import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, MessageCircle, ClipboardList, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import Paywall from './Paywall';

// Pages that require a subscription
const GATED_PATHS = ['/workbook', '/chatbot', '/health-tools'];

const Layout = () => {
  const { isSubscribed, isLoading } = useSubscription();
  const location = useLocation();

  const isGatedPage = GATED_PATHS.some(p => location.pathname.startsWith(p));
  const showGate = isGatedPage && !isSubscribed && !isLoading;

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Workbook', path: '/workbook', icon: FileText },
    { name: 'Chat', path: '/chatbot', icon: MessageCircle },
    { name: 'Health', path: '/health-tools', icon: ClipboardList },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
  ];

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
        {showGate ? <Paywall /> : <Outlet />}
      </main>

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
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 ${
                  isActive ? 'text-primary-600' : 'text-secondary-500 hover:text-primary-500'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
