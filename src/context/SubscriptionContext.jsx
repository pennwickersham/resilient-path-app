import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeRevenueCat,
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases
} from '../services/subscriptionService';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Initialize RevenueCat and check status on mount
  useEffect(() => {
    let didTimeout = false;

    // Timeout guard: if init takes too long, fail-open
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      console.warn('[SubscriptionContext] Init timed out — granting access');
      setIsSubscribed(true);
      setIsLoading(false);
    }, 8000);

    async function init() {
      try {
        await initializeRevenueCat();
        if (didTimeout) return; // timeout already fired

        const status = await checkSubscriptionStatus();
        if (didTimeout) return;
        setIsSubscribed(status.isActive);
        setIsTrialing(status.isTrialing);

        // Pre-fetch offerings for the paywall (don't block on this)
        getOfferings().then(o => { if (!didTimeout) setOfferings(o); }).catch(() => {});
      } catch (err) {
        console.error('[SubscriptionContext] Init error:', err);
        // Fail-open: don't lock out users on error
        if (!didTimeout) setIsSubscribed(true);
      } finally {
        clearTimeout(timeoutId);
        if (!didTimeout) setIsLoading(false);
      }
    }
    init();

    return () => clearTimeout(timeoutId);
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

  const value = {
    isSubscribed,
    isTrialing,
    isLoading,
    offerings,
    showPaywall,
    setShowPaywall,
    subscribe,
    restore,
    refreshStatus,
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
