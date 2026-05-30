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
          // Auto-close paywall when subscription detected via listener
          setShowPaywall(false);
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

  const subscribe = useCallback(async (pkg) => {
    if (!pkg) return { success: false, error: 'No package provided' };
    
    const result = await purchasePackage(pkg);
    if (result.success) {
      setIsSubscribed(true);
      setShowPaywall(false);
    }
    return result;
  }, []);

  // Fallback: purchase by product ID when offerings aren't available
  const subscribeFallback = useCallback(async () => {
    const result = await purchaseStoreProduct(PRODUCT_ID);
    if (result.success) {
      setIsSubscribed(true);
      setShowPaywall(false);
    }
    return result;
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

  // BUILD 51: Aggressive refresh that invalidates cache + syncs purchases
  // before checking status. Used during purchase polling to catch purchases
  // that completed on StoreKit but aren't reflected in cached customerInfo.
  const refreshStatusWithSync = useCallback(async () => {
    const status = await invalidateAndCheckStatus();
    setIsSubscribed(status.isActive);
    setIsTrialing(status.isTrialing);
    return status;
  }, []);

  const value = {
    isSubscribed,
    isTrialing,
    isLoading,
    offerings,
    offeringsLoading,
    showPaywall,
    setShowPaywall,
    subscribe,
    subscribeFallback,
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
