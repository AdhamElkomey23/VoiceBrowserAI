import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Play, 
  X, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Download,
  Globe2,
  Languages,
  Loader2
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import type { TaskTemplate, TaskExecution, ConfirmationDialog } from "../../types";

interface TaskManagerProps {
  onShowConfirmation: (dialog: ConfirmationDialog) => void;
}

export function TaskManager({ onShowConfirmation }: TaskManagerProps) {
  const [activeExecutions, setActiveExecutions] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'general' as string
  });
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/tasks/templates"],
  });

  const { data: executions = [] } = useQuery<TaskExecution[]>({
    queryKey: ["/api/tasks/executions"],
    refetchInterval: 2000, // Poll for updates on running tasks
  });

  const executeTaskMutation = useMutation({
    mutationFn: ({ templateId, parameters }: { templateId: string; parameters?: any }) => 
      apiClient.executeTask(templateId, parameters),
    onSuccess: (execution) => {
      setActiveExecutions(prev => [...prev, execution.id]);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/executions"] });
    }
  });

  const runningExecutions = executions.filter(exec => exec.status === 'running');
  const completedExecutions = executions.filter(exec => exec.status === 'completed' || exec.status === 'failed');

  const handleUseTemplate = (template: TaskTemplate) => {
    if (template.category === 'wordpress' && template.name.toLowerCase().includes('delete')) {
      // Show confirmation for destructive actions
      onShowConfirmation({
        title: "Confirm Destructive Action",
        description: "This action cannot be undone",
        details: `You are about to execute "${template.name}". This may delete or modify content permanently.`,
        onConfirm: () => executeTaskMutation.mutate({ templateId: template.id }),
        onCancel: () => {}
      });
    } else {
      executeTaskMutation.mutate({ templateId: template.id });
    }
  };

  const handleCancelTask = (executionId: string) => {
    // TODO: Implement task cancellation
    setActiveExecutions(prev => prev.filter(id => id !== executionId));
    console.log("Cancelling task:", executionId);
  };

  const handleCreateNewTemplate = () => {
    setShowCreateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;
    
    // Create a basic template with the form data
    const newTemplate = {
      ...templateForm,
      steps: [
        { type: "placeholder", description: "Add your automation steps here" }
      ],
      variables: [],
      isPublic: false
    };

    console.log("Creating template:", newTemplate);
    setShowCreateModal(false);
    setTemplateForm({ name: '', description: '', category: 'general' });
    
    // In a real implementation, you'd call the API to save the template
    // apiClient.createTaskTemplate(newTemplate);
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setTemplateForm({ name: '', description: '', category: 'general' });
  };

  const getTemplateIcon = (category: string, name: string) => {
    if (category === 'wordpress' || name.toLowerCase().includes('wordpress')) {
      return <FileText className="w-4 h-4" />;
    } else if (category === 'scraping' || name.toLowerCase().includes('extract')) {
      return <Download className="w-4 h-4" />;
    } else if (name.toLowerCase().includes('translation')) {
      return <Languages className="w-4 h-4" />;
    }
    return <Globe2 className="w-4 h-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <Badge className="bg-gradient-to-r from-accent to-accent/80 text-white text-xs">
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gradient-to-r from-muted to-muted/80 text-white text-xs">
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Active Tasks */}
      {runningExecutions.length > 0 && (
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground mb-3">Active Tasks</h3>
          <ScrollArea className="max-h-48">
            <div className="space-y-3">
              {runningExecutions.map((execution) => {
                const template = templates.find(t => t.id === execution.templateId);
                return (
                  <Card key={execution.id} className="p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {template?.name || "Unknown Task"}
                      </h4>
                      {getStatusBadge(execution.status)}
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {Array.isArray(execution.logs) && execution.logs.slice(-3).map((log, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {index === execution.logs.length - 1 ? 
                            <Loader2 className="w-3 h-3 animate-spin text-primary" /> :
                            <CheckCircle className="w-3 h-3 text-accent" />
                          }
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex-1 mr-3">
                        <Progress value={execution.progress} className="h-1" />
                        <span className="text-xs text-muted-foreground mt-1">
                          {execution.progress}% complete
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80 text-xs h-6"
                        onClick={() => handleCancelTask(execution.id)}
                        data-testid={`button-cancel-task-${execution.id}`}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Task Templates */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Task Templates</h3>
        </div>
        
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-3 hover:bg-muted/20 cursor-pointer transition-colors group"
                onClick={() => handleUseTemplate(template)}
                data-testid={`template-${template.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    template.category === 'wordpress' ? 'bg-primary/10 text-primary' :
                    template.category === 'scraping' ? 'bg-accent/10 text-accent' :
                    'bg-secondary/10 text-secondary'
                  }`}>
                    {getTemplateIcon(template.category || '', template.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {template.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {template.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Task Controls */}
      <div className="p-4 border-t border-border">
        <Button
          className="w-full"
          onClick={handleCreateNewTemplate}
          data-testid="button-create-template"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Template
        </Button>
      </div>
      
      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new automation template that can be reused for repetitive tasks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                data-testid="input-template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                data-testid="textarea-template-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this template does..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select value={templateForm.category} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1" data-testid="select-template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="wordpress">WordPress</SelectItem>
                  <SelectItem value="scraping">Web Scraping</SelectItem>
                  <SelectItem value="translation">Translation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={handleCancelCreate}
                data-testid="button-cancel-template"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={!templateForm.name.trim()}
                data-testid="button-save-template"
              >
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
