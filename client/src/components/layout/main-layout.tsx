import { useState } from "react";
import { LeftPanel } from "../panels/left-panel";
import { BrowserPanel } from "../panels/browser-panel";
import { RightPanel } from "../panels/right-panel";
import { VoiceController } from "../voice/voice-controller";
import { ConfirmationModal } from "../modals/confirmation-modal";
import { ActionLogModal } from "../modals/action-log-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Mic, Type } from "lucide-react";
import type { ConfirmationDialog } from "../../types";

export function MainLayout() {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isListening, setIsListening] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialog | null>(null);
  const [showActionLog, setShowActionLog] = useState(false);
  const [connectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleOpenSettings = () => {
    // TODO: Implement settings modal
    console.log("Opening settings...");
  };

  const handleShowConfirmation = (dialog: ConfirmationDialog) => {
    setConfirmationDialog(dialog);
  };

  const handleHideConfirmation = () => {
    setConfirmationDialog(null);
  };

  const handleShowActionLog = () => {
    setShowActionLog(true);
  };

  const handleHideActionLog = () => {
    setShowActionLog(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">Voice AI Browser Agent</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div 
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-accent' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-destructive'
              }`} 
            />
            <span data-testid="connection-status">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Voice Activation Button */}
          <VoiceController 
            isListening={isListening}
            onToggle={handleVoiceToggle}
          />
          
          {/* Mode Selector */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            <Button
              variant={inputMode === 'voice' ? 'default' : 'ghost'}
              size="sm"
              className="px-3 py-1 h-8 text-sm"
              onClick={() => setInputMode('voice')}
              data-testid="button-voice-mode"
            >
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'ghost'}
              size="sm"
              className="px-3 py-1 h-8 text-sm"
              onClick={() => setInputMode('text')}
              data-testid="button-text-mode"
            >
              <Type className="w-3 h-3 mr-1" />
              Text
            </Button>
          </div>
          
          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSettings}
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>
      
      {/* Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: History & Profiles */}
        <LeftPanel />
        
        {/* Resize Handle */}
        <div className="w-1 bg-border hover:bg-border/80 transition-colors cursor-col-resize" />
        
        {/* Center Panel: Browser View */}
        <BrowserPanel onShowActionLog={handleShowActionLog} />
        
        {/* Resize Handle */}
        <div className="w-1 bg-border hover:bg-border/80 transition-colors cursor-col-resize" />
        
        {/* Right Panel: AI Assistant & Tasks */}
        <RightPanel 
          inputMode={inputMode}
          onShowConfirmation={handleShowConfirmation}
        />
      </div>
      
      {/* Modals */}
      {confirmationDialog && (
        <ConfirmationModal
          dialog={confirmationDialog}
          onClose={handleHideConfirmation}
        />
      )}
      
      {showActionLog && (
        <ActionLogModal onClose={handleHideActionLog} />
      )}
    </div>
  );
}
