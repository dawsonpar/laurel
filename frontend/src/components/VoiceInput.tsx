"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionInstance = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const start = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new (SR as new () => SpeechRecognitionInstance)();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: {
      results: { 0: { 0: { transcript: string } } };
    }) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      title={listening ? "Listening, tap to stop" : "Speak your question"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50 ${
        listening
          ? "bg-gold text-cream"
          : "text-muted hover:bg-cream hover:text-laurel"
      }`}
      aria-pressed={listening}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      style={
        listening
          ? { animation: "laurel-breathe 1.6s ease-in-out infinite" }
          : undefined
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
        <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z" />
      </svg>
    </button>
  );
}
