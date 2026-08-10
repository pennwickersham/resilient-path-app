import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wind, Footprints, Hand, Gamepad2, Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

/* Cross-promotion for the coping-skills game in the Resilient Path family.
   TODO: once SootheQuest launches on the app stores, point this at the store
   listing (or branch by platform via Capacitor.getPlatform()). */
const SOOTHEQUEST_URL = 'https://pennwickersham.github.io/SootheQuest/';

/* ─────────────────────── Breathing ───────────────────────
   Two evidence-informed patterns. Phase timing drives both the
   label/countdown and a smoothly scaling circle. */

const PATTERNS = {
  box: {
    label: 'Box Breathing',
    blurb: 'Inhale, hold, exhale, hold — 4 seconds each. Steady and grounding.',
    phases: [
      { name: 'Breathe in', secs: 4, scale: 1 },
      { name: 'Hold', secs: 4, scale: 1 },
      { name: 'Breathe out', secs: 4, scale: 0.55 },
      { name: 'Hold', secs: 4, scale: 0.55 },
    ],
  },
  relax: {
    label: '4-7-8 Relaxing Breath',
    blurb: 'Inhale 4, hold 7, exhale slowly for 8. Especially good before sleep.',
    phases: [
      { name: 'Breathe in', secs: 4, scale: 1 },
      { name: 'Hold', secs: 7, scale: 1 },
      { name: 'Breathe out', secs: 8, scale: 0.55 },
    ],
  },
};

function BreathingTool() {
  const [patternId, setPatternId] = useState('box');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PATTERNS.box.phases[0].secs);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);

  const pattern = PATTERNS[patternId];
  const phase = pattern.phases[phaseIdx];

  useEffect(() => {
    if (!running) return undefined;
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1;
        // advance phase
        setPhaseIdx(pIdx => {
          const next = (pIdx + 1) % pattern.phases.length;
          if (next === 0) setCycles(c => c + 1);
          return next;
        });
        return 0; // will be reset by the phase effect below
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, pattern.phases.length]);

  // When the phase changes, load its duration.
  useEffect(() => {
    setSecondsLeft(pattern.phases[phaseIdx].secs);
  }, [phaseIdx, pattern]);

  const reset = (id = patternId) => {
    setRunning(false);
    setPatternId(id);
    setPhaseIdx(0);
    setSecondsLeft(PATTERNS[id].phases[0].secs);
    setCycles(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.entries(PATTERNS).map(([id, p]) => (
          <button
            key={id}
            onClick={() => reset(id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
              patternId === id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-secondary-600 border-secondary-200 hover:border-primary-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-secondary-500 text-center">{pattern.blurb}</p>

      {/* Animated circle — CSS transition matched to the phase length */}
      <div className="flex items-center justify-center h-56">
        <div
          className="rounded-full bg-primary-100 border-4 border-primary-400 flex items-center justify-center"
          style={{
            width: '180px',
            height: '180px',
            transform: `scale(${running ? phase.scale : 0.75})`,
            transition: `transform ${running ? phase.secs : 0.5}s ease-in-out`,
          }}
        >
          <div className="text-center">
            <p className="text-base font-extrabold text-primary-800">{running ? phase.name : 'Ready'}</p>
            {running && <p className="text-3xl font-extrabold text-primary-600 leading-tight">{secondsLeft}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setRunning(r => !r)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shadow-sm"
        >
          {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
        </button>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-secondary-200 text-secondary-600 bg-white hover:bg-secondary-50 font-bold text-sm transition-colors"
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>
      {cycles > 0 && (
        <p className="text-center text-xs font-semibold text-emerald-700">
          {cycles} full {cycles === 1 ? 'cycle' : 'cycles'} complete — well done.
        </p>
      )}
      <p className="text-[10px] text-secondary-400 text-center leading-relaxed">
        Breathe gently and stop if you feel lightheaded. Aim for 4–8 cycles.
      </p>
    </div>
  );
}

/* ─────────────────────── Guided step-through (shared) ─────────────────────── */

function GuidedSteps({ steps, closing }) {
  const [idx, setIdx] = useState(0);
  const last = idx === steps.length - 1;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-primary-600' : 'w-1.5 bg-secondary-200'}`} />
        ))}
      </div>
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 min-h-[170px] flex flex-col justify-center">
        <p className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-2">{steps[idx].title}</p>
        <p className="text-sm text-secondary-700 leading-relaxed">{steps[idx].text}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border border-secondary-200 text-secondary-600 bg-white font-bold text-sm disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={() => (last ? setIdx(0) : setIdx(i => i + 1))}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shadow-sm"
        >
          {last ? 'Start Over' : 'Next'} {!last && <ChevronRight size={16} />}
        </button>
      </div>
      {last && closing && (
        <p className="text-xs text-emerald-700 font-semibold text-center">{closing}</p>
      )}
    </div>
  );
}

const BODY_SCAN_STEPS = [
  { title: 'Settle in', text: 'Sit or lie down comfortably. Let your eyes close or soften your gaze. Take three slow breaths, letting each exhale be a little longer than the inhale.' },
  { title: 'Feet & legs', text: 'Bring gentle attention to your feet. Notice any sensation — warmth, pressure, tingling — without trying to change it. Slowly move your attention up through your calves and thighs.' },
  { title: 'Hips & lower back', text: 'Notice your hips and lower back. If you find tension or pain, don\u2019t fight it. Imagine your breath flowing to that area, softening around it like warm water.' },
  { title: 'Belly & chest', text: 'Feel your belly rise and fall. Notice your chest expanding with each breath. Let your shoulders drop away from your ears.' },
  { title: 'Hands & arms', text: 'Bring attention to your hands — fingertips, palms, wrists. Travel up your forearms and upper arms, releasing any gripping you find along the way.' },
  { title: 'Neck, jaw & face', text: 'Notice your neck and throat. Unclench your jaw and let your tongue rest. Smooth your forehead. So much tension hides here.' },
  { title: 'Whole body', text: 'Now sense your body as a whole, breathing. You are not your pain — you are the one noticing it. Rest here for a few breaths before gently opening your eyes.' },
];

const GROUNDING_STEPS = [
  { title: 'Why grounding works', text: 'When pain or anxiety spikes, your attention narrows onto threat. The 5-4-3-2-1 technique redirects your senses to the present moment, giving your nervous system evidence that you are safe right now.' },
  { title: '5 things you can SEE', text: 'Look around slowly. Name five things you can see. Notice their color, texture, and shape — really look at them like you\u2019ve never seen them before.' },
  { title: '4 things you can FEEL', text: 'Notice four things you can physically feel: your feet on the floor, the chair supporting you, fabric on your skin, the temperature of the air.' },
  { title: '3 things you can HEAR', text: 'Listen for three sounds — near or far. Traffic, a fan, your own breathing. Let each one come to you without judging it.' },
  { title: '2 things you can SMELL', text: 'Notice two scents, or if you can\u2019t find any, name two smells you love — fresh coffee, rain on pavement.' },
  { title: '1 thing you can TASTE', text: 'Notice one taste in your mouth, or take a sip of water and follow the sensation. Then take one slow, full breath.' },
];

/* ─────────────────────── Page ─────────────────────── */

const TOOLS = [
  { id: 'breathing', label: 'Breathing', icon: Wind },
  { id: 'bodyscan', label: 'Body Scan', icon: Footprints },
  { id: 'grounding', label: 'Grounding', icon: Hand },
];

const CopingTools = () => {
  const [searchParams] = useSearchParams();
  const initial = TOOLS.some(t => t.id === searchParams.get('tool')) ? searchParams.get('tool') : 'breathing';
  const [tool, setTool] = useState(initial);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-6">
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h2 className="text-xl font-bold text-primary-800 mb-1">Coping Toolbox</h2>
        <p className="text-secondary-600 text-sm leading-relaxed">
          In-the-moment tools drawn from <i>The Resilient Path</i>. Use them during a flare, before sleep, or any time your nervous system needs a hand. They work offline and take just a few minutes.
        </p>
      </section>

      <div className="flex gap-1 bg-secondary-100 p-1 rounded-xl">
        {TOOLS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                tool === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        {tool === 'breathing' && <BreathingTool />}
        {tool === 'bodyscan' && (
          <GuidedSteps
            steps={BODY_SCAN_STEPS}
            closing="Notice how your body feels compared to when you started."
          />
        )}
        {tool === 'grounding' && (
          <GuidedSteps
            steps={GROUNDING_STEPS}
            closing="You brought yourself back to the present. That\u2019s a real skill."
          />
        )}
      </section>

      {/* SootheQuest cross-promotion */}
      <button
        onClick={() => window.open(SOOTHEQUEST_URL, '_blank')}
        className="w-full bg-white p-4 rounded-2xl shadow-sm border border-secondary-100 hover:border-primary-200 transition-colors flex items-center gap-3 text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <Gamepad2 size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-secondary-900">Prefer to practice through play?</p>
          <p className="text-xs text-secondary-500 leading-snug">
            SootheQuest, our coping-skills game, turns these same techniques into an adventure.
          </p>
        </div>
        <ChevronRight size={18} className="text-secondary-300 shrink-0" />
      </button>
    </div>
  );
};

export default CopingTools;
