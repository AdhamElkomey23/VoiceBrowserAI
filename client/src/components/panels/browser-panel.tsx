import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, RotateCcw, Brain, ChartLine, X, Loader2 } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import type { BrowserSession, PageAnalysis } from "../../types";

interface BrowserPanelProps {
  onShowActionLog: () => void;
}

export function BrowserPanel({ onShowActionLog }: BrowserPanelProps) {
  const [currentUrl, setCurrentUrl] = useState("https://wordpress.com/dashboard");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sessionId] = useState("default-session");
  
  const queryClient = useQueryClient();

  // Mock browser session - in real implementation would create actual session
  const { data: session } = useQuery<BrowserSession>({
    queryKey: ["/api/browser/session", sessionId],
    initialData: {
      id: sessionId,
      url: currentUrl,
      title: "WordPress Dashboard",
      isLoading: false,
      canGoBack: true,
      canGoForward: false
    }
  });

  const { data: analysis } = useQuery<PageAnalysis>({
    queryKey: ["/api/browser", sessionId, "analyze"],
    queryFn: () => apiClient.analyzeCurrentPage(sessionId),
    enabled: showAnalysis
  });

  const navigateMutation = useMutation({
    mutationFn: (url: string) => apiClient.navigateToUrl(sessionId, url),
    onSuccess: (newSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], newSession);
      setCurrentUrl(newSession.url);
    }
  });

  const backMutation = useMutation({
    mutationFn: () => apiClient.browserBack(sessionId),
    onSuccess: (newSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], newSession);
      setCurrentUrl(newSession.url);
    }
  });

  const forwardMutation = useMutation({
    mutationFn: () => apiClient.browserForward(sessionId),
    onSuccess: (newSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], newSession);
      setCurrentUrl(newSession.url);
    }
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiClient.browserRefresh(sessionId),
    onSuccess: (newSession) => {
      queryClient.setQueryData(["/api/browser/session", sessionId], newSession);
    }
  });

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUrl) {
      navigateMutation.mutate(currentUrl);
    }
  };

  const handleAnalyze = () => {
    setShowAnalysis(!showAnalysis);
    if (!showAnalysis) {
      queryClient.invalidateQueries({ queryKey: ["/api/browser", sessionId, "analyze"] });
    }
  };

  const handleSuggestedAction = (action: any) => {
    console.log("Executing suggested action:", action);
    // TODO: Implement action execution
  };

  const isLoading = navigateMutation.isPending || session?.isLoading;

  return (
    <div className="flex-1 flex flex-col bg-card">
      {/* Browser Controls */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!session?.canGoBack || backMutation.isPending}
              onClick={() => backMutation.mutate()}
              data-testid="button-browser-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!session?.canGoForward || forwardMutation.isPending}
              onClick={() => forwardMutation.mutate()}
              data-testid="button-browser-forward"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={refreshMutation.isPending}
              onClick={() => refreshMutation.mutate()}
              data-testid="button-browser-refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <form onSubmit={handleNavigate} className="flex-1 relative">
            <Input
              type="url"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              placeholder="Enter URL or search..."
              className="pr-10"
              data-testid="input-url"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
              onClick={handleAnalyze}
              data-testid="button-analyze-page"
            >
              <Brain className="w-4 h-4" />
            </Button>
          </form>
          
          <Button
            variant={showAnalysis ? "default" : "outline"}
            onClick={handleAnalyze}
            data-testid="button-toggle-analysis"
          >
            <ChartLine className="w-4 h-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>
      
      {/* Browser Frame Container */}
      <div className="flex-1 relative bg-muted/10">
        {/* Embedded Browser iframe */}
        <iframe 
          src="about:blank" 
          className="w-full h-full border-0"
          title="Embedded Browser"
          data-testid="browser-iframe"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Loading page...</div>
            </div>
          </div>
        )}
        
        {/* Analysis Overlay */}
        {showAnalysis && (
          <Card className="absolute top-4 right-4 w-80 p-4 shadow-lg bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Page Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(false)}
                data-testid="button-close-analysis"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {analysis ? (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="font-medium text-foreground">Page Type:</label>
                  <span className="text-muted-foreground ml-2" data-testid="text-page-type">
                    {analysis.pageType}
                  </span>
                </div>
                
                <div>
                  <label className="font-medium text-foreground">Summary:</label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {analysis.summary}
                  </p>
                </div>
                
                {analysis.elements.length > 0 && (
                  <div>
                    <label className="font-medium text-foreground">Detected Elements:</label>
                    <div className="mt-1 space-y-1">
                      {analysis.elements.slice(0, 3).map((element, index) => (
                        <Badge key={index} variant="secondary" className="text-xs mr-1">
                          {element}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {analysis.suggestedActions.length > 0 && (
                  <div>
                    <label className="font-medium text-foreground">Suggested Actions:</label>
                    <div className="mt-1 space-y-1">
                      {analysis.suggestedActions.slice(0, 2).map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => handleSuggestedAction(action)}
                          data-testid={`button-action-${action.type}`}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Analyzing page...</span>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
