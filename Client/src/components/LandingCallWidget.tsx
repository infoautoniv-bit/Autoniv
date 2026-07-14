import { useState, useRef, useCallback, useEffect } from 'react';
import VapiModule from '@vapi-ai/web';
import { publicDemoService } from '../services/api';

const Vapi = (typeof VapiModule === 'function' ? VapiModule : (VapiModule as any).default) as new (key: string) => any;

/* ─── Vapi singleton ─────────────────────────────────────────── */
let vapiInstance: any | null = null;
function getVapi(): any | null {
  const key = import.meta.env.VITE_VAPI_API_KEY as string | undefined;
  if (!key) return null;
  if (!vapiInstance) vapiInstance = new Vapi(key);
  return vapiInstance;
}

/* ─── Waveform ───────────────────────────────────────────── */
function Waveform({ active, color = '#00e5a0' }: { active: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 32 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 99,
            background: color,
            height: active ? `${6 + Math.abs(Math.sin(i * 0.6)) * 22}px` : '3px',
            opacity: active ? 0.9 : 0.15,
            animation: active ? `waveBar ${0.5 + (i % 5) * 0.08}s ease-in-out ${i * 0.025}s infinite alternate` : 'none',
            transition: 'height .3s ease, opacity .3s ease',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Voice Orb ──────────────────────────────────────────── */
function VoiceOrb({ speaking }: { speaking: 'user' | 'agent' | 'idle' }) {
  const isAgent = speaking === 'agent';
  const isUser = speaking === 'user';
  const isActive = speaking !== 'idle';
  const coreColor = isAgent ? '#0077ff' : isUser ? '#0099ff' : '#1e3a5f';

  return (
    <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Ripple rings */}
      {isActive && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '1.5px solid rgba(0,119,255,0.12)',
          animation: `ringPulse 2.2s ease-out ${i * 0.7}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Outer glow */}
      <div style={{
        position: 'absolute', width: 130, height: 130, borderRadius: '50%',
        background: isActive ? 'rgba(0,119,255,0.14)' : 'rgba(0,119,255,0.04)',
        filter: 'blur(32px)', transition: 'background .6s ease',
      }} />

      {/* Border ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '1px solid rgba(0,119,255,0.08)',
      }} />

      {/* Core sphere */}
      <div style={{
        position: 'relative', zIndex: 2, width: 78, height: 78, borderRadius: '50%',
        background: speaking === 'idle'
          ? 'radial-gradient(circle at 35% 35%, #0d1f36, #050d1a)'
          : isAgent
            ? 'radial-gradient(circle at 30% 30%, #0077ff 0%, #005fe6 40%, #003fa3 100%)'
            : 'radial-gradient(circle at 30% 30%, #0099ff 0%, #0066dd 55%, #003fa3 100%)',
        border: `1.5px solid ${coreColor}30`,
        boxShadow: isActive
          ? `0 0 0 4px ${coreColor}10, 0 0 50px ${coreColor}25, inset 0 2px 0 rgba(255,255,255,.15)`
          : '0 0 30px rgba(0,119,255,.08), inset 0 1px 0 rgba(255,255,255,.04)',
        transition: 'all .5s cubic-bezier(.16,1,.3,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#fff' : '#1e3a5f'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke .4s ease' }}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0014 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Connecting Dots ────────────────────────────────────── */
function ConnectingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#0099ff',
          animation: 'connectBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
type CallMode = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

export default function LandingCallWidget() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<CallMode>('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [speaking, setSpeaking] = useState<'user' | 'agent' | 'idle'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxDurationRef.current) { clearTimeout(maxDurationRef.current); maxDurationRef.current = null; }
  }, []);

  const stopCall = useCallback(() => {
    try { getVapi()?.stop(); } catch { /* ignore */ }
    clearTimers();
    setMode('ended');
    setSpeaking('idle');
  }, [clearTimers]);

  useEffect(() => () => { stopCall(); }, [stopCall]);

  const startCall = useCallback(async () => {
    if (mode === 'active' || mode === 'connecting') { stopCall(); return; }

    const vapi = getVapi();
    if (!vapi) {
      setErrorMsg('Voice calling is not available. Please try again later.');
      setMode('error');
      return;
    }

    setMode('connecting');
    setCallSeconds(0);
    setErrorMsg('');

    try {
      const { data } = await publicDemoService.getAgent();
      const agent = data.agent;

      const onSpeechStart = () => { setMode('active'); setSpeaking('agent'); };
      const onSpeechEnd = () => setSpeaking('idle');
      const onCallEnd = () => stopCall();
      const onError = (e: any) => {
        console.error('[LandingCall] VAPI error:', e);
        setErrorMsg('Call failed. Please try again.');
        stopCall();
      };

      vapi.on('speech-start', onSpeechStart);
      vapi.on('speech-end', onSpeechEnd);
      vapi.on('call-end', onCallEnd);
      vapi.on('error', onError);

      await vapi.start({
        name: agent.name,
        firstMessage: agent.firstMessage,
        model: {
          provider: 'openai',
          model: 'gpt-4',
          messages: [{ role: 'system', content: agent.prompt }],
        },
        voice: {
          provider: '11labs',
          voiceId: agent.voiceId,
        },
      });

      setMode('active');
      timerRef.current = setInterval(() => setCallSeconds(prev => prev + 1), 1000);
      maxDurationRef.current = setTimeout(() => stopCall(), 120_000);

    } catch (err) {
      console.error('[LandingCall] Failed to start:', err);
      setErrorMsg('Could not connect. Please try again.');
      setMode('error');
    }
  }, [mode, stopCall]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleClose = () => {
    if (mode === 'active' || mode === 'connecting') stopCall();
    setModalOpen(false);
    setMode('idle');
    setCallSeconds(0);
    setSpeaking('idle');
    setErrorMsg('');
  };

  return (
    <>
      {/* ════════════════════════════════════════════
          FLOATING CTA BUTTON
      ════════════════════════════════════════════ */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 group"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 18px 10px 12px', borderRadius: 16,
          background: 'rgba(7,22,40,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,119,255,0.20)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
          cursor: 'pointer', color: '#fff',
          transition: 'all .25s cubic-bezier(.16,1,.3,1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
          e.currentTarget.style.borderColor = 'rgba(0,119,255,0.40)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,119,255,0.15), 0 0 0 1px rgba(0,119,255,0.15) inset';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = 'rgba(0,119,255,0.20)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset';
        }}
      >
        {/* Live pulse icon */}
        <span style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,119,255,0.12)', border: '1px solid rgba(0,119,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid rgba(0,119,255,0.15)', animation: 'livePulse 2.5s ease-out infinite' }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0077ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        </span>
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: '#e8f8ff' }}>Try Our AI Live</div>
          <div style={{ fontSize: 10, color: '#0077ff', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0077ff', animation: 'livePulse 2s ease infinite' }} />
            Click to call
          </div>
        </div>
      </button>

      {/* ════════════════════════════════════════════
          CALL MODAL
      ════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(5,13,26,0.88)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn .25s ease both',
          }} />

          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 400,
              background: 'linear-gradient(170deg, #080f1e 0%, #0a1a2e 50%, #071628 100%)',
              border: '1px solid rgba(0,119,255,0.15)',
              borderRadius: 28, overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(0,119,255,0.06), 0 48px 100px rgba(0,0,0,0.7), 0 0 140px rgba(0,119,255,0.06)',
              animation: 'modalIn .35s cubic-bezier(.16,1,.3,1) both',
            }}
          >
            {/* Gradient glow top */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 300, height: 180, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,119,255,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Title bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(0,119,255,0.06)',
              background: 'rgba(255,255,255,0.01)',
              position: 'relative', zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: mode === 'active' ? '#0077ff' : mode === 'connecting' ? '#ffe484' : '#1e3a5f',
                  animation: mode === 'active' ? 'livePulse 1.8s infinite' : 'none',
                  transition: 'background .3s',
                }} />
                <span style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  color: mode === 'active' ? '#0077ff' : '#6b9ec8',
                  letterSpacing: '0.1em', transition: 'color .3s',
                }}>
                  {mode === 'active' ? 'autoniv · live call' : mode === 'connecting' ? 'connecting…' : 'autoniv · ready'}
                </span>
              </div>

              <button
                onClick={handleClose}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.04)', color: '#6b9ec8',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e8f8ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#6b9ec8'; }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ─── Content ─── */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '44px 28px 36px', gap: 20,
              position: 'relative', zIndex: 1,
            }}>
              {/* Orb */}
              <VoiceOrb speaking={speaking} />

              {/* Status label */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', borderRadius: 99,
                background: mode === 'active' ? 'rgba(0,119,255,0.06)' : mode === 'connecting' ? 'rgba(255,228,132,0.06)' : 'rgba(0,119,255,0.04)',
                border: `1px solid ${mode === 'active' ? 'rgba(0,119,255,0.15)' : mode === 'connecting' ? 'rgba(255,228,132,0.15)' : 'rgba(0,119,255,0.10)'}`,
                transition: 'all .3s',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: mode === 'active' ? '#0077ff' : mode === 'connecting' ? '#ffe484' : '#0077ff',
                  animation: mode !== 'idle' ? 'livePulse 2s ease infinite' : 'none',
                }} />
                <span style={{
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                  color: mode === 'active' ? '#0077ff' : mode === 'connecting' ? '#ffe484' : '#6b9ec8',
                  letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
                }}>
                  {mode === 'idle' && 'Ready to call'}
                  {mode === 'connecting' && 'Connecting'}
                  {mode === 'active' && 'Live'}
                  {mode === 'ended' && 'Call ended'}
                  {mode === 'error' && 'Error'}
                </span>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontSize: 20, fontWeight: 700, color: '#e8f8ff',
                  margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em',
                }}>
                  {mode === 'idle' && 'Talk to Our AI'}
                  {mode === 'connecting' && 'Connecting…'}
                  {mode === 'active' && 'In Call'}
                  {mode === 'ended' && 'Call Complete'}
                  {mode === 'error' && 'Connection Failed'}
                </h3>

                {mode === 'idle' && (
                  <p style={{ fontSize: 13, color: '#6b9ec8', margin: '6px 0 0', lineHeight: 1.5, maxWidth: 260 }}>
                    Have a real conversation with our AI assistant. No signup required.
                  </p>
                )}

                {mode === 'active' && callSeconds > 0 && (
                  <div style={{
                    marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 14px', borderRadius: 99,
                    background: 'rgba(0,119,255,0.08)', border: '1px solid rgba(0,119,255,0.18)',
                  }}>
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: '#0077ff', fontWeight: 600 }}>
                      {formatTime(callSeconds)}
                    </span>
                  </div>
                )}

                {errorMsg && (
                  <p style={{ fontSize: 12, color: '#ff8a8a', margin: '6px 0 0' }}>{errorMsg}</p>
                )}
              </div>

              {/* Waveform */}
              {(mode === 'active' || mode === 'connecting') && (
                <Waveform active={speaking !== 'idle'} color="#0077ff" />
              )}

              {/* Connecting dots */}
              {mode === 'connecting' && <ConnectingDots />}

              {/* ─── Action Buttons ─── */}
              <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300 }}>
                {mode === 'idle' || mode === 'ended' || mode === 'error' ? (
                  <button
                    onClick={startCall}
                    style={{
                      flex: 1, padding: '14px 28px', borderRadius: 14,
                      border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #0077ff, #005fe6, #003fa3)',
                      backgroundSize: '200% 200%',
                      animation: 'borderFlow 4s ease infinite',
                      color: '#fff', fontSize: 14, fontWeight: 700,
                      boxShadow: '0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 0 rgba(0,20,50,.7), 0 0 40px rgba(0,119,255,.25)',
                      transition: 'all .2s cubic-bezier(.16,1,.3,1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,.10) inset, 0 10px 0 rgba(0,20,50,.6), 0 0 60px rgba(0,119,255,.40)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 0 rgba(0,20,50,.7), 0 0 40px rgba(0,119,255,.25)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0014 0" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                      <line x1="9" y1="22" x2="15" y2="22" />
                    </svg>
                    Start Call
                  </button>
                ) : (
                  <button
                    onClick={stopCall}
                    style={{
                      flex: 1, padding: '14px 28px', borderRadius: 14, cursor: 'pointer',
                      border: '1px solid rgba(255,87,87,0.25)',
                      background: 'rgba(255,87,87,0.08)',
                      color: '#ff5f57', fontSize: 14, fontWeight: 700,
                      transition: 'all .2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,87,87,0.14)';
                      e.currentTarget.style.borderColor = 'rgba(255,87,87,0.45)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,87,87,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255,87,87,0.25)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.68 13.31a16 16 0 000 1.79l-1.42-1.42a14 14 0 010-1.79z" />
                      <path d="M13.36 10.06a16 16 0 000-1.79l1.42 1.42a14 14 0 010 1.79z" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                    End Call
                  </button>
                )}
              </div>

              {/* Duration hint */}
              {mode === 'active' && (
                <p style={{
                  fontSize: 10, color: '#1e3a5f',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.06em', margin: 0,
                }}>
                  Max duration: 2 minutes
                </p>
              )}

              {/* ─── Post-call stats ─── */}
              {mode === 'ended' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { icon: '📞', label: 'Duration', value: formatTime(callSeconds) },
                      { icon: '🤖', label: 'Handled by', value: 'AI Agent' },
                      { icon: '✨', label: 'Quality', value: 'Natural' },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 12,
                        background: 'rgba(0,119,255,0.04)', border: '1px solid rgba(0,119,255,0.10)',
                      }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0077ff' }}>{stat.value}</div>
                        <div style={{ fontSize: 9, color: '#1e3a5f', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', marginTop: 2 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => window.location.href = '/register'}
                    style={{
                      width: '100%', padding: '13px 24px', borderRadius: 13, cursor: 'pointer',
                      border: '1px solid rgba(0,119,255,0.25)',
                      background: 'rgba(0,119,255,0.06)',
                      color: '#0099ff', fontSize: 13, fontWeight: 600,
                      transition: 'all .2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,119,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,119,255,0.40)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,119,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,119,255,0.25)'; }}
                  >
                    Create Your Own Agent
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Inline Keyframes ═══ */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes connectBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
