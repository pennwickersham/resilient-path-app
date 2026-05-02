import { useState, useEffect, useRef } from 'react';
import { workbookData } from '../data/workbookForms';
import { Printer, Share2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

const WorkbookForms = () => {
  const topRef = useRef();
  const [answers, setAnswers] = useState({});
  const [activeModule, setActiveModule] = useState(1);
  const printRef = useRef();

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('resilientPathWorkbook');
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse workbook from local storage', e);
      }
    }
  }, []);

  const handleChange = (id, value, type) => {
    let newValue = value;
    if (type === 'checkbox') {
        newValue = !answers[id];
    }
    
    const newAnswers = {
      ...answers,
      [id]: newValue,
    };
    setAnswers(newAnswers);
    localStorage.setItem('resilientPathWorkbook', JSON.stringify(newAnswers));
  };

  const handleShareAllAnswers = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    let exportText = "My Resilient Path Workbook Answers\n\n";
    workbookData.forEach(module => {
      let hasAnswers = false;
      let moduleText = `${module.title}\n`;
      module.sections.forEach(sec => {
        sec.fields.forEach(field => {
          if (answers[field.id] && answers[field.id] !== '') {
            hasAnswers = true;
            let answerVal = answers[field.id];
            if (field.type === 'checkbox') answerVal = 'Yes';
            moduleText += `- ${field.label}\n  Your Answer: ${answerVal}\n\n`;
          }
        });
      });
      if (hasAnswers) exportText += moduleText + "------------------------\n\n";
    });
    
    try {
      await Share.share({
        title: 'Workbook Answers',
        text: exportText.trim() === "My Resilient Path Workbook Answers" ? "No answers recorded yet in the workbook." : exportText,
        dialogTitle: 'Share All Answers'
      });
    } catch (e) {
      console.error("Error sharing dataset", e);
    }
  };

  const handleShareCurrent = async () => {
    if (Capacitor.isNativePlatform()) {
      if (!currentModuleData) return;

      let exportText = `${currentModuleData.title}\n${currentModuleData.exerciseTitle}\n\n`;
      
      currentModuleData.sections.forEach(sec => {
        exportText += `--- ${sec.sectionTitle} ---\n\n`;
        sec.fields.forEach(field => {
          let answerVal = answers[field.id];
          if (field.type === 'checkbox') {
              answerVal = answerVal ? 'Yes (Completed)' : 'No (Blank)';
          } else if (!answerVal || String(answerVal).trim() === '') {
              answerVal = '___________________________________'; 
          }
          exportText += `${field.label}\nAnswer: ${answerVal}\n\n`;
        });
      });
      
      try {
        await Share.share({
          title: currentModuleData.title,
          text: exportText.trim(),
          dialogTitle: 'Share Worksheet'
        });
      } catch (e) {
        console.error("Error sharing worksheet", e);
      }
    } else {
      window.print();
    }
  };

  const handleClearModule = () => {
    if (!currentModuleData) return;
    
    if (window.confirm('Are you sure you want to clear your answers for this module? This cannot be undone.')) {
      const newAnswers = { ...answers };
      currentModuleData.sections.forEach(sec => {
        sec.fields.forEach(field => {
          delete newAnswers[field.id];
        });
      });
      setAnswers(newAnswers);
      localStorage.setItem('resilientPathWorkbook', JSON.stringify(newAnswers));
    }
  };

  const currentModuleData = workbookData.find(m => m.moduleId === activeModule);

  const navigateModule = (direction) => {
    const currentIndex = workbookData.findIndex(m => m.moduleId === activeModule);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < workbookData.length) {
      setActiveModule(workbookData[newIndex].moduleId);
      // Use setTimeout to ensure scroll happens after React re-renders the new module
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-12">
      <div ref={topRef}></div>
      <div className="flex justify-between items-center mb-2 no-print flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-primary-800">Digital Workbook</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {Capacitor.isNativePlatform() && (
            <button 
              onClick={handleShareAllAnswers}
              className="flex items-center gap-1.5 bg-primary-100 hover:bg-primary-200 text-primary-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Share2 size={16} />
              Share All Answers
            </button>
          )}
          <button 
            onClick={handleShareCurrent}
            className="flex items-center gap-1.5 bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {Capacitor.isNativePlatform() ? <Share2 size={16} /> : <Printer size={16} />} 
            {Capacitor.isNativePlatform() ? "Share Worksheet" : "Print Worksheet"}
          </button>
        </div>
      </div>

      <p className="text-secondary-600 text-sm mb-4 no-print">
        Your answers are automatically saved to your device. You can clear them or print them out to share with your healthcare team.
      </p>

      {/* Module Selector */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-print custom-scrollbar">
        {workbookData.map((m) => (
          <button
            key={m.moduleId}
            onClick={() => setActiveModule(m.moduleId)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeModule === m.moduleId 
                ? 'bg-primary-600 text-white shadow-md' 
                : 'bg-white text-secondary-600 border border-secondary-200 hover:bg-secondary-50'
            }`}
          >
            Module {m.moduleId}
          </button>
        ))}
      </div>

      {/* Form Display area (Printable) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100 print:shadow-none print:border-none print:p-0" ref={printRef}>
        {currentModuleData && (
          <div className="space-y-8">
            {/* Module Orientation Header */}
            <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 p-6 rounded-2xl mb-8 shadow-inner overflow-hidden relative group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-primary-700 font-bold text-xs uppercase tracking-widest mb-3">
                  <div className="w-8 h-[2px] bg-primary-600"></div>
                   Module Orientation
                </div>
                
                <h3 className="text-2xl font-black text-primary-900 leading-tight mb-2">
                  {currentModuleData.title}
                </h3>
                 
                {currentModuleData.summary && (
                  <p className="text-secondary-700 text-sm leading-relaxed mb-4 font-medium italic">
                    "{currentModuleData.summary}"
                  </p>
                )}

                {currentModuleData.patientNote && (
                  <div className="bg-primary-50 border-l-4 border-primary-400 px-4 py-3 rounded-r-xl mt-3">
                    <p className="text-primary-900 text-sm italic font-medium leading-relaxed">
                      "{currentModuleData.patientNote}"
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 no-print">
                  <div className="bg-white/80 border border-primary-200 px-3 py-1 rounded-full text-[10px] font-bold text-primary-700 shadow-sm flex items-center gap-1.5 uppercase">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                    Current Objective: {currentModuleData.exerciseTitle}
                  </div>
                </div>
              </div>
              
              {/* Abstract decorative element in background */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary-500/10 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-400/5 rounded-full blur-3xl -ml-10 -mb-10"></div>
            </div>

            <div className="border-b border-secondary-100 pb-4 mb-6 flex justify-between items-center gap-4 no-print">
               <h4 className="text-lg font-bold text-secondary-900">Worksheet: {currentModuleData.exerciseTitle}</h4>
               <button 
                onClick={handleClearModule}
                className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-all active:scale-95 shrink-0"
                title="Clear all answers in this module"
              >
                <Trash2 size={14} />
                Reset Data
              </button>
            </div>

            {currentModuleData.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h5 className="font-bold text-primary-700 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 inline-block">
                  {section.sectionTitle}
                </h5>

                {section.description && (
                  <p className="text-secondary-600 text-sm leading-relaxed mt-2 mb-1 px-1">
                    {section.description}
                  </p>
                )}
                
                <div className="space-y-6 mt-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="flex flex-col gap-2">
                       {field.type === 'textarea' && (
                         <div className="flex flex-col gap-2">
                           <label className="text-sm font-medium text-secondary-900 leading-snug">
                             {field.label}
                           </label>
                           <textarea
                             className="w-full border border-secondary-300 rounded-xl p-3 text-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y min-h-[100px] print:border-none print:resize-none print:bg-secondary-50 print:min-h-0"
                             placeholder="Type your response here..."
                             value={answers[field.id] || ''}
                             onChange={(e) => handleChange(field.id, e.target.value, 'textarea')}
                           />
                         </div>
                       )}

                       {field.type === 'text' && (
                         <div className="flex flex-col gap-2">
                           <label className="text-sm font-medium text-secondary-900 leading-snug">
                             {field.label}
                           </label>
                           <input
                             type="text"
                             className="w-full border border-secondary-300 rounded-xl p-3 text-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none print:border-b print:rounded-none"
                             placeholder="Type here..."
                             value={answers[field.id] || ''}
                             onChange={(e) => handleChange(field.id, e.target.value, 'text')}
                           />
                         </div>
                       )}
                       
                       {field.type === 'checkbox' && (
                         <label className="flex items-start gap-3 cursor-pointer group">
                           <div className="relative flex items-center justify-center mt-0.5">
                             <input
                               type="checkbox"
                               className="peer sr-only"
                               checked={!!answers[field.id]}
                               onChange={() => handleChange(field.id, null, 'checkbox')}
                             />
                             <div className="w-5 h-5 border-2 border-secondary-300 rounded bg-white peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors duration-200"></div>
                             <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                             </svg>
                           </div>
                           <span className="text-sm text-secondary-800 group-hover:text-secondary-900">{field.label}</span>
                         </label>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Module Navigation */}
      {currentModuleData && (
        <div className="flex justify-between items-center mt-6 no-print gap-4">
          <button
            onClick={() => navigateModule(-1)}
            disabled={workbookData.findIndex(m => m.moduleId === activeModule) === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50 shadow-sm"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <span className="text-xs text-secondary-400 font-medium">Module {activeModule} of {workbookData.length}</span>
          <button
            onClick={() => navigateModule(1)}
            disabled={workbookData.findIndex(m => m.moduleId === activeModule) === workbookData.length - 1}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:resize-none { resize: none !important; }
          .print\\:min-h-0 { min-height: 0 !important; }
          .print\\:bg-secondary-50 {
             background-color: #f8fafc !important;
             border: 1px dashed #cbd5e1 !important;
          }
          .print\\:border-b { border-bottom: 1px solid #000 !important; }
          
          /* Show just the form container and its contents */
          .bg-white.p-6 {
             position: absolute !important;
             left: 0 !important;
             top: 0 !important;
             width: 100% !important;
             visibility: visible !important;
          }
          .bg-white.p-6 * {
             visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkbookForms;
