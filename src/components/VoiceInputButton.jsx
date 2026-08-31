/**
 * VoiceInputButton — dictation for people whose hands hurt.
 *
 * Typing long workbook answers on a phone is a real barrier with hand
 * arthritis, fatigue, or brain fog. This button turns any text field
 * into a dictation target.
 *
 * Platform strategy:
 *   - Native (iOS/Android): @capacitor-community/speech-recognition,
 *     which uses the OS speech engines. Requires `npx cap sync` plus the
 *     mic/speech permission strings (see upload notes).
 *   - Web: the Web Speech API where available (Chrome, Edge, Safari).
 *   - Neither available: the button renders nothing — the field simply
 *     stays a normal text field. Never an error state for the user.
 *
 * Usage:
 *   <VoiceInputButton onText={(t) => append(t)} />
 * onText receives finalized utterances; the parent appends them to its
 * own state so dictation and typing mix freely.
 */

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const isNative = Capacitor.isNativePlatform();
const WebSpeech = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const VoiceInputButton = ({ onText, className = '', size = 16, title = 'Dictate instead of typing' }) => {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const webRecRef = useRef(null);
  const listenerRef = useRef(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isNative) {
        try {
          const { available } = await SpeechRecognition.available();
          if (!cancelled) setSupported(!!available);
        } catch { /* plugin not synced — hide the button */ }
      } else if (WebSpeech) {
        setSupported(true);
      }
    })();
    return () => {
      cancelled = true;
      stopEverything();
    };
  }, []);

  const stopEverything = async () => {
    setListening(false);
    try { webRecRef.current?.stop(); } catch { /* already stopped */ }
    webRecRef.current = null;
    if (isNative) {
      try { await SpeechRecognition.stop(); } catch { /* not running */ }
      try { listenerRef.current?.remove(); } catch { /* removed */ }
      listenerRef.current = null;
    }
  };

  const startNative = async () => {
    const perm = await SpeechRecognition.requestPermissions();
    if (perm.speechRecognition !== 'granted') return;

    // partialResults gives live text; we only commit on listening end to
    // avoid duplicating partials. Track the latest partial as the result.
    let latest = '';
    listenerRef.current = await SpeechRecognition.addListener('partialResults', (data) => {
      if (data?.matches?.length) latest = data.matches[0];
    });

    setListening(true);
    try {
      const res = await SpeechRecognition.start({
        language: 'en-US',
        partialResults: false,
        popup: false,
      });
      const finalText = res?.matches?.[0] || latest;
      if (finalText) onTextRef.current?.(finalText);
    } catch (e) {
      console.error('Native speech recognition failed', e);
    } finally {
      await stopEverything();
    }
  };

  const startWeb = () => {
    const rec = new WebSpeech();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const t = event.results[i][0].transcript.trim();
          if (t) onTextRef.current?.(t);
        }
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    webRecRef.current = rec;
    setListening(true);
    rec.start();
  };

  if (!supported) return null;

  const toggle = () => {
    if (listening) stopEverything();
    else (isNative ? startNative() : startWeb());
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop dictating' : title}
      aria-label={listening ? 'Stop dictating' : title}
      className={`shrink-0 flex items-center justify-center rounded-lg border transition-colors ${
        listening
          ? 'bg-red-600 border-red-600 text-white animate-pulse'
          : 'bg-white border-secondary-200 text-secondary-500 hover:text-primary-600 hover:border-primary-300'
      } ${className || 'w-9 h-9'}`}
    >
      {listening ? <Square size={size - 2} /> : <Mic size={size} />}
    </button>
  );
};

export default VoiceInputButton;
