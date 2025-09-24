import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import type { ChatMessage } from "../types";

export function useAIChat() {
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Get chat history
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/ai/chat/history"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ message, context }: { message: string; context?: any }) =>
      apiClient.sendChatMessage(message, context),
    onMutate: async ({ message }) => {
      // Show typing indicator
      setIsTyping(true);
      
      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      };

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(["/api/ai/chat/history"]) || [];
      queryClient.setQueryData(["/api/ai/chat/history"], [...previousMessages, userMessage]);

      return { previousMessages };
    },
    onSuccess: (aiResponse) => {
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/history"] });
    },
    onError: (error, variables, context) => {
      setIsTyping(false);
      // Revert optimistic update on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["/api/ai/chat/history"], context.previousMessages);
      }
    },
  });

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: ({ topic, keywords }: { topic: string; keywords?: string[] }) =>
      apiClient.generateContent(topic, keywords),
  });

  // Helper functions
  const sendMessage = useCallback((message: string, context?: any) => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ message: message.trim(), context });
    }
  }, [sendMessageMutation]);

  const generateContent = useCallback((topic: string, keywords?: string[]) => {
    generateContentMutation.mutate({ topic, keywords });
  }, [generateContentMutation]);

  const clearChat = useCallback(() => {
    queryClient.setQueryData(["/api/ai/chat/history"], []);
  }, [queryClient]);

  const getLastMessage = useCallback(() => {
    return messages[messages.length - 1];
  }, [messages]);

  const getLastAIMessage = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  const hasActiveConversation = messages.length > 0;

  return {
    // Messages
    messages,
    messagesLoading,
    isTyping,
    hasActiveConversation,
    
    // Actions
    sendMessage,
    generateContent,
    clearChat,
    
    // State
    isSending: sendMessageMutation.isPending,
    isGeneratingContent: generateContentMutation.isPending,
    
    // Data
    generatedContent: generateContentMutation.data?.content,
    
    // Errors
    sendError: sendMessageMutation.error,
    generateError: generateContentMutation.error,
    
    // Helpers
    getLastMessage,
    getLastAIMessage,
  };
}
