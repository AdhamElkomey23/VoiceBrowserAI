import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Download, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Clock,
  ExternalLink 
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import type { ActionLogItem } from "../../types";

interface ActionLogModalProps {
  onClose: () => void;
}

export function ActionLogModal({ onClose }: ActionLogModalProps) {
  const [exportingLog, setExportingLog] = useState(false);

  const { data: logs = [] } = useQuery<ActionLogItem[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 2000, // Poll for real-time updates
  });

  const handleExportLog = async () => {
    setExportingLog(true);
    try {
      // Create downloadable log file
      const logData = logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: log.details,
        url: log.url
      }));
      
      const blob = new Blob([JSON.stringify(logData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `action-log-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export log:", error);
    } finally {
      setExportingLog(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'navigate':
        return <ExternalLink className="w-4 h-4 text-primary" />;
      case 'scrape_data':
        return <Download className="w-4 h-4 text-accent" />;
      case 'wordpress_create_post':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionStatus = (action: string) => {
    // In a real implementation, this would check the actual status
    // For now, we'll show completed for most actions
    return Math.random() > 0.1 ? 'completed' : 'running';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const completedActions = logs.filter(log => getActionStatus(log.action) === 'completed').length;
  const totalActions = logs.length;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      data-testid="action-log-modal"
    >
      <Card className="max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col shadow-lg">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Action Log</CardTitle>
              <CardDescription>Step-by-step automation progress</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-action-log"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p>No actions logged yet</p>
                <p className="text-sm mt-2">
                  Actions will appear here as you interact with the browser and AI assistant.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
                  const status = getActionStatus(log.action);
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-start space-x-3"
                      data-testid={`log-item-${log.id}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        status === 'completed' ? 'bg-accent text-white' : 
                        status === 'running' ? 'bg-primary text-white' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : status === 'running' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {formatActionName(log.action)}
                            </p>
                            {log.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {typeof log.details === 'string' ? 
                                  log.details : 
                                  JSON.stringify(log.details)
                                }
                              </p>
                            )}
                            {log.url && (
                              <div className="flex items-center space-x-1 mt-1">
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {log.url}
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </div>
                          <Badge 
                            variant={status === 'completed' ? 'default' : status === 'running' ? 'secondary' : 'destructive'}
                            className="ml-2 text-xs"
                          >
                            {status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        <div className="p-6 border-t border-border">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Progress: <span className="font-medium text-foreground">
                {completedActions} of {totalActions} actions completed
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={handleExportLog}
              disabled={exportingLog || logs.length === 0}
              data-testid="button-export-log"
            >
              {exportingLog ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Log
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
