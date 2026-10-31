import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeRevenueCat,
  checkSubscriptionStatus,
  invalidateAndCheckStatus,
  setupCustomerInfoListener,
  getOfferings,
  purchasePackage,
  purchaseStoreProduct,
  restorePurchases,
  getProductInfoFromOfferings,
  statusFromCustomerInfo,
} from '../services/subscriptionService';
import storage, { SUBSCRIPTION_CACHE_KEY } from '../services/storage';

const SubscriptionContext = createContext(null);

const PRODUCT_ID = 'com.resilient-path-app.monthly';

// Store renewals can lag a few days (billing retry, offline phone), so a
// remembered entitlement stays usable briefly past its expiration date.
const RENEWAL_GRACE_MS = 3 * 86400000;

/** Remember a definite RevenueCat answer on the device (never errors). */
function rememberEntitlement(status) {
  if (!status || status.error) return;
  const write = status.isActive
    ? storage.set(SUBSCRIPTION_CACHE_KEY, {
        active: true,
        isTrialing: !!status.isTrialing,
        expirationDate: status.expirationDate || null,
        checkedAt: new Date().toISOString(),
      })
    : storage.remove(SUBSCRIPTION_CACHE_KEY);
  write.catch(e => console.warn('[SubscriptionContext] Could not remember entitlement', e));
}

/** Last confirmed entitlement if it is still within its paid period. */
async function readRememberedEntitlement() {
  try {
    const c = await storage.get(SUBSCRIPTION_CACHE_KEY);
    if (!c || c.active !== true) return null;
    if (c.expirationDate) {
      const exp = Date.parse(c.expirationDate);
      if (Number.isFinite(exp) && exp + RENEWAL_GRACE_MS < Date.now()) return null;
    }
    return c;
  } catch {
    return null;
  }
}

export function SubscriptionProvider({ children }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  // Initialize RevenueCat and check status on mount.
  //
  // ROOT-CAUSE FIX (repeated "please subscribe / restore / sign in"):
  // entitlement used to live only in memory and start as `false` on every
  // launch. If RevenueCat was slow (>15s timeout) its eventual answer was
  // DISCARDED for the whole session, any network error was treated as
  // "not subscribed", and the CustomerInfo listener was registered before
  // the SDK was configured (so it failed silently and could never correct
  // things). Paying users therefore hit the paywall again and again, had
  // to "Restore Purchase" (an App Store / Google sign-in prompt), and their
  // Health Tools data was hidden behind the paywall until they did.
  //
  // Now: the last confirmed entitlement is remembered on the device and
  // used immediately on launch; a late RevenueCat answer is always applied;
  // "couldn't check" never downgrades a known subscriber; and the listener
  // is registered after configure(). New installs (no remembered
  // entitlement) still fail closed, so App Review always sees the paywall.
  useEffect(() => {
    let cancelled = false;
    let confirmed = false; // RevenueCat has given a definite answer
    let removeListener = () => {};

    const timeoutId = setTimeout(() => {
      if (cancelled || confirmed) return;
      console.warn('[SubscriptionContext] Init slow — showing last-known status; will update when RevenueCat answers');
      setIsLoading(false);
    }, 15000);

    // 1. Last-known entitlement → unlock instantly (works offline too).
    readRememberedEntitlement().then((remembered) => {
      if (cancelled || confirmed || !remembered) return;
      setIsSubscribed(true);
      setIsTrialing(!!remembered.isTrialing);
      setIsLoading(false);
    });

    async function init() {
      try {
        await initializeRevenueCat();
        if (cancelled) return;

        const status = await checkSubscriptionStatus();
        if (cancelled) return;
        if (!status.error) {
          confirmed = true;
          setIsSubscribed(status.isActive);
          setIsTrialing(status.isTrialing);
          rememberEntitlement(status);
        }

        // BUILD 51: CustomerInfo listener — detects purchases whose bridge
        // callback is dropped. Registered only after configure() so it
        // actually attaches.
        removeListener = await setupCustomerInfoListener((info) => {
          console.log('[SubscriptionContext] CustomerInfo listener update: isActive =', info.isActive);
          confirmed = true;
          setIsSubscribed(info.isActive);
          setIsTrialing(info.isTrialing);
          rememberEntitlement(info);
          if (info.isActive) {
            // Auto-close paywall and stop purchase state when subscription detected via listener
            setShowPaywall(false);
            setPurchaseInProgress(false);
          }
        });
        if (cancelled) { removeListener(); return; }

        // Pre-fetch offerings for the paywall (don't block on this)
        setOfferingsLoading(true);
        fetchOfferingsWithRetry();
      } catch (err) {
        // BUILD 55: Fail-closed for unknown users — the remembered
        // entitlement (if any) stays in effect.
        console.error('[SubscriptionContext] Init error:', err);
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setIsLoading(false);
      }
    }

    /**
     * Fetch offerings with a secondary retry if the first attempt returns null.
     * Sandbox environments often need extra time for offerings to become available.
     */
    function fetchOfferingsWithRetry() {
      getOfferings()
        .then(o => {
          if (cancelled) return;
          if (o) {
            setOfferings(o);
            const pi = getProductInfoFromOfferings(o);
            setProductInfo(pi);
            setOfferingsLoading(false);
          } else {
            // First fetch returned null — retry after a delay
            console.warn('[SubscriptionContext] Initial offerings null, retrying in 3s...');
            setTimeout(() => {
              if (cancelled) return;
              getOfferings()
                .then(o2 => { 
                  if (!cancelled) {
                    setOfferings(o2);
                    const pi2 = getProductInfoFromOfferings(o2);
                    setProductInfo(pi2);
                  }
                })
                .catch(() => {})
                .finally(() => { if (!cancelled) setOfferingsLoading(false); });
            }, 3000);
          }
        })
        .catch(() => {
          if (!cancelled) setOfferingsLoading(false);
        });
    }

    init();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      removeListener();
    };
  }, []);

  // Allow Paywall to trigger a re-fetch of offerings
  const refreshOfferings = useCallback(async () => {
    setOfferingsLoading(true);
    try {
      const o = await getOfferings();
      setOfferings(o);
      const pi = getProductInfoFromOfferings(o);
      setProductInfo(pi);
      return o;
    } catch {
      return null;
    } finally {
      setOfferingsLoading(false);
    }
  }, []);

  /**
   * BUILD 53: FIRE-AND-FORGET purchase via offerings package.
   * Launches the purchase and returns immediately with { initiated: true }.
   * The actual subscription detection happens via:
   *   1. CustomerInfo listener (above)
   *   2. Polling in Paywall via refreshStatusWithSync
   *   3. Best-effort: purchase promise resolving
   *
   * BUILD 56: ABANDONED fire-and-forget. Apple rejected Builds 53-55 because
   * errors were silently swallowed and "nothing happened" on tap.
   * Now we AWAIT the purchase with a 60s timeout. Errors are shown immediately.
   * The CustomerInfo listener and polling remain as backup detection.
   */
  const beginPurchase = useCallback(async (pkg) => {
    if (!pkg) {
      return { success: false, error: 'No package provided' };
    }

    setPurchaseInProgress(true);
    console.log('[SubscriptionContext] beginPurchase: starting purchase (awaited)');

    try {
      const result = await purchasePackage(pkg);
      console.log('[SubscriptionContext] Purchase resolved:', result.success);
      if (result.success) {
        rememberEntitlement(statusFromCustomerInfo(result.customerInfo));
        setIsSubscribed(true);
        setShowPaywall(false);
        setPurchaseInProgress(false);
        return result;
      } else if (result.error === 'cancelled') {
        console.log('[SubscriptionContext] User cancelled purchase');
        setPurchaseInProgress(false);
        return result;
      } else {
        console.warn('[SubscriptionContext] Purchase error:', result.error);
        setPurchaseInProgress(false);
        return result;
      }
    } catch (err) {
      console.error('[SubscriptionContext] Purchase rejected:', err);
      setPurchaseInProgress(false);
      return { success: false, error: err.message || 'Purchase failed. Please try again.' };
    }
  }, []);

  /**
   * BUILD 56: Direct purchase by product ID (fallback).
   * AWAITED — errors are returned to the caller, not swallowed.
   */
  const beginPurchaseFallback = useCallback(async () => {
    setPurchaseInProgress(true);
    console.log('[SubscriptionContext] beginPurchaseFallback: starting purchase (awaited)');

    try {
      const result = await purchaseStoreProduct(PRODUCT_ID);
      console.log('[SubscriptionContext] Fallback purchase resolved:', result.success);
      if (result.success) {
        rememberEntitlement(statusFromCustomerInfo(result.customerInfo));
        setIsSubscribed(true);
        setShowPaywall(false);
        setPurchaseInProgress(false);
        return result;
      } else if (result.error === 'cancelled') {
        console.log('[SubscriptionContext] User cancelled purchase (fallback)');
        setPurchaseInProgress(false);
        return result;
      } else {
        console.warn('[SubscriptionContext] Fallback purchase error:', result.error);
        setPurchaseInProgress(false);
        return result;
      }
    } catch (err) {
      console.error('[SubscriptionContext] Fallback purchase rejected:', err);
      setPurchaseInProgress(false);
      return { success: false, error: err.message || 'Purchase failed. Please try again.' };
    }
  }, []);

  // Cancel a purchase-in-progress (user wants to dismiss)
  const cancelPurchaseState = useCallback(() => {
    setPurchaseInProgress(false);
  }, []);

  const restore = useCallback(async () => {
    const result = await restorePurchases();
    if (result.isActive) {
      rememberEntitlement(result);
      setIsSubscribed(true);
      setShowPaywall(false);
    }
    return result;
  }, []);

  const refreshStatus = useCallback(async () => {
    const status = await checkSubscriptionStatus();
    if (status.error) return; // couldn't check — keep what we know
    setIsSubscribed(status.isActive);
    setIsTrialing(status.isTrialing);
    rememberEntitlement(status);
  }, []);

  // BUILD 53: Aggressive refresh that invalidates cache before checking status.
  // Used during purchase polling to catch purchases that completed on StoreKit
  // but aren't reflected in cached customerInfo.
  // NOTE: syncPurchases was removed from this path in Build 53.
  const refreshStatusWithSync = useCallback(async () => {
    const status = await invalidateAndCheckStatus();
    if (status.error) return status; // couldn't check — keep what we know
    setIsSubscribed(status.isActive);
    setIsTrialing(status.isTrialing);
    rememberEntitlement(status);
    if (status.isActive && purchaseInProgress) {
      // Purchase detected via polling — stop purchase state
      console.log('[SubscriptionContext] Subscription detected via polling — ending purchase state');
      setPurchaseInProgress(false);
    }
    return status;
  }, [purchaseInProgress]);

  const value = {
    isSubscribed,
    isTrialing,
    isLoading,
    offerings,
    productInfo,
    offeringsLoading,
    showPaywall,
    setShowPaywall,
    purchaseInProgress,
    beginPurchase,
    beginPurchaseFallback,
    cancelPurchaseState,
    restore,
    refreshOfferings,
    refreshStatus,
    refreshStatusWithSync,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
