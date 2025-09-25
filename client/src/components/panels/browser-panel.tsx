import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, RotateCcw, Brain, ChartLine, X, Loader2, ExternalLink, Camera } from "lucide-react";
import { useBrowser } from "../../hooks/use-browser";
import { apiClient } from "../../lib/api-client";
import type { PageAnalysis } from "../../types";

interface BrowserPanelProps {
  onShowActionLog: () => void;
}

export function BrowserPanel({ onShowActionLog }: BrowserPanelProps) {
  const [currentUrl, setCurrentUrl] = useState("https://example.org");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoadingScreenshot, setIsLoadingScreenshot] = useState(false);
  
  const {
    session,
    sessionId,
    sessionLoading,
    isNavigating,
    canGoBack,
    canGoForward,
    analysis,
    isAnalyzing,
    initializeSession,
    navigate,
    goBack,
    goForward,
    refresh,
    analyzePage
  } = useBrowser();

  // Initialize browser session on component mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Update URL input when session URL changes and take screenshot
  useEffect(() => {
    if (session?.url) {
      setCurrentUrl(session.url);
      if (sessionId && session.url !== "about:blank") {
        takeScreenshot();
      }
    }
  }, [session?.url, sessionId]);

  const takeScreenshot = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoadingScreenshot(true);
      const result = await apiClient.takeScreenshot(sessionId);
      setScreenshot(result.screenshot);
    } catch (error) {
      console.error("Failed to take screenshot:", error);
    } finally {
      setIsLoadingScreenshot(false);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUrl) {
      setScreenshot(null);
      navigate(currentUrl);
    }
  };

  const handleAnalyze = () => {
    setShowAnalysis(!showAnalysis);
    if (!showAnalysis) {
      analyzePage();
    }
  };

  const openInNewTab = () => {
    if (session?.url) {
      window.open(session.url, '_blank');
    }
  };

  const handleRefresh = () => {
    refresh();
    if (sessionId) {
      takeScreenshot();
    }
  };

  const handleSuggestedAction = (action: any) => {
    console.log("Executing suggested action:", action);
    // TODO: Implement action execution
  };

  const isLoading = sessionLoading || isNavigating || session?.isLoading || isLoadingScreenshot;

  return (
    <div className="flex-1 flex flex-col bg-card">
      {/* Browser Controls */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoBack || isNavigating}
              onClick={goBack}
              data-testid="button-browser-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoForward || isNavigating}
              onClick={goForward}
              data-testid="button-browser-forward"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isNavigating}
              onClick={handleRefresh}
              data-testid="button-browser-refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoadingScreenshot || !sessionId}
              onClick={takeScreenshot}
              data-testid="button-take-screenshot"
            >
              <Camera className="w-4 h-4" />
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
        {/* Browser Screenshot Display */}
        {screenshot ? (
          <div className="w-full h-full relative bg-white">
            <img 
              src={screenshot}
              className="w-full h-full object-contain"
              alt="Browser Screenshot"
              data-testid="browser-screenshot"
            />
            {/* Open in new tab overlay */}
            <div className="absolute bottom-4 right-4">
              <Button 
                onClick={openInNewTab} 
                size="sm" 
                className="gap-2 bg-black/70 hover:bg-black/80 text-white"
                data-testid="button-open-external"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        ) : session?.url && session.url !== "about:blank" ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4 max-w-md p-6">
              <div className="text-lg font-medium text-foreground">Loading Page Preview</div>
              <p className="text-sm text-muted-foreground">
                Generating a visual preview of {session.url}
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Taking screenshot...</span>
              </div>
              <Button onClick={openInNewTab} variant="outline" className="gap-2" data-testid="button-open-external">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4 max-w-md p-6">
              <div className="text-lg font-medium text-foreground">Navigate to a Website</div>
              <p className="text-sm text-muted-foreground">
                Enter a URL above to start browsing and analyzing web content.
              </p>
            </div>
          </div>
        )}
        
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
            ) : isAnalyzing ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Analyzing page...</span>
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-sm text-muted-foreground">Click Analyze to get insights about this page</span>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
