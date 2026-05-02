import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle, AlertTriangle, ClipboardList, Lock } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import Paywall from '../components/Paywall';

const Home = () => {
  const { isSubscribed, showPaywall, setShowPaywall } = useSubscription();
  const navigate = useNavigate();

  const handleGatedNav = (e, path) => {
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

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 mt-2">
        <h2 className="text-xl font-bold text-primary-800 mb-1">Welcome Back</h2>
        <p className="text-secondary-600 text-sm leading-relaxed">
          Manage your journey with structured modules, guided journaling, and empathetic AI support.
        </p>
      </section>

      {/* Shopify / Book Purchase Section */}
      <section 
        className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 flex flex-col gap-4 relative overflow-hidden group hover:border-primary-200 transition-colors cursor-pointer"
        onClick={() => window.open('https://shopify.com', '_blank')}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-900 rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-primary-900 font-bold text-lg">Order the Physical Workbook</h3>
            <p className="text-secondary-600 text-sm leading-snug mt-0.5">
              Get the complete hardcopy book and journaling companion.
            </p>
          </div>
        </div>
        
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center justify-between group-hover:bg-primary-100 transition-colors">
          <span className="text-primary-800 font-bold text-sm">Visit our Shopify Store</span>
          <div className="bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
            TBD
          </div>
        </div>
        
        {/* Decorative Shopify-esque feel */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-100/30 rounded-full blur-2xl"></div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Link 
          to="/workbook" 
          onClick={(e) => handleGatedNav(e, '/workbook')}
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
          onClick={(e) => handleGatedNav(e, '/chatbot')}
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
          <h3 className="font-semibold text-primary-900 text-sm">Ask the Therapist AI</h3>
        </Link>
      </div>

      <Link 
        to="/health-tools" 
        onClick={(e) => handleGatedNav(e, '/health-tools')}
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

      <Link to="/emergency" className="bg-red-50 p-4 rounded-2xl border border-red-200 flex items-center gap-4 hover:bg-red-100 transition shadow-sm mt-2 cursor-pointer group">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition duration-300">
          <AlertTriangle className="text-red-600" size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="font-bold text-red-800 text-base">Emergency Information</h3>
          <p className="text-red-600/80 text-xs font-medium leading-tight mt-0.5">Quick access to crisis resources.</p>
        </div>
      </Link>
    </div>
  );
};

export default Home;
