import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Browser profiles for session management
export const browserProfiles = pgTable("browser_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  sessionData: json("session_data"), // Encrypted session data
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Browsing history
export const browsingHistory = pgTable("browsing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").references(() => browserProfiles.id),
  url: text("url").notNull(),
  title: text("title"),
  favicon: text("favicon"),
  summary: text("summary"), // AI-generated summary
  visitedAt: timestamp("visited_at").defaultNow(),
});

// Task templates for automation
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // 'wordpress', 'scraping', 'general'
  steps: json("steps"), // Array of automation steps
  variables: json("variables"), // Template variables
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task executions/jobs
export const taskExecutions = pgTable("task_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => taskTemplates.id),
  userId: varchar("user_id").references(() => users.id),
  status: text("status").notNull(), // 'running', 'completed', 'failed', 'cancelled'
  progress: integer("progress").default(0), // 0-100
  logs: json("logs"), // Array of execution logs
  result: json("result"), // Execution result data
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// AI chat conversations
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  messages: json("messages"), // Array of chat messages
  context: json("context"), // Current page context
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Action logs for audit trail
export const actionLogs = pgTable("action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: json("details"),
  url: text("url"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBrowserProfileSchema = createInsertSchema(browserProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertBrowsingHistorySchema = createInsertSchema(browsingHistory).omit({
  id: true,
  visitedAt: true,
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertTaskExecutionSchema = createInsertSchema(taskExecutions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActionLogSchema = createInsertSchema(actionLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BrowserProfile = typeof browserProfiles.$inferSelect;
export type InsertBrowserProfile = z.infer<typeof insertBrowserProfileSchema>;

export type BrowsingHistory = typeof browsingHistory.$inferSelect;
export type InsertBrowsingHistory = z.infer<typeof insertBrowsingHistorySchema>;

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

export type TaskExecution = typeof taskExecutions.$inferSelect;
export type InsertTaskExecution = z.infer<typeof insertTaskExecutionSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = z.infer<typeof insertActionLogSchema>;

// Additional types for API responses
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: TaskAction[];
}

export interface TaskAction {
  id: string;
  type: 'wordpress_create_post' | 'scrape_data' | 'analyze_page' | 'login' | 'fill_form' | 'click_element' | 'extract_data' | 'custom';
  label: string;
  parameters: Record<string, any>;
}

export interface LoginCredentials {
  website: string;
  username: string;
  password: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
}

export interface LoginRequest {
  id: string;
  website: string;
  needsCredentials: boolean;
  detectedSelectors?: {
    username?: string;
    password?: string;
    submit?: string;
  };
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
