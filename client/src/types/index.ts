export interface BrowserSession {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: TaskAction[];
}

export interface TaskAction {
  id: string;
  type: 'wordpress_create_post' | 'scrape_data' | 'analyze_page' | 'custom';
  label: string;
  parameters: Record<string, any>;
}

export interface PageAnalysis {
  pageType: string;
  elements: string[];
  suggestedActions: TaskAction[];
  summary: string;
}

export interface VoiceCommand {
  text: string;
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
}

export interface ConfirmationDialog {
  title: string;
  description: string;
  details: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ActionLogItem {
  id: string;
  action: string;
  details: any;
  url?: string;
  timestamp: string;
}

export interface BrowserProfile {
  id: string;
  userId: string;
  name: string;
  sessionData: any;
  isDefault: boolean;
  createdAt: string;
}

export interface BrowsingHistoryItem {
  id: string;
  profileId: string;
  url: string;
  title?: string;
  favicon?: string;
  summary?: string;
  visitedAt: string;
}

export interface TaskTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  steps: any[];
  variables: any[];
  isPublic: boolean;
  createdAt: string;
}

export interface TaskExecution {
  id: string;
  templateId: string;
  userId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  logs: string[];
  result: any;
  startedAt: string;
  completedAt?: string;
}
