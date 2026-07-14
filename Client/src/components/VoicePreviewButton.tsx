import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ttsService } from '../services/api';

const LANGUAGE_SAMPLES: Record<string, string> = {
  en: "Hello, this is your AI voice agent speaking. How can I help you today?",
  es: "Hola, soy tu asistente de voz con inteligencia artificial. ¿Cómo puedo ayudarte hoy?",
  fr: "Bonjour, je suis votre assistant vocal IA. Comment puis-je vous aider aujourd'hui ?",
  de: "Hallo, ich bin Ihr KI-Sprachassistent. Wie kann ich Ihnen heute helfen?",
  it: "Ciao, sono il tuo assistente vocale AI. Come posso aiutarti oggi?",
  pt: "Olá, sou seu assistente de voz IA. Como posso ajudá-lo hoje?",
  pl: "Cześć, jestem twoim asystentem głosowym AI. Jak mogę ci dzisiaj pomóc?",
  hi: "नमस्ते, मैं आपका AI वॉइस असिस्टेंट हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
  ar: "مرحبًا، أنا مساعد الصوت الذكي الخاص بك. كيف يمكنني مساعدتك اليوم? ",
  ja: "こんにちは、私はあなたのAI音声アシスタントです。今日はどのようにお手伝いできますか？",
  ko: "안녕하세요, 저는 당신의 AI 음성 어시스턴트입니다. 오늘 어떻게 도와드릴까요？",
  zh: "你好，我是你的AI语音助手。今天我能怎么帮助你？",
  nl: "Hallo, ik ben uw AI-stemassistent. Hoe kan ik u vandaag helpen？",
  ru: "Здравствуйте, я ваш голосовой помощник на базе ИИ. Чем я могу помочь вам сегодня？",
  tr: "Merhaba, ben sizin AI ses asistanınız. Bugün size nasıl yardımcı olabilirim？",
};

type PreviewMode = 'idle' | 'connecting' | 'active';

interface VoicePreviewButtonProps {
  voiceId: string;
  language: string;
  prompt?: string;
}

export function VoicePreviewButton({ voiceId, language, prompt }: VoicePreviewButtonProps) {
  const [mode, setMode] = useState<PreviewMode>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopCall = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setMode('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startCall = useCallback(async () => {
    if (mode !== 'idle') {
      stopCall();
      return;
    }

    setMode('connecting');

    try {
      // Keep it short (max 100 chars) so synthesis is fast and instant
      const rawFirstMessage = (prompt && prompt.trim().length > 0)
        ? prompt.trim().slice(0, 100)
        : (LANGUAGE_SAMPLES[language] || LANGUAGE_SAMPLES.en);

      const response = await ttsService.preview(voiceId, language, rawFirstMessage);
      
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setMode('active');

      audio.onended = () => {
        setMode('idle');
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.onerror = () => {
        setMode('idle');
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('[VoicePreview] Failed to play preview:', err);
      setMode('idle');
    }
  }, [voiceId, language, prompt, mode, stopCall]);

  const isLoading = mode === 'connecting';
  const isActive = mode === 'active';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isActive || isLoading ? stopCall : startCall}
        title={
          isActive ? 'Stop preview' :
          isLoading ? 'Connecting…' :
          'Preview voice instantly'
        }
        className={`p-2 rounded-xl border transition-all flex-shrink-0 relative ${
          isLoading
            ? 'bg-[var(--surface)] border-white/8 text-[var(--text-secondary)] cursor-wait'
            : isActive
            ? 'bg-[var(--primary-soft)]/10 border-[var(--border)] text-[var(--primary)] hover:bg-[var(--primary-soft)]/20'
            : 'bg-[var(--surface)] border-white/8 text-[var(--text-secondary)] hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30'
        }`}
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        ) : isActive ? (
          <div className="flex items-center gap-[2px] h-4 w-4 justify-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-[2.5px] bg-[var(--primary)] rounded-full"
                initial={{ height: 4 }}
                animate={{ height: [4, 14, 4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.12,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
    </div>
  );
}