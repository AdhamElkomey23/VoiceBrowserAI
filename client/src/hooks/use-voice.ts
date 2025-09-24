import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import type { VoiceCommand } from "../types";

interface VoiceRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => VoiceRecognition;
    webkitSpeechRecognition: new () => VoiceRecognition;
  }
}

export function useVoice() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.addEventListener('start', () => {
        setIsRecording(true);
        setError(null);
        setTranscript("");
        setConfidence(null);
      });
      
      recognition.addEventListener('end', () => {
        setIsRecording(false);
      });
      
      recognition.addEventListener('error', (event: any) => {
        setError(event.error);
        setIsRecording(false);
      });
      
      recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            setConfidence(result[0].confidence);
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        // If we have a final transcript, process it
        if (finalTranscript) {
          processVoiceCommand.mutate(finalTranscript.trim());
        }
      });
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processVoiceCommand = useMutation({
    mutationFn: (text: string) => apiClient.processVoiceCommand(text),
    onSuccess: (command: VoiceCommand) => {
      console.log("Voice command processed:", command);
      // TODO: Execute the parsed command based on intent
    },
    onError: (error) => {
      console.error("Voice command processing failed:", error);
      setError("Failed to process voice command");
    }
  });

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isRecording) {
      return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      setError("Failed to start voice recognition");
      console.error("Voice recognition start error:", error);
    }
  }, [isSupported, isRecording]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setConfidence(null);
    setError(null);
  }, []);

  return {
    isSupported,
    isRecording,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isProcessing: processVoiceCommand.isPending
  };
}
