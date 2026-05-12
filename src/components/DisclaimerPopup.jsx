import { useState, useEffect } from 'react';
import { AlertCircle, Bot, ShieldCheck, Heart } from 'lucide-react';

const DisclaimerPopup = () => {
  const [step, setStep] = useState(null); // null = not ready, 'medical' | 'ai' | 'done'

  useEffect(() => {
    const aiConsentAccepted = localStorage.getItem('aiConsentAccepted');
    // Always show medical disclaimer on launch; show AI consent only on first install
    if (aiConsentAccepted === 'true') {
      setStep('medical'); // skip AI step on subsequent launches
    } else {
      setStep('medical'); // show medical first, then AI
    }
  }, []);

  const handleAcceptMedical = () => {
    const aiConsentAccepted = localStorage.getItem('aiConsentAccepted');
    if (aiConsentAccepted === 'true') {
      setStep('done');
    } else {
      setStep('ai');
    }
  };

  const handleAcceptAI = () => {
    localStorage.setItem('aiConsentAccepted', 'true');
    setStep('done');
  };

  const handleDeclineAI = () => {
    // User declined AI data sharing — store explicit refusal
    localStorage.setItem('aiConsentAccepted', 'false');
    setStep('done');
  };

  if (!step || step === 'done') {
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

        {/* ── Step 1: Medical Disclaimer ── */}
        {step === 'medical' && (
          <>
            <div className="flex flex-col items-center gap-2 text-purple-600 mb-4 text-center">
              <AlertCircle size={36} />
              <h2 className="text-xl font-bold uppercase tracking-wide">Not a Medical Device</h2>
              <h3 className="text-lg font-semibold text-secondary-900">Medical Disclaimer</h3>
            </div>

            <div className="h-72 overflow-y-auto pr-2 text-sm text-secondary-700 bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 mb-4">
              <p>
                <strong>Important:</strong> "Managing Life with Chronic Pain: The Resilient Path" is an <strong>educational and informational wellness tool only</strong>. It is <strong>NOT</strong> a medical device and has not received regulatory clearance from the FDA or any other regulatory body.
              </p>
              <p>
                This application does <strong>NOT</strong> provide medical advice, diagnoses, or treatment recommendations. The content — including the digital workbook, AI chat assistant, and health tracking tools — is intended solely for general informational and educational purposes.
              </p>
              <p>
                Always seek the advice of your rheumatologist, pain management provider, or other qualified health provider with any questions regarding a medical condition. <strong>Do not rely on information in this app to make medical decisions.</strong>
              </p>
              <p>
                Never disregard professional medical advice or delay seeking it because of something you have read or seen in this app. If you think you may have a medical emergency, call your doctor or 911 immediately.
              </p>
              <p>
                The AI-powered chat feature provides responses based on educational material only. It cannot and does not diagnose conditions, prescribe medications, or replace consultations with licensed healthcare professionals.
              </p>
            </div>

            {/* Self-compassion statement */}
            <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl p-3 mb-5">
              <Heart size={20} className="text-purple-500 shrink-0 mt-0.5" />
              <p className="text-sm text-purple-800 leading-relaxed">
                We encourage you to use this app and the information it provides with <strong>patience, honesty, and self-compassion</strong>. Your journey is unique, and progress is not always linear. Be gentle with yourself along the way.
              </p>
            </div>

            <p className="text-xs text-secondary-500 text-center mb-4">
              By tapping "I Understand and Accept", you acknowledge that this app is not a substitute for professional medical guidance.
            </p>

            <button
              id="disclaimer-accept-btn"
              onClick={handleAcceptMedical}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-sm"
            >
              I Understand and Accept
            </button>
          </>
        )}

        {/* ── Step 2: AI Data Sharing Consent (first install only) ── */}
        {step === 'ai' && (
          <>
            <div className="flex flex-col items-center gap-2 text-primary-600 mb-4 text-center">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Bot size={32} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-secondary-900">AI Assistant Data Notice</h2>
              <p className="text-secondary-500 text-xs">Required before using the AI feature</p>
            </div>

            <div className="overflow-y-auto pr-1 text-sm text-secondary-700 bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 mb-5 max-h-64">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-primary-500 mt-0.5 shrink-0" />
                <p>
                  <strong>Third-Party AI Service:</strong> The "Therapist AI" chat feature is powered by <strong>Google Gemini</strong>, an AI service operated by <strong>Google LLC</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-primary-500 mt-0.5 shrink-0" />
                <p>
                  <strong>Data Sent to Google:</strong> When you use the chat feature, the following information is transmitted to Google's servers to generate a response:
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-secondary-600">
                <li>Your typed messages</li>
                <li>Your conversation history within the current session</li>
                <li>Excerpts from the Resilient Path program materials (used as AI context)</li>
              </ul>
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-primary-500 mt-0.5 shrink-0" />
                <p>
                  <strong>What is NOT sent:</strong> Your name, account details, subscription status, health tracking data, or any data from the Workbook or Health Tools sections.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-primary-500 mt-0.5 shrink-0" />
                <p>
                  <strong>Google's Privacy Policy</strong> governs how Google processes this data. You can review it at <span className="text-primary-600 underline">policies.google.com/privacy</span>.
                </p>
              </div>
              <p className="text-xs text-secondary-500 pt-1">
                You can decline and still use all other app features. The AI chat will remain unavailable if you decline.
              </p>
            </div>

            <div className="space-y-2">
              <button
                id="ai-consent-accept-btn"
                onClick={handleAcceptAI}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-sm"
              >
                I Consent — Enable AI Chat
              </button>
              <button
                id="ai-consent-decline-btn"
                onClick={handleDeclineAI}
                className="w-full border border-secondary-200 text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 font-medium py-2.5 rounded-xl transition duration-200 text-sm"
              >
                No Thanks — Skip AI Feature
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DisclaimerPopup;
