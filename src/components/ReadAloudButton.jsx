/**
 * ReadAloudButton — speaks a block of text on tap; tap again to stop.
 * Renders nothing where read-aloud isn't available, like VoiceInputButton.
 */

import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speak, stopSpeaking, speechAvailable } from '../services/speech';

const ReadAloudButton = ({ text, label = 'Read aloud', className = '' }) => {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => { stopSpeaking(); }, []);

  if (!text || !speechAvailable()) return null;

  const toggle = async () => {
    if (speaking) {
      setSpeaking(false);
      await stopSpeaking();
      return;
    }
    setSpeaking(true);
    await speak(text);
    setSpeaking(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? 'Stop reading' : label}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-bold text-xs transition-colors ${
        speaking
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'bg-white border-primary-200 text-primary-700 hover:bg-primary-50'
      } ${className || 'px-3 py-2'}`}
    >
      {speaking ? <><Square size={13} /> Stop</> : <><Volume2 size={14} /> {label}</>}
    </button>
  );
};

export default ReadAloudButton;
