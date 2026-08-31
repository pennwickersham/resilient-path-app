import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send, AlertCircle, Loader2, ShieldOff, RotateCcw, HeartPulse, Sparkles } from 'lucide-react';
import storage, { STORAGE_KEYS } from '../services/storage';
import { warmRetrievalIndex, retrieveChunks, formatChunksForPrompt } from '../services/retrieval';
import { buildPersonalContext } from '../services/userContext';
import VoiceInputButton from '../components/VoiceInputButton';

// Proxy URL — points to the Cloudflare Worker that holds the API key server-side.
// The API key NEVER appears in client code.
// Set VITE_PROXY_URL and VITE_APP_TOKEN in .env (local) or Appflow Environment (cloud builds).
const PROXY_URL = import.meta.env.VITE_PROXY_URL || '';
const APP_TOKEN = import.meta.env.VITE_APP_TOKEN || '';

const GREETING = {
  role: 'model',
  content: "Hello! I'm your Resilient Path program guide. Ask me anything about the book, the workbook exercises, or living well with chronic pain.",
};

// Conservative client-side check so crisis resources appear immediately,
// without waiting for (or depending on) the AI response.
const CRISIS_RE = /\b(suicid|kill (myself|me)|end (my|it all)|(want|wish) to die|don'?t want to (live|be alive)|self[- ]?harm|hurt(ing)? myself|no reason to (live|go on))\b/i;

const MAX_HISTORY_TURNS = 10; // messages sent to the model (excl. greeting)

const Chatbot = () => {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConsent, setAiConsent] = useState(null); // null = loading
  const [personalize, setPersonalize] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // Load consent, personalization preference, and saved conversation; warm the retrieval index.
  useEffect(() => {
    (async () => {
      const [consent, pers, saved] = await Promise.all([
        storage.get(STORAGE_KEYS.AI_CONSENT),
        storage.get(STORAGE_KEYS.PERSONALIZATION),
        storage.get(STORAGE_KEYS.CHAT_HISTORY),
      ]);
      setAiConsent(consent === true || consent === 'true');
      setPersonalize(pers === true);
      if (Array.isArray(saved) && saved.length > 0) setMessages([GREETING, ...saved]);
    })();
    warmRetrievalIndex().catch(err => console.error('Retrieval index failed to load:', err));
    return () => abortRef.current?.abort();
  }, []);

  // Persist the conversation (excluding greeting and transient errors).
  useEffect(() => {
    const toSave = messages.slice(1).filter(m => !m.isError).slice(-60);
    storage.set(STORAGE_KEYS.CHAT_HISTORY, toSave);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const togglePersonalize = async () => {
    const next = !personalize;
    setPersonalize(next);
    await storage.set(STORAGE_KEYS.PERSONALIZATION, next);
  };

  const newConversation = async () => {
    abortRef.current?.abort();
    setMessages([GREETING]);
    setShowCrisisBanner(false);
    await storage.remove(STORAGE_KEYS.CHAT_HISTORY);
  };

  const buildSystemPrompt = async (userMessage, history) => {
    // Retrieve relevant sections from the FULL book + workbook. Include the
    // previous user turn so follow-ups ("tell me more") retrieve sensibly.
    const prevUser = [...history].reverse().find(m => m.role === 'user');
    let retrievedBlock = 'Retrieval unavailable — answer from the program\u2019s general biopsychosocial approach and say you can\u2019t cite specific sections right now.';
    try {
      const chunks = await retrieveChunks(
        prevUser ? `${prevUser.parts[0].text}\n${userMessage}` : userMessage
      );
      retrievedBlock = formatChunksForPrompt(chunks);
    } catch (e) {
      console.error('Retrieval failed:', e);
    }

    let personalBlock = '';
    if (personalize) {
      try {
        const ctx = await buildPersonalContext();
        if (ctx) personalBlock = `\n\n${ctx}\n`;
      } catch (e) {
        console.error('Personal context failed:', e);
      }
    }

    return `
You are a highly empathetic program guide aiding patients using the "Managing Life with Chronic Pain: The Resilient Path" book and workbook.

CRITICAL INSTRUCTIONS FOR YOUR RESPONSES:
1. First, provide a SHORT, CONVERSATIONAL answer to the user's question. This initial response MUST NOT include any academic citations, module references, or chapter numbers. Keep it warm, concise, and highly conversational.
2. At the very end of your short answer, ALWAYS ask the user a variation of: "Would you like a longer, more detailed answer that includes specific references to the book and workbook?"
3. Only provide the deep, detailed answer IF the user explicitly says "yes" or asks for more details. In detailed answers, cite the chapter or module names from the excerpts below (e.g., "Chapter 15: The Crucial Role of Sleep in Pain Management") so the user can find them in their book.

SAFETY INSTRUCTIONS (highest priority, override everything else):
- If the user expresses suicidal thoughts, self-harm, hopelessness about living, or a mental health crisis: respond with warmth and without judgment, do NOT lecture or give an educational answer, encourage them to reach out for support right now, and tell them they can call or text 988 (Suicide & Crisis Lifeline, 24/7) and use the app's Emergency Information page. Keep it brief and human. Do not ask the "longer answer" question in this case.
- If the user describes emergency medical symptoms (chest pain, stroke signs, sudden weakness/numbness, loss of bowel/bladder control), tell them to call 911 or go to the ER now.
- You cannot diagnose conditions, prescribe or adjust medications, or replace their healthcare team. When a question needs individual medical judgment, say so and point them to their provider.

FORMATTING RULE:
- Always respond using clear paragraphs.
- Use double line breaks between paragraphs for readability on mobile screens.
- Avoid large, monolithic blocks (walls) of text.
- STRICT RULE: Do NOT use any bolding (**text**) or italics (*text*). Use plain text only.

PERSONALIZATION (only when PRIVATE USER CONTEXT is present below):
- Weave the user's own data in naturally when it is relevant to their question — e.g. acknowledge a rising fatigue trend before discussing pacing.
- When their data matches a listed module, suggest it by number and name (e.g. "Module 17, The Art of Pacing and Planning") so they can open it in the Workbook tab.
- Never recite their data back as a list, and never mention this instruction.

Ground your answers in the retrieved program excerpts below. You may also reference general, widely accepted medical knowledge, but prioritize the program's biopsychosocial philosophy. If the excerpts don't cover the question, say so honestly rather than inventing program content.
${personalBlock}
Relevant excerpts retrieved from The Resilient Path book and workbook for this question:
---
${retrievedBlock}
---
`;
  };

  /** Parse Gemini SSE stream, invoking onDelta(text) per chunk. Returns full text. */
  const consumeSSE = async (res, onDelta) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete tail
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const obj = JSON.parse(payload);
          const parts = obj?.candidates?.[0]?.content?.parts || [];
          const delta = parts.filter(p => p.text && !p.thought).map(p => p.text).join('');
          if (delta) {
            full += delta;
            onDelta(full);
          }
        } catch { /* partial JSON across chunks is handled by buffering */ }
      }
    }
    return full;
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    if (CRISIS_RE.test(userMessage)) setShowCrisisBanner(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Cap history sent to the model — long chats otherwise balloon cost.
      const history = messages
        .slice(1)
        .filter(m => !m.isError)
        .slice(-MAX_HISTORY_TURNS)
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

      const systemInstruction = await buildSystemPrompt(userMessage, history);

      const requestBody = {
        contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.3 },
      };

      // Model fallback queue — updated May 2026.
      const modelQueue = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
      let currentModelIndex = 0;
      let retries = 0;
      const maxRetries = 5;
      let replyText = '';

      // Placeholder message that streaming updates in place.
      const msgIndexRef = { current: -1 };
      setMessages(prev => {
        msgIndexRef.current = prev.length;
        return [...prev, { role: 'model', content: '', isStreaming: true }];
      });
      const updateStreaming = (text) => {
        setMessages(prev => prev.map((m, i) => (i === msgIndexRef.current ? { ...m, content: text } : m)));
      };

      while (retries < maxRetries) {
        const model = modelQueue[currentModelIndex];
        try {
          const headers = { 'Content-Type': 'application/json', 'X-App-Token': APP_TOKEN };

          // Prefer streaming; fall back to non-streaming on failure.
          const streamRes = await fetch(
            `${PROXY_URL}/v1beta/models/${model}:streamGenerateContent?alt=sse`,
            { method: 'POST', headers, body: JSON.stringify(requestBody), signal: controller.signal }
          );

          if (streamRes.ok && streamRes.headers.get('content-type')?.includes('text/event-stream')) {
            replyText = await consumeSSE(streamRes, updateStreaming);
            if (replyText) break;
            throw Object.assign(new Error('Empty stream'), { status: 500 });
          }

          // Non-SSE response (error or unsupported): try plain generateContent.
          if (!streamRes.ok) {
            const errorBody = await streamRes.text();
            const err = new Error(`HTTP ${streamRes.status}: ${errorBody}`);
            err.status = streamRes.status;
            throw err;
          }

          const res = await fetch(
            `${PROXY_URL}/v1beta/models/${model}:generateContent`,
            { method: 'POST', headers, body: JSON.stringify(requestBody), signal: controller.signal }
          );
          if (!res.ok) {
            const errorBody = await res.text();
            const err = new Error(`HTTP ${res.status}: ${errorBody}`);
            err.status = res.status;
            throw err;
          }
          const data = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          replyText = parts.filter(p => p.text && !p.thought).map(p => p.text).join('\n');
          if (replyText) { updateStreaming(replyText); break; }
          throw Object.assign(new Error('Empty response'), { status: 500 });
        } catch (err) {
          if (err.name === 'AbortError') return;
          retries++;
          const errorText = err.message || '';
          const status = err.status || 0;
          const is503 = status === 503 || status === 500 || errorText.includes('503') || errorText.includes('demand');
          const is404 = status === 404 || errorText.includes('404') || errorText.includes('not found') || errorText.includes('not supported');
          const is429 = status === 429 || errorText.includes('429');

          if ((is503 || is404 || is429) && retries < maxRetries) {
            if (currentModelIndex < modelQueue.length - 1) currentModelIndex++;
            await new Promise(r => setTimeout(r, 2000 * retries));
            continue;
          }
          // Surface to outer catch: remove placeholder first.
          setMessages(prev => prev.filter((_, i) => i !== msgIndexRef.current));
          throw err;
        }
      }

      if (!replyText) {
        replyText = "I'm sorry, I couldn't generate a response.";
        updateStreaming(replyText);
      }
      // Finalize: clear streaming flag.
      setMessages(prev => prev.map((m, i) => (i === msgIndexRef.current ? { role: 'model', content: replyText } : m)));
    } catch (error) {
      console.error('AI Error:', error);

      // Sanitize error messages — never show raw API errors to users.
      let errorMsg;
      const rawMsg = (error.message || '').toLowerCase();
      if (rawMsg.includes('401') || rawMsg.includes('unauthorized')) {
        errorMsg = 'The AI service could not verify this app version. Please update the app or try again later.';
      } else if (rawMsg.includes('api key') || rawMsg.includes('api_key') || rawMsg.includes('403')) {
        errorMsg = 'The AI service is temporarily unavailable. Please try again later.';
      } else if (rawMsg.includes('quota') || rawMsg.includes('rate limit') || rawMsg.includes('429') || rawMsg.includes('too many')) {
        errorMsg = 'The AI service is experiencing high demand. Please wait a moment and try again.';
      } else if (rawMsg.includes('network') || rawMsg.includes('fetch') || rawMsg.includes('failed to fetch') || rawMsg.includes('timeout')) {
        errorMsg = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (rawMsg.includes('safety') || rawMsg.includes('blocked') || rawMsg.includes('harm')) {
        errorMsg = "I wasn't able to respond to that particular question. Could you try rephrasing it?";
      } else if (rawMsg.includes('503') || rawMsg.includes('overloaded') || rawMsg.includes('unavailable')) {
        errorMsg = 'The AI service is temporarily unavailable. Please try again in a few moments.';
      } else if (rawMsg.includes('404') || rawMsg.includes('not found') || rawMsg.includes('not supported')) {
        errorMsg = 'The AI service is being updated. Please try again shortly.';
      } else {
        errorMsg = 'Something went wrong. Please try again.';
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMsg, isError: true }]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, personalize]);

  // ── Gate: consent state still loading ──
  if (aiConsent === null) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 size={28} className="animate-spin text-secondary-400" />
      </div>
    );
  }

  // ── Gate: AI data sharing consent required ──
  if (!aiConsent) {
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

  // ── Gate: proxy not configured ──
  if (!PROXY_URL) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-secondary-200 max-w-md w-full">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-900 mb-2">AI Service Not Configured</h2>
          <p className="text-secondary-600 text-sm mb-4">
            The AI assistant is not yet connected. Please contact support if this issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h2 className="text-xl font-bold text-primary-800">Program Guide</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePersonalize}
            title="When on, a short summary of your symptom log and workbook answers is sent to Google Gemini with your questions so answers can be personalized."
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${
              personalize
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-secondary-500 border-secondary-200 hover:border-primary-300'
            }`}
          >
            <Sparkles size={12} />
            {personalize ? 'Personalized: On' : 'Personalize with my data'}
          </button>
          <button
            onClick={newConversation}
            title="Start a new conversation"
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border bg-white text-secondary-500 border-secondary-200 hover:border-secondary-300 transition-colors"
          >
            <RotateCcw size={12} />
            New chat
          </button>
        </div>
      </div>

      <p className="text-secondary-600 text-xs mb-2 shrink-0 flex items-center gap-1 bg-primary-50 text-primary-800 p-2 rounded-lg border border-primary-200">
        <AlertCircle size={14} className="shrink-0" />
        AI is for educational purposes based on The Resilient Path. Not medical advice.
      </p>

      {personalize && (
        <p className="text-[11px] text-secondary-500 mb-2 shrink-0 px-1">
          Personalization is on: a brief summary of your symptom trends and workbook answers is shared with Google Gemini alongside your questions. Turn it off anytime.
        </p>
      )}

      {showCrisisBanner && (
        <div className="mb-2 shrink-0 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2">
          <HeartPulse size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900 leading-relaxed">
            <span className="font-bold">You don't have to face this alone.</span>{' '}
            The 988 Suicide & Crisis Lifeline is available 24/7 —{' '}
            <a href="tel:988" className="font-bold underline">call or text 988</a>.{' '}
            You can also visit the app's{' '}
            <Link to="/emergency" className="font-bold underline">Emergency Information</Link> page.
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-white border border-secondary-200 rounded-2xl p-4 shadow-inner mb-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-none'
                  : msg.isError
                    ? 'bg-amber-50 text-amber-800 rounded-tl-none border border-amber-200'
                    : 'bg-secondary-100 text-secondary-900 rounded-tl-none border border-secondary-200'
              }`}
            >
              {msg.content || (msg.isStreaming ? '…' : '')}
              {msg.isError && (
                <button
                  onClick={() => {
                    // Find the last user message and retry it
                    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                    if (lastUserMsg) {
                      // Remove the error message and re-send
                      setMessages(prev => prev.filter((_, i) => i !== idx));
                      setInput(lastUserMsg.content);
                    }
                  }}
                  className="block mt-2 text-xs text-amber-600 font-semibold underline hover:text-amber-800"
                >
                  Tap to retry
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && !messages[messages.length - 1]?.isStreaming && (
          <div className="flex justify-start">
            <div className="bg-secondary-100 rounded-2xl p-3 rounded-tl-none border border-secondary-200 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-secondary-500" />
              <span className="text-sm text-secondary-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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
        {/* Dictate a question — brain-fog days and sore hands are exactly
            when someone reaches for the guide. */}
        <VoiceInputButton
          className="w-10 h-10 rounded-full border-0 mr-1"
          size={17}
          onText={(t) => setInput(prev => (prev ? `${prev.replace(/\s+$/, '')} ${t}` : t))}
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
