import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const DisclaimerPopup = () => {
  const [accepted, setAccepted] = useState(false); // Default false to require acknowledgment every time
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Show disclaimer every time the app opens, no localStorage check
    setMounted(true);
  }, []);

  const handleAccept = () => {
    setAccepted(true);
  };

  if (!mounted || accepted) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}
    >
      <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-red-600 mb-4 text-center">
          <AlertCircle size={36} />
          <h2 className="text-xl font-bold uppercase tracking-wide">Not a Medical Device</h2>
          <h3 className="text-lg font-semibold text-secondary-900">Medical Disclaimer</h3>
        </div>
        
        <div className="h-64 overflow-y-auto pr-2 text-sm text-secondary-700 bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 mb-6">
          <p>
            <strong>Important:</strong> "Managing Life with Chronic Pain: The Resilient Path" Application is intended for informational purposes only and does <strong>NOT</strong> provide medical advice.
          </p>
          <p>
            The content is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
          </p>
          <p>
            Always seek the advice of your rheumatologist, pain management provider, or other qualified health provider with any questions regarding a medical condition.
          </p>
          <p>
            Never disregard professional medical advice or delay seeking it because of something you have read or seen in this app.
          </p>
          <p>
            By clicking "Accept", you acknowledge that you have read this disclaimer and understand that this tool is not a substitute for professional medical guidance.
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-sm"
        >
          I Understand and Accept
        </button>
      </div>
    </div>
  );
};

export default DisclaimerPopup;
