import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeRevenueCat,
  checkSubscriptionStatus,
  invalidateAndCheckStatus,
  setupCustomerInfoListener,
  getOfferings,
  purchasePackage,
  purchaseStoreProduct,
  restorePurchases
} from '../services/subscriptionService';

const SubscriptionContext = createContext(null);

const PRODUCT_ID = 'com.resilientpath.app.monthly';

export function SubscriptionProvider({ children }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState(null);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  // Initialize RevenueCat and check status on mount
  useEffect(() => {
    let didTimeout = false;

    // Timeout guard: if init takes too long, fail-open
    // Extended to 15s to accommodate slow sandbox environments
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      console.warn('[SubscriptionContext] Init timed out — granting access');
      setIsSubscribed(true);
      setIsLoading(false);
    }, 15000);

    async function init() {
      try {
        await initializeRevenueCat();
        if (didTimeout) return; // timeout already fired

        const status = await checkSubscriptionStatus();
        if (didTimeout) return;
        setIsSubscribed(status.isActive);
        setIsTrialing(status.isTrialing);

        // Pre-fetch offerings for the paywall (don't block on this)
        setOfferingsLoading(true);
        fetchOfferingsWithRetry(didTimeout);
      } catch (err) {
        console.error('[SubscriptionContext] Init error:', err);
        // Fail-open: don't lock out users on error
        if (!didTimeout) setIsSubscribed(true);
      } finally {
        clearTimeout(timeoutId);
        if (!didTimeout) setIsLoading(false);
      }
    }

    /**
     * Fetch offerings with a secondary retry if the first attempt returns null.
     * Sandbox environments often need extra time for offerings to become available.
     */
    function fetchOfferingsWithRetry(cancelled) {
      getOfferings()
        .then(o => {
          if (cancelled) return;
          if (o) {
            setOfferings(o);
            setOfferingsLoading(false);
          } else {
            // First fetch returned null — retry after a delay
            console.warn('[SubscriptionContext] Initial offerings null, retrying in 3s...');
            setTimeout(() => {
              if (cancelled) return;
              getOfferings()
                .then(o2 => { if (!cancelled) setOfferings(o2); })
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

    return () => clearTimeout(timeoutId);
  }, []);

  // BUILD 51: Register CustomerInfo listener — the RECOMMENDED way to detect
  // purchases that complete on StoreKit but whose Capacitor bridge callback is dropped.
  // This listener fires in real-time when customer info changes, unlike polling.
  useEffect(() => {
    let cleanup = () => {};

    async function registerListener() {
      cleanup = await setupCustomerInfoListener(({ isActive, isTrialing: trial }) => {
        console.log('[SubscriptionContext] CustomerInfo listener update: isActive =', isActive);
        setIsSubscribed(isActive);
        setIsTrialing(trial);
        if (isActive) {
          // Auto-close paywall and stop purchase state when subscription detected via listener
          // This is the PRIMARY detection mechanism for the fire-and-forget architecture.
          setShowPaywall(false);
          setPurchaseInProgress(false);
        }
      });
    }

    registerListener();
    return () => cleanup();
  }, []);

  // Allow Paywall to trigger a re-fetch of offerings
  const refreshOfferings = useCallback(async () => {
    setOfferingsLoading(true);
    try {
      const o = await getOfferings();
      setOfferings(o);
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
   * The purchase promise runs in the background. If it resolves with
   * success, we update state as a tertiary signal. If it fails, we
   * set an error callback so the Paywall can show guidance.
   */
  const beginPurchase = useCallback((pkg, onError) => {
    if (!pkg) {
      if (onError) onError('No package provided');
      return;
    }

    setPurchaseInProgress(true);
    console.log('[SubscriptionContext] beginPurchase: firing purchase (non-blocking)');

    // Fire and forget — DO NOT await
    purchasePackage(pkg)
      .then((result) => {
        console.log('[SubscriptionContext] Purchase promise resolved:', result.success);
        if (result.success) {
          // Tertiary detection — listener/polling usually catch this first
          setIsSubscribed(true);
          setShowPaywall(false);
          setPurchaseInProgress(false);
        } else if (result.error === 'cancelled') {
          console.log('[SubscriptionContext] User cancelled purchase');
          setPurchaseInProgress(false);
        } else if (result.error) {
          console.warn('[SubscriptionContext] Purchase error:', result.error);
          if (onError) onError(result.error);
          // Don't reset purchaseInProgress here — let the Paywall handle it
          // because the subscription might still complete via listener/polling
        }
      })
      .catch((err) => {
        console.error('[SubscriptionContext] Purchase promise rejected:', err);
        // This is the "promise never resolves" escape hatch — it shouldn't
        // happen often, but if it does, the Paywall timeout handles it.
      });
  }, []);

  /**
   * BUILD 53: FIRE-AND-FORGET purchase by product ID (fallback).
   * Same fire-and-forget pattern as beginPurchase.
   */
  const beginPurchaseFallback = useCallback((onError) => {
    setPurchaseInProgress(true);
    console.log('[SubscriptionContext] beginPurchaseFallback: firing purchase (non-blocking)');

    purchaseStoreProduct(PRODUCT_ID)
      .then((result) => {
        console.log('[SubscriptionContext] Fallback purchase promise resolved:', result.success);
        if (result.success) {
          setIsSubscribed(true);
          setShowPaywall(false);
          setPurchaseInProgress(false);
        } else if (result.error === 'cancelled') {
          console.log('[SubscriptionContext] User cancelled purchase (fallback)');
          setPurchaseInProgress(false);
        } else if (result.error) {
          console.warn('[SubscriptionContext] Fallback purchase error:', result.error);
          if (onError) onError(result.error);
        }
      })
      .catch((err) => {
        console.error('[SubscriptionContext] Fallback purchase promise rejected:', err);
      });
  }, []);

  // Cancel a purchase-in-progress (user wants to dismiss)
  const cancelPurchaseState = useCallback(() => {
    setPurchaseInProgress(false);
  }, []);

  const restore = useCallback(async () => {
    const result = await restorePurchases();
    if (result.isActive) {
      setIsSubscribed(true);
      setShowPaywall(false);
    }
    return result;
  }, []);

  const refreshStatus = useCallback(async () => {
    const status = await checkSubscriptionStatus();
    setIsSubscribed(status.isActive);
    setIsTrialing(status.isTrialing);
  }, []);

  // BUILD 53: Aggressive refresh that invalidates cache before checking status.
  // Used during purchase polling to catch purchases that completed on StoreKit
  // but aren't reflected in cached customerInfo.
  // NOTE: syncPurchases was removed from this path in Build 53.
  const refreshStatusWithSync = useCallback(async () => {
    const status = await invalidateAndCheckStatus();
    setIsSubscribed(status.isActive);
    setIsTrialing(status.isTrialing);
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
