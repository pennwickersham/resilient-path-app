import { useState } from 'react';
import { Shield, BookOpen, MessageCircle, ClipboardList, Sparkles, CheckCircle, Loader2, RotateCcw } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

const Paywall = ({ onClose }) => {
  const { offerings, subscribe, restore } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState(null);

  const handleSubscribe = async () => {
    if (!offerings?.availablePackages?.length) {
      setError('Subscription not available yet. Please try again later.');
      return;
    }
    
    setPurchasing(true);
    setError(null);
    
    const pkg = offerings.availablePackages[0];
    const result = await subscribe(pkg);
    
    if (!result.success && result.error !== 'cancelled') {
      setError(result.error || 'Something went wrong. Please try again.');
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    setRestoreMsg(null);
    
    const result = await restore();
    
    if (result.isActive) {
      setRestoreMsg('Subscription restored!');
    } else {
      setRestoreMsg('No active subscription found. If you believe this is an error, please contact support.');
    }
    setRestoring(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
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

        {/* Pricing */}
        <div className="px-5 pb-2">
          <div className="bg-gradient-to-r from-purple-50 to-primary-50 border border-purple-200 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="text-purple-400" size={16} />
              <span className="text-purple-700 font-bold text-sm">7 Days Free</span>
              <Sparkles className="text-purple-400" size={16} />
            </div>
            <p className="text-secondary-600 text-xs">
              Then just <span className="font-bold text-secondary-900">$1.99/month</span>. Cancel anytime.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="p-5 pt-3 space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={purchasing}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {purchasing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Start Your Free Trial
              </>
            )}
          </button>

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

          {error && (
            <p className="text-red-600 text-xs text-center bg-red-50 p-2 rounded-lg">{error}</p>
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
          <p className="text-secondary-400 text-[10px] text-center leading-snug">
            Payment will be charged to your App Store or Google Play account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage your subscription in your device settings.
          </p>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full text-secondary-400 text-xs mt-3 hover:text-secondary-600 transition-colors"
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
