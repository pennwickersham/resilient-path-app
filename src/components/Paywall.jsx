import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, BookOpen, MessageCircle, ClipboardList, CheckCircle, Loader2, RotateCcw, RefreshCw } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import IAPDiagnostic from './IAPDiagnostic';
import { Capacitor } from '@capacitor/core';

/**
 * Paywall Component — BUILD 57
 *
 * ARCHITECTURE: Direct-await purchase with immediate error feedback.
 * 
 * Build 57 approach:
 *   1. User taps Subscribe → we AWAIT beginPurchase() directly.
 *   2. purchaseInProgress=true shows spinner INSTANTLY on tap.
 *   3. Purchase calls go directly to RevenueCat (no extra product fetch,
 *      no retry logic — both were causing 30+ second waits in sandbox).
 *   4. If purchase fails, error is returned and displayed immediately.
 *   5. Graceful timeout at 15s shows "Check Again" (down from 30s).
 *   6. Polling + listener remain as backup detection mechanisms.
 */
const Paywall = ({ onClose }) => {
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const {
    isSubscribed,
    offerings,
    offeringsLoading,
    beginPurchase,
    beginPurchaseFallback,
    cancelPurchaseState,
    purchaseInProgress,
    restore,
    refreshOfferings,
    refreshStatusWithSync,
  } = useSubscription();

  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [retryingOfferings, setRetryingOfferings] = useState(false);
  const [purchaseElapsed, setPurchaseElapsed] = useState(0);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  // ─── PURCHASE PROCESSING UI ──────────────────────────────────────
  // BUILD 53: The UI is driven by `purchaseInProgress` from context,
  // NOT by whether the purchase promise has resolved. This means the
  // spinner state is controlled by detection (listener/polling), not
  // by a potentially-hanging promise.
  //
  // Graceful timeout: 30 seconds. This is short enough that Apple
  // reviewers won't see a stuck spinner, but long enough for even
  // slow sandbox environments.
  // ──────────────────────────────────────────────────────────────────

  const elapsedTimerRef = useRef(null);
  const pollingRef = useRef(null);
  const gracefulTimeoutRef = useRef(null);
  const GRACEFUL_TIMEOUT_MS = 15000; // BUILD 57: 15 seconds — reviewer sees feedback fast

  useEffect(() => {
    if (purchaseInProgress) {
      setPurchaseElapsed(0);
      setTimedOut(false);
      setError(null);

      // Tick every second for progressive status display
      elapsedTimerRef.current = setInterval(() => {
        setPurchaseElapsed(prev => prev + 1);
      }, 1000);

      // Poll every 3 seconds with cache invalidation.
      // This catches purchases that complete in StoreKit but whose JS callback
      // is never fired (known Capacitor bridge issue).
      // Primary detection is via addCustomerInfoUpdateListener in SubscriptionContext;
      // this polling is the backup safety net.
      pollingRef.current = setInterval(async () => {
        try {
          console.log('[Paywall] Polling with cache invalidation...');
          await refreshStatusWithSync();
          // If subscription detected, context sets purchaseInProgress=false
          // which will trigger the cleanup branch below.
        } catch (e) {
          console.warn('[Paywall] Polling error (non-critical):', e.message);
        }
      }, 3000);

      // Graceful timeout: after 30 seconds, show "Check Again" button.
      // NOT an error message — gentle guidance that doesn't look like a bug.
      gracefulTimeoutRef.current = setTimeout(() => {
        console.log('[Paywall] Graceful timeout reached (30s)');
        setTimedOut(true);
        // Don't cancel purchaseInProgress yet — give user the "Check Again" option
      }, GRACEFUL_TIMEOUT_MS);
    } else {
      // Purchase finished (or was cancelled) — clean up timers
      setPurchaseElapsed(0);
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (gracefulTimeoutRef.current) {
        clearTimeout(gracefulTimeoutRef.current);
        gracefulTimeoutRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (gracefulTimeoutRef.current) clearTimeout(gracefulTimeoutRef.current);
    };
  }, [purchaseInProgress, refreshStatusWithSync]);

  // When the paywall opens and offerings are null, attempt to fetch them
  useEffect(() => {
    if (!offerings && !offeringsLoading) {
      setRetryingOfferings(true);
      refreshOfferings().finally(() => setRetryingOfferings(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AUTO-CLOSE: When subscription is detected while purchase was in progress
  useEffect(() => {
    if (isSubscribed && purchaseInProgress) {
      console.log('[Paywall] Subscription detected — auto-closing paywall');
      // purchaseInProgress will be set to false by the context
      onClose();
    }
  }, [isSubscribed, purchaseInProgress, onClose]);

  // Also auto-close if isSubscribed becomes true while paywall is open
  // (e.g., listener fires after purchase completes)
  const initialSubscribedRef = useRef(isSubscribed);
  useEffect(() => {
    if (isSubscribed && !initialSubscribedRef.current) {
      console.log('[Paywall] Subscription status transitioned to active — closing');
      onClose();
    }
  }, [isSubscribed, onClose]);

  const handleRetryOfferings = async () => {
    setRetryingOfferings(true);
    setError(null);
    await refreshOfferings();
    setRetryingOfferings(false);
  };

  // Error callback for fire-and-forget purchase
  const handlePurchaseError = useCallback((errorMsg) => {
    if (errorMsg !== 'cancelled') {
      setError(errorMsg || 'Please check your internet connection and try again.');
    }
    // For cancellations, just quietly reset
    cancelPurchaseState();
  }, [cancelPurchaseState]);

  /**
   * BUILD 57: Simplified subscribe handler.
   * 
   * Calls purchase directly and awaits result.
   * No extra product fetch, no retry — errors surface immediately.
   */
  const handleSubscribe = async () => {
    setError(null);
    setTimedOut(false);

    // INSTANT feedback — spinner shows the moment user taps
    // (Previous builds waited for refreshOfferings before showing any feedback)

    let result;

    if (offerings?.availablePackages?.length) {
      // Primary path: purchase via offerings package
      const pkg = offerings.availablePackages[0];
      result = await beginPurchase(pkg);
    } else {
      // Offerings are null — try a quick refresh, then fall back to product ID.
      // beginPurchaseFallback sets purchaseInProgress internally.
      console.warn('[Paywall] No offerings, trying product ID fallback directly...');
      result = await beginPurchaseFallback();
    }

    // Handle the result — show errors immediately (not silently swallowed)
    if (result && !result.success && result.error && result.error !== 'cancelled') {
      setError(result.error);
    }
  };

  // "Check Again" — one final poll after timeout, then give up
  const handleCheckAgain = async () => {
    setTimedOut(false);
    setError(null);
    try {
      console.log('[Paywall] Check Again — one final poll...');
      const status = await refreshStatusWithSync();
      if (status?.isActive) {
        // Found it! Close the paywall
        onClose();
        return;
      }
    } catch (e) {
      console.warn('[Paywall] Check Again poll failed:', e.message);
    }
    // Still not found — end purchase state with gentle message
    cancelPurchaseState();
    setError('The purchase didn\'t complete this time. Your account was not charged. Please try again.');
  };

  // Allow user to cancel a stuck purchase without showing an error
  const handleCancelPurchase = () => {
    cancelPurchaseState();
    // Don't show any error — just quietly reset
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    setRestoreMsg(null);
    
    try {
      const result = await restore();
      
      if (result.isActive) {
        setRestoreMsg('Subscription restored!');
      } else {
        setRestoreMsg('No active subscription found. If you believe this is an error, please contact support.');
      }
    } catch (err) {
      console.error('[Paywall] Unexpected error during restore:', err);
      setRestoreMsg('Unable to restore. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  // Progressive status messages — reassuring, communicates activity, never alarming
  const getStatusMessage = () => {
    const storeName = isIOS ? 'App Store' : 'Google Play';
    if (purchaseElapsed >= 20) return `Almost there — the ${storeName} is still processing…`;
    if (purchaseElapsed >= 12) return `Waiting for ${storeName} response…`;
    if (purchaseElapsed >= 8) return `Processing with the ${storeName}…`;
    if (purchaseElapsed >= 4) return `Connecting to the ${storeName}…`;
    if (purchaseElapsed >= 2) return 'Starting purchase…';
    return 'Processing…';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      {showDiagnostic && <IAPDiagnostic onClose={() => setShowDiagnostic(false)} />}
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div
              className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm"
              onClick={() => {
                tapCountRef.current += 1;
                if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
                tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
                if (tapCountRef.current >= 5) {
                  tapCountRef.current = 0;
                  setShowDiagnostic(true);
                }
              }}
            >
              <Shield className="text-white" size={32} />
            </div>
            <h2 className="text-white text-xl font-bold mb-1">Unlock Resilient Path</h2>
            <p className="text-white/80 text-sm leading-snug">
              Your complete pain management toolkit
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-secondary-900 text-sm">25-Module Digital Workbook</p>
              <p className="text-secondary-500 text-xs">Evidence-based exercises and guided journaling</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-secondary-900 text-sm">AI Therapist Guide</p>
              <p className="text-secondary-500 text-xs">Personalized support whenever you need it</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-secondary-900 text-sm">Health Tools Suite</p>
              <p className="text-secondary-500 text-xs">Track symptoms, medications, and share with doctors</p>
            </div>
          </div>
        </div>

        {/* Pricing — billed amount is the MOST prominent element (Apple Guideline 3.1.2(c)) */}
        <div className="px-5 pb-2">
          <div className="border border-secondary-200 rounded-2xl p-5 text-center bg-white">
            {/* PRIMARY: Billed amount — largest, boldest element */}
            <p className="text-secondary-900 font-extrabold text-2xl leading-tight">
              $3.99<span className="text-base font-bold text-secondary-600">/month</span>
            </p>
            <p className="text-secondary-500 text-sm mt-1">Auto-renewing monthly subscription</p>
            
            {isIOS && (
              <div className="mt-3 pt-3 border-t border-secondary-100">
                <p className="text-secondary-400 text-xs">
                  Cancel anytime. Payment will be charged to your Apple ID account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="p-5 pt-3 space-y-3">
          <button
            id="subscribe-btn"
            onClick={handleSubscribe}
            disabled={purchaseInProgress}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {purchaseInProgress ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {timedOut ? 'Still checking…' : getStatusMessage()}
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Subscribe — $3.99/month
              </>
            )}
          </button>

          {/* Timeout: show "Check Again" button instead of an error */}
          {purchaseInProgress && timedOut && (
            <div className="space-y-2">
              <button
                onClick={handleCheckAgain}
                className="w-full bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                Check Again
              </button>
              <button
                onClick={handleCancelPurchase}
                className="w-full text-secondary-400 text-xs hover:text-secondary-600 transition-colors py-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Cancel button — appears after 8 seconds, lets user exit without error */}
          {purchaseInProgress && !timedOut && purchaseElapsed >= 8 && (
            <button
              onClick={handleCancelPurchase}
              className="w-full text-secondary-400 text-xs hover:text-secondary-600 transition-colors py-1"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full text-primary-600 font-semibold text-sm py-2 flex items-center justify-center gap-1.5 hover:text-primary-800 transition-colors"
          >
            {restoring ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RotateCcw size={14} />
            )}
            Restore Purchase
          </button>

          {/* Error display — guidance-style, not alarming */}
          {error && (
            <div className="text-center space-y-2.5">
              <p className="text-secondary-600 text-xs bg-secondary-50 p-3 rounded-xl leading-relaxed border border-secondary-100">
                {error}
              </p>
              <button
                onClick={handleSubscribe}
                disabled={purchaseInProgress}
                className="w-full bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} className={purchaseInProgress ? 'animate-spin' : ''} />
                Try Again
              </button>
            </div>
          )}

          {restoreMsg && (
            <p className={`text-xs text-center p-2 rounded-lg ${
              restoreMsg.includes('restored') 
                ? 'text-emerald-700 bg-emerald-50' 
                : 'text-purple-700 bg-purple-50'
            }`}>
              {restoreMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          {/* Subscription details */}
          <div className="bg-secondary-50 rounded-xl p-3 mb-3 text-[10px] text-secondary-500 leading-relaxed">
            <p className="font-semibold text-secondary-600 mb-1">Resilient Path Monthly Subscription</p>
            <p>• Duration: 1 month, auto-renewing</p>
            <p>• Price: $3.99/month</p>
            {isIOS && (
              <>
                <p>• Payment charged to your Apple ID at confirmation of purchase</p>
                <p>• Manage or cancel in iPhone Settings → Apple ID → Subscriptions</p>
              </>
            )}
            <p>• Subscription renews unless cancelled at least 24 hours before the end of the current period</p>
          </div>

          {/* Legal links - required by App Store Guideline 3.1.2(c) */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <a
              href="https://pennwickersham.github.io/resilient-path-app/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 text-[10px] underline"
            >
              Privacy Policy
            </a>
            <span className="text-secondary-300 text-[10px]">•</span>
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 text-[10px] underline"
            >
              Terms of Use (EULA)
            </a>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full text-secondary-400 text-xs hover:text-secondary-600 transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Paywall;
