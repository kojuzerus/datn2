"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook bọc Web Speech API (SpeechRecognition) của trình duyệt.
 *
 * Lưu ý:
 * - Chỉ chạy trên HTTPS hoặc http://localhost.
 * - Hỗ trợ tốt: Chrome, Edge, Cốc Cốc, Safari (macOS/iOS 14.5+). Firefox chưa hỗ trợ.
 * - Trình duyệt sẽ hỏi quyền micro ở lần đầu.
 */

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
};

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type UseSpeechRecognitionOptions = {
  /** Mã ngôn ngữ, mặc định tiếng Việt. Ví dụ: "vi-VN", "en-US" */
  lang?: string;
  /** Nghe liên tục, không tự dừng khi im lặng. Mặc định false. */
  continuous?: boolean;
  /** Trả kết quả tạm thời trong lúc nói. Mặc định true. */
  interimResults?: boolean;
  /** Gọi khi có câu hoàn chỉnh. Dùng để tự động tìm kiếm. */
  onFinalResult?: (text: string) => void;
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Trình duyệt đang chặn micro. Mở khoá micro trong thanh địa chỉ rồi thử lại.",
  "service-not-allowed":
    "Trình duyệt đang chặn micro. Mở khoá micro trong thanh địa chỉ rồi thử lại.",
  "audio-capture":
    "Không tìm thấy micro. Cắm micro hoặc chọn thiết bị thu âm khác.",
  "no-speech": "Không nghe thấy gì. Bấm micro và nói lại gần thiết bị hơn.",
  network:
    "Mất kết nối tới dịch vụ nhận diện giọng nói. Kiểm tra mạng rồi thử lại.",
};

export function useSpeechRecognition({
  lang = "vi-VN",
  continuous = false,
  interimResults = true,
  onFinalResult,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Giữ callback trong ref để handler luôn gọi phiên bản mới nhất.
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const Ctor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!Ctor) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new (Ctor as new () => SpeechRecognitionInstance)();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onerror = (event) => {
      // "aborted" xảy ra khi mình chủ động dừng, không phải lỗi thật.
      if (event.error === "aborted") return;
      setError(
        ERROR_MESSAGES[event.error] ??
          "Không nhận diện được giọng nói. Thử lại nhé.",
      );
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalText += text;
        else interimText += text;
      }

      setInterimTranscript(interimText);

      if (finalText) {
        const cleaned = finalText.trim();
        setTranscript(cleaned);
        setInterimTranscript("");
        onFinalResultRef.current?.(cleaned);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang, continuous, interimResults]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    try {
      recognition.start();
    } catch {
      // start() ném lỗi nếu đang chạy sẵn — bỏ qua.
    }
  }, [isListening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    toggle,
    reset,
  };
}
