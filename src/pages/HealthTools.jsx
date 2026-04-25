import { useState, useEffect } from 'react';
import { Pill, Stethoscope, ClipboardList, Activity, Share2, Printer, Plus, Trash2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

const TABS = [
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'history', label: 'History', icon: ClipboardList },
  { id: 'symptoms', label: 'Symptoms', icon: Activity },
];

const emptyMedication = { name: '', dose: '', frequency: '', doctor: '', purpose: '', sideEffects: '' };
const emptyDoctor = { name: '', specialty: '', phone: '', portal: '', notes: '' };
const emptySymptomEntry = { date: '', pain: '', fatigue: '', mood: '', sleep: '', notes: '', triggers: '' };

const HealthTools = () => {
  const [activeTab, setActiveTab] = useState('medications');

  // Medications state
  const [medications, setMedications] = useState([{ ...emptyMedication }]);

  // Doctors state
  const [doctors, setDoctors] = useState([{ ...emptyDoctor }]);

  // Medical history state
  const [history, setHistory] = useState({
    conditions: '', surgeries: '', allergies: '', familyHistory: '', otherNotes: ''
  });

  // Symptom tracker state
  const [symptoms, setSymptoms] = useState([{ ...emptySymptomEntry }]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('resilientPathHealthTools');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.medications?.length) setMedications(data.medications);
        if (data.doctors?.length) setDoctors(data.doctors);
        if (data.history) setHistory(data.history);
        if (data.symptoms?.length) setSymptoms(data.symptoms);
      }
    } catch (e) {
      console.error('Failed to load health tools data', e);
    }
  }, []);

  // Save to localStorage on any change
  useEffect(() => {
    const data = { medications, doctors, history, symptoms };
    localStorage.setItem('resilientPathHealthTools', JSON.stringify(data));
  }, [medications, doctors, history, symptoms]);

  // Sharing helpers
  const formatMedicationsText = () => {
    let text = "═══ MY MEDICATIONS ═══\n\n";
    medications.forEach((med, i) => {
      if (!med.name && !med.dose) return;
      text += `${i + 1}. ${med.name || '(unnamed)'}\n`;
      if (med.dose) text += `   Dose: ${med.dose}\n`;
      if (med.frequency) text += `   Frequency: ${med.frequency}\n`;
      if (med.doctor) text += `   Prescribing Doctor: ${med.doctor}\n`;
      if (med.purpose) text += `   Purpose: ${med.purpose}\n`;
      if (med.sideEffects) text += `   Side Effects: ${med.sideEffects}\n`;
      text += '\n';
    });
    return text;
  };

  const formatDoctorsText = () => {
    let text = "═══ MY DOCTORS & PROVIDERS ═══\n\n";
    doctors.forEach((doc, i) => {
      if (!doc.name && !doc.specialty) return;
      text += `${i + 1}. ${doc.name || '(unnamed)'}\n`;
      if (doc.specialty) text += `   Specialty: ${doc.specialty}\n`;
      if (doc.phone) text += `   Phone: ${doc.phone}\n`;
      if (doc.portal) text += `   Portal/Email: ${doc.portal}\n`;
      if (doc.notes) text += `   Notes: ${doc.notes}\n`;
      text += '\n';
    });
    return text;
  };

  const formatHistoryText = () => {
    let text = "═══ MY MEDICAL HISTORY ═══\n\n";
    if (history.conditions) text += `Conditions/Diagnoses:\n${history.conditions}\n\n`;
    if (history.surgeries) text += `Surgeries/Procedures:\n${history.surgeries}\n\n`;
    if (history.allergies) text += `Allergies:\n${history.allergies}\n\n`;
    if (history.familyHistory) text += `Family History:\n${history.familyHistory}\n\n`;
    if (history.otherNotes) text += `Other Notes:\n${history.otherNotes}\n\n`;
    return text;
  };

  const formatSymptomsText = () => {
    let text = "═══ SYMPTOM TRACKER ═══\n\n";
    symptoms.forEach((entry, i) => {
      if (!entry.date && !entry.pain) return;
      text += `Entry ${i + 1}${entry.date ? ` (${entry.date})` : ''}\n`;
      if (entry.pain) text += `   Pain: ${entry.pain}/10\n`;
      if (entry.fatigue) text += `   Fatigue: ${entry.fatigue}/10\n`;
      if (entry.mood) text += `   Mood: ${entry.mood}\n`;
      if (entry.sleep) text += `   Sleep Quality: ${entry.sleep}/10\n`;
      if (entry.triggers) text += `   Triggers: ${entry.triggers}\n`;
      if (entry.notes) text += `   Notes: ${entry.notes}\n`;
      text += '\n';
    });
    return text;
  };

  const handleShare = async (section) => {
    let text = '';
    let title = '';
    switch (section) {
      case 'medications':
        text = formatMedicationsText();
        title = 'My Medications';
        break;
      case 'doctors':
        text = formatDoctorsText();
        title = 'My Doctors & Providers';
        break;
      case 'history':
        text = formatHistoryText();
        title = 'My Medical History';
        break;
      case 'symptoms':
        text = formatSymptomsText();
        title = 'Symptom Tracker';
        break;
      case 'all':
        text = formatMedicationsText() + '\n' + formatDoctorsText() + '\n' + formatHistoryText() + '\n' + formatSymptomsText();
        title = 'My Health Records';
        break;
      default: return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({ title, text: text.trim(), dialogTitle: `Share ${title}` });
      } catch (e) {
        console.error('Share failed', e);
      }
    } else {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 2rem;">${text}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generic list updater
  const updateListItem = (setter, index, field, value) => {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addListItem = (setter, template) => {
    setter(prev => [...prev, { ...template }]);
  };

  const removeListItem = (setter, index) => {
    setter(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  // Field renderer helper
  const renderField = (label, value, onChange, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="w-full border border-secondary-200 rounded-xl p-3 text-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y min-h-[80px] text-sm bg-white"
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="w-full border border-secondary-200 rounded-xl p-3 text-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white"
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center mb-1 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-primary-800">Health Tools</h2>
        <button
          onClick={() => handleShare('all')}
          className="flex items-center gap-1.5 bg-primary-100 hover:bg-primary-200 text-primary-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {Capacitor.isNativePlatform() ? <Share2 size={16} /> : <Printer size={16} />}
          {Capacitor.isNativePlatform() ? 'Share All' : 'Print All'}
        </button>
      </div>

      <p className="text-secondary-600 text-sm mb-2">
        Keep all your important health information in one place. Easy to share with your healthcare team via email, text, or print.
      </p>

      {/* Tab Selector */}
      <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-secondary-600 border border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">

        {/* ─── MEDICATIONS TAB ─── */}
        {activeTab === 'medications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">My Medications</h3>
              <button
                onClick={() => handleShare('medications')}
                className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {Capacitor.isNativePlatform() ? <Share2 size={13} /> : <Printer size={13} />}
                Share
              </button>
            </div>

            {medications.map((med, idx) => (
              <div key={idx} className="bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                    Medication {idx + 1}
                  </span>
                  {medications.length > 1 && (
                    <button onClick={() => removeListItem(setMedications, idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {renderField('Name', med.name, (v) => updateListItem(setMedications, idx, 'name', v))}
                <div className="grid grid-cols-2 gap-3">
                  {renderField('Dose', med.dose, (v) => updateListItem(setMedications, idx, 'dose', v), 'text', 'e.g., 50mg')}
                  {renderField('Frequency', med.frequency, (v) => updateListItem(setMedications, idx, 'frequency', v), 'text', 'e.g., twice daily')}
                </div>
                {renderField('Prescribing Doctor', med.doctor, (v) => updateListItem(setMedications, idx, 'doctor', v))}
                {renderField('Purpose', med.purpose, (v) => updateListItem(setMedications, idx, 'purpose', v), 'text', 'What is this for?')}
                {renderField('Side Effects Noted', med.sideEffects, (v) => updateListItem(setMedications, idx, 'sideEffects', v), 'text', 'Any side effects?')}
              </div>
            ))}

            <button
              onClick={() => addListItem(setMedications, emptyMedication)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus size={18} />
              Add Medication
            </button>
          </div>
        )}

        {/* ─── DOCTORS TAB ─── */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">My Doctors & Providers</h3>
              <button
                onClick={() => handleShare('doctors')}
                className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {Capacitor.isNativePlatform() ? <Share2 size={13} /> : <Printer size={13} />}
                Share
              </button>
            </div>

            {doctors.map((doc, idx) => (
              <div key={idx} className="bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                    Provider {idx + 1}
                  </span>
                  {doctors.length > 1 && (
                    <button onClick={() => removeListItem(setDoctors, idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {renderField('Name', doc.name, (v) => updateListItem(setDoctors, idx, 'name', v))}
                {renderField('Specialty', doc.specialty, (v) => updateListItem(setDoctors, idx, 'specialty', v), 'text', 'e.g., Rheumatologist, PCP')}
                <div className="grid grid-cols-2 gap-3">
                  {renderField('Phone', doc.phone, (v) => updateListItem(setDoctors, idx, 'phone', v), 'tel', '(555) 123-4567')}
                  {renderField('Portal/Email', doc.portal, (v) => updateListItem(setDoctors, idx, 'portal', v), 'text', 'MyChart, email, etc.')}
                </div>
                {renderField('Notes', doc.notes, (v) => updateListItem(setDoctors, idx, 'notes', v), 'text', 'Key role in your care')}
              </div>
            ))}

            <button
              onClick={() => addListItem(setDoctors, emptyDoctor)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus size={18} />
              Add Provider
            </button>
          </div>
        )}

        {/* ─── MEDICAL HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">My Medical History</h3>
              <button
                onClick={() => handleShare('history')}
                className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {Capacitor.isNativePlatform() ? <Share2 size={13} /> : <Printer size={13} />}
                Share
              </button>
            </div>

            {renderField('Conditions & Diagnoses', history.conditions, (v) => setHistory(prev => ({ ...prev, conditions: v })), 'textarea', 'List your current diagnoses...')}
            {renderField('Surgeries & Procedures', history.surgeries, (v) => setHistory(prev => ({ ...prev, surgeries: v })), 'textarea', 'Past surgeries, dates, outcomes...')}
            {renderField('Allergies', history.allergies, (v) => setHistory(prev => ({ ...prev, allergies: v })), 'textarea', 'Medications, foods, environmental...')}
            {renderField('Family History', history.familyHistory, (v) => setHistory(prev => ({ ...prev, familyHistory: v })), 'textarea', 'Relevant family medical history...')}
            {renderField('Other Notes', history.otherNotes, (v) => setHistory(prev => ({ ...prev, otherNotes: v })), 'textarea', 'Anything else important...')}
          </div>
        )}

        {/* ─── SYMPTOM TRACKER TAB ─── */}
        {activeTab === 'symptoms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">Symptom Tracker</h3>
              <button
                onClick={() => handleShare('symptoms')}
                className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {Capacitor.isNativePlatform() ? <Share2 size={13} /> : <Printer size={13} />}
                Share
              </button>
            </div>

            <p className="text-secondary-500 text-xs">
              Log your daily symptoms to share with your healthcare team and spot patterns over time.
            </p>

            {symptoms.map((entry, idx) => (
              <div key={idx} className="bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                    Entry {idx + 1}
                  </span>
                  {symptoms.length > 1 && (
                    <button onClick={() => removeListItem(setSymptoms, idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {renderField('Date', entry.date, (v) => updateListItem(setSymptoms, idx, 'date', v), 'date')}
                <div className="grid grid-cols-3 gap-3">
                  {renderField('Pain (0-10)', entry.pain, (v) => updateListItem(setSymptoms, idx, 'pain', v), 'number', '0-10')}
                  {renderField('Fatigue (0-10)', entry.fatigue, (v) => updateListItem(setSymptoms, idx, 'fatigue', v), 'number', '0-10')}
                  {renderField('Sleep (0-10)', entry.sleep, (v) => updateListItem(setSymptoms, idx, 'sleep', v), 'number', '0-10')}
                </div>
                {renderField('Mood', entry.mood, (v) => updateListItem(setSymptoms, idx, 'mood', v), 'text', 'e.g., calm, frustrated, hopeful')}
                {renderField('Triggers', entry.triggers, (v) => updateListItem(setSymptoms, idx, 'triggers', v), 'text', 'What may have contributed?')}
                {renderField('Notes', entry.notes, (v) => updateListItem(setSymptoms, idx, 'notes', v), 'text', 'Anything else to note?')}
              </div>
            ))}

            <button
              onClick={() => addListItem(setSymptoms, emptySymptomEntry)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus size={18} />
              Add Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTools;
