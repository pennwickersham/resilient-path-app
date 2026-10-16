/**
 * speech.js — read-aloud for moments when reading a screen is too much.
 *
 * During a flare, brain fog and screen fatigue make even short text hard.
 * This speaks it instead, using the phone's own voices — nothing leaves
 * the device.
 *
 * Platform strategy (mirrors VoiceInputButton):
 *   - Native (iOS/Android): @capacitor-community/text-to-speech. Requires
 *     `npx cap sync`; until then isPluginAvailable() is false and callers
 *     hide their read-aloud buttons.
 *   - Web: the Web Speech API's speechSynthesis where available.
 */

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isNative = Capacitor.isNativePlatform();
const webSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export const speechAvailable = () =>
  isNative ? Capacitor.isPluginAvailable('TextToSpeech') : !!webSynth;

export async function stopSpeaking() {
  if (isNative) {
    try { await TextToSpeech.stop(); } catch { /* nothing playing */ }
  } else {
    try { webSynth?.cancel(); } catch { /* nothing playing */ }
  }
}

/** Speaks `text` slowly and calmly. Resolves when finished or stopped. */
export async function speak(text) {
  await stopSpeaking();
  if (!text || !speechAvailable()) return;
  if (isNative) {
    try {
      // 'playback' keeps it audible with the iPhone silent switch on.
      await TextToSpeech.speak({ text, lang: 'en-US', rate: 0.9, pitch: 1.0, volume: 1.0, category: 'playback' });
    } catch { /* stopped or engine unavailable */ }
    return;
  }
  await new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    u.onend = resolve;
    u.onerror = resolve;
    webSynth.speak(u);
  });
}
