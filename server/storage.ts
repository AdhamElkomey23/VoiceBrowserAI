import { 
  type User, 
  type InsertUser,
  type BrowserProfile,
  type InsertBrowserProfile,
  type BrowsingHistory,
  type InsertBrowsingHistory,
  type TaskTemplate,
  type InsertTaskTemplate,
  type TaskExecution,
  type InsertTaskExecution,
  type ChatConversation,
  type InsertChatConversation,
  type ActionLog,
  type InsertActionLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Browser Profiles
  getBrowserProfiles(userId: string): Promise<BrowserProfile[]>;
  getBrowserProfile(id: string): Promise<BrowserProfile | undefined>;
  createBrowserProfile(profile: InsertBrowserProfile): Promise<BrowserProfile>;
  updateBrowserProfile(id: string, updates: Partial<BrowserProfile>): Promise<BrowserProfile | undefined>;
  deleteBrowserProfile(id: string): Promise<boolean>;
  
  // Browsing History
  getBrowsingHistory(profileId: string, limit?: number): Promise<BrowsingHistory[]>;
  addBrowsingHistory(history: InsertBrowsingHistory): Promise<BrowsingHistory>;
  searchBrowsingHistory(profileId: string, query: string): Promise<BrowsingHistory[]>;
  
  // Task Templates
  getTaskTemplates(userId: string): Promise<TaskTemplate[]>;
  getTaskTemplate(id: string): Promise<TaskTemplate | undefined>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate | undefined>;
  deleteTaskTemplate(id: string): Promise<boolean>;
  
  // Task Executions
  getTaskExecutions(userId: string): Promise<TaskExecution[]>;
  getTaskExecution(id: string): Promise<TaskExecution | undefined>;
  createTaskExecution(execution: InsertTaskExecution): Promise<TaskExecution>;
  updateTaskExecution(id: string, updates: Partial<TaskExecution>): Promise<TaskExecution | undefined>;
  
  // Chat Conversations
  getChatConversation(userId: string): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | undefined>;
  
  // Action Logs
  getActionLogs(userId: string, limit?: number): Promise<ActionLog[]>;
  addActionLog(log: InsertActionLog): Promise<ActionLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private browserProfiles: Map<string, BrowserProfile> = new Map();
  private browsingHistory: Map<string, BrowsingHistory> = new Map();
  private taskTemplates: Map<string, TaskTemplate> = new Map();
  private taskExecutions: Map<string, TaskExecution> = new Map();
  private chatConversations: Map<string, ChatConversation> = new Map();
  private actionLogs: Map<string, ActionLog> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "demo",
      password: "demo",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default browser profile
    const defaultProfile: BrowserProfile = {
      id: "default-profile",
      userId: defaultUser.id,
      name: "Default Profile",
      sessionData: {},
      isDefault: true,
      createdAt: new Date(),
    };
    this.browserProfiles.set(defaultProfile.id, defaultProfile);

    // Create default task templates
    const wordpressTemplate: TaskTemplate = {
      id: "wordpress-template",
      userId: defaultUser.id,
      name: "Bulk WordPress Posts",
      description: "Create multiple posts from CSV data",
      category: "wordpress",
      steps: [
        { type: "upload_csv", description: "Upload CSV file with post data" },
        { type: "generate_content", description: "Generate content using AI" },
        { type: "create_posts", description: "Create WordPress posts" }
      ],
      variables: [
        { name: "csv_file", type: "file", required: true },
        { name: "post_status", type: "select", options: ["draft", "publish"], default: "draft" }
      ],
      isPublic: false,
      createdAt: new Date(),
    };
    this.taskTemplates.set(wordpressTemplate.id, wordpressTemplate);

    const scrapingTemplate: TaskTemplate = {
      id: "scraping-template",
      userId: defaultUser.id,
      name: "Data Extraction",
      description: "Scrape product information to CSV",
      category: "scraping",
      steps: [
        { type: "navigate_to_page", description: "Navigate to target page" },
        { type: "extract_data", description: "Extract specified data" },
        { type: "export_csv", description: "Export data to CSV" }
      ],
      variables: [
        { name: "target_url", type: "url", required: true },
        { name: "selectors", type: "json", required: true }
      ],
      isPublic: false,
      createdAt: new Date(),
    };
    this.taskTemplates.set(scrapingTemplate.id, scrapingTemplate);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getBrowserProfiles(userId: string): Promise<BrowserProfile[]> {
    return Array.from(this.browserProfiles.values()).filter(profile => profile.userId === userId);
  }

  async getBrowserProfile(id: string): Promise<BrowserProfile | undefined> {
    return this.browserProfiles.get(id);
  }

  async createBrowserProfile(insertProfile: InsertBrowserProfile): Promise<BrowserProfile> {
    const id = randomUUID();
    const profile: BrowserProfile = {
      id,
      userId: insertProfile.userId || null,
      name: insertProfile.name,
      sessionData: insertProfile.sessionData || {},
      isDefault: insertProfile.isDefault || false,
      createdAt: new Date()
    };
    this.browserProfiles.set(id, profile);
    return profile;
  }

  async updateBrowserProfile(id: string, updates: Partial<BrowserProfile>): Promise<BrowserProfile | undefined> {
    const profile = this.browserProfiles.get(id);
    if (!profile) return undefined;

    const updatedProfile = { ...profile, ...updates };
    this.browserProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteBrowserProfile(id: string): Promise<boolean> {
    return this.browserProfiles.delete(id);
  }

  async getBrowsingHistory(profileId: string, limit = 50): Promise<BrowsingHistory[]> {
    return Array.from(this.browsingHistory.values())
      .filter(history => history.profileId === profileId)
      .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
      .slice(0, limit);
  }

  async addBrowsingHistory(insertHistory: InsertBrowsingHistory): Promise<BrowsingHistory> {
    const id = randomUUID();
    const history: BrowsingHistory = {
      ...insertHistory,
      id,
      visitedAt: new Date()
    };
    this.browsingHistory.set(id, history);
    return history;
  }

  async searchBrowsingHistory(profileId: string, query: string): Promise<BrowsingHistory[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.browsingHistory.values())
      .filter(history => 
        history.profileId === profileId &&
        (history.title?.toLowerCase().includes(lowerQuery) || 
         history.url.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
  }

  async getTaskTemplates(userId: string): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplates.values()).filter(template => template.userId === userId);
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | undefined> {
    return this.taskTemplates.get(id);
  }

  async createTaskTemplate(insertTemplate: InsertTaskTemplate): Promise<TaskTemplate> {
    const id = randomUUID();
    const template: TaskTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date()
    };
    this.taskTemplates.set(id, template);
    return template;
  }

  async updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate | undefined> {
    const template = this.taskTemplates.get(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...updates };
    this.taskTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    return this.taskTemplates.delete(id);
  }

  async getTaskExecutions(userId: string): Promise<TaskExecution[]> {
    return Array.from(this.taskExecutions.values())
      .filter(execution => execution.userId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async getTaskExecution(id: string): Promise<TaskExecution | undefined> {
    return this.taskExecutions.get(id);
  }

  async createTaskExecution(insertExecution: InsertTaskExecution): Promise<TaskExecution> {
    const id = randomUUID();
    const execution: TaskExecution = {
      ...insertExecution,
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.taskExecutions.set(id, execution);
    return execution;
  }

  async updateTaskExecution(id: string, updates: Partial<TaskExecution>): Promise<TaskExecution | undefined> {
    const execution = this.taskExecutions.get(id);
    if (!execution) return undefined;

    const updatedExecution = { ...execution, ...updates };
    if (updates.status === 'completed' || updates.status === 'failed') {
      updatedExecution.completedAt = new Date();
    }
    this.taskExecutions.set(id, updatedExecution);
    return updatedExecution;
  }

  async getChatConversation(userId: string): Promise<ChatConversation | undefined> {
    return Array.from(this.chatConversations.values()).find(conv => conv.userId === userId);
  }

  async createChatConversation(insertConversation: InsertChatConversation): Promise<ChatConversation> {
    const id = randomUUID();
    const conversation: ChatConversation = {
      ...insertConversation,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatConversations.set(id, conversation);
    return conversation;
  }

  async updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    const conversation = this.chatConversations.get(id);
    if (!conversation) return undefined;

    const updatedConversation = { ...conversation, ...updates, updatedAt: new Date() };
    this.chatConversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async getActionLogs(userId: string, limit = 100): Promise<ActionLog[]> {
    return Array.from(this.actionLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async addActionLog(insertLog: InsertActionLog): Promise<ActionLog> {
    const id = randomUUID();
    const log: ActionLog = {
      ...insertLog,
      id,
      timestamp: new Date()
    };
    this.actionLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
