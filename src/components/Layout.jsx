import { Outlet, NavLink } from 'react-router-dom';
import { Home, FileText, MessageCircle, AlertTriangle } from 'lucide-react';

const Layout = () => {
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Workbook', path: '/workbook', icon: FileText },
    { name: 'Chat', path: '/chatbot', icon: MessageCircle },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-secondary-50 text-secondary-900 font-sans w-full max-w-md mx-auto relative shadow-xl overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-secondary-100 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-center">
        <h1 className="text-xl font-bold text-primary-700 tracking-tight">Resilient Path</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 p-4 relative z-0">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-secondary-100 flex justify-around items-center h-16 px-2 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
              <Icon size={24} strokeWidth={2.5} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
