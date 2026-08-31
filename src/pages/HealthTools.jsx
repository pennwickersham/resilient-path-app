import { useState, useEffect, useMemo } from 'react';
import { Pill, Stethoscope, ClipboardList, Activity, Share2, Printer, Plus, Trash2, Download, Check, LayoutDashboard, History } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import storage, { STORAGE_KEYS } from '../services/storage';
import SymptomDashboard from '../components/SymptomDashboard';
import ReminderCard from '../components/ReminderCard';
import { ensureReminderScheduled } from '../services/reminders';
import { STARTER_FOODS, PRACTICES, getRecentFoods, analyzeFoodTriggers, analyzePractices, validEntries, toNum } from '../services/symptomAnalysis';
import { FileText, FileDown, Loader2 } from 'lucide-react';
import { saveAndShareVisitPacket } from '../services/pdfReport';
import VoiceInputButton from '../components/VoiceInputButton';

// ─── Symptom helpers: quick entry, trends, weekly summary ───

const todayStr = () => new Date().toISOString().split('T')[0];
/** Tap-to-select 0–10 scale — a daily check-in should take seconds, not typing. */
const ScalePicker = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">{label}</label>
    <div className="flex gap-1">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(String(value) === String(i) ? '' : String(i))}
          className={`flex-1 min-w-0 h-9 rounded-lg text-xs font-bold transition-colors border ${
            String(value) === String(i)
              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
              : 'bg-white text-secondary-500 border-secondary-200 hover:border-primary-300'
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  </div>
);

const TABS = [
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'history', label: 'History', icon: ClipboardList },
  { id: 'symptoms', label: 'Symptoms', icon: Activity },
];

const emptyMedication = { name: '', dose: '', frequency: '', doctor: '', purpose: '', sideEffects: '', startDate: '' };
const emptyDoctor = { name: '', specialty: '', phone: '', portal: '', notes: '' };
const emptySymptomEntry = { date: '', pain: '', fatigue: '', mood: '', sleep: '', notes: '', triggers: '', foods: [], practices: [] };

const HealthTools = () => {
  const [activeTab, setActiveTab] = useState('medications');

  // Medications state
  const [medications, setMedications] = useState([{ ...emptyMedication }]);

  // Doctors state
  const [doctors, setDoctors] = useState([{ ...emptyDoctor }]);

  // Medical history state
  const [history, setHistory] = useState({
    conditions: '', surgeries: '', allergies: '', familyHistory: '', otherNotes: '', visitQuestions: ''
  });

  // Symptom tracker state
  const [symptoms, setSymptoms] = useState([{ ...emptySymptomEntry }]);

  // Flare events (logged by Flare Mode) — excuse streak gaps, annotate trends.
  const [flares, setFlares] = useState([]);

  // PDF visit packet generation state
  const [pdfBusy, setPdfBusy] = useState(false);

  // Quick daily check-in — date defaults to today, scales are tap-to-select.
  const [quickEntry, setQuickEntry] = useState({ ...emptySymptomEntry, date: todayStr(), foods: [], practices: [] });
  const [quickLogged, setQuickLogged] = useState(false);

  // Symptom tracker sub-view — the dashboard is the landing view.
  const [symptomView, setSymptomView] = useState('dashboard'); // 'dashboard' | 'checkin' | 'history'

  // Food diary input + quick-add chips (user's recent foods first, then common triggers)
  const [foodDraft, setFoodDraft] = useState('');
  const foodSuggestions = useMemo(() => {
    const merged = [...getRecentFoods(symptoms)];
    STARTER_FOODS.forEach(f => {
      if (!merged.some(m => m.toLowerCase() === f.toLowerCase())) merged.push(f);
    });
    return merged
      .filter(f => !(quickEntry.foods || []).some(x => x.toLowerCase() === f.toLowerCase()))
      .slice(0, 8);
  }, [symptoms, quickEntry.foods]);

  const addFood = (name) => {
    const v = (name !== undefined ? name : foodDraft).trim();
    if (!v) return;
    setQuickEntry(prev =>
      (prev.foods || []).some(f => f.toLowerCase() === v.toLowerCase())
        ? prev
        : { ...prev, foods: [...(prev.foods || []), v] }
    );
    setFoodDraft('');
  };

  const removeFood = (name) => {
    setQuickEntry(prev => ({ ...prev, foods: (prev.foods || []).filter(f => f !== name) }));
  };

  const togglePractice = (name) => {
    setQuickEntry(prev => {
      const cur = prev.practices || [];
      return cur.includes(name)
        ? { ...prev, practices: cur.filter(p => p !== name) }
        : { ...prev, practices: [...cur, name] };
    });
  };

  const handleQuickLog = () => {
    const hasData = quickEntry.pain !== '' || quickEntry.fatigue !== '' || quickEntry.sleep !== '' ||
      quickEntry.mood.trim() || quickEntry.triggers.trim() || quickEntry.notes.trim() ||
      (quickEntry.foods && quickEntry.foods.length > 0) ||
      (quickEntry.practices && quickEntry.practices.length > 0);
    if (!hasData) return;
    setSymptoms(prev => {
      // One entry per day: logging again on the same date updates it.
      const withoutBlank = prev.filter(e => e.date || e.pain || e.fatigue || e.sleep || e.mood || e.notes || e.triggers || (e.foods && e.foods.length) || (e.practices && e.practices.length));
      const existingIdx = withoutBlank.findIndex(e => e.date === quickEntry.date);
      if (existingIdx >= 0) {
        return withoutBlank.map((e, i) => (i === existingIdx ? { ...e, ...quickEntry } : e));
      }
      return [{ ...quickEntry }, ...withoutBlank];
    });
    setQuickEntry({ ...emptySymptomEntry, date: todayStr(), foods: [], practices: [] });
    setQuickLogged(true);
    setTimeout(() => setQuickLogged(false), 2500);
    // Land back on the dashboard so the payoff of logging is immediate.
    setTimeout(() => setSymptomView('dashboard'), 900);
  };

  // Track initial load so we don't overwrite saved data with defaults.
  const [loaded, setLoaded] = useState(false);

  // Load from durable storage on mount (auto-migrates old localStorage data).
  useEffect(() => {
    (async () => {
      try {
        const data = await storage.get(STORAGE_KEYS.HEALTH_TOOLS);
        if (data) {
          if (data.medications?.length) setMedications(data.medications);
          if (data.doctors?.length) setDoctors(data.doctors);
          if (data.history) setHistory(prev => ({ ...prev, ...data.history }));
          if (data.symptoms?.length) setSymptoms(data.symptoms);
        }
        const flareLog = await storage.get(STORAGE_KEYS.FLARES);
        if (Array.isArray(flareLog)) setFlares(flareLog);
      } catch (e) {
        console.error('Failed to load health tools data', e);
      } finally {
        setLoaded(true);
      }
      ensureReminderScheduled();
    })();
  }, []);

  // Save to durable storage on any change (after initial load completes).
  useEffect(() => {
    if (!loaded) return;
    storage.set(STORAGE_KEYS.HEALTH_TOOLS, { medications, doctors, history, symptoms });
  }, [loaded, medications, doctors, history, symptoms]);

  // Sharing helpers
  const formatMedicationsText = () => {
    let text = "═══ MY MEDICATIONS ═══\n\n";
    medications.forEach((med, i) => {
      if (!med.name && !med.dose) return;
      text += `${i + 1}. ${med.name || '(unnamed)'}\n`;
      if (med.dose) text += `   Dose: ${med.dose}\n`;
      if (med.frequency) text += `   Frequency: ${med.frequency}\n`;
      if (med.startDate) text += `   Started: ${med.startDate}\n`;
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
    if (history.visitQuestions) text += `Questions for My Next Appointment:\n${history.visitQuestions}\n\n`;
    return text;
  };

  /**
   * Visit Prep Report — one page that makes a 15-minute appointment count:
   * current meds, care team, key history, 30-day symptom picture, suspected
   * food triggers, what's been helping, and the patient's own questions.
   */
  const formatVisitSummary = () => {
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    let text = `═══ APPOINTMENT VISIT SUMMARY ═══\nPrepared ${dateStr} with the Resilient Path app\n\n`;

    // Questions first — the thing most likely to get squeezed out of a visit.
    if (history.visitQuestions && history.visitQuestions.trim()) {
      text += `── MY QUESTIONS FOR THIS VISIT ──\n${history.visitQuestions.trim()}\n\n`;
    }

    // 30-day symptom picture
    const sorted = validEntries(symptoms);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const last30 = sorted.filter(e => e.date >= cutoffStr);
    if (last30.length > 0) {
      const avgOf = (key) => {
        const xs = last30.map(e => toNum(e[key])).filter(v => v !== null);
        return xs.length ? (xs.reduce((a, v) => a + v, 0) / xs.length) : null;
      };
      const p = avgOf('pain'), f = avgOf('fatigue'), s = avgOf('sleep');
      text += `── LAST 30 DAYS (${last30.length} check-ins) ──\n`;
      if (p !== null) text += `Average pain: ${p.toFixed(1)}/10\n`;
      if (f !== null) text += `Average fatigue: ${f.toFixed(1)}/10\n`;
      if (s !== null) text += `Average sleep quality: ${s.toFixed(1)}/10\n`;
      const worst = last30.reduce((w, e) => (toNum(e.pain) ?? -1) > (toNum(w.pain) ?? -1) ? e : w, last30[0]);
      if (toNum(worst.pain) !== null) {
        text += `Worst pain day: ${worst.date} (${toNum(worst.pain)}/10${worst.triggers ? `; possible triggers: ${worst.triggers}` : ''})\n`;
      }
      text += '\n';
    }

    // Suspected food triggers
    const fa = analyzeFoodTriggers(symptoms);
    const suspects = fa.ready ? fa.results.filter(r => r.delta >= 1).slice(0, 4) : [];
    if (suspects.length > 0) {
      text += `── POSSIBLE FOOD TRIGGERS (from my food diary) ──\n`;
      suspects.forEach(r => {
        text += `- ${r.food}: symptom burden avg ${r.expAvg.toFixed(1)} the ${r.window} vs ${r.nonAvg.toFixed(1)} otherwise (${r.timesEaten} days)\n`;
      });
      text += '(Patterns from self-tracking, not a diagnosis)\n\n';
    }

    // What's been helping
    const pa = analyzePractices(symptoms);
    const helpers = pa.ready ? pa.results.filter(r => r.benefit >= 1).slice(0, 4) : [];
    if (helpers.length > 0) {
      text += `── WHAT SEEMS TO HELP ──\n`;
      helpers.forEach(r => {
        text += `- ${r.practice}: symptom burden avg ${r.benefit.toFixed(1)} points lower on practice days (${r.timesDone} days)\n`;
      });
      text += '\n';
    }

    // Meds, providers, key history (reuse existing formatters)
    text += formatMedicationsText() + '\n';
    text += formatDoctorsText() + '\n';
    if (history.conditions || history.allergies) {
      text += `── KEY HISTORY ──\n`;
      if (history.conditions) text += `Conditions: ${history.conditions}\n`;
      if (history.allergies) text += `Allergies: ${history.allergies}\n`;
      text += '\n';
    }

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
      if (entry.foods && entry.foods.length > 0) text += `   Foods: ${entry.foods.join(', ')}\n`;
      if (entry.practices && entry.practices.length > 0) text += `   Practiced: ${entry.practices.join(', ')}\n`;
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
      case 'visit':
        text = formatVisitSummary();
        title = 'Visit Summary';
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

  // Save-to-phone state
  const [saveStatus, setSaveStatus] = useState('');

  /** Formatted PDF visit packet — the version a clinician actually reads. */
  const handleVisitPacketPDF = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const filename = await saveAndShareVisitPacket({ medications, doctors, history, symptoms });
      setSaveStatus(Capacitor.isNativePlatform() ? `PDF saved to Documents: ${filename}` : `Downloaded ${filename}`);
      setTimeout(() => setSaveStatus(''), 5000);
    } catch (e) {
      console.error('Visit packet PDF failed', e);
      setSaveStatus('PDF generation failed — the text version below still works.');
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setPdfBusy(false);
    }
  };

  const handleSaveToPhone = async (section = 'all') => {
    let text = '';
    let filename = '';
    const dateStr = new Date().toISOString().split('T')[0];

    switch (section) {
      case 'medications':
        text = formatMedicationsText();
        filename = `Resilient_Path_Medications_${dateStr}.txt`;
        break;
      case 'doctors':
        text = formatDoctorsText();
        filename = `Resilient_Path_Doctors_${dateStr}.txt`;
        break;
      case 'history':
        text = formatHistoryText();
        filename = `Resilient_Path_Medical_History_${dateStr}.txt`;
        break;
      case 'symptoms':
        text = formatSymptomsText();
        filename = `Resilient_Path_Symptom_Tracker_${dateStr}.txt`;
        break;
      case 'visit':
        text = formatVisitSummary();
        filename = `Resilient_Path_Visit_Summary_${dateStr}.txt`;
        break;
      default:
        text = formatMedicationsText() + '\n' + formatDoctorsText() + '\n' + formatHistoryText() + '\n' + formatSymptomsText();
        filename = `Resilient_Path_Health_Records_${dateStr}.txt`;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: filename,
          data: text.trim(),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        setSaveStatus(`Saved to Documents/${filename}`);
        setTimeout(() => setSaveStatus(''), 4000);
      } catch (e) {
        console.error('Save to phone failed', e);
        // Fallback: share instead
        try {
          await Share.share({ title: 'Health Records', text: text.trim(), dialogTitle: 'Save Health Records' });
        } catch (shareErr) {
          console.error('Share fallback also failed', shareErr);
        }
      }
    } else {
      // Browser fallback: download as file
      const blob = new Blob([text.trim()], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSaveStatus(`Downloaded ${filename}`);
      setTimeout(() => setSaveStatus(''), 4000);
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              // Full-app backup: workbook answers + health data + chat, one JSON file.
              try {
                const { filename, json } = await storage.exportBackup();
                if (Capacitor.isNativePlatform()) {
                  setSaveStatus(`Backup saved to Documents: ${filename}`);
                } else {
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = filename; a.click();
                  URL.revokeObjectURL(url);
                  setSaveStatus(`Downloaded ${filename}`);
                }
                setTimeout(() => setSaveStatus(''), 5000);
              } catch (e) {
                console.error('Backup failed', e);
                setSaveStatus('Backup failed — please try again.');
                setTimeout(() => setSaveStatus(''), 5000);
              }
            }}
            className="flex items-center gap-1.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            Back Up All Data
          </button>
          <label className="flex items-center gap-1.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
            Restore
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  await storage.importBackup(await file.text());
                  setSaveStatus('Backup restored — reloading...');
                  setTimeout(() => window.location.reload(), 800);
                } catch (err) {
                  console.error('Restore failed', err);
                  setSaveStatus(err.message || 'Restore failed — not a valid backup file.');
                  setTimeout(() => setSaveStatus(''), 5000);
                }
              }}
            />
          </label>
          <button
            onClick={() => handleSaveToPhone('all')}
            className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            Save to Phone
          </button>
          <button
            onClick={() => handleShare('all')}
            className="flex items-center gap-1.5 bg-primary-100 hover:bg-primary-200 text-primary-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {Capacitor.isNativePlatform() ? <Share2 size={16} /> : <Printer size={16} />}
            {Capacitor.isNativePlatform() ? 'Share All' : 'Print All'}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-lg animate-in fade-in duration-300">
          <Check size={14} />
          {saveStatus}
        </div>
      )}

      <p className="text-secondary-600 text-sm mb-2">
        Keep all your important health information in one place. Easy to save to your phone or share with your healthcare team via email, text, or print.
      </p>

      {/* ── Visit Prep Report ── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary-200 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-secondary-900 leading-tight">Preparing for an appointment?</p>
          <p className="text-xs text-secondary-500 leading-snug">
            One-page summary: your questions, meds, 30-day trends, and what your tracking has found.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleVisitPacketPDF}
            disabled={pdfBusy}
            className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {pdfBusy ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            PDF Packet
          </button>
          <button
            onClick={() => handleShare('visit')}
            className="flex items-center gap-1 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {Capacitor.isNativePlatform() ? <Share2 size={12} /> : <Printer size={12} />}
            {Capacitor.isNativePlatform() ? 'Share' : 'Print'}
          </button>
          <button
            onClick={() => handleSaveToPhone('visit')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download size={12} /> Save
          </button>
        </div>
      </div>

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
                    <button onClick={() => removeListItem(setMedications, idx)} className="text-purple-400 hover:text-purple-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {renderField('Name', med.name, (v) => updateListItem(setMedications, idx, 'name', v))}
                <div className="grid grid-cols-2 gap-3">
                  {renderField('Dose', med.dose, (v) => updateListItem(setMedications, idx, 'dose', v), 'text', 'e.g., 50mg')}
                  {renderField('Frequency', med.frequency, (v) => updateListItem(setMedications, idx, 'frequency', v), 'text', 'e.g., twice daily')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {renderField('Prescribing Doctor', med.doctor, (v) => updateListItem(setMedications, idx, 'doctor', v))}
                  {renderField('Date Started', med.startDate || '', (v) => updateListItem(setMedications, idx, 'startDate', v), 'date')}
                </div>
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
                    <button onClick={() => removeListItem(setDoctors, idx)} className="text-purple-400 hover:text-purple-600 transition-colors">
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
            {renderField('Questions for My Next Appointment', history.visitQuestions, (v) => setHistory(prev => ({ ...prev, visitQuestions: v })), 'textarea', 'Write questions as they occur to you — they lead your Visit Prep Report so nothing gets forgotten in the room.')}
          </div>
        )}

        {/* ─── SYMPTOM TRACKER TAB ─── */}
        {activeTab === 'symptoms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">Symptom Tracker</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSaveToPhone('symptoms')}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={13} />
                  Save
                </button>
                <button
                  onClick={() => handleShare('symptoms')}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {Capacitor.isNativePlatform() ? <Share2 size={13} /> : <Printer size={13} />}
                  Share
                </button>
              </div>
            </div>

            <p className="text-secondary-500 text-xs">
              Log your daily symptoms to share with your healthcare team and spot patterns over time.
            </p>

            {/* ── Sub-view tabs: Dashboard is the landing view ── */}
            {(() => {
              const goCheckin = () => {
                // Prefill from today's entry if it already exists
                const existing = symptoms.find(e => e.date === todayStr());
                if (existing) setQuickEntry({ ...emptySymptomEntry, ...existing, foods: existing.foods || [], practices: existing.practices || [] });
                setSymptomView('checkin');
              };
              const sub = (id, label, icon) => (
                <button
                  onClick={() => (id === 'checkin' ? goCheckin() : setSymptomView(id))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    symptomView === id
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  {icon} {label}
                </button>
              );
              return (
                <div className="flex gap-1 bg-secondary-100 p-1 rounded-xl">
                  {sub('dashboard', 'Dashboard', <LayoutDashboard size={14} />)}
                  {sub('checkin', 'Check-in', <Activity size={14} />)}
                  {sub('history', 'History', <History size={14} />)}
                </div>
              );
            })()}

            {/* ── DASHBOARD VIEW ── */}
            {symptomView === 'dashboard' && (<>
              <SymptomDashboard
                entries={symptoms}
                medications={medications}
                flares={flares}
                onLogToday={() => {
                  const existing = symptoms.find(e => e.date === todayStr());
                  if (existing) setQuickEntry({ ...emptySymptomEntry, ...existing, foods: existing.foods || [], practices: existing.practices || [] });
                  setSymptomView('checkin');
                }}
                onViewHistory={() => setSymptomView('history')}
              />
              <ReminderCard />
            </>)}

            {/* ── CHECK-IN VIEW ── */}
            {symptomView === 'checkin' && (
            <div className="bg-white p-4 rounded-xl border-2 border-primary-200 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-primary-800">Today's Check-in</span>
                <input
                  type="date"
                  value={quickEntry.date}
                  onChange={(e) => setQuickEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="text-xs border border-secondary-200 rounded-lg px-2 py-1 text-secondary-700 bg-white"
                />
              </div>
              <ScalePicker label="Pain (0–10)" value={quickEntry.pain} onChange={(v) => setQuickEntry(prev => ({ ...prev, pain: v }))} />
              <ScalePicker label="Fatigue (0–10)" value={quickEntry.fatigue} onChange={(v) => setQuickEntry(prev => ({ ...prev, fatigue: v }))} />
              <ScalePicker label="Sleep Quality (0–10)" value={quickEntry.sleep} onChange={(v) => setQuickEntry(prev => ({ ...prev, sleep: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Mood (optional)"
                  className="border border-secondary-200 rounded-xl p-2.5 text-sm text-secondary-800 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={quickEntry.mood}
                  onChange={(e) => setQuickEntry(prev => ({ ...prev, mood: e.target.value }))}
                />
                <input
                  type="text" placeholder="Triggers (optional)"
                  className="border border-secondary-200 rounded-xl p-2.5 text-sm text-secondary-800 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={quickEntry.triggers}
                  onChange={(e) => setQuickEntry(prev => ({ ...prev, triggers: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Notes (optional) — or tap the mic"
                  className="flex-1 border border-secondary-200 rounded-xl p-2.5 text-sm text-secondary-800 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={quickEntry.notes}
                  onChange={(e) => setQuickEntry(prev => ({ ...prev, notes: e.target.value }))}
                />
                <VoiceInputButton
                  size={15}
                  onText={(t) => setQuickEntry(prev => ({ ...prev, notes: prev.notes ? `${prev.notes.replace(/\s+$/, '')} ${t}` : t }))}
                />
              </div>

              {/* ── Food Diary ── */}
              <div className="pt-1 border-t border-secondary-100">
                <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1 mt-2">Food Diary</p>
                <p className="text-[11px] text-secondary-400 leading-snug mb-2">
                  Log what you ate — after a few days, your Dashboard flags foods that tend to precede worse symptoms.
                </p>
                {quickEntry.foods && quickEntry.foods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {quickEntry.foods.map(f => (
                      <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-800">
                        {f}
                        <button
                          type="button"
                          onClick={() => removeFood(f)}
                          aria-label={`Remove ${f}`}
                          className="text-primary-400 hover:text-primary-700 leading-none"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a food (e.g. dairy, coffee)..."
                    className="flex-1 border border-secondary-200 rounded-xl p-2.5 text-sm text-secondary-800 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    value={foodDraft}
                    onChange={(e) => setFoodDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFood()}
                  />
                  <button
                    type="button"
                    onClick={() => addFood()}
                    className="px-4 rounded-xl border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 font-semibold text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                {foodSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {foodSuggestions.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => addFood(f)}
                        className="px-2.5 py-1 rounded-full bg-secondary-50 border border-secondary-200 text-xs text-secondary-600 hover:border-primary-300 transition-colors"
                      >
                        + {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── What did you practice today? ── */}
              <div className="pt-1 border-t border-secondary-100">
                <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1 mt-2">What did you practice today?</p>
                <p className="text-[11px] text-secondary-400 leading-snug mb-2">
                  Tap the skills you used — your Dashboard will show which ones line up with your better days.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRACTICES.map(p => {
                    const on = (quickEntry.practices || []).includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePractice(p)}
                        className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          on
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-secondary-50 border-secondary-200 text-secondary-600 hover:border-emerald-300'
                        }`}
                      >
                        {on ? '✓ ' : ''}{p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleQuickLog}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${
                  quickLogged ? 'bg-emerald-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {quickLogged ? (<><Check size={16} /> Logged!</>) : 'Log Entry'}
              </button>
            </div>
            )}

            {/* ── HISTORY VIEW ── */}
            {symptomView === 'history' && (<>
            {symptoms.map((entry, idx) => (
              <div key={idx} className="bg-secondary-50 p-4 rounded-xl border border-secondary-100 space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                    Entry {idx + 1}
                  </span>
                  {symptoms.length > 1 && (
                    <button onClick={() => removeListItem(setSymptoms, idx)} className="text-purple-400 hover:text-purple-600 transition-colors">
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
                {entry.foods && entry.foods.length > 0 && (
                  <p className="text-xs text-secondary-600">
                    <b className="text-secondary-900">Foods:</b> {entry.foods.join(', ')}
                    <span className="text-secondary-400"> (edit via Check-in on that date)</span>
                  </p>
                )}
                {entry.practices && entry.practices.length > 0 && (
                  <p className="text-xs text-secondary-600">
                    <b className="text-secondary-900">Practiced:</b> {entry.practices.join(', ')}
                  </p>
                )}
              </div>
            ))}

            <button
              onClick={() => addListItem(setSymptoms, emptySymptomEntry)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus size={18} />
              Add Entry
            </button>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTools;
