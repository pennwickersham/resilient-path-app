import { PhoneCall, AlertCircle, HeartPulse } from 'lucide-react';

const EmergencyGuidance = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
        <AlertCircle className="text-red-600" size={28} />
        Emergency Help
      </h2>

      <div className="bg-red-50 p-5 rounded-2xl border border-red-200">
        <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
          <HeartPulse size={20} />
          In Crisis or Feeling Suicidal?
        </h3>
        <p className="text-red-800 text-sm mb-4">
          You are not alone. Please reach out immediately. Help is available 24/7.
        </p>
        <a href="tel:988" className="bg-red-600 text-white flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition">
          <PhoneCall size={20} />
          Call or Text 988
        </a>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-secondary-200 shadow-sm">
        <h3 className="font-bold text-secondary-900 mb-2">When to Call Your Doctor</h3>
        <ul className="list-disc pl-5 text-sm text-secondary-700 space-y-2">
          <li>New or worsening pain that is significantly different from your baseline.</li>
          <li>Side effects from medications that are concerning but not life-threatening.</li>
          <li>Questions about your treatment plan or workbook exercises.</li>
        </ul>
      </div>

      <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200 shadow-sm">
        <h3 className="font-bold text-orange-900 mb-2">Urgent vs Emergent Care</h3>
        <div className="space-y-4 text-sm text-orange-900">
          <div>
            <strong className="block mb-1 text-orange-950">Go to the Emergency Room (Emergent) if:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sudden loss of bowel or bladder control.</li>
              <li>Sudden onset of severe weakness or numbness in arms or legs.</li>
              <li>Chest pain, difficulty breathing, or signs of a stroke.</li>
            </ul>
          </div>
          <div>
            <strong className="block mb-1 text-orange-950">Go to Urgent Care if:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>Severe pain flare-up that cannot be managed at home but does not include emergency symptoms.</li>
              <li>Minor injuries or infections.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyGuidance;
