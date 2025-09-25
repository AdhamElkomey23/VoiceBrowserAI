import OpenAI from "openai";
import { type ChatMessage, type VoiceCommand, type PageAnalysis, type TaskAction, type LoginRequest } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export class AIProcessor {
  async processVoiceCommand(text: string): Promise<VoiceCommand> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a voice command processor for a browser automation assistant. Analyze the user's voice input and extract the intent and parameters. Respond with JSON in this format:
            {
              "intent": "navigate|scrape|create_post|analyze|search|login|help",
              "confidence": 0.0-1.0,
              "parameters": {}
            }`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        text,
        intent: result.intent || "help",
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        parameters: result.parameters || {}
      };
    } catch (error) {
      console.error("AI processing failed:", error);
      return {
        text,
        intent: "help",
        confidence: 0,
        parameters: {}
      };
    }
  }

  async processChatMessage(message: string, context?: any): Promise<ChatMessage> {
    try {
      const systemPrompt = `You are an AI assistant that helps with browser automation, web scraping, WordPress management, and website login automation. You can:
      - Analyze web pages and suggest actions
      - Help create and manage WordPress content
      - Extract data from websites
      - Automate repetitive web tasks
      - Automate website logins and form interactions
      - Detect login forms and guide users through authentication
      
      When a user asks to login to a website, help them by:
      1. Analyzing the current page for login forms
      2. Requesting credentials securely
      3. Automating the login process
      4. Suggesting post-login tasks
      
      Current page context: ${JSON.stringify(context || {})}
      
      Respond in a helpful, conversational tone. If you can suggest specific automation actions, include them in your response.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      });

      const content = response.choices[0].message.content || "";
      const actions = this.extractActionsFromResponse(content, context);

      return {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        actions
      };
    } catch (error) {
      console.error("Chat processing failed:", error);
      return {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzePageContent(url: string, html: string, title?: string): Promise<PageAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Analyze the provided webpage content and return a JSON response with:
            {
              "pageType": "description of page type",
              "elements": ["key elements found"],
              "summary": "brief summary of the page",
              "suggestedActions": [
                {
                  "type": "action_type",
                  "label": "Action Label",
                  "parameters": {}
                }
              ]
            }`
          },
          {
            role: "user",
            content: `URL: ${url}\nTitle: ${title || "Unknown"}\nHTML Content: ${html.substring(0, 4000)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        pageType: result.pageType || "Unknown",
        elements: Array.isArray(result.elements) ? result.elements : [],
        summary: result.summary || "No summary available",
        suggestedActions: Array.isArray(result.suggestedActions) ? result.suggestedActions : []
      };
    } catch (error) {
      console.error("Page analysis failed:", error);
      return {
        pageType: "Unknown",
        elements: [],
        summary: "Analysis failed",
        suggestedActions: []
      };
    }
  }

  async generateBlogContent(topic: string, keywords?: string[]): Promise<string> {
    try {
      const keywordText = keywords && keywords.length > 0 ? `Keywords to include: ${keywords.join(", ")}` : "";
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional content writer. Create engaging, informative blog post content that is well-structured with headings, paragraphs, and natural keyword integration."
          },
          {
            role: "user",
            content: `Create a comprehensive blog post about: ${topic}\n${keywordText}\n\nPlease include an engaging title, introduction, main sections with headings, and a conclusion. Aim for approximately 1000-1500 words.`
          }
        ]
      });

      return response.choices[0].message.content || "Content generation failed";
    } catch (error) {
      console.error("Content generation failed:", error);
      return "Failed to generate content. Please try again.";
    }
  }

  private extractActionsFromResponse(content: string, context?: any): TaskAction[] {
    const actions: TaskAction[] = [];
    
    // Simple pattern matching for common action triggers
    if (content.toLowerCase().includes("create") && content.toLowerCase().includes("post")) {
      actions.push({
        id: `action-${Date.now()}`,
        type: "wordpress_create_post",
        label: "Create WordPress Post",
        parameters: { content: context?.url || "" }
      });
    }
    
    if (content.toLowerCase().includes("analyze") || content.toLowerCase().includes("extract")) {
      actions.push({
        id: `action-${Date.now()}-analyze`,
        type: "analyze_page",
        label: "Analyze Current Page",
        parameters: { url: context?.url || "" }
      });
    }

    if (content.toLowerCase().includes("scrape") || content.toLowerCase().includes("data")) {
      actions.push({
        id: `action-${Date.now()}-scrape`,
        type: "scrape_data",
        label: "Extract Page Data",
        parameters: { url: context?.url || "" }
      });
    }

    if (content.toLowerCase().includes("login") || content.toLowerCase().includes("sign in") || content.toLowerCase().includes("log in")) {
      actions.push({
        id: `action-${Date.now()}-login`,
        type: "login",
        label: "Login to Website",
        parameters: { url: context?.url || "" }
      });
    }

    if (content.toLowerCase().includes("fill") && (content.toLowerCase().includes("form") || content.toLowerCase().includes("field"))) {
      actions.push({
        id: `action-${Date.now()}-fill`,
        type: "fill_form",
        label: "Fill Form",
        parameters: { url: context?.url || "" }
      });
    }

    if (content.toLowerCase().includes("click") || content.toLowerCase().includes("button")) {
      actions.push({
        id: `action-${Date.now()}-click`,
        type: "click_element",
        label: "Click Element",
        parameters: { url: context?.url || "" }
      });
    }

    return actions;
  }

  async detectLoginForm(url: string, pageContent: string): Promise<LoginRequest> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Analyze the webpage content and detect if there's a login form. Return JSON with:
            {
              "hasLoginForm": boolean,
              "detectedSelectors": {
                "username": "CSS selector for username field",
                "password": "CSS selector for password field",
                "submit": "CSS selector for submit button"
              },
              "loginUrl": "detected login page URL if different",
              "confidence": 0.0-1.0
            }`
          },
          {
            role: "user",
            content: `URL: ${url}\nPage Content: ${pageContent.substring(0, 3000)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        id: `login-${Date.now()}`,
        website: url,
        needsCredentials: result.hasLoginForm || false,
        detectedSelectors: result.detectedSelectors || {}
      };
    } catch (error) {
      console.error("Login form detection failed:", error);
      return {
        id: `login-${Date.now()}`,
        website: url,
        needsCredentials: false
      };
    }
  }

  async generatePostLoginTasks(website: string, pageContent: string): Promise<TaskAction[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Analyze the post-login page content and suggest useful automation tasks. Return JSON array of actions:
            [
              {
                "type": "fill_form|click_element|extract_data|custom",
                "label": "User-friendly action description",
                "parameters": {"selector": "CSS selector", "action": "specific action"}
              }
            ]`
          },
          {
            role: "user",
            content: `Website: ${website}\nPost-login page content: ${pageContent.substring(0, 3000)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const actions = Array.isArray(result.actions) ? result.actions : [];
      
      return actions.map((action: any, index: number) => ({
        id: `task-${Date.now()}-${index}`,
        type: action.type || "custom",
        label: action.label || "Perform Action",
        parameters: action.parameters || {}
      }));
    } catch (error) {
      console.error("Post-login task generation failed:", error);
      return [];
    }
  }

  async summarizeContent(content: string, maxLength = 200): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Summarize the following content in approximately ${maxLength} characters. Be concise but capture the key points.`
          },
          {
            role: "user",
            content: content.substring(0, 2000)
          }
        ]
      });

      return response.choices[0].message.content || "Summary not available";
    } catch (error) {
      console.error("Summarization failed:", error);
      return "Summary not available";
    }
  }
}

export const aiProcessor = new AIProcessor();
