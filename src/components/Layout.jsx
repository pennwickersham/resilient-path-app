import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, MessageCircle, ClipboardList, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import Paywall from './Paywall';

// Pages that require a subscription
const GATED_PATHS = ['/workbook', '/chatbot', '/health-tools'];

const Layout = () => {
  const { isSubscribed, isLoading, showPaywall, setShowPaywall } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const isGatedPage = GATED_PATHS.some(p => location.pathname.startsWith(p));

  // Determine what to render in the content area:
  // 1. If still loading subscription status on a gated page → show spinner (NOT content)
  // 2. If on a gated page and not subscribed → show paywall
  // 3. Otherwise → show the actual page content
  const showLoading = isGatedPage && isLoading;
  const showGate = isGatedPage && !isSubscribed && !isLoading;

  const navItems = [
    { name: 'Home', path: '/', icon: Home, gated: false },
    { name: 'Workbook', path: '/workbook', icon: FileText, gated: true },
    { name: 'Chat', path: '/chatbot', icon: MessageCircle, gated: true },
    { name: 'Health', path: '/health-tools', icon: ClipboardList, gated: true },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle, gated: false },
  ];

  // Handle tapping a gated nav item: block navigation and show paywall
  const handleNavClick = (e, item) => {
    if (item.gated && !isSubscribed && !isLoading) {
      e.preventDefault();
      setShowPaywall(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary-50 text-secondary-900 font-sans w-full max-w-md mx-auto relative shadow-xl overflow-hidden">
      {/* Header */}
      <header 
        className="bg-white border-b border-secondary-100 sticky top-0 z-10 shadow-sm flex items-center justify-center"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <h1 className="text-xl font-bold text-primary-700 tracking-tight">Resilient Path</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 p-4 relative z-0">
        {showLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-secondary-500 text-sm">Checking subscription…</p>
          </div>
        ) : showGate ? (
          <Paywall />
        ) : (
          <Outlet />
        )}
      </main>

      {/* Paywall modal triggered from nav taps */}
      {showPaywall && (
        <Paywall onClose={() => setShowPaywall(false)} />
      )}

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 w-full max-w-md bg-white border-t border-secondary-100 flex justify-around items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ 
          height: 'calc(4rem + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLocked = item.gated && !isSubscribed && !isLoading;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 relative ${
                  isActive ? 'text-primary-600' : 'text-secondary-500 hover:text-primary-500'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} strokeWidth={2} />
                {isLocked && (
                  <Lock size={10} className="absolute -top-1 -right-2 text-secondary-400" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
