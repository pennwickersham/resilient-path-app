import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle, AlertTriangle, ClipboardList, Lock, Wind, Flame, ChevronRight, ShieldAlert, X } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import Paywall from '../components/Paywall';
import storage, { STORAGE_KEYS } from '../services/storage';
import { getProgress, summarizeProgress } from '../services/progress';

const Home = () => {
  const { isSubscribed, showPaywall, setShowPaywall, productInfo } = useSubscription();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);      // { total, done, pct, resume, resumeTitle }
  const [backupNudge, setBackupNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profile, workbook, health, lastBackup, prog] = await Promise.all([
          storage.get(STORAGE_KEYS.PROFILE),
          storage.get(STORAGE_KEYS.WORKBOOK),
          storage.get(STORAGE_KEYS.HEALTH_TOOLS),
          storage.get(STORAGE_KEYS.LAST_BACKUP),
          getProgress(),
        ]);

        // First launch → guided onboarding. Existing users (any saved data)
        // are never interrupted; the redirect only fires on a truly fresh app.
        const hasData = (workbook && Object.keys(workbook).length > 0) ||
          (health && ((health.symptoms || []).some(s => s.date) || (health.medications || []).some(m => m.name)));
        if (!profile?.onboarded && !hasData) {
          navigate('/onboarding', { replace: true });
          return;
        }

        setProgress(summarizeProgress(prog));

        // Backup nudge: meaningful data + no backup in 30 days (or ever).
        if (hasData) {
          const last = lastBackup ? Date.parse(lastBackup) : null;
          const stale = !last || (Date.now() - last) > 30 * 86400000;
          setBackupNudge(stale);
        }
      } catch (e) {
        console.error('Home init failed', e);
      }
    })();
  }, [navigate]);

  // Helper to get price with fallback
  const getPriceDisplay = () => {
    if (productInfo?.priceString) {
      const priceWithoutTrailingZeros = productInfo.priceString.replace('.00', '');
      return `${priceWithoutTrailingZeros}/month`;
    }
    // Fallback
    return '$3.99/month';
  };

  const handleGatedNav = (e) => {
    if (!isSubscribed) {
      e.preventDefault();
      setShowPaywall(true);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500 pb-6">

      {/* Paywall Modal */}
      {showPaywall && (
        <Paywall onClose={() => setShowPaywall(false)} />
      )}

      {/* Flare Mode — one tap, always available, never gated */}
      <Link
        to="/flare"
        className="w-full rounded-2xl p-4 flex items-center justify-between shadow-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white active:scale-[0.98] transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Flame size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-base leading-tight">Having a flare?</p>
            <p className="text-white/85 text-xs mt-0.5">One tap: your plan, your tools, your care team.</p>
          </div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-white/80" />
      </Link>

      {/* Backup nudge — only when data is going unprotected */}
      {backupNudge && !nudgeDismissed && (
        <div className="flex items-start gap-3 bg-secondary-100 border border-secondary-200 rounded-2xl p-4">
          <ShieldAlert size={18} className="text-secondary-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-secondary-800 leading-tight">Protect your entries</p>
            <p className="text-xs text-secondary-500 leading-snug mt-0.5">
              It&apos;s been a while since your last backup. One tap in Health Tools keeps your workbook and tracking safe if this phone is ever lost.
            </p>
            <button
              onClick={() => { if (!isSubscribed) { setShowPaywall(true); } else { navigate('/health-tools'); } }}
              className="text-xs font-bold text-primary-700 mt-1.5 inline-flex items-center gap-0.5"
            >
              Back up now <ChevronRight size={13} />
            </button>
          </div>
          <button onClick={() => setNudgeDismissed(true)} aria-label="Dismiss" className="text-secondary-400 hover:text-secondary-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Book Cover / Hero Section */}
      <section className="relative w-full h-72 rounded-3xl overflow-hidden shadow-md flex items-center justify-center bg-black group">
        <img
          src="./book-cover.jpg"
          alt="The Resilient Path Book Cover"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </section>

      {/* Program progress — visible momentum + a one-tap resume point */}
      {progress && progress.done > 0 && (
        <section
          className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 cursor-pointer hover:border-primary-200 transition-colors"
          onClick={() => {
            if (!isSubscribed) { setShowPaywall(true); return; }
            navigate(progress.resume ? `/workbook?module=${progress.resume}` : '/workbook');
          }}
        >
          <div className="flex items-center gap-4">
            {/* Progress ring */}
            <div className="relative w-16 h-16 shrink-0">
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="27" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                <circle
                  cx="32" cy="32" r="27" fill="none" stroke="#0d9488" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${(2 * Math.PI * 27) * (progress.pct / 100)} ${(2 * Math.PI * 27)}`}
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-extrabold text-primary-700">{progress.pct}%</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-primary-900 font-bold text-base leading-tight">
                {progress.done} of {progress.total} modules complete
              </h3>
              {progress.resume ? (
                <p className="text-secondary-500 text-xs leading-snug mt-1">
                  Pick up where you left off: <span className="font-semibold text-secondary-700">Module {progress.resume}{progress.resumeTitle ? ` · ${progress.resumeTitle}` : ''}</span>
                </p>
              ) : (
                <p className="text-emerald-700 text-xs font-semibold mt-1">Every module complete. Revisit any of them, any time.</p>
              )}
            </div>
            <ChevronRight size={18} className="text-secondary-300 shrink-0" />
          </div>
        </section>
      )}

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 mt-2">
        <h2 className="text-xl font-bold text-primary-800 mb-1">Welcome Back</h2>
        <p className="text-secondary-600 text-sm leading-relaxed">
          Manage your journey with structured modules, guided journaling, and empathetic AI support.
        </p>
      </section>

      {/* Subscription CTA — ALWAYS visible so reviewers and users can always locate the IAP */}
      <button
        id="get-full-access-btn"
        onClick={() => setShowPaywall(true)}
        className={`w-full rounded-2xl p-5 flex items-center justify-between shadow-md active:scale-[0.98] transition-all duration-200 ${
          isSubscribed
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
        } text-white`}
      >
        <div className="text-left">
          <p className="font-bold text-base leading-tight">
            {isSubscribed ? '✓ Subscribed — Manage Plan' : 'Get Full Access'}
          </p>
          <p className="text-white/80 text-xs mt-0.5">
            {isSubscribed ? 'Tap to view or manage your subscription' : `${getPriceDisplay()} · Cancel anytime`}
          </p>
        </div>
        <div className="bg-white/20 rounded-xl px-3 py-1.5 text-sm font-bold shrink-0 ml-3">
          {isSubscribed ? 'Manage' : 'Subscribe'}
        </div>
      </button>

      {/* Book & Workbook Purchase Section */}
      <section
        className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 flex flex-col gap-4 relative overflow-hidden group hover:border-primary-200 transition-colors cursor-pointer"
        onClick={() => window.open('https://brewsterwickershampublications.com', '_blank')}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-900 rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-primary-900 font-bold text-lg">Order the Book & Workbook</h3>
            <p className="text-secondary-600 text-sm leading-snug mt-0.5">
              Get the complete hardcopy book and journaling companion.
            </p>
          </div>
        </div>

        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center justify-between group-hover:bg-primary-100 transition-colors">
          <span className="text-primary-800 font-bold text-sm">Brewster Wickersham Publications</span>
          <div className="bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
            Shop Now
          </div>
        </div>

        {/* Decorative accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-100/30 rounded-full blur-2xl"></div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/coping-tools"
          className="bg-primary-50 p-5 rounded-2xl border border-primary-100 flex flex-col items-center text-center justify-center hover:bg-primary-100 transition shadow-sm group cursor-pointer relative"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition duration-300">
            <Wind className="text-primary-600" size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-primary-900 text-sm">Coping Toolbox</h3>
          <p className="text-[11px] text-secondary-500 mt-0.5">Breathing · Body scan · Grounding</p>
        </Link>

        <Link
          to="/workbook"
          onClick={handleGatedNav}
          className="bg-primary-50 p-5 rounded-2xl border border-primary-100 flex flex-col items-center text-center justify-center hover:bg-primary-100 transition shadow-sm group cursor-pointer relative"
        >
          {!isSubscribed && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-secondary-200 rounded-full flex items-center justify-center">
              <Lock className="text-secondary-500" size={12} />
            </div>
          )}
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition duration-300">
            <BookOpen className="text-primary-600" size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-primary-900 text-sm">Review Your Workbook</h3>
        </Link>

        <Link
          to="/chatbot"
          onClick={handleGatedNav}
          className="bg-primary-50 p-5 rounded-2xl border border-primary-100 flex flex-col items-center text-center justify-center hover:bg-primary-100 transition shadow-sm group cursor-pointer relative"
        >
          {!isSubscribed && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-secondary-200 rounded-full flex items-center justify-center">
              <Lock className="text-secondary-500" size={12} />
            </div>
          )}
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition duration-300">
            <MessageCircle className="text-primary-600" size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-primary-900 text-sm">Ask the Program Guide</h3>
        </Link>
      </div>

      <Link
        to="/health-tools"
        onClick={handleGatedNav}
        className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex items-center gap-4 hover:bg-primary-100 transition shadow-sm group cursor-pointer relative"
      >
        {!isSubscribed && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-secondary-200 rounded-full flex items-center justify-center">
            <Lock className="text-secondary-500" size={12} />
          </div>
        )}
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition duration-300">
          <ClipboardList className="text-primary-600" size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="font-bold text-primary-900 text-base">My Health Tools</h3>
          <p className="text-primary-600/80 text-xs font-medium leading-tight mt-0.5">Medications, doctors, history & symptom tracker — easy to share.</p>
        </div>
      </Link>

      <Link to="/emergency" className="bg-purple-50 p-4 rounded-2xl border border-purple-200 flex items-center gap-4 hover:bg-purple-100 transition shadow-sm mt-2 cursor-pointer group">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition duration-300">
          <AlertTriangle className="text-purple-600" size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="font-bold text-purple-800 text-base">Emergency Information</h3>
          <p className="text-purple-600/80 text-xs font-medium leading-tight mt-0.5">Quick access to crisis resources.</p>
        </div>
      </Link>
    </div>
  );
};

export default Home;
