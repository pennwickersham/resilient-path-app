import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    let handler;
    const registerListener = async () => {
      handler = await CapacitorApp.addListener('backButton', () => {
        if (location.pathname !== '/') {
          // If we're not on home, go back to home
          navigate('/');
        } else {
          // If we're already on home, show exit confirmation dialog
          setShowExitDialog(true);
        }
      });
    };
    
    registerListener();

    return () => {
      // Cleanup listener so we don't multiply instances on path changes
      if (handler) {
        handler.remove();
      }
    };
  }, [location.pathname, navigate]);

  if (!showExitDialog) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold mb-2 text-primary-900">Exit App?</h2>
        <p className="text-secondary-600 mb-6 font-medium leading-snug">Are you sure you want to close Resilient Path?</p>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowExitDialog(false)}
            className="flex-1 bg-secondary-100 hover:bg-secondary-200 text-secondary-800 font-bold py-3 rounded-xl transition shadow-sm"
          >
            Stay
          </button>
          <button 
            onClick={() => CapacitorApp.exitApp()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-sm"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackButtonHandler;
