import { apiRequest } from "./queryClient";
import type { 
  BrowserSession, 
  ChatMessage, 
  VoiceCommand, 
  PageAnalysis,
  BrowserProfile,
  BrowsingHistoryItem,
  TaskTemplate,
  TaskExecution,
  ActionLogItem
} from "../types";

export class ApiClient {
  // Browser Profiles
  async getBrowserProfiles(): Promise<BrowserProfile[]> {
    const response = await apiRequest("GET", "/api/profiles");
    return response.json();
  }

  async createBrowserProfile(data: { name: string; sessionData?: any; isDefault?: boolean }): Promise<BrowserProfile> {
    const response = await apiRequest("POST", "/api/profiles", data);
    return response.json();
  }

  // Browsing History
  async getBrowsingHistory(profileId: string, limit?: number): Promise<BrowsingHistoryItem[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiRequest("GET", `/api/history/${profileId}${params}`);
    return response.json();
  }

  async addBrowsingHistory(data: { profileId: string; url: string; title?: string; favicon?: string }): Promise<BrowsingHistoryItem> {
    const response = await apiRequest("POST", "/api/history", data);
    return response.json();
  }

  async searchBrowsingHistory(profileId: string, query: string): Promise<BrowsingHistoryItem[]> {
    const response = await apiRequest("GET", `/api/history/${profileId}/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }

  // Browser Automation
  async createBrowserSession(profileId: string): Promise<BrowserSession> {
    const response = await apiRequest("POST", "/api/browser/session", { profileId });
    return response.json();
  }

  async navigateToUrl(sessionId: string, url: string): Promise<BrowserSession> {
    const response = await apiRequest("POST", `/api/browser/${sessionId}/navigate`, { url });
    return response.json();
  }

  async browserBack(sessionId: string): Promise<BrowserSession> {
    const response = await apiRequest("POST", `/api/browser/${sessionId}/back`);
    return response.json();
  }

  async browserForward(sessionId: string): Promise<BrowserSession> {
    const response = await apiRequest("POST", `/api/browser/${sessionId}/forward`);
    return response.json();
  }

  async browserRefresh(sessionId: string): Promise<BrowserSession> {
    const response = await apiRequest("POST", `/api/browser/${sessionId}/refresh`);
    return response.json();
  }

  async analyzeCurrentPage(sessionId: string): Promise<PageAnalysis> {
    const response = await apiRequest("GET", `/api/browser/${sessionId}/analyze`);
    return response.json();
  }

  async scrapePageData(sessionId: string): Promise<any> {
    const response = await apiRequest("GET", `/api/browser/${sessionId}/scrape`);
    return response.json();
  }

  async takeScreenshot(sessionId: string): Promise<{ screenshot: string; timestamp: string }> {
    const response = await apiRequest("GET", `/api/browser/${sessionId}/screenshot`);
    return response.json();
  }

  async getBrowserSession(sessionId: string): Promise<BrowserSession> {
    const response = await apiRequest("GET", `/api/browser/session/${sessionId}`);
    return response.json();
  }

  // AI Processing
  async processVoiceCommand(text: string): Promise<VoiceCommand> {
    const response = await apiRequest("POST", "/api/ai/voice-command", { text });
    return response.json();
  }

  async sendChatMessage(message: string, context?: any): Promise<ChatMessage> {
    const response = await apiRequest("POST", "/api/ai/chat", { message, context });
    return response.json();
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const response = await apiRequest("GET", "/api/ai/chat/history");
    return response.json();
  }

  async generateContent(topic: string, keywords?: string[]): Promise<{ content: string }> {
    const response = await apiRequest("POST", "/api/ai/generate-content", { topic, keywords });
    return response.json();
  }

  // Task Management
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    const response = await apiRequest("GET", "/api/tasks/templates");
    return response.json();
  }

  async createTaskTemplate(data: any): Promise<TaskTemplate> {
    const response = await apiRequest("POST", "/api/tasks/templates", data);
    return response.json();
  }

  async getTaskExecutions(): Promise<TaskExecution[]> {
    const response = await apiRequest("GET", "/api/tasks/executions");
    return response.json();
  }

  async executeTask(templateId: string, parameters?: any): Promise<TaskExecution> {
    const response = await apiRequest("POST", "/api/tasks/execute", { templateId, parameters });
    return response.json();
  }

  // WordPress Integration
  async configureWordPress(config: { siteUrl: string; username: string; applicationPassword: string }): Promise<any> {
    const response = await apiRequest("POST", "/api/wordpress/config", config);
    return response.json();
  }

  async createWordPressPost(post: any): Promise<any> {
    const response = await apiRequest("POST", "/api/wordpress/posts", post);
    return response.json();
  }

  async getWordPressPosts(params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiRequest("GET", `/api/wordpress/posts${queryString}`);
    return response.json();
  }

  // Action Logs
  async getActionLogs(limit?: number): Promise<ActionLogItem[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiRequest("GET", `/api/logs${params}`);
    return response.json();
  }

  // Voice
  async getAvailableVoices(): Promise<any[]> {
    const response = await apiRequest("GET", "/api/voice/voices");
    return response.json();
  }
}

export const apiClient = new ApiClient();
