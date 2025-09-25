import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Bot, User, Wand2, FileText } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import type { ChatMessage } from "../../types";

interface ChatInterfaceProps {
  inputMode: 'voice' | 'text';
}

export function ChatInterface({ inputMode }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/ai/chat/history"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => apiClient.sendChatMessage(message, { 
      url: window.location.href,
      timestamp: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/history"] });
      setMessage("");
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleQuickAction = (action: string) => {
    if (!sendMessageMutation.isPending) {
      sendMessageMutation.mutate(action);
    }
  };

  const handleExecuteAction = (action: any) => {
    console.log("Executing action:", action);
    // TODO: Implement specific action execution
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm">
              Hello! I'm your AI assistant. I can help you automate web tasks, 
              scrape data, and manage WordPress content.
            </p>
            <p className="text-xs mt-2">
              Try asking me to analyze this page or create content.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}
              data-testid={`message-${msg.role}-${msg.id}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`flex-1 max-w-[280px] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-lg px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto'
                    : 'bg-muted/30 text-foreground'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Action buttons for AI messages */}
                  {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {msg.actions.map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => handleExecuteAction(action)}
                          data-testid={`button-action-${action.type}`}
                        >
                          {action.type === 'wordpress_create_post' && <FileText className="w-3 h-3 mr-2" />}
                          {action.type === 'analyze_page' && <Bot className="w-3 h-3 mr-2" />}
                          {action.type === 'scrape_data' && <Wand2 className="w-3 h-3 mr-2" />}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`text-xs text-muted-foreground mt-1 ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/90 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder={inputMode === 'voice' ? "Speak your command..." : "Type your command or question..."}
                className="resize-none pr-10"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sendMessageMutation.isPending}
                data-testid="textarea-chat-input"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 h-6 w-6 p-0"
                data-testid="button-attach-file"
              >
                <Paperclip className="w-3 h-3" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction("Analyze this page")}
              disabled={sendMessageMutation.isPending}
              data-testid="button-quick-analyze"
            >
              Analyze page
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction("Extract data from this page")}
              disabled={sendMessageMutation.isPending}
              data-testid="button-quick-extract"
            >
              Extract data
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction("Create a WordPress post")}
              disabled={sendMessageMutation.isPending}
              data-testid="button-quick-create-post"
            >
              Create post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
