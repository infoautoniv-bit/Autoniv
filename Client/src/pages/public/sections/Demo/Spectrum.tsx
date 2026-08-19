import React from 'react';

interface SpectrumProps {
  active: boolean;
  status?: 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended';
  rms?: number;
}

export const Spectrum = React.memo(function Spectrum({ active, status = 'idle', rms = 0 }: SpectrumProps) {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
      {/* Dynamic Ambient Radiant Aura */}
      <div
        className={`absolute w-72 h-72 rounded-full transition-all duration-700 blur-[80px] ${
          isSpeaking
            ? 'bg-blue-500/30 scale-125'
            : isListening
            ? 'bg-emerald-500/25 scale-110'
            : 'bg-blue-500/10 scale-90'
        }`}
      />

      {/* Layer 1: Fluid Multi-Wave Sinusoidal SVG Ribbon */}
      <svg
        className="absolute w-full h-44 opacity-80"
        viewBox="0 0 600 160"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="25%" stopColor="#2dd4bf" stopOpacity={active ? 0.6 : 0.15} />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity={active ? 0.9 : 0.25} />
            <stop offset="75%" stopColor="#10b981" stopOpacity={active ? 0.6 : 0.15} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="30%" stopColor="#06b6d4" stopOpacity={active ? 0.7 : 0.2} />
            <stop offset="50%" stopColor="#818cf8" stopOpacity={active ? 0.85 : 0.2} />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity={active ? 0.7 : 0.2} />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Primary Harmonic Wave Ribbon */}
        <path
          d={
            active
              ? `M0,80 C150,${40 - (isSpeaking ? 35 : rms * 80)} 300,${120 + (isSpeaking ? 35 : rms * 80)} 450,${45 - (isSpeaking ? 30 : rms * 60)} 600,80`
              : 'M0,80 C150,75 300,85 450,75 600,80'
          }
          stroke="url(#waveGrad1)"
          strokeWidth={active ? 3 : 1.5}
          strokeLinecap="round"
          className="transition-all duration-300"
          style={{
            filter: active ? 'drop-shadow(0 0 10px rgba(56,189,248,0.5))' : 'none',
          }}
        />

        {/* Secondary Harmonic Wave Ribbon (Cross Phase) */}
        <path
          d={
            active
              ? `M0,80 C150,${115 + (isSpeaking ? 30 : rms * 70)} 300,${45 - (isSpeaking ? 30 : rms * 70)} 450,${110 + (isSpeaking ? 25 : rms * 50)} 600,80`
              : 'M0,80 C150,85 300,75 450,85 600,80'
          }
          stroke="url(#waveGrad2)"
          strokeWidth={active ? 2.5 : 1}
          strokeLinecap="round"
          className="transition-all duration-300"
          style={{
            filter: active ? 'drop-shadow(0 0 8px rgba(45,212,191,0.4))' : 'none',
          }}
        />
      </svg>

      {/* Layer 2: Centered Audio Frequency Equalizer Bar Array */}
      <div className="absolute inset-x-8 flex items-center justify-center gap-[3px] opacity-60">
        {Array.from({ length: 28 }).map((_, i) => {
          const center = (28 - 1) / 2;
          const dist = Math.abs(i - center) / center;
          const curve = Math.max(0.1, 1 - dist * 0.7);

          const amp = active
            ? (isSpeaking ? 28 : 12 + rms * 80) * curve * Math.sin(((i + 1) / 28) * Math.PI)
            : 4;

          const isLeft = i < 14;
          const bg = isLeft
            ? 'linear-gradient(180deg, #2dd4bf 0%, #059669 100%)'
            : 'linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)';

          return (
            <div
              key={i}
              className="w-[2.5px] rounded-full transition-all duration-150"
              style={{
                height: `${Math.max(4, amp)}px`,
                background: bg,
                opacity: active ? (isSpeaking ? 0.85 : 0.5 + rms * 2) : 0.15,
                boxShadow: active
                  ? isLeft
                    ? '0 0 8px rgba(45,212,191,0.5)'
                    : '0 0 8px rgba(56,189,248,0.5)'
                  : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
});
