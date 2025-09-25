import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, CheckSquare } from "lucide-react";
import { ChatInterface } from "../ai/chat-interface";
import { TaskManager } from "../tasks/task-manager";
import type { ConfirmationDialog } from "../../types";

interface RightPanelProps {
  inputMode: 'voice' | 'text';
  onShowConfirmation: (dialog: ConfirmationDialog) => void;
}

export function RightPanel({ inputMode, onShowConfirmation }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b flex-shrink-0">
          <TabsTrigger 
            value="chat" 
            className="flex items-center space-x-2"
            data-testid="tab-chat"
          >
            <MessageCircle className="w-4 h-4" />
            <span>AI Chat</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="flex items-center space-x-2"
            data-testid="tab-tasks"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Content */}
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 min-h-0">
          <ChatInterface inputMode={inputMode} />
        </TabsContent>
        
        <TabsContent value="tasks" className="flex-1 flex flex-col p-0 m-0 min-h-0">
          <TaskManager onShowConfirmation={onShowConfirmation} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
