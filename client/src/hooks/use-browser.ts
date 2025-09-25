import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import type { BrowserSession, PageAnalysis } from "../types";

export function useBrowser(profileId: string = "default-profile") {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get current browser session
  const { data: session, isLoading: sessionLoading } = useQuery<BrowserSession>({
    queryKey: ["/api/browser/session", sessionId],
    enabled: !!sessionId,
    refetchInterval: 1000, // Poll for session updates
  });

  // Create browser session
  const createSessionMutation = useMutation({
    mutationFn: () => apiClient.createBrowserSession(profileId),
    onSuccess: (newSession) => {
      setSessionId(newSession.id);
      queryClient.setQueryData(["/api/browser/session", newSession.id], newSession);
    }
  });

  // Navigation mutations
  const navigateMutation = useMutation({
    mutationFn: (url: string) => {
      if (!sessionId) throw new Error("No active session");
      return apiClient.navigateToUrl(sessionId, url);
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], updatedSession);
      // Invalidate history to refresh with new entry
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    }
  });

  const backMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No active session");
      return apiClient.browserBack(sessionId);
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], updatedSession);
    }
  });

  const forwardMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No active session");
      return apiClient.browserForward(sessionId);
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], updatedSession);
    }
  });

  const refreshMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No active session");
      return apiClient.browserRefresh(sessionId);
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], updatedSession);
    }
  });

  // Page analysis
  const { data: analysis, refetch: analyzeCurrentPage, isFetching: isAnalyzing, error: analysisError } = useQuery<PageAnalysis>({
    queryKey: ["/api/browser", sessionId, "analyze"],
    queryFn: () => {
      if (!sessionId) throw new Error("No active session");
      return apiClient.analyzeCurrentPage(sessionId);
    },
    enabled: false, // Only run when explicitly requested
  });

  // Scraping
  const scrapeMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No active session");
      return apiClient.scrapePageData(sessionId);
    }
  });

  // Helper methods
  const initializeSession = useCallback(() => {
    if (!sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [sessionId, createSessionMutation]);

  const navigate = useCallback((url: string) => {
    if (!sessionId) {
      // If no session exists, create one first then navigate
      createSessionMutation.mutate(undefined, {
        onSuccess: (newSession) => {
          apiClient.navigateToUrl(newSession.id, url);
        }
      });
    } else {
      navigateMutation.mutate(url);
    }
  }, [sessionId, navigateMutation, createSessionMutation]);

  const goBack = useCallback(() => {
    if (session?.canGoBack) {
      backMutation.mutate();
    }
  }, [session?.canGoBack, backMutation]);

  const goForward = useCallback(() => {
    if (session?.canGoForward) {
      forwardMutation.mutate();
    }
  }, [session?.canGoForward, forwardMutation]);

  const refresh = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  const analyzePage = useCallback(() => {
    analyzeCurrentPage();
  }, [analyzeCurrentPage]);

  const scrapePage = useCallback(() => {
    scrapeMutation.mutate();
  }, [scrapeMutation]);

  return {
    // Session state
    session,
    sessionId,
    sessionLoading: sessionLoading || createSessionMutation.isPending,
    
    // Navigation state
    isNavigating: navigateMutation.isPending,
    canGoBack: session?.canGoBack ?? false,
    canGoForward: session?.canGoForward ?? false,
    
    // Page analysis
    analysis,
    isAnalyzing,
    
    // Scraping
    isScrapingData: scrapeMutation.isPending,
    scrapedData: scrapeMutation.data,
    
    // Actions
    initializeSession,
    navigate,
    goBack,
    goForward,
    refresh,
    analyzePage,
    scrapePage,
    
    // Loading states
    isLoading: session?.isLoading ?? false,
    
    // Error states
    navigationError: navigateMutation.error,
    analysisError,
    scrapingError: scrapeMutation.error,
  };
}
