import logoBrand from '../assets/autoniv-full-logo.webp';

// Each bar has its own peak height, animation speed and delay so the
// equalizer reads as a live audio meter rather than a synchronized wave.
const BARS = [
  { peak: 0.55, dur: 1.05, delay: 0.0 },
  { peak: 0.8, dur: 0.82, delay: 0.18 },
  { peak: 0.45, dur: 1.25, delay: 0.05 },
  { peak: 1.0, dur: 0.7, delay: 0.32 },
  { peak: 0.65, dur: 0.95, delay: 0.12 },
  { peak: 0.95, dur: 0.76, delay: 0.28 },
  { peak: 0.5, dur: 1.15, delay: 0.02 },
  { peak: 0.78, dur: 0.88, delay: 0.22 },
  { peak: 0.6, dur: 1.0, delay: 0.09 },
];

const MAX_BAR_HEIGHT = 48;

export default function AutonivLoadingScreen() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background:
          'radial-gradient(900px 500px at 50% 30%, #131a2e 0%, #0b1120 55%, #060912 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Soft single accent glow, low and centered */}
      <div
        style={{
          position: 'absolute',
          bottom: '30%',
          width: 520,
          height: 260,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.08) 45%, transparent 72%)',
          filter: 'blur(30px)',
          animation: 'auto-breathe 4s ease-in-out infinite',
        }}
      />

      {/* Logo + Brand */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          animation: 'auto-rise 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <img
          src={logoBrand}
          alt="Autoniv Full Logo"
          width={270}
          height={180}
          style={{
            height: 180,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Voice equalizer — the product motif */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: MAX_BAR_HEIGHT,
        }}
      >
        {BARS.map((bar, i) => (
          <span
            key={i}
            style={{
              display: 'block',
              width: 5,
              height: MAX_BAR_HEIGHT,
              // The base height sets each bar's ceiling; the animation
              // scales between a low floor and that ceiling.
              maxHeight: Math.round(MAX_BAR_HEIGHT * bar.peak),
              borderRadius: 999,
                background:
                  'linear-gradient(180deg, #10b981 0%, #06b6d4 55%, #3b82f6 100%)',
              transformOrigin: 'center',
              animation: `auto-eq ${bar.dur}s ease-in-out ${bar.delay}s infinite`,
              boxShadow: '0 0 12px rgba(139,92,246,0.35)',
            }}
          />
        ))}
      </div>

      {/* Label + indeterminate progress track */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(148,163,184,0.75)',
            animation: 'auto-fade 0.9s ease',
          }}
        >
          Preparing your workspace
        </span>

        <div
          style={{
            position: 'relative',
            width: 180,
            height: 2,
            borderRadius: 999,
            background: 'rgba(148,163,184,0.14)',
            overflow: 'hidden',
            animation: 'auto-fade 1.2s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '40%',
              borderRadius: 999,
              background:
                'linear-gradient(90deg, transparent 0%, #818cf8 50%, #22c55e 100%)',
              animation: 'auto-progress 1.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes auto-eq {
          0%, 100% { transform: scaleY(0.28); opacity: 0.7; }
          50%      { transform: scaleY(1);    opacity: 1; }
        }
        @keyframes auto-breathe {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50%      { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes auto-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes auto-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes auto-progress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @media (prefers-reduced-motion: reduce) {
          img, span, div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
