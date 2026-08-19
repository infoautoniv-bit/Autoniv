import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '../utils';
import { logger } from '../../../../utils/logger';
import { Spectrum } from './Spectrum';

/* ─────────────────────────────────────────────────────────────
   Types & Persona Presets
   ───────────────────────────────────────────────────────────── */
type CallState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended';

interface Persona {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: string;
  lang: string;
  samplePrompt: string;
  starterQuestion: string;
}

const DEMO_PERSONAS: Persona[] = [
  {
    id: 'ava',
    name: 'Ava',
    role: 'Autoniv Product Guide',
    badge: 'AI Assistant',
    icon: '✨',
    lang: 'English',
    samplePrompt: 'Ask about pricing plans, setup fees, features, or 20+ language support.',
    starterQuestion: '"What are your pricing plans for voice agents?"',
  },
  {
    id: 'dentist',
    name: 'Smile Dental',
    role: 'Clinic Receptionist',
    badge: 'Healthcare',
    icon: '🦷',
    lang: 'English',
    samplePrompt: 'Ask for teeth cleaning availability, tooth pain advice, or book an appointment.',
    starterQuestion: '"Can I book a dental cleaning appointment this Thursday afternoon?"',
  },
  {
    id: 'restaurant',
    name: 'Le Bistro',
    role: 'Table Reservations Host',
    badge: 'Hospitality',
    icon: '🍽️',
    lang: 'English',
    samplePrompt: 'Reserve a table for 4 tonight, ask about outdoor seating or dietary options.',
    starterQuestion: '"Do you have a table for 4 outside tonight at 8 PM?"',
  },
  {
    id: 'orders',
    name: 'Logistics Desk',
    role: 'Order & Delivery Support',
    badge: 'E-Commerce',
    icon: '📦',
    lang: 'English',
    samplePrompt: 'Inquire about package status, carrier tracking, or delayed delivery.',
    starterQuestion: '"Where is my package? My Order ID is 89402."',
  },
  {
    id: 'complaint',
    name: 'Resolution Team',
    role: 'Customer Grievances',
    badge: 'Support Desk',
    icon: '🛡️',
    lang: 'English',
    samplePrompt: 'Report a damaged product, delayed shipment, or request ticket generation.',
    starterQuestion: '"I received a broken item in my package and need an immediate refund."',
  },
  {
    id: 'hindi',
    name: 'हिंदी रिसेप्शनिस्ट',
    role: 'स्वाभाविक हिंदी वॉइस AI',
    badge: 'Indic V3',
    icon: '🇮🇳',
    lang: 'Hindi',
    samplePrompt: 'हिंदी में बात करें — अपॉइंटमेंट बुक करें या सेवाओं के बारे में पूछें।',
    starterQuestion: '"नमस्ते, मुझे डॉक्टर से मिलने के लिए अपॉइंटमेंट चाहिए।"',
  },
];

export const HUMAN_VOICE_MODELS = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', tag: 'Ultra-Realistic Warm', gender: 'Female', badge: 'Dograh Style' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', tag: 'Deep & Resonant', gender: 'Male', badge: 'Comforting' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', tag: 'Bright & Energetic', gender: 'Female', badge: 'Concierge' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', tag: 'Gentle Healthcare', gender: 'Female', badge: 'Caring' },
  { id: 'sarvam:shreya', name: 'Shreya', tag: 'Native Indic / Hindi', gender: 'Female', badge: 'Bulbul V3' },
];

type LogMessage = {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  time: string;
};

const getNowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

export function DemoTalk() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(DEMO_PERSONAS[0]);
  const [selectedVoice, setSelectedVoice] = useState<string>(HUMAN_VOICE_MODELS[0].id);
  const [status, setStatus] = useState<CallState>('idle');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rms, setRms] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* ── Audio & WebSocket Refs ── */
  const ws = useRef<WebSocket | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const procNode = useRef<ScriptProcessorNode | null>(null);
  const audioSources = useRef<AudioScheduledSourceNode[]>([]);
  const nextPlayTime = useRef(0);
  const analyser = useRef<AnalyserNode | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Smooth Container-Only Scroll (Zero window jumping) ── */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs]);

  /* ── Duration Timer ── */
  useEffect(() => {
    if (status === 'listening' || status === 'speaking') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (status === 'idle') setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  /* ── Teardown & Buffer Cleanup ── */
  const clearBuffers = useCallback(() => {
    audioSources.current.forEach(s => {
      try { s.stop(); } catch {}
      try { s.disconnect(); } catch {}
    });
    audioSources.current = [];
    if (ctx.current) {
      nextPlayTime.current = ctx.current.currentTime;
    }
  }, []);

  const endCall = useCallback(() => {
    if (ws.current) {
      try { ws.current.close(1000, 'User ended call'); } catch {}
      ws.current = null;
    }
    if (procNode.current) {
      try { procNode.current.disconnect(); } catch {}
      procNode.current = null;
    }
    if (micStream.current) {
      micStream.current.getTracks().forEach(t => t.stop());
      micStream.current = null;
    }
    clearBuffers();
    if (ctx.current && ctx.current.state !== 'closed') {
      try { ctx.current.close(); } catch {}
      ctx.current = null;
    }
    setStatus('idle');
    setRms(0);
    setDuration(0);
    setLogs([]); // Immediately delete conversation transcript when call ends/cuts
  }, [clearBuffers]);

  useEffect(() => () => { endCall(); }, [endCall]);

  /* ── Audio Playback ── */
  const playAudio = useCallback(async (base64: string) => {
    const ac = ctx.current;
    const an = analyser.current;
    if (!ac || ac.state === 'closed' || !an) return;

    try {
      if (ac.state === 'suspended') await ac.resume();
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      let ab: AudioBuffer;
      const isContainer =
        (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) || // RIFF
        (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) || // MP3 sync
        (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53); // OggS

      if (isContainer) {
        try {
          const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
          ab = await ac.decodeAudioData(copy);
        } catch {
          const i16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
          const f32 = new Float32Array(i16.length);
          for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
          ab = ac.createBuffer(1, f32.length, 24000);
          ab.copyToChannel(f32, 0);
        }
      } else {
        const i16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
        const f32 = new Float32Array(i16.length);
        for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
        ab = ac.createBuffer(1, f32.length, 24000);
        ab.copyToChannel(f32, 0);
      }

      const src = ac.createBufferSource();
      src.buffer = ab;
      src.connect(an);
      src.connect(ac.destination);

      const t0 = Math.max(ac.currentTime, nextPlayTime.current);
      src.start(t0);
      nextPlayTime.current = t0 + ab.duration;
      audioSources.current.push(src);

      src.onended = () => {
        audioSources.current = audioSources.current.filter(x => x !== src);
        if (!audioSources.current.length) {
          setStatus(s => (s === 'speaking' ? 'listening' : s));
        }
      };
    } catch (err) {
      logger.error('[Demo Playback Error]', err);
    }
  }, []);

  /* ── Start Live Voice Talk ── */
  const startCall = async (personaOverride?: Persona, voiceOverride?: string) => {
    const targetPersona = personaOverride || selectedPersona;
    const targetVoice = voiceOverride || selectedVoice;
    endCall();
    setError(null);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStream.current = stream;

      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ac = new AC({ sampleRate: 16000 });
      ctx.current = ac;
      if (ac.state === 'suspended') await ac.resume();
      nextPlayTime.current = ac.currentTime;

      const an = ac.createAnalyser();
      an.fftSize = 256;
      analyser.current = an;

      const { API_HOST } = await import('../../../../config/api');
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = API_HOST || window.location.host;

      const wsUrl = `${proto}//${host}/web-call?agentId=demo&persona=${targetPersona.id}&voiceId=${targetVoice}`;
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setStatus('listening');

        const src = ac.createMediaStreamSource(stream);
        const proc = ac.createScriptProcessor(4096, 1, 1);
        procNode.current = proc;

        src.connect(proc);
        const zeroGain = ac.createGain();
        zeroGain.gain.value = 0;
        proc.connect(zeroGain);
        zeroGain.connect(ac.destination);
        src.connect(an);

        proc.onaudioprocess = e => {
          if (muted) return;
          const input = e.inputBuffer.getChannelData(0);
          let s = 0;
          for (let i = 0; i < input.length; i++) s += input[i] * input[i];
          setRms(Math.sqrt(s / input.length));

          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
          }

          if (socket.readyState === WebSocket.OPEN) {
            socket.send(pcm.buffer as ArrayBuffer);
          }
        };
      };

      socket.onmessage = e => {
        try {
          const d = JSON.parse(e.data);
          if (d.event === 'audio') {
            setStatus('speaking');
            playAudio(d.payload);
          } else if (d.event === 'clear') {
            setStatus('listening');
            clearBuffers();
          } else if (d.event === 'transcript') {
            const role: 'agent' | 'user' | 'system' =
              d.role === 'agent' || d.role === 'assistant'
                ? 'agent'
                : d.role === 'caller' || d.role === 'user'
                ? 'user'
                : 'system';
            setLogs(p => [...p, { id: `tr-${Date.now()}-${Math.random()}`, role, text: d.text, time: getNowTime() }]);
          } else if (d.event === 'tool_call') {
            setLogs(p => [
              ...p,
              {
                id: `tool-${Date.now()}`,
                role: 'system',
                text: `⚡ Executing tool: ${d.name || 'action'}...`,
                time: getNowTime(),
              },
            ]);
          } else if (d.event === 'tool_result') {
            const resultMsg = d.result?.message || d.result?.ticketId || 'Action completed';
            setLogs(p => [
              ...p,
              {
                id: `res-${Date.now()}`,
                role: 'system',
                text: `✓ ${resultMsg}`,
                time: getNowTime(),
              },
            ]);
          }
        } catch {}
      };

      socket.onerror = () => {
        setError('Connection issue. Please verify microphone permission.');
        setStatus('idle');
        setLogs([]);
      };

      socket.onclose = () => {
        setStatus('idle');
        setLogs([]);
        setDuration(0);
      };
    } catch (err: any) {
      logger.error('Mic access error', err);
      setError('Microphone permission is required to talk live.');
      setStatus('idle');
      setLogs([]);
    }
  };

  const handleSwitchPersona = (p: Persona) => {
    setSelectedPersona(p);
    setDuration(0);
    setError(null);
    setLogs([]); // clean state without pre-canned greetings

    if (status === 'listening' || status === 'speaking' || status === 'connecting') {
      startCall(p);
    } else {
      endCall();
    }
  };

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <section id="demo" className="section-box black relative overflow-hidden py-12 sm:py-20">
      {/* Ambient background aura */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none filter blur-[140px] opacity-20"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, #10b981 40%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <Reveal className="text-center mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Voice Demo
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Talk with <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Autoniv Voice AI</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Experience ultra-low latency real-time voice streaming. Select an industry persona and talk live via your browser microphone.
          </p>
        </Reveal>

        {/* Persona Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          {DEMO_PERSONAS.map(p => {
            const isSelected = selectedPersona.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSwitchPersona(p)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-500/80 text-white shadow-lg shadow-blue-500/20 scale-[1.03]'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Human Voice Model Timbre Selector (Dograh & ElevenLabs Realism) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mr-1">
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Human Voice:
          </span>
          {HUMAN_VOICE_MODELS.map(v => {
            const isSelected = selectedVoice === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVoice(v.id);
                  if (status === 'listening' || status === 'speaking' || status === 'connecting') {
                    startCall(undefined, v.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300 shadow-sm shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <span className="font-semibold">{v.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({v.tag})</span>
              </button>
            );
          })}
        </div>

        {/* Main Stage */}
        <div className="bg-[#0b0f17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/90 backdrop-blur-2xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <div className="h-4 w-px bg-white/10 mx-1" />
              <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'listening'
                      ? 'bg-emerald-400 animate-pulse'
                      : status === 'speaking'
                      ? 'bg-blue-400 animate-ping'
                      : status === 'connecting'
                      ? 'bg-yellow-400'
                      : 'bg-slate-500'
                  }`}
                />
                {status === 'listening'
                  ? 'Listening to you...'
                  : status === 'speaking'
                  ? `${selectedPersona.name} is speaking`
                  : status === 'connecting'
                  ? 'Connecting audio stream...'
                  : 'Ready to talk'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 text-emerald-400">
                <span>⚡ ~120ms latency</span>
              </div>
              <div className="font-semibold text-slate-200">
                ⏱ {formatSecs(duration)}
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            {/* LEFT — Voice Orb & Controls */}
            <div className="lg:col-span-5 flex flex-col items-center justify-between p-8 border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-b from-[#0d131f] to-[#090c12] relative overflow-hidden">
              {/* Centered Fluid Sound Wave Spectrum */}
              <Spectrum active={status === 'listening' || status === 'speaking'} status={status} rms={rms} />

              {/* Persona Tag */}
              <div className="text-center relative z-10 w-full">
                <div className="inline-block p-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-1.5">
                  {selectedPersona.icon} {selectedPersona.role}
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {selectedPersona.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {selectedPersona.samplePrompt}
                </p>
              </div>

              {/* Dynamic Centered Orb */}
              <div className="relative my-6 flex items-center justify-center z-10">
                <div
                  className={`absolute rounded-full transition-all duration-300 ${
                    status === 'speaking'
                      ? 'w-48 h-48 bg-blue-500/25 blur-2xl scale-125'
                      : status === 'listening'
                      ? 'w-44 h-44 bg-emerald-500/20 blur-2xl scale-110'
                      : 'w-36 h-36 bg-blue-500/10 blur-xl'
                  }`}
                  style={{
                    transform: status === 'listening' ? `scale(${1 + Math.min(rms * 3, 0.4)})` : undefined,
                  }}
                />

                <div
                  className={`w-32 h-32 rounded-full border-2 flex items-center justify-center relative z-10 transition-all duration-300 ${
                    status === 'speaking'
                      ? 'border-blue-400 bg-blue-600/30 shadow-[0_0_50px_rgba(59,130,246,0.6)]'
                      : status === 'listening'
                      ? 'border-emerald-400 bg-emerald-600/25 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                      : 'border-white/20 bg-white/5 hover:border-blue-400/50'
                  }`}
                  style={{
                    transform: status === 'listening' ? `scale(${1 + Math.min(rms * 1.5, 0.2)})` : undefined,
                  }}
                >
                  {status === 'idle' || status === 'ended' ? (
                    <button
                      onClick={() => startCall()}
                      aria-label="Start Voice Demo"
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
                    >
                      <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-9 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-300 tracking-wider">
                        {status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="w-full relative z-10 flex flex-col items-center gap-2.5 mt-4">
                {status === 'idle' || status === 'ended' ? (
                  <button
                    onClick={() => startCall()}
                    className="w-full max-w-xs py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span>🎙️ Click to Talk Live</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full justify-center">
                    <button
                      onClick={() => setMuted(!muted)}
                      className={`p-3 rounded-2xl border transition-all ${
                        muted
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                      title={muted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {muted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19L5 5m14 6a7 7 0 01-11.33 5.37M9 9V5a3 3 0 016 0v4m-3 10v2m-3 0h6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={endCall}
                      className="py-3 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                      End Call
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-center">
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT — Clean Live Conversation Transcript */}
            <div className="lg:col-span-7 flex flex-col bg-[#070a10]">
              <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <span className="text-xs font-mono text-slate-400">
                  Live Conversation Transcript
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Try asking: <span className="text-slate-300 italic">{selectedPersona.starterQuestion}</span>
                </span>
              </div>

              {/* Chat Container (internal scroll only, no parent window scrolling) */}
              <div
                ref={chatContainerRef}
                className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[360px] scrollbar-thin scrollbar-thumb-white/10"
              >
                {logs.length === 0 && (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-3 shadow-inner">
                      {selectedPersona.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Ready to speak with {selectedPersona.name}</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Click the microphone button on the left to start live voice talk. Your transcript will appear here.
                    </p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {logs.map(log => {
                    const isAgent = log.role === 'agent';
                    const isSystem = log.role === 'system';

                    if (isSystem) {
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center my-1"
                        >
                          <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/25 px-3 py-0.5 rounded-full text-center max-w-md">
                            {log.text}
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, scale: 0.97, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} w-full`}
                      >
                        {/* Speaker Label */}
                        <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] font-medium ${isAgent ? 'text-cyan-400' : 'text-blue-300'}`}>
                          <span>{isAgent ? `${selectedPersona.name} (AI)` : 'You (Caller)'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">· {log.time}</span>
                        </div>

                        <div className={`flex gap-2.5 max-w-[85%] ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-md ${
                              isAgent
                                ? 'bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 text-white shadow-cyan-500/20 ring-1 ring-white/10'
                                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/25 ring-1 ring-white/10'
                            }`}
                          >
                            {isAgent ? selectedPersona.icon : '👤'}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isAgent
                                ? 'bg-[#111827] border border-cyan-500/20 text-slate-100 rounded-tl-sm shadow-md'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/25'
                            }`}
                          >
                            <p>{log.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Bottom Quick-Start Suggestions */}
              <div className="p-3.5 px-6 border-t border-white/5 bg-white/[0.01] flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 mr-1">Suggestions:</span>
                <span className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1 rounded-full border border-white/5 cursor-default transition-all">
                  {selectedPersona.starterQuestion}
                </span>
                <span className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1 rounded-full border border-white/5 cursor-default transition-all">
                  "Can you speak in Hindi?"
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default DemoTalk;
