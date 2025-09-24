import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff } from "lucide-react";
import { useVoice } from "../../hooks/use-voice";

interface VoiceControllerProps {
  isListening: boolean;
  onToggle: () => void;
}

export function VoiceController({ isListening, onToggle }: VoiceControllerProps) {
  const { 
    startListening, 
    stopListening, 
    isSupported,
    isRecording,
    transcript,
    confidence 
  } = useVoice();

  useEffect(() => {
    if (isListening && !isRecording) {
      startListening();
    } else if (!isListening && isRecording) {
      stopListening();
    }
  }, [isListening, isRecording, startListening, stopListening]);

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        disabled
        className="relative px-4 py-2"
        data-testid="button-voice-disabled"
      >
        <MicOff className="w-4 h-4 mr-2" />
        Voice Not Supported
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant={isListening ? "default" : "outline"}
        className={`relative px-4 py-2 transition-all duration-200 ${
          isListening ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""
        }`}
        onClick={onToggle}
        data-testid="button-voice-toggle"
      >
        <Mic className="w-4 h-4 mr-2" />
        Push to Talk
        
        {/* Recording indicator */}
        {isListening && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
      
      {/* Transcript preview */}
      {transcript && (
        <div className="absolute top-full mt-2 left-0 right-0 z-10">
          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Transcript</span>
              {confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(confidence * 100)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground">
              {transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
