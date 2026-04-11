import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, AlertTriangle } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500 pb-6">
      
      {/* Book Cover / Hero Section */}
      <section className="relative w-full h-72 rounded-3xl overflow-hidden shadow-md flex items-center justify-center bg-black group">
        <img 
          src="/book-cover.jpg" 
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

      <div className="grid grid-cols-2 gap-4">
        <Link to="/workbook" className="bg-primary-50 p-5 rounded-2xl border border-primary-100 flex flex-col items-center text-center justify-center hover:bg-primary-100 transition shadow-sm group cursor-pointer">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition duration-300">
            <BookOpen className="text-primary-600" size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-primary-900 text-sm">Review Your Workbook</h3>
        </Link>
        
        <Link to="/chatbot" className="bg-primary-50 p-5 rounded-2xl border border-primary-100 flex flex-col items-center text-center justify-center hover:bg-primary-100 transition shadow-sm group cursor-pointer">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition duration-300">
            <MessageCircle className="text-primary-600" size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-semibold text-primary-900 text-sm">Ask the Therapist AI</h3>
        </Link>
      </div>

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
