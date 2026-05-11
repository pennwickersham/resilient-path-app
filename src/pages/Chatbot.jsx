import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, KeyRound, AlertCircle, Loader2, ShieldOff } from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm here to support you. Ask me anything about the Resilient Path program, chronic pain management, or your medications." }
  ]);
  const [input, setInput] = useState('');
  // API key is injected at build time by Appflow Secrets → Vite replaces
  // import.meta.env.VITE_GEMINI_API_KEY with the literal value in the
  // production JS bundle.  The key is NEVER stored in source code or Git.
  // Users can also enter their own key via localStorage.
  const buildTimeKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const storedKey = typeof window !== 'undefined'
    ? localStorage.getItem('resilientPathGeminiKey') || ''
    : '';
  const initialKey = storedKey || buildTimeKey;
  const [apiKey, setApiKey] = useState(initialKey);
  const [isKeySet, setIsKeySet] = useState(initialKey.length > 0);
  const [isLoading, setIsLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState({ book: '', workbook: '' });
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check for API key in local storage
    const storedKey = localStorage.getItem('resilientPathGeminiKey');
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeySet(true);
    }

    // Preload context texts
    const loadContext = async () => {
      try {
        const [bookRes, workbookRes] = await Promise.all([
          fetch('/data/book-utf8.md'),
          fetch('/data/workbook.md')
        ]);
        const bookText = await bookRes.text();
        const workbookText = await workbookRes.text();
        
        setContextFiles({ book: bookText, workbook: workbookText });
      } catch (err) {
        console.error("Failed to load context files:", err);
      }
    };
    loadContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveApiKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('resilientPathGeminiKey', apiKey.trim());
      setIsKeySet(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !isKeySet || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenerativeAI(apiKey);

      // Build the system prompt with context
      const systemInstruction = `
        You are a highly empathetic, professional medical assistant aiding patients using the "Managing Life with Chronic Pain: The Resilient Path" program. 
        
        CRITICAL INSTRUCTIONS FOR YOUR RESPONSES:
        1. First, provide a SHORT, CONVERSATIONAL answer to the user's question. This initial response MUST NOT include any academic citations, module references, or chapter numbers. Keep it warm, concise, and highly conversational.
        2. At the very end of your short answer, ALWAYS ask the user a variation of: "Would you like a longer, more detailed answer that includes specific references to the book and workbook?"
        3. Only provide the deep, detailed answer with specific book/workbook references IF the user explicitly says "yes" or asks for more details in a subsequent message.
        
        FORMATTING RULE:
        - Always respond using clear paragraphs. 
        - Use double line breaks between paragraphs for readability on mobile screens. 
        - Avoid large, monolithic blocks (walls) of text.
        - STRICT RULE: Do NOT use any bolding (**text**) or italics (*text*). Use plain text only.
        
        Your goal is to be strictly informed by the provided book and workbook excerpts. You may also reference general, widely accepted medical knowledge but prioritizing the program's biopsychosocial philosophy.
        Do not provide final diagnoses or prescribe medications. Always remind the user to consult their healthcare provider for medical advice.
        
        Context from The Resilient Path Book:
        ---
        ${contextFiles.book.substring(0, 30000)}
        ---
        
        Context from the Workbook:
        ---
        ${contextFiles.workbook.substring(0, 15000)}
        ---
      `;

      // Build history (excluding the first system greeting)
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Multi-Model Fallback & Retry logic
      let response;
      let retries = 0;
      const maxRetries = 5;
      // VERIFIED AVAILABLE via ListModels API query on 2026-04-24.
      // All Gemini 1.5 models have been retired and return 404.
      const modelQueue = ['gemini-2.5-flash', 'gemini-2.0-flash-001', 'gemini-2.5-pro'];
      let currentModelIndex = 0;
      
      while (retries < maxRetries) {
        const currentModelName = modelQueue[currentModelIndex];
        try {
          const model = ai.getGenerativeModel({ 
            model: currentModelName,
            systemInstruction: systemInstruction 
          }, { apiVersion: 'v1beta' });

          const result = await model.generateContent({
            contents: [
              ...history,
              { role: 'user', parts: [{ text: userMessage }] }
            ],
            generationConfig: {
              temperature: 0.3,
            }
          });
          
          response = result.response;
          break; // Success!
        } catch (err) {
          retries++;
          const errorText = err.message || "";
          const is503 = errorText.includes('503') || errorText.includes('demand');
          const is404 = errorText.includes('404') || errorText.includes('not found') || errorText.includes('not supported');
          
          if ((is503 || is404) && retries < maxRetries) {
            if (currentModelIndex < modelQueue.length - 1) {
              console.log(`Model ${modelQueue[currentModelIndex]} failed (${is404 ? '404' : '503'}). Trying ${modelQueue[currentModelIndex + 1]}...`);
              currentModelIndex++;
            }
            
            console.log(`Retry ${retries}/${maxRetries} using ${modelQueue[currentModelIndex]}...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retries)); 
            continue;
          }
          throw err; 
        }
      }

      // Extract text, handling both standard and thinking-model responses
      let replyText = '';
      try {
        replyText = response.text();
      } catch (e) {
        // Fallback: manually extract text parts from candidates
        const parts = response?.candidates?.[0]?.content?.parts || [];
        replyText = parts
          .filter(p => p.text && !p.thought)
          .map(p => p.text)
          .join('\n') || "I'm sorry, I couldn't generate a response.";
      }
      setMessages(prev => [...prev, { role: 'model', content: replyText }]);

    } catch (error) {
      console.error("Gemini AI Error:", error);
      
      let errorMsg = error.message || "An error occurred while connecting to the AI. Please try again.";
      
      if (error.message?.includes('API key')) {
        errorMsg = "Invalid API key. Please check your key in settings.";
      } else if (error.message?.includes('quota')) {
        errorMsg = "API quota exceeded. Please try again later.";
      }

      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check AI data sharing consent — must be accepted before any data is sent to Google
  const aiConsent = localStorage.getItem('aiConsentAccepted');
  if (aiConsent !== 'true') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-secondary-200 max-w-md w-full">
          <div className="w-16 h-16 bg-secondary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={32} className="text-secondary-400" />
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">AI Data Consent Required</h2>
          <p className="text-secondary-600 text-sm leading-relaxed mb-4">
            This feature sends your messages to <strong>Google Gemini</strong> (Google LLC) to generate responses.
            You must consent to this data sharing before using the AI chat.
          </p>
          <p className="text-secondary-500 text-xs leading-relaxed bg-secondary-50 p-3 rounded-xl border border-secondary-100">
            To enable this feature, please close and reopen the app — the data consent notice will appear on the next launch, where you can review and accept the terms.
          </p>
        </div>
      </div>
    );
  }

  if (!isKeySet) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-secondary-200 max-w-md w-full">
          <KeyRound size={48} className="text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-900 mb-2">Connect AI Assistant</h2>
          <p className="text-secondary-600 text-sm mb-6">
            To use the Resilient Path Chatbot, please enter your Gemini API Key. Your key is stored securely on your local device and is never sent anywhere except directly to Google.
          </p>
          <input
            type="password"
            placeholder="Enter your Gemini API Key"
            className="w-full border border-secondary-300 rounded-xl p-3 text-secondary-800 focus:ring-2 focus:ring-primary-500 mb-4"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
          />
          <button 
            onClick={saveApiKey}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-sm"
          >
            Save Key & Start Chatting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <h2 className="text-xl font-bold text-primary-800">Therapist AI</h2>
      </div>
      <p className="text-secondary-600 text-xs mb-3 shrink-0 flex items-center gap-1 bg-primary-50 text-primary-800 p-2 rounded-lg border border-primary-200">
        <AlertCircle size={14} className="shrink-0" />
        AI is for educational purposes based on The Resilient Path. Not medical advice.
      </p>
 
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-white border border-secondary-200 rounded-2xl p-4 shadow-inner mb-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-secondary-100 text-secondary-900 rounded-tl-none border border-secondary-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary-100 rounded-2xl p-3 rounded-tl-none border border-secondary-200 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-secondary-500" />
              <span className="text-sm text-secondary-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Added extra margin-bottom for home key safety */}
      <div className="bg-white border border-secondary-200 rounded-full p-1.5 flex items-center shadow-sm shrink-0 mb-[env(safe-area-inset-bottom,20px)] sm:mb-2 mt-auto">
        <input 
          type="text" 
          placeholder="Ask a question..." 
          className="flex-1 bg-transparent px-4 py-2 outline-none text-secondary-900 text-sm" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-10 h-10"
        >
          <Send size={18} className="translate-x-[1px]" />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
