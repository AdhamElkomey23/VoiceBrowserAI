import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { aiProcessor } from "./services/ai-processor.js";
import { browserAutomation } from "./services/browser-automation.js";
import { voiceProcessor } from "./services/voice-processor.js";
import { wordpressIntegration } from "./services/wordpress-integration.js";
import {
  insertBrowserProfileSchema,
  insertBrowsingHistorySchema,
  insertTaskTemplateSchema,
  insertTaskExecutionSchema,
  insertChatConversationSchema,
  insertActionLogSchema,
  type ChatMessage
} from "@shared/schema.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Default user ID for demo purposes
  const DEFAULT_USER_ID = "default-user";

  // Browser Profiles
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getBrowserProfiles(DEFAULT_USER_ID);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertBrowserProfileSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const profile = await storage.createBrowserProfile(validatedData);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // Browsing History
  app.get("/api/history/:profileId", async (req, res) => {
    try {
      const { profileId } = req.params;
      const { limit } = req.query;
      const history = await storage.getBrowsingHistory(
        profileId, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const validatedData = insertBrowsingHistorySchema.parse(req.body);
      const history = await storage.addBrowsingHistory(validatedData);
      
      // Generate AI summary for the page
      if (validatedData.url && validatedData.title) {
        const summary = await aiProcessor.summarizeContent(
          `${validatedData.title} - ${validatedData.url}`
        );
        await storage.addBrowsingHistory({
          ...validatedData,
          summary
        });
      }
      
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: "Invalid history data" });
    }
  });

  app.get("/api/history/:profileId/search", async (req, res) => {
    try {
      const { profileId } = req.params;
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }
      const results = await storage.searchBrowsingHistory(profileId, q as string);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Browser Automation
  app.post("/api/browser/session", async (req, res) => {
    try {
      const { profileId } = req.body;
      const session = await browserAutomation.createSession(profileId);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create browser session" });
    }
  });

  app.post("/api/browser/:sessionId/navigate", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { url } = req.body;
      const session = await browserAutomation.navigateToUrl(sessionId, url);
      
      // Log the navigation action
      await storage.addActionLog({
        userId: DEFAULT_USER_ID,
        action: "navigate",
        details: { url, sessionId },
        url
      });
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Navigation failed" });
    }
  });

  app.post("/api/browser/:sessionId/back", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await browserAutomation.goBack(sessionId);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to go back" });
    }
  });

  app.post("/api/browser/:sessionId/forward", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await browserAutomation.goForward(sessionId);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to go forward" });
    }
  });

  app.post("/api/browser/:sessionId/refresh", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await browserAutomation.refresh(sessionId);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh" });
    }
  });

  app.get("/api/browser/:sessionId/analyze", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const analysis = await browserAutomation.analyzeCurrentPage(sessionId);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Page analysis failed" });
    }
  });

  app.get("/api/browser/:sessionId/scrape", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const data = await browserAutomation.scrapePageData(sessionId);
      
      // Log the scraping action
      await storage.addActionLog({
        userId: DEFAULT_USER_ID,
        action: "scrape_data",
        details: { sessionId, dataSize: data.text.length },
        url: data.url
      });
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Data scraping failed" });
    }
  });

  // AI Processing
  app.post("/api/ai/voice-command", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text required" });
      }
      
      const command = await aiProcessor.processVoiceCommand(text);
      res.json(command);
    } catch (error) {
      res.status(500).json({ error: "Voice command processing failed" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message required" });
      }

      const response = await aiProcessor.processChatMessage(message, context);
      
      // Store or update conversation
      let conversation = await storage.getChatConversation(DEFAULT_USER_ID);
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      };

      if (conversation) {
        const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
        messages.push(userMessage, response);
        await storage.updateChatConversation(conversation.id, {
          messages,
          context
        });
      } else {
        await storage.createChatConversation({
          userId: DEFAULT_USER_ID,
          messages: [userMessage, response],
          context
        });
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Chat processing failed" });
    }
  });

  app.get("/api/ai/chat/history", async (req, res) => {
    try {
      const conversation = await storage.getChatConversation(DEFAULT_USER_ID);
      res.json(conversation?.messages || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  app.post("/api/ai/generate-content", async (req, res) => {
    try {
      const { topic, keywords } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic required" });
      }

      const content = await aiProcessor.generateBlogContent(topic, keywords);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Content generation failed" });
    }
  });

  // Task Management
  app.get("/api/tasks/templates", async (req, res) => {
    try {
      const templates = await storage.getTaskTemplates(DEFAULT_USER_ID);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task templates" });
    }
  });

  app.post("/api/tasks/templates", async (req, res) => {
    try {
      const validatedData = insertTaskTemplateSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const template = await storage.createTaskTemplate(validatedData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.get("/api/tasks/executions", async (req, res) => {
    try {
      const executions = await storage.getTaskExecutions(DEFAULT_USER_ID);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task executions" });
    }
  });

  app.post("/api/tasks/execute", async (req, res) => {
    try {
      const { templateId, parameters } = req.body;
      if (!templateId) {
        return res.status(400).json({ error: "Template ID required" });
      }

      const template = await storage.getTaskTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const execution = await storage.createTaskExecution({
        templateId,
        userId: DEFAULT_USER_ID,
        status: "running",
        progress: 0,
        logs: [],
        result: null
      });

      // Start task execution in background
      executeTaskInBackground(execution.id, template, parameters);

      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to start task execution" });
    }
  });

  // WordPress Integration
  app.post("/api/wordpress/config", async (req, res) => {
    try {
      const { siteUrl, username, applicationPassword } = req.body;
      if (!siteUrl || !username || !applicationPassword) {
        return res.status(400).json({ error: "All WordPress credentials required" });
      }

      wordpressIntegration.setConfig(DEFAULT_USER_ID, {
        siteUrl,
        username,
        applicationPassword
      });

      const testResult = await wordpressIntegration.testConnection(DEFAULT_USER_ID);
      res.json(testResult);
    } catch (error) {
      res.status(500).json({ error: "WordPress configuration failed" });
    }
  });

  app.post("/api/wordpress/posts", async (req, res) => {
    try {
      const result = await wordpressIntegration.createPost(DEFAULT_USER_ID, req.body);
      
      if (result.success) {
        await storage.addActionLog({
          userId: DEFAULT_USER_ID,
          action: "wordpress_create_post",
          details: { postId: result.data?.id, title: req.body.title }
        });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create WordPress post" });
    }
  });

  app.get("/api/wordpress/posts", async (req, res) => {
    try {
      const result = await wordpressIntegration.getPosts(DEFAULT_USER_ID, req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WordPress posts" });
    }
  });

  // Action Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getActionLogs(
        DEFAULT_USER_ID,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch action logs" });
    }
  });

  // Voice Processing
  app.get("/api/voice/voices", async (req, res) => {
    try {
      const voices = voiceProcessor.getAvailableVoices();
      res.json(voices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available voices" });
    }
  });

  // Helper function to execute tasks in background
  async function executeTaskInBackground(executionId: string, template: any, parameters: any) {
    try {
      // Simulate task execution steps
      const steps = Array.isArray(template.steps) ? template.steps : [];
      const totalSteps = steps.length;
      
      for (let i = 0; i < totalSteps; i++) {
        const step = steps[i];
        const progress = Math.round(((i + 1) / totalSteps) * 100);
        
        // Update progress
        await storage.updateTaskExecution(executionId, {
          progress,
          logs: [`Step ${i + 1}: ${step.description || step.type}`]
        });
        
        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Mark as completed
      await storage.updateTaskExecution(executionId, {
        status: "completed",
        progress: 100,
        result: { success: true, message: "Task completed successfully" }
      });
    } catch (error) {
      await storage.updateTaskExecution(executionId, {
        status: "failed",
        result: { success: false, error: String(error) }
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
