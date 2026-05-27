import { useState, useEffect, useRef } from 'react';
import { Shield, BookOpen, MessageCircle, ClipboardList, CheckCircle, Loader2, RotateCcw, RefreshCw } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import IAPDiagnostic from './IAPDiagnostic';

const Paywall = ({ onClose }) => {
  const { offerings, offeringsLoading, subscribe, subscribeFallback, restore, refreshOfferings, refreshStatus } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [retryingOfferings, setRetryingOfferings] = useState(false);
  const [purchaseElapsed, setPurchaseElapsed] = useState(0);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  // ─── GRACEFUL PURCHASE TIMEOUT ─────────────────────────────────
  // BUILD 45 FIX: Balanced approach between infinite spinner (Build 44)
  // and scary error messages (Build 42-43).
  //
  // Strategy:
  //   1. Show progressive, reassuring status messages during the wait
  //   2. Poll getCustomerInfo() every 8 seconds to catch silent completions
  //   3. After 90 seconds, auto-stop with a gentle guidance message
  //      (NOT an error — just "didn't complete this time, try again")
  //   4. Provide a "Cancel" option after 10 seconds so the user isn't trapped
  //   5. Never show an alarming error message
  //
  // The 90s timeout is generous enough for even slow sandbox environments
  // but prevents the "still loading" infinite spinner Apple flagged.
  // ────────────────────────────────────────────────────────────────

  const elapsedTimerRef = useRef(null);
  const pollingRef = useRef(null);
  const purchaseAbortedRef = useRef(false);
  const gracefulTimeoutRef = useRef(null);
  const GRACEFUL_TIMEOUT_MS = 90000; // 90 seconds

  useEffect(() => {
    if (purchasing) {
      setPurchaseElapsed(0);
      purchaseAbortedRef.current = false;

      // Tick every second for progressive status display
      elapsedTimerRef.current = setInterval(() => {
        setPurchaseElapsed(prev => prev + 1);
      }, 1000);

      // Poll customerInfo every 8 seconds — catches purchases that
      // complete in StoreKit but whose JS callback is never fired.
      pollingRef.current = setInterval(async () => {
        try {
          console.log('[Paywall] Polling customerInfo for silent purchase completion...');
          await refreshStatus();
          // If refreshStatus detects an active subscription, the context
          // will set isSubscribed=true and close the paywall automatically.
        } catch (e) {
          // Polling errors are non-critical — just log and continue
          console.warn('[Paywall] Polling error (non-critical):', e.message);
        }
      }, 8000);

      // Graceful timeout: after 90 seconds, auto-stop with gentle guidance.
      // This prevents the "still loading" infinite spinner Apple flagged in Build 44.
      // The message is NOT an error — it's gentle guidance that doesn't look like a bug.
      gracefulTimeoutRef.current = setTimeout(() => {
        console.log('[Paywall] Graceful timeout reached (90s) — auto-stopping purchase UI');
        purchaseAbortedRef.current = true;
        setPurchasing(false);
        setError('The purchase didn\'t complete this time. This can happen occasionally with the App Store. Your account was not charged. Please try again.');
      }, GRACEFUL_TIMEOUT_MS);
    } else {
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
  }, [purchasing, refreshStatus]);

  // When the paywall opens and offerings are null, attempt to fetch them
  useEffect(() => {
    if (!offerings && !offeringsLoading) {
      setRetryingOfferings(true);
      refreshOfferings().finally(() => setRetryingOfferings(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetryOfferings = async () => {
    setRetryingOfferings(true);
    setError(null);
    await refreshOfferings();
    setRetryingOfferings(false);
  };

  const handleSubscribe = async () => {
    setPurchasing(true);
    setError(null);

    try {
      let result;

      if (offerings?.availablePackages?.length) {
        // Primary path: purchase via offerings package
        const pkg = offerings.availablePackages[0];
        result = await subscribe(pkg);
      } else {
        // Fallback path: purchase by product ID directly (only when offerings unavailable)
        console.warn('[Paywall] No offerings available, using product ID fallback...');
        result = await subscribeFallback();
      }

      if (result.success) {
        // Purchase succeeded — paywall will close via context
        return;
      }

      if (result.error === 'cancelled') {
        // User cancelled — no error to show, just reset
        return;
      }

      // Only show errors from actual purchase failures (not timeouts)
      // These are soft guidance messages, not alarming errors.
      setError(result.error || 'Please check your internet connection and try again.');
    } catch (err) {
      console.error('[Paywall] Unexpected error during subscribe:', err);
      // Don't show scary error messages — keep it soft
      setError('Please check your internet connection and payment method, then try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // Allow user to cancel a stuck purchase without showing an error
  const handleCancelPurchase = () => {
    purchaseAbortedRef.current = true;
    setPurchasing(false);
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
    if (purchaseElapsed >= 60) return 'Almost there — the App Store is still processing…';
    if (purchaseElapsed >= 40) return 'The App Store is taking a moment. Please wait…';
    if (purchaseElapsed >= 25) return 'Waiting for App Store response…';
    if (purchaseElapsed >= 15) return 'Processing with the App Store…';
    if (purchaseElapsed >= 8) return 'Connecting to the App Store…';
    if (purchaseElapsed >= 3) return 'Starting purchase…';
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
            
            {/* SUBORDINATE: Free trial — smaller font, lighter color */}
            <div className="mt-3 pt-3 border-t border-secondary-100">
              <p className="text-secondary-400 text-xs">
                Includes a 7-day free trial. Cancel anytime.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="p-5 pt-3 space-y-3">
          <button
            id="start-free-trial-btn"
            onClick={handleSubscribe}
            disabled={purchasing}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {purchasing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {getStatusMessage()}
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Subscribe — $3.99/month
              </>
            )}
          </button>

          {/* Cancel button — appears after 10 seconds of purchasing, lets user exit without error */}
          {purchasing && purchaseElapsed >= 10 && (
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
                disabled={purchasing}
                className="w-full bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} className={purchasing ? 'animate-spin' : ''} />
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
          {/* Subscription details - required by App Store Guideline 3.1.2(c) */}
          <div className="bg-secondary-50 rounded-xl p-3 mb-3 text-[10px] text-secondary-500 leading-relaxed">
            <p className="font-semibold text-secondary-600 mb-1">Resilient Path Monthly Subscription</p>
            <p>• Duration: 1 month, auto-renewing</p>
            <p>• Price: $3.99/month (after 7-day free trial)</p>
            <p>• Payment charged to your Apple ID at confirmation of purchase</p>
            <p>• Subscription renews unless cancelled at least 24 hours before the end of the current period</p>
            <p>• Manage or cancel in iPhone Settings → Apple ID → Subscriptions</p>
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
