import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { GradientText, Reveal, MONO, SANS } from './design';
import { USPSlider } from './sections/USPSlider';

import type {
  IndustryId,
  TranscriptItem,
  DemoRecording,
  IndustryTab,
  USPItem,
} from './demoRecordingsData';

import {
  USP_SLIDES,
  SARVAM_VOICES,
  INDUSTRIES,
  DEMO_RECORDINGS,
} from './demoRecordingsData';

export type { IndustryId, TranscriptItem, DemoRecording, IndustryTab, USPItem };
export { USP_SLIDES, SARVAM_VOICES, INDUSTRIES, DEMO_RECORDINGS };

export function DemoRecordings() {
  const [activeTab, setActiveTab] = useState<IndustryId>('healthcare');
  const [selectedDemo, setSelectedDemo] = useState<DemoRecording>(DEMO_RECORDINGS['healthcare'][0]);
  const [selectedSarvamVoice, setSelectedSarvamVoice] = useState<string>('sarvam:bulbul:v3:shreya');
  const [selectedUserVoice, setSelectedUserVoice] = useState<string>('sarvam:bulbul:v3:shubh');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [activeTranscriptIdx, setActiveTranscriptIdx] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showWebCallModal, setShowWebCallModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [activePromptTab, setActivePromptTab] = useState<'prompt' | 'schema' | 'sarvam'>('prompt');
  const [activeUspIdx, setActiveUspIdx] = useState<number>(0);
  const [webCallStatus, setWebCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [webCallDuration, setWebCallDuration] = useState<number>(0);
  const [userQuery, setUserQuery] = useState<string>('');
  const [webCallMessages, setWebCallMessages] = useState<{ speaker: 'agent' | 'user'; text: string; time: string }[]>([]);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioFileRef = useRef<HTMLAudioElement | null>(null);
  const isAudioPlayingRef = useRef<boolean>(false);
  const pendingSpeakRef = useRef<{ idx: number } | null>(null);
  const audioStartedAtRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);
  const webCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTranscriptIdxRef = useRef<number>(0);
  const currentTimeMsRef = useRef<number>(0);

  const currentTab = useMemo(() => INDUSTRIES.find((tab) => tab.id === activeTab)!, [activeTab]);
  const demos = useMemo(() => DEMO_RECORDINGS[activeTab] || [], [activeTab]);

  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setActiveUspIdx((prev) => (prev + 1) % USP_SLIDES.length);
    }, 4500);
    return () => clearInterval(sliderInterval);
  }, []);

  const speakTurn = useCallback(async (item: TranscriptItem, agentVoiceId: string, userVoiceId: string = selectedUserVoice) => {
    let voiceIdToUse = item.speaker === 'user' ? userVoiceId : agentVoiceId;
    if (item.speaker === 'user' && !voiceIdToUse) {
      const isAgentFemale = ['shreya', 'ritu', 'priya', 'simran'].some((v) => agentVoiceId.toLowerCase().includes(v));
      voiceIdToUse = isAgentFemale ? 'sarvam:bulbul:v3:shubh' : 'sarvam:bulbul:v3:shreya';
    }

    if (isMuted) return;

    const text = item.text;
    const speakerName = (voiceIdToUse.split(':').pop() || 'shreya').toLowerCase();
    const sarvamApiKey = import.meta.env.VITE_SARVAM_API_KEY;

    if (audioFileRef.current) {
      audioFileRef.current.pause();
      audioFileRef.current = null;
    }
    isAudioPlayingRef.current = false;
    pendingSpeakRef.current = null;

    const wrapAndPlay = (src: string, revoke?: () => void) => {
      const audio = new Audio(src);
      isAudioPlayingRef.current = true;
      audioFileRef.current = audio;
      audio.playbackRate = playbackSpeed;
      audio.volume = 1.0;
      audio.onloadedmetadata = () => {
        audioStartedAtRef.current = Date.now();
      };
      audio.onended = () => {
        if (!isNaN(audio.duration)) {
          accumulatedMsRef.current += audio.duration * 1000 * playbackSpeed;
        }
        isAudioPlayingRef.current = false;
        audioFileRef.current = null;
        currentTimeMsRef.current = accumulatedMsRef.current;
        setCurrentTimeMs(accumulatedMsRef.current);
        if (revoke) revoke();
        if (pendingSpeakRef.current) {
          const next = pendingSpeakRef.current;
          pendingSpeakRef.current = null;
          const transcript = selectedDemo.transcript;
          if (transcript[next.idx] && transcript[next.idx].speaker !== 'system') {
            speakTurn(transcript[next.idx], selectedSarvamVoice, selectedUserVoice);
          }
        }
      };
      audio.play().catch(() => { isAudioPlayingRef.current = false; });
    };

    if (sarvamApiKey) {
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      try {
        const res = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-subscription-key': sarvamApiKey },
          body: JSON.stringify({
            text, model: 'bulbul:v3', speaker: speakerName,
            target_language_code: hasDevanagari ? 'hi-IN' : 'en-IN',
            speech_sample_rate: 22050, output_audio_codec: 'wav',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audios && data.audios[0]) {
            wrapAndPlay(`data:audio/wav;base64,${data.audios[0]}`);
            return;
          }
        }
      } catch {}
    }

    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    const ttsUrl = `/api/tts/speak?text=${encodeURIComponent(text)}&voiceId=${encodeURIComponent(voiceIdToUse)}&language=${hasDevanagari ? 'hi' : 'en'}`;
    try {
      const res = await fetch(ttsUrl);
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      wrapAndPlay(blobUrl, () => URL.revokeObjectURL(blobUrl));
    } catch (err) {
      console.error('[DemoRecordings] TTS playback failed:', err);
      isAudioPlayingRef.current = false;
    }
  }, [isMuted, playbackSpeed, selectedUserVoice, selectedDemo, selectedSarvamVoice]);

  const pausePlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioFileRef.current) {
      audioFileRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const stopPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioFileRef.current) {
      audioFileRef.current.pause();
      audioFileRef.current.currentTime = 0;
    }
    isAudioPlayingRef.current = false;
    pendingSpeakRef.current = null;
    audioStartedAtRef.current = 0;
    accumulatedMsRef.current = 0;
    setIsPlaying(false);
    currentTimeMsRef.current = 0;
    activeTranscriptIdxRef.current = 0;
    setCurrentTimeMs(0);
    setActiveTranscriptIdx(0);
  }, []);

  const handleTabChange = (id: IndustryId) => {
    setActiveTab(id);
    const newDemo = DEMO_RECORDINGS[id]?.[0];
    if (newDemo) {
      setSelectedDemo(newDemo);
      setSelectedSarvamVoice(newDemo.orchestration.sarvamVoiceId);
      stopPlayback();
    }
  };

  const handleSelectDemo = (demo: DemoRecording) => {
    setSelectedDemo(demo);
    setSelectedSarvamVoice(demo.orchestration.sarvamVoiceId);
    stopPlayback();
  };

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pausePlayback();
      return;
    }

    if (selectedDemo.audioUrl) {
      if (!audioFileRef.current || audioFileRef.current.src !== selectedDemo.audioUrl) {
        audioFileRef.current = new Audio(selectedDemo.audioUrl);
      }
      audioFileRef.current.playbackRate = playbackSpeed;
      audioFileRef.current.play().then(() => setIsPlaying(true)).catch(() => { });

      const interval = 100;
      timerRef.current = setInterval(() => {
        if (!audioFileRef.current) return;
        const elapsed = audioFileRef.current.currentTime * 1000;
        currentTimeMsRef.current = elapsed;
        setCurrentTimeMs(elapsed);

        if (audioFileRef.current.ended) {
          stopPlayback();
          return;
        }

        const transcript = selectedDemo.transcript;
        const currentIdx = transcript.findIndex((item, idx) => {
          const nextItem = transcript[idx + 1];
          if (!nextItem) return elapsed >= item.delayMs;
          return elapsed >= item.delayMs && elapsed < nextItem.delayMs;
        });

        if (currentIdx !== -1 && currentIdx !== activeTranscriptIdxRef.current) {
          activeTranscriptIdxRef.current = currentIdx;
          setActiveTranscriptIdx(currentIdx);
        }
      }, interval);

      return;
    }

    setIsPlaying(true);
    accumulatedMsRef.current = currentTimeMsRef.current;

    let elapsed = currentTimeMsRef.current;
    const transcript = selectedDemo.transcript;

    let startIdx = transcript.findIndex((item, idx) => {
      const nextItem = transcript[idx + 1];
      if (!nextItem) return elapsed >= item.delayMs;
      return elapsed >= item.delayMs && elapsed < nextItem.delayMs;
    });

    if (startIdx === -1) startIdx = 0;

    activeTranscriptIdxRef.current = startIdx;
    setActiveTranscriptIdx(startIdx);

    if (transcript[startIdx] && transcript[startIdx].speaker !== 'system') {
      speakTurn(transcript[startIdx], selectedSarvamVoice, selectedUserVoice);
    }

    const interval = 100;
    timerRef.current = setInterval(() => {
      if (isAudioPlayingRef.current && audioFileRef.current && !isNaN(audioFileRef.current.currentTime)) {
        elapsed = accumulatedMsRef.current + audioFileRef.current.currentTime * 1000 * playbackSpeed;
      } else {
        elapsed = accumulatedMsRef.current;
      }
      currentTimeMsRef.current = elapsed;
      setCurrentTimeMs(elapsed);

      if (elapsed >= selectedDemo.durationMs) {
        stopPlayback();
        return;
      }

      const currentIdx = transcript.findIndex((item, idx) => {
        const nextItem = transcript[idx + 1];
        if (!nextItem) return elapsed >= item.delayMs;
        return elapsed >= item.delayMs && elapsed < nextItem.delayMs;
      });

      if (currentIdx !== -1 && currentIdx !== activeTranscriptIdxRef.current) {
        activeTranscriptIdxRef.current = currentIdx;
        setActiveTranscriptIdx(currentIdx);
        if (transcript[currentIdx] && transcript[currentIdx].speaker !== 'system') {
          if (isAudioPlayingRef.current) {
            pendingSpeakRef.current = { idx: currentIdx };
          } else {
            speakTurn(transcript[currentIdx], selectedSarvamVoice, selectedUserVoice);
          }
        }
      }
    }, interval);
  }, [isPlaying, selectedDemo, selectedSarvamVoice, selectedUserVoice, playbackSpeed, speakTurn, pausePlayback, stopPlayback]);

  const startWebCall = () => {
    setShowWebCallModal(true);
    setWebCallStatus('connecting');
    setWebCallDuration(0);
    const greetingText = `Namaste! Thank you for calling ${selectedDemo.agentName}. How can I assist you with ${selectedDemo.title} today?`;
    setWebCallMessages([
      { speaker: 'agent', text: greetingText, time: '00:00' }
    ]);

    setTimeout(() => {
      setWebCallStatus('connected');
      speakTurn({ speaker: 'agent', text: greetingText, timestamp: '00:00', delayMs: 0, durationMs: 4000 }, selectedSarvamVoice, selectedUserVoice);
      webCallTimerRef.current = setInterval(() => {
        setWebCallDuration((prev) => prev + 1);
      }, 1000);
    }, 1200);
  };

  const handleSendWebCallMessage = (userText: string) => {
    if (!userText.trim()) return;
    const timeSecs = webCallDuration;
    const mins = Math.floor(timeSecs / 60);
    const secs = timeSecs % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const userMsg = { speaker: 'user' as const, text: userText, time: timeStr };
    setWebCallMessages((prev) => [...prev, userMsg]);
    speakTurn({ speaker: 'user', text: userText, timestamp: timeStr, delayMs: 0, durationMs: 3000 }, selectedSarvamVoice, selectedUserVoice);

    setTimeout(() => {
      let agentReply = `Got it! Autoniv Voice Engine has processed "${userText}" and updated your records. Is there anything else I can help you with?`;

      const lower = userText.toLowerCase();
      if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
        agentReply = `I have pre-checked slot availability and booked your appointment for tomorrow. A confirmation SMS with details has been sent!`;
      } else if (lower.includes('rate') || lower.includes('interest') || lower.includes('loan') || lower.includes('finance')) {
        agentReply = `Our loan interest rates currently start at 8.40% p.a. with instant pre-approval. Would you like me to share full plan details?`;
      } else if (lower.includes('order') || lower.includes('status') || lower.includes('where') || lower.includes('track')) {
        agentReply = `Your order #84920 has been dispatched via Express Delivery and is scheduled to arrive tomorrow by 4:00 PM.`;
      }

      const replyMins = Math.floor((timeSecs + 2) / 60);
      const replySecs = (timeSecs + 2) % 60;
      const replyTimeStr = `${replyMins}:${replySecs.toString().padStart(2, '0')}`;

      const agentMsg = { speaker: 'agent' as const, text: agentReply, time: replyTimeStr };
      setWebCallMessages((prev) => [...prev, agentMsg]);
      speakTurn({ speaker: 'agent', text: agentReply, timestamp: replyTimeStr, delayMs: 0, durationMs: 4000 }, selectedSarvamVoice, selectedUserVoice);
    }, 1400);
  };

  const endWebCall = () => {
    if (webCallTimerRef.current) clearInterval(webCallTimerRef.current);
    if (audioFileRef.current) audioFileRef.current.pause();
    setWebCallStatus('ended');
    setTimeout(() => {
      setShowWebCallModal(false);
      setWebCallStatus('idle');
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (webCallTimerRef.current) clearInterval(webCallTimerRef.current);
    };
  }, [stopPlayback]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeUsp = USP_SLIDES[activeUspIdx];

  const currentTurn = selectedDemo.transcript[activeTranscriptIdx] || selectedDemo.transcript[0];
  const isAgentSpeaking = isPlaying && currentTurn?.speaker === 'agent';
  const isCallerSpeaking = isPlaying && currentTurn?.speaker === 'user';

  return (
    <div className="m-body-pad" style={{ background: '#F8FAFC', color: '#0F172A', fontFamily: SANS, minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes studioPulse {
          0%, 100% { transform: scale(1); opacity: 0.95; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.06); opacity: 1; box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
        }
        @keyframes glowRing {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes pipelineSignal {
          0% { left: 0%; opacity: 0.2; }
          50% { opacity: 1; }
          100% { left: 100%; opacity: 0.2; }
        }
        @keyframes fadeHighlight {
          0% { box-shadow: 0 0 0 0 ${currentTab.accentColor}40; }
          100% { box-shadow: 0 0 0 0 ${currentTab.accentColor}00; }
        }
        .agent-card-hover { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .agent-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.1) !important; }
        .agent-card-hover:hover .agent-avatar-el { transform: scale(1.08); }
        .agent-card-hover:hover .agent-play-label { opacity: 1; }
        .agent-avatar-el { transition: transform 0.25s ease; }
        .agent-play-label { opacity: 0; transition: opacity 0.2s ease; }
        .tab-btn-hover { transition: all 0.2s ease; }
        .tab-btn-hover:hover { background: #F1F5F9 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 768px) {
          .m-hide { display: none !important; }
          .m-flex-col { flex-direction: column !important; }
          .m-grid-1 { grid-template-columns: 1fr !important; }
          .m-grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
          .m-text-center { text-align: center !important; }
          .m-px-16 { padding-left: 16px !important; padding-right: 16px !important; }
          .m-gap-12 { gap: 12px !important; }
          .m-p-12 { padding: 12px !important; }
          .m-full-modal { border-radius: 0 !important; max-width: 100% !important; width: 100% !important; max-height: 100vh !important; height: 100vh !important; }
          .m-scroll-x { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .m-pipeline-scroll { flex-wrap: nowrap !important; justify-content: flex-start !important; padding-bottom: 8px; }
          .m-workforce-scroll { grid-template-columns: repeat(6, 130px) !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .m-bottom-ctrl { display: flex !important; }
          .m-hero-stat { flex-direction: row !important; flex-wrap: nowrap !important; gap: 8px !important; justify-content: center !important; }
        }
        @media (min-width: 769px) {
          .m-bottom-ctrl { display: none !important; }
        }
      `}</style>

      <USPSlider />
      <PublicNavbar />


      {/* ── 2. COMPACT HERO ── */}
      <section className='mt-30' style={{ padding: '32px 16px 24px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 800, color: currentTab.accentColor, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, marginBottom: 8 }}>
              AUTONIV VOICE INTELLIGENCE
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.12, marginBottom: 8 }}>
              AI agents that actually talk to your <GradientText>customers</GradientText>.
            </h1>
          </Reveal>

          <Reveal delay={130}>
            <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1.05rem)', color: '#64748B', lineHeight: 1.5, maxWidth: 640, margin: '0 auto 18px' }}>
              Build, deploy and monitor production-grade voice agents capable of understanding customers, calling tools, and completing real-world tasks.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="m-hero-stat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'nowrap', overflowX: 'auto', padding: '4px 0' }}>
              {[
                { value: '340ms', label: 'Latency' },
                { value: '20+', label: 'Languages' },
                { value: '24/7', label: 'Availability' },
                { value: '99.9%', label: 'Uptime', color: '#059669' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {i > 0 && <span style={{ width: 1, height: 14, background: '#CBD5E1', flexShrink: 0, marginRight: 6 }} />}
                  <span style={{ fontSize: 'clamp(12px, 3.2vw, 18px)', fontWeight: 900, color: s.color || '#0F172A', fontFamily: MONO, whiteSpace: 'nowrap' }}>{s.value}</span>
                  <span style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 3–6. MAIN PRODUCT AREA ── */}
      <section id="demo-workstation" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Live Platform Capability Pill */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: activeUsp.accentColor, fontFamily: MONO, flexWrap: 'wrap' }}>
          <span>{activeUsp.icon}</span>
          <span>{activeUsp.badge}:</span>
          <span style={{ color: '#0F172A' }}>{activeUsp.title}</span>
          <span style={{ background: `${activeUsp.accentColor}15`, color: activeUsp.accentColor, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{activeUsp.stat} {activeUsp.statLabel}</span>
        </div>

        {/* 3. INDUSTRY SWITCHER */}
        <div style={{ marginBottom: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 4, display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {INDUSTRIES.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="tab-btn-hover"
                style={{
                  flex: '1 1 0px',
                  minWidth: 130,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  background: isActive ? `${tab.accentColor}10` : 'transparent',
                  border: 'none',
                  borderTop: isActive ? `3px solid ${tab.accentColor}` : '3px solid transparent',
                  color: isActive ? '#0F172A' : '#94A3B8',
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. PERFORMANCE STRIP */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 24px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {currentTab.metrics.map((m, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: i === 0 ? currentTab.accentColor : '#0F172A', fontFamily: MONO, display: 'block', lineHeight: 1 }}>{m.value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', fontFamily: MONO, letterSpacing: '0.04em' }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Demo scenario selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {demos.map((demo) => {
            const isSelected = selectedDemo.id === demo.id;
            const hasVideo = !!demo.videoUrl;
            return (
              <button
                key={demo.id}
                onClick={() => handleSelectDemo(demo)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: isSelected ? '#FFFFFF' : '#F8FAFC',
                  border: isSelected ? `2px solid ${currentTab.accentColor}` : '1px solid #E2E8F0',
                  color: isSelected ? '#0F172A' : '#94A3B8',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <span>{demo.agentAvatar}</span>
                <span>{demo.title}</span>
                {hasVideo && (
                  <span style={{ fontSize: 9, fontWeight: 800, background: '#EFF6FF', color: '#2563EB', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', border: '1px solid #BFDBFE' }}>
                    📹 VIDEO
                  </span>
                )}
                <span style={{ fontSize: 10, opacity: 0.7, fontFamily: MONO }}>({demo.duration})</span>
              </button>
            );
          })}
        </div>

        {/* 5. MAIN PRODUCT PANEL — TWO COLUMNS */}
        <div className="m-grid-1" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT: AGENT PANEL */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar + Name + LIVE badge */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `${currentTab.accentColor}15`,
                  border: `2px solid ${currentTab.accentColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 38,
                  margin: '0 auto 12px',
                  position: 'relative',
                  animation: isAgentSpeaking ? 'studioPulse 1.5s infinite' : 'none',
                }}
              >
                {selectedDemo.agentAvatar}
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {selectedDemo.agentName}
              </h2>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 10 }}>
                {selectedDemo.subtitle}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#047857', fontFamily: MONO }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'glowRing 1.5s infinite' }} />
                LIVE DEMO
              </div>
            </div>

            {/* Spec list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Agent Voice</span>
                <select
                  value={selectedSarvamVoice}
                  onChange={(e) => setSelectedSarvamVoice(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, fontFamily: MONO, color: '#0F172A', background: '#F8FAFC', outline: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  {SARVAM_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Caller Voice</span>
                <select
                  value={selectedUserVoice}
                  onChange={(e) => setSelectedUserVoice(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, fontFamily: MONO, color: '#0F172A', background: '#F8FAFC', outline: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  {SARVAM_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Voice', value: selectedDemo.orchestration.sarvamVoiceLabel },
                { label: 'Languages', value: selectedDemo.languages.join(' · ') },
                { label: 'Latency', value: selectedDemo.orchestration.totalLatency, color: '#059669' },
                { label: 'Model', value: selectedDemo.orchestration.llmEngine, color: '#2563EB' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: row.color || '#0F172A', fontWeight: 700, fontFamily: MONO, fontSize: 11, textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Play button + status */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <button
                onClick={togglePlayPause}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isPlaying ? '#EF4444' : currentTab.accentColor,
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  margin: '0 auto 8px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${currentTab.accentColor}35`,
                  transition: 'transform 0.15s ease',
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div style={{ fontSize: 11, fontWeight: 700, color: isPlaying ? '#059669' : '#94A3B8', fontFamily: MONO, textTransform: 'uppercase' }}>
                {isAgentSpeaking ? `● ${selectedDemo.agentName.split(' ')[0]} speaking` : isCallerSpeaking ? '● Caller speaking' : isPlaying ? '● Playing' : 'Click ▶ to start'}
              </div>
            </div>

            <button
              onClick={() => setShowPromptModal(true)}
              style={{ width: '100%', padding: '8px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: MONO }}
            >
              Inspect System Prompt & Tools
            </button>
          </div>

          {/* RIGHT: LIVE CONVERSATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedDemo.videoUrl && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '10px 16px', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎬 SCREEN RECORDING DEMO
                  </span>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: MONO, background: '#1E293B', padding: '2px 8px', borderRadius: 4 }}>{selectedDemo.duration}</span>
                </div>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', display: 'block', maxHeight: 440, background: '#000' }}
                >
                  <source src={selectedDemo.videoUrl} type="video/mp4" />
                  <source src="/Screen Recording 2026-08-06 213415.mp4" type="video/mp4" />
                  Your browser does not support HTML5 video player.
                </video>
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', letterSpacing: '0.04em', fontFamily: MONO }}>LIVE CONVERSATION</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#047857', fontFamily: MONO }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                  CONNECTED
                </div>
              </div>

              {/* Transcript blocks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 360, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
                {selectedDemo.transcript.map((item, idx) => {
                  const isSystem = item.speaker === 'system';
                  const isAgent = item.speaker === 'agent';
                  const isActiveTurn = activeTranscriptIdx === idx && isPlaying;

                  if (isSystem) return null;

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.timestamp} · {isAgent ? 'DR. SARAH' : 'CALLER'}
                      </div>

                      <div
                        style={{
                          background: isActiveTurn ? `${currentTab.accentColor}08` : isAgent ? '#F8FAFC' : '#FFFFFF',
                          border: isActiveTurn ? `2px solid ${currentTab.accentColor}` : isAgent ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: '#0F172A',
                          boxShadow: isActiveTurn ? `0 2px 8px ${currentTab.accentColor}15` : 'none',
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {item.text}
                      </div>

                      {item.toolCall && (
                        <div style={{ marginTop: 4, background: '#0B0F1A', border: '1px solid #1E293B', borderRadius: 10, padding: 12, color: '#E2E8F0', fontFamily: MONO, fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: '#38BDF8', fontWeight: 800 }}>AI ACTION: {item.toolCall.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9 }}>
                              <span style={{ color: '#64748B' }}>Calling</span>
                              <span style={{ color: '#64748B' }}>→</span>
                              <span style={{ color: '#64748B' }}>Processing</span>
                              <span style={{ color: '#10B981' }}>→</span>
                              <span style={{ color: '#10B981', background: '#064E3B', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>Completed ✓</span>
                              <span style={{ color: '#38BDF8', background: '#0C4A6E', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>142ms</span>
                            </div>
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: 10, marginBottom: 6 }}>args: {item.toolCall.args}</div>
                          <div style={{ color: '#4ADE80', fontWeight: 700, borderTop: '1px solid #1E293B', paddingTop: 6 }}>
                            ✓ RESULT: {item.toolCall.result}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Waveform */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isPlaying ? '#059669' : '#94A3B8', fontFamily: MONO, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {isAgentSpeaking ? `● ${selectedDemo.agentName.split(' ')[0]} is speaking` : isCallerSpeaking ? '● Caller is speaking' : '● Standby'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, height: 24, justifyContent: 'flex-end' }}>
                  {Array.from({ length: 28 }).map((_, i) => {
                    const seed = Math.sin(i * 1.5 + (isPlaying ? currentTimeMs * 0.015 : 0));
                    const barHeight = isPlaying ? 6 + Math.abs(seed) * 18 : 4;
                    return (
                      <div
                        key={i}
                        style={{
                          width: 3,
                          height: `${barHeight}px`,
                          borderRadius: 1.5,
                          background: isPlaying ? currentTab.accentColor : '#E2E8F0',
                          transition: 'height 0.1s ease',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Scrubber + Controls */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontFamily: MONO, marginBottom: 6 }}>
                  <span>{formatTime(currentTimeMs)}</span>
                  <span>{selectedDemo.duration}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={selectedDemo.durationMs}
                  value={currentTimeMs}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    currentTimeMsRef.current = newTime;
                    setCurrentTimeMs(newTime);
                  }}
                  style={{ width: '100%', accentColor: currentTab.accentColor, cursor: 'pointer', marginBottom: 10 }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={togglePlayPause} style={{ width: 30, height: 30, borderRadius: 6, background: '#0F172A', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={stopPlayback} style={{ width: 30, height: 30, borderRadius: 6, background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14 }}>
                      ↻
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.25 : 1)} style={{ padding: '3px 8px', borderRadius: 5, background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, fontFamily: MONO, cursor: 'pointer' }}>
                      {playbackSpeed}×
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} style={{ padding: '3px 8px', borderRadius: 5, background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: 11, cursor: 'pointer' }}>
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. EXTRACTED INTELLIGENCE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: 12 }}>
                Extracted Intelligence
              </h3>

              <div className="m-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {selectedDemo.extractedEntities.map((ent, idx) => {
                  const isHighlighted = isPlaying && currentTurn?.highlightKey && (
                    ent.label.toLowerCase().includes(currentTurn.highlightKey.toLowerCase()) ||
                    ent.value.toLowerCase().includes(currentTurn.highlightKey.toLowerCase())
                  );
                  return (
                    <div
                      key={idx}
                      style={{
                        background: isHighlighted ? `${currentTab.accentColor}15` : '#F8FAFC',
                        border: isHighlighted ? `2px solid ${currentTab.accentColor}` : '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: 10,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ fontSize: 9, color: isHighlighted ? currentTab.accentColor : '#94A3B8', fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ent.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isHighlighted ? '#0F172A' : '#2563EB', marginTop: 3, fontFamily: MONO }}>{ent.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. VOICE PIPELINE ── */}
      <section id="pipeline" style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: currentTab.accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
            SYSTEM ARCHITECTURE
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 28 }}>
            How the conversation happens
          </h2>

          <div className="m-pipeline-scroll m-scroll-x" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', position: 'relative', paddingBottom: 8 }}>
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 100,
                  background: `linear-gradient(90deg, transparent, ${currentTab.accentColor}30, transparent)`,
                  pointerEvents: 'none',
                  animation: 'pipelineSignal 2.5s infinite linear',
                }}
              />
            )}

            {[
              { title: 'CALLER', sub: 'Input Stream', latency: '0ms' },
              { title: 'AUTONIV STT', sub: 'Vernacular Speech', latency: selectedDemo.orchestration.sttLatency },
              { title: 'LLM BRAIN', sub: selectedDemo.orchestration.llmEngine, latency: selectedDemo.orchestration.llmLatency },
              { title: 'TOOL ORCHESTRATION', sub: 'CRM & Calendar', latency: '15ms' },
              { title: 'AUTONIV TTS', sub: 'Neural Voice', latency: selectedDemo.orchestration.ttsLatency },
              { title: 'CALLER', sub: 'Output Audio', latency: selectedDemo.orchestration.totalLatency },
            ].map((node, idx, arr) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', minWidth: 140, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#0F172A', fontFamily: MONO }}>{node.title}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', margin: '3px 0 5px' }}>{node.sub}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 3, fontFamily: MONO, display: 'inline-block' }}>
                    {node.latency}
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ color: currentTab.accentColor, fontWeight: 900, fontSize: 16 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. WHY AUTONIV ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
            ENTERPRISE ADVANTAGE
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
            Why top enterprises choose Autoniv
          </h2>
        </div>

        <div className="m-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🇮🇳', title: 'Vernacular AI', desc: 'Native mastery across 10+ Indian regional languages and accents.', metric: '10+ Languages', color: '#10B981' },
            { icon: '⚡', title: 'Ultra-Low Latency', desc: 'Conversations delivered in sub-340ms for human-like speech flow.', metric: '340ms Latency', color: '#2563EB' },
            { icon: '🛠', title: 'Tool Orchestration', desc: 'AI agents that query databases, book slots, and send WhatsApp SMS.', metric: '100% Automated', color: '#7C3AED' },
            { icon: '🎙', title: 'Natural Voices', desc: 'High-fidelity neural voice models tailored for Indian enterprise telephony.', metric: '8+ Voice Models', color: '#DB2777' },
            { icon: '🔒', title: 'Enterprise Security', desc: 'SOC-2 compliant end-to-end encryption with guaranteed uptime SLA.', metric: '99.9% Uptime', color: '#059669' },
            { icon: '💰', title: 'Lower Costs', desc: 'Drastically reduce contact center overhead with zero human delays.', metric: '90% Cost Savings', color: '#D97706' },
          ].map((card, idx) => (
            <div key={idx} className="agent-card-hover" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 22, borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 14 }}>{card.desc}</p>
              <div style={{ fontSize: 14, fontWeight: 900, color: card.color, fontFamily: MONO }}>{card.metric}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8.5 PLATFORM VIDEO RECORDING WALKTHROUGH ── */}
      <section style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '48px 16px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', padding: '4px 12px', borderRadius: 99, border: '1px solid #BFDBFE' }}>
              🎬 PLATFORM VIDEO RECORDING
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>
              Autoniv AI Platform in Action
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 600, margin: '8px auto 0' }}>
              Watch the video recording demonstrating real-time voice orchestration, latency tracking, and zero-code agent workflows.
            </p>
          </div>

          <div style={{ background: '#0F172A', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 32px rgba(15,23,42,0.15)', border: '1px solid #1E293B' }}>
            <div style={{ padding: '12px 20px', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', fontFamily: MONO, marginLeft: 8 }}>Screen Recording 2026-08-06</span>
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: MONO, background: '#0F172A', padding: '3px 10px', borderRadius: 6 }}>HD 1080p · 03:00</span>
            </div>

            <video
              controls
              playsInline
              preload="metadata"
              style={{ width: '100%', display: 'block', maxHeight: 560, background: '#000' }}
            >
              <source src="https://res.cloudinary.com/nbxnvgwr/video/upload/v1786287172/autoniv/demos/screen-recording-demo.mp4" type="video/mp4" />
              <source src="/Screen Recording 2026-08-06 213415.mp4" type="video/mp4" />
              Your browser does not support HTML5 video player.
            </video>
          </div>
        </div>
      </section>

      {/* ── 9. MEET YOUR AI WORKFORCE ── */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '48px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
              PRODUCTION AGENTS
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
              Meet your AI workforce
            </h2>
          </div>

          <div className="m-workforce-scroll m-scroll-x" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { name: 'Dr. Sarah', industry: 'Healthcare', icon: '🩺', voice: 'Shreya', duration: '00:48', tab: 'healthcare' as const },
              { name: 'Aditya', industry: 'Real Estate', icon: '🏠', voice: 'Aditya', duration: '00:54', tab: 'realestate' as const },
              { name: 'Shubh', industry: 'Finance', icon: '🏦', voice: 'Shubh', duration: '00:48', tab: 'finance' as const },
              { name: 'Simran', industry: 'E-Commerce', icon: '🛒', voice: 'Simran', duration: '00:45', tab: 'ecommerce' as const },
              { name: 'Rahul', industry: 'Education', icon: '🎓', voice: 'Rahul', duration: '00:50', tab: 'education' as const },
              { name: 'Priya', industry: 'Travel', icon: '🏨', voice: 'Priya', duration: '00:46', tab: 'travel' as const },
            ].map((agent, idx) => (
              <div
                key={idx}
                onClick={() => handleTabChange(agent.tab)}
                className="agent-card-hover"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer' }}
              >
                <div className="agent-avatar-el" style={{ fontSize: 32, marginBottom: 6 }}>{agent.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{agent.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '2px 0 8px' }}>{agent.industry}</div>
                <div className="agent-play-label" style={{ fontSize: 10, color: INDUSTRIES.find(t => t.id === agent.tab)?.accentColor || '#2563EB', fontWeight: 700, fontFamily: MONO }}>Play conversation →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. DEVELOPER MODE ── */}
      <section id="developer-mode" style={{ background: '#0B0F1A', color: '#E2E8F0', padding: '48px 16px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
              DEVELOPER EXPERIENCE
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
              Built for developers. Ready for production.
            </h2>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0B0F1A', padding: '10px 16px', borderBottom: '1px solid #1F2937' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['prompt', 'schema', 'sarvam'] as const).map((tabKey) => (
                  <button
                    key={tabKey}
                    onClick={() => setActivePromptTab(tabKey)}
                    style={{
                      background: activePromptTab === tabKey ? '#1F2937' : 'transparent',
                      color: activePromptTab === tabKey ? '#38BDF8' : '#64748B',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: MONO,
                      cursor: 'pointer',
                    }}
                  >
                    {tabKey === 'prompt' ? 'System Prompt' : tabKey === 'schema' ? 'Tools JSON' : 'Voice Pipeline'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    const textToCopy = activePromptTab === 'prompt' ? selectedDemo.systemPrompt : activePromptTab === 'schema' ? selectedDemo.toolSchema : `// Autoniv Neural Voice Pipeline Config\n{\n  "voiceModel": "${selectedDemo.orchestration.sarvamVoiceId}",\n  "sttEngine": "${selectedDemo.orchestration.sttEngine}",\n  "llmEngine": "${selectedDemo.orchestration.llmEngine}",\n  "targetLatency": "${selectedDemo.orchestration.totalLatency}",\n  "sampleRate": 22050\n}`;
                    navigator.clipboard.writeText(textToCopy);
                    alert("Copied to clipboard ✓");
                  }}
                  style={{ background: '#1F2937', border: 'none', color: '#E2E8F0', padding: '4px 10px', borderRadius: 5, fontSize: 10, fontFamily: MONO, cursor: 'pointer', fontWeight: 700 }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowPromptModal(true)}
                  style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '4px 10px', borderRadius: 5, fontSize: 10, fontFamily: MONO, cursor: 'pointer', fontWeight: 700 }}
                >
                  Expand
                </button>
              </div>
            </div>

            <div style={{ padding: 20, fontFamily: MONO, fontSize: 12, color: '#D1D5DB', lineHeight: 1.7, maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {activePromptTab === 'prompt' && selectedDemo.systemPrompt}
              {activePromptTab === 'schema' && selectedDemo.toolSchema}
              {activePromptTab === 'sarvam' && `// Autoniv Neural Voice Pipeline Config
{
  "voiceModel": "${selectedDemo.orchestration.sarvamVoiceId}",
  "sttEngine": "${selectedDemo.orchestration.sttEngine}",
  "llmEngine": "${selectedDemo.orchestration.llmEngine}",
  "targetLatency": "${selectedDemo.orchestration.totalLatency}",
  "sampleRate": 22050
}`}
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. LIVE CALL CTA ── */}
      <section style={{ background: '#0B0F1A', color: '#FFFFFF', padding: '56px 16px', textAlign: 'center', borderTop: '1px solid #1F2937', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i / 40) * 100}%`,
                top: '50%',
                width: 3,
                height: `${12 + Math.sin(i * 0.8) * 8}px`,
                background: currentTab.accentColor,
                borderRadius: 1.5,
                transform: 'translateY(-50%)',
              }}
            />
          ))}
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Don't just listen. Talk to an AI agent.
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28 }}>
            Experience Autoniv's conversational intelligence yourself.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={startWebCall}
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${currentTab.accentColor}, ${currentTab.accentColor}DD)`,
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                boxShadow: `0 4px 20px ${currentTab.accentColor}40`,
              }}
            >
              🎙 Start a Live Conversation
            </button>
            <Link
              to="/register"
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                background: '#1F2937',
                border: '1px solid #374151',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Build Your Own Agent →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MODALS ── */}

      {/* Web Call Modal */}
      {showWebCallModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(16px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: window.innerWidth <= 768 ? 0 : 24 }}>
          <div className={window.innerWidth <= 768 ? 'm-full-modal' : ''} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 20, padding: window.innerWidth <= 768 ? 20 : 28, maxWidth: 520, width: '100%', boxShadow: '0 25px 70px -15px rgba(0,0,0,0.3)', position: 'relative', maxHeight: window.innerWidth <= 768 ? '100vh' : '90vh', overflowY: 'auto' }}>
            <button
              onClick={endWebCall}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '50%', width: 30, height: 30, color: '#64748B', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${currentTab.accentColor}, ${currentTab.accentColor}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', boxShadow: `0 0 30px ${currentTab.accentColor}40`, animation: webCallStatus === 'connected' ? 'studioPulse 2s infinite' : 'none' }}>
                🎙️
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                {selectedDemo.agentName}
              </h3>
              <div style={{ fontSize: 11, color: '#059669', fontFamily: MONO, fontWeight: 700, marginBottom: 6 }}>
                Autoniv Voice Stream • {selectedDemo.title}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: webCallStatus === 'connected' ? '#ECFDF5' : '#FEF3C7', border: webCallStatus === 'connected' ? '1px solid #A7F3D0' : '1px solid #FDE68A', borderRadius: 99, fontSize: 11, fontWeight: 700, color: webCallStatus === 'connected' ? '#047857' : '#D97706', fontFamily: MONO }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: webCallStatus === 'connected' ? '#10B981' : '#F59E0B', animation: webCallStatus === 'connected' ? 'glowRing 1.5s infinite' : 'none' }} />
                <span>{webCallStatus === 'connecting' ? 'Connecting...' : webCallStatus === 'connected' ? `Active • ${formatTime(webCallDuration * 1000)}` : 'Ended'}</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, height: 200, overflowY: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {webCallMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.speaker === 'agent' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: msg.speaker === 'agent' ? '#FFFFFF' : '#EFF6FF',
                    border: msg.speaker === 'agent' ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                    borderRadius: msg.speaker === 'agent' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                    padding: '8px 12px',
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: msg.speaker === 'agent' ? '#0F172A' : '#1E40AF',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: MONO, marginBottom: 2 }}>
                    {msg.speaker === 'agent' ? `🤖 ${selectedDemo.agentName}` : '👤 You'} • {msg.time}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', fontFamily: MONO, textTransform: 'uppercase', marginBottom: 6, textAlign: 'left' }}>
                Quick Replies:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  "Book appointment for tomorrow 3 PM",
                  "What are your interest rates?",
                  "Track my order #84920",
                ].map((sampleText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendWebCallMessage(sampleText)}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1E40AF',
                      borderRadius: 99,
                      padding: '5px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    "{sampleText}"
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!userQuery.trim()) return;
                const txt = userQuery;
                setUserQuery('');
                handleSendWebCallMessage(txt);
              }}
              style={{ display: 'flex', gap: 6, marginBottom: 14 }}
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  color: '#0F172A',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${currentTab.accentColor}, ${currentTab.accentColor}CC)`,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Send 🗣️
              </button>
            </form>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsMicMuted(!isMicMuted)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {isMicMuted ? '🔇 Mic Muted' : '🎙️ Mic Active'}
              </button>

              <button
                type="button"
                onClick={endWebCall}
                style={{ flex: 2, padding: '10px', borderRadius: 10, background: '#EF4444', color: '#FFFFFF', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                🔴 End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Inspector Modal */}
      {showPromptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: window.innerWidth <= 768 ? 0 : 24 }}>
          <div className={window.innerWidth <= 768 ? 'm-full-modal' : ''} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 20, padding: window.innerWidth <= 768 ? 16 : 32, maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px -15px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => setShowPromptModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '50%', width: 32, height: 32, color: '#475569', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <span style={{ fontSize: 36, background: '#F1F5F9', padding: 10, borderRadius: 14 }}>{selectedDemo.agentAvatar}</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{selectedDemo.agentName}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700, border: '1px solid #A7F3D0' }}>
                    🇮🇳 {selectedDemo.orchestration.sarvamVoiceLabel}
                  </span>
                  <span style={{ fontSize: 11, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700, border: '1px solid #BFDBFE' }}>
                    🧠 {selectedDemo.orchestration.llmEngine}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
              <button
                onClick={() => setActivePromptTab('prompt')}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activePromptTab === 'prompt' ? '2px solid #2563EB' : '1px solid #E2E8F0', background: activePromptTab === 'prompt' ? '#EFF6FF' : '#F8FAFC', color: activePromptTab === 'prompt' ? '#1E40AF' : '#64748B' }}
              >
                📜 System Prompt ({selectedDemo.systemPrompt.length} chars)
              </button>

              <button
                onClick={() => setActivePromptTab('schema')}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activePromptTab === 'schema' ? '2px solid #10B981' : '1px solid #E2E8F0', background: activePromptTab === 'schema' ? '#ECFDF5' : '#F8FAFC', color: activePromptTab === 'schema' ? '#047857' : '#64748B' }}
              >
                🔧 Tools JSON
              </button>

              <button
                onClick={() => setActivePromptTab('sarvam')}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activePromptTab === 'sarvam' ? '2px solid #7C3AED' : '1px solid #E2E8F0', background: activePromptTab === 'sarvam' ? '#F5F3FF' : '#F8FAFC', color: activePromptTab === 'sarvam' ? '#6D28D9' : '#64748B' }}
              >
                🎙️ Voice Config
              </button>
            </div>

            {activePromptTab === 'prompt' && (
              <div style={{ background: '#0B0F1A', border: '1px solid #1F2937', borderRadius: 12, padding: 20, fontFamily: MONO, fontSize: 12, color: '#D1D5DB', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20, overflowX: 'auto' }}>
                {selectedDemo.systemPrompt}
              </div>
            )}

            {activePromptTab === 'schema' && (
              <div style={{ background: '#022C22', border: '1px solid #065F46', borderRadius: 12, padding: 20, fontFamily: MONO, fontSize: 12, color: '#A7F3D0', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20, overflowX: 'auto' }}>
                {selectedDemo.toolSchema}
              </div>
            )}

            {activePromptTab === 'sarvam' && (
              <div style={{ background: '#1E1B4B', border: '1px solid #4338CA', borderRadius: 12, padding: 20, color: '#DDD6FE', marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 14 }}>🇮🇳 Autoniv Neural Voice Pipeline</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontFamily: MONO, fontSize: 12 }}>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>VOICE MODEL</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>{selectedDemo.orchestration.sarvamVoiceId}</div>
                  </div>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>TTS ENDPOINT</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>api.sarvam.ai/tts</div>
                  </div>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>SAMPLE RATE</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>22,050 Hz</div>
                  </div>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>LATENCY</div>
                    <div style={{ color: '#10B981', fontWeight: 700, marginTop: 3 }}>{selectedDemo.orchestration.totalLatency}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPromptModal(false)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#0F172A', color: '#ffffff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY AUDIO CONTROLLER ── */}
      <div className="m-bottom-ctrl" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E2E8F0', padding: '8px 12px', display: 'none', alignItems: 'center', gap: 8 }}>
        <button onClick={togglePlayPause} style={{ width: 36, height: 36, borderRadius: '50%', background: isPlaying ? '#EF4444' : currentTab.accentColor, color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={stopPlayback} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ↻
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8', fontFamily: MONO }}>
            <span>{formatTime(currentTimeMs)}</span>
            <span>{selectedDemo.duration}</span>
          </div>
          <input
            type="range"
            min={0}
            max={selectedDemo.durationMs}
            value={currentTimeMs}
            onChange={(e) => {
              const newTime = Number(e.target.value);
              currentTimeMsRef.current = newTime;
              setCurrentTimeMs(newTime);
            }}
            style={{ width: '100%', accentColor: currentTab.accentColor, cursor: 'pointer', height: 4 }}
          />
        </div>
        <button onClick={() => setIsMuted(!isMuted)} style={{ width: 32, height: 32, borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default DemoRecordings;
