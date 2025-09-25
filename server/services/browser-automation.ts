import { type PageAnalysis, type LoginCredentials, type LoginRequest, type TaskAction } from "@shared/schema";
import { aiProcessor } from "./ai-processor.js";

export interface BrowserSession {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ScrapedData {
  url: string;
  title: string;
  text: string;
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string }>;
  metadata: Record<string, string>;
}

export interface LoginResult {
  success: boolean;
  message: string;
  postLoginTasks?: TaskAction[];
  redirectUrl?: string;
}

export class BrowserAutomation {
  private sessions: Map<string, BrowserSession> = new Map();

  async createSession(profileId: string): Promise<BrowserSession> {
    // In a real implementation, this would use Playwright to create a browser context
    const session: BrowserSession = {
      id: `session-${Date.now()}`,
      url: "about:blank",
      title: "New Tab",
      isLoading: false,
      canGoBack: false,
      canGoForward: false
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async navigateToUrl(sessionId: string, url: string): Promise<BrowserSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Update session state
    session.isLoading = true;
    session.url = url;
    this.sessions.set(sessionId, session);

    try {
      // In a real implementation, this would use Playwright to navigate
      // For now, we'll simulate navigation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate getting page title
      const title = this.extractTitleFromUrl(url);
      
      session.isLoading = false;
      session.title = title;
      session.canGoBack = true;
      this.sessions.set(sessionId, session);

      return session;
    } catch (error) {
      session.isLoading = false;
      this.sessions.set(sessionId, session);
      throw error;
    }
  }

  async goBack(sessionId: string): Promise<BrowserSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright browser.goBack()
    session.canGoForward = true;
    this.sessions.set(sessionId, session);
    return session;
  }

  async goForward(sessionId: string): Promise<BrowserSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright browser.goForward()
    this.sessions.set(sessionId, session);
    return session;
  }

  async refresh(sessionId: string): Promise<BrowserSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.isLoading = true;
    this.sessions.set(sessionId, session);

    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500));

    session.isLoading = false;
    this.sessions.set(sessionId, session);
    return session;
  }

  async scrapePageData(sessionId: string): Promise<ScrapedData> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright to extract data
    // For now, we'll return simulated data based on the URL
    const scrapedData: ScrapedData = {
      url: session.url,
      title: session.title,
      text: this.generateSampleText(session.url),
      links: this.generateSampleLinks(session.url),
      images: this.generateSampleImages(session.url),
      metadata: {
        "og:title": session.title,
        "og:description": "Sample description",
        "viewport": "width=device-width, initial-scale=1"
      }
    };

    return scrapedData;
  }

  async analyzeCurrentPage(sessionId: string): Promise<PageAnalysis> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const scrapedData = await this.scrapePageData(sessionId);
    
    // Use AI to analyze the page content
    const analysis = await aiProcessor.analyzePageContent(
      scrapedData.url,
      scrapedData.text,
      scrapedData.title
    );

    return analysis;
  }

  async takeScreenshot(sessionId: string): Promise<{ screenshot: string; timestamp: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright page.screenshot()
    // For now, we'll return a placeholder that indicates the page content
    const timestamp = new Date().toISOString();
    
    // Generate a simulated screenshot representation based on the URL
    const screenshotData = this.generateScreenshotPreview(session.url, session.title);
    
    return {
      screenshot: screenshotData,
      timestamp
    };
  }

  async executeCustomScript(sessionId: string, script: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright page.evaluate()
    // For security, this should be heavily sandboxed and validated
    try {
      // Simulate script execution
      return { success: true, result: "Script executed successfully" };
    } catch (error) {
      throw new Error(`Script execution failed: ${error}`);
    }
  }

  async waitForElement(sessionId: string, selector: string, timeout = 5000): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright page.waitForSelector()
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), Math.min(timeout, 1000));
    });
  }

  async clickElement(sessionId: string, selector: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright page.click()
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async fillForm(sessionId: string, formData: Record<string, string>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // In a real implementation, this would use Playwright to fill form fields
    for (const [selector, value] of Object.entries(formData)) {
      // page.fill(selector, value)
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async detectLoginForm(sessionId: string): Promise<LoginRequest> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get page content for AI analysis
    const scrapedData = await this.scrapePageData(sessionId);
    const pageContent = `${scrapedData.text}\n\nLinks: ${scrapedData.links.map(l => `${l.text}: ${l.href}`).join(', ')}`;
    
    // Use AI to detect login form
    return await aiProcessor.detectLoginForm(session.url, pageContent);
  }

  async performLogin(sessionId: string, credentials: LoginCredentials): Promise<LoginResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    try {
      // Detect login form first if selectors not provided
      let loginRequest: LoginRequest | null = null;
      if (!credentials.usernameSelector || !credentials.passwordSelector) {
        loginRequest = await this.detectLoginForm(sessionId);
        if (!loginRequest.needsCredentials) {
          return {
            success: false,
            message: "No login form detected on current page"
          };
        }
      }

      // Use provided selectors or detected ones
      const usernameSelector = credentials.usernameSelector || loginRequest?.detectedSelectors?.username || "input[type='email'], input[type='text'], input[name*='user'], input[name*='email']";
      const passwordSelector = credentials.passwordSelector || loginRequest?.detectedSelectors?.password || "input[type='password']";
      const submitSelector = credentials.submitSelector || loginRequest?.detectedSelectors?.submit || "button[type='submit'], input[type='submit'], button";

      // Fill login form
      await this.fillLoginForm(sessionId, {
        [usernameSelector]: credentials.username,
        [passwordSelector]: credentials.password
      });

      // Submit form
      await this.clickElement(sessionId, submitSelector);

      // Wait for login to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get updated page content after login
      const postLoginData = await this.scrapePageData(sessionId);
      
      // Generate post-login tasks
      const postLoginTasks = await aiProcessor.generatePostLoginTasks(
        session.url,
        postLoginData.text
      );

      return {
        success: true,
        message: "Login completed successfully",
        postLoginTasks,
        redirectUrl: session.url
      };

    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async fillLoginForm(sessionId: string, formData: Record<string, string>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Enhanced form filling specifically for login forms
    for (const [selector, value] of Object.entries(formData)) {
      try {
        // Wait for the field to be available
        await this.waitForElement(sessionId, selector, 3000);
        
        // Clear any existing value and fill
        // In real implementation: await page.fill(selector, '', { force: true });
        // In real implementation: await page.fill(selector, value);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log(`Filled ${selector} with credentials`);
      } catch (error) {
        console.error(`Failed to fill ${selector}:`, error);
        // Continue with other fields even if one fails
      }
    }
  }

  async executeTaskSequence(sessionId: string, tasks: TaskAction[]): Promise<Array<{ task: TaskAction; success: boolean; message: string }>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const results: Array<{ task: TaskAction; success: boolean; message: string }> = [];

    for (const task of tasks) {
      try {
        switch (task.type) {
          case 'click_element':
            await this.clickElement(sessionId, task.parameters.selector);
            results.push({ task, success: true, message: "Element clicked successfully" });
            break;

          case 'fill_form':
            await this.fillForm(sessionId, task.parameters);
            results.push({ task, success: true, message: "Form filled successfully" });
            break;

          case 'extract_data':
            const data = await this.scrapePageData(sessionId);
            results.push({ task, success: true, message: `Extracted ${data.text.length} characters of data` });
            break;

          default:
            results.push({ task, success: false, message: `Unknown task type: ${task.type}` });
        }

        // Small delay between tasks
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        results.push({ 
          task, 
          success: false, 
          message: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    }

    return results;
  }

  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const path = urlObj.pathname;
      
      if (hostname.includes('wordpress.com') || hostname.includes('wp-admin')) {
        return 'WordPress Dashboard';
      } else if (hostname.includes('gmail.com')) {
        return 'Gmail';
      } else if (hostname.includes('github.com')) {
        return 'GitHub';
      } else {
        return `${hostname}${path}`;
      }
    } catch {
      return url;
    }
  }

  private generateSampleText(url: string): string {
    if (url.includes('wordpress')) {
      return "WordPress Dashboard - Manage your website content, posts, pages, and settings.";
    } else if (url.includes('github')) {
      return "GitHub repository with code, documentation, and collaboration tools.";
    } else {
      return `Sample content from ${url}. This would contain the actual page text in a real implementation.`;
    }
  }

  private generateSampleLinks(url: string): Array<{ text: string; href: string }> {
    if (url.includes('wordpress')) {
      return [
        { text: "Posts", href: "/wp-admin/edit.php" },
        { text: "Pages", href: "/wp-admin/edit.php?post_type=page" },
        { text: "Plugins", href: "/wp-admin/plugins.php" },
        { text: "Settings", href: "/wp-admin/options-general.php" }
      ];
    }
    return [
      { text: "Home", href: "/" },
      { text: "About", href: "/about" },
      { text: "Contact", href: "/contact" }
    ];
  }

  private generateSampleImages(url: string): Array<{ src: string; alt: string }> {
    return [
      { src: "/sample-image-1.jpg", alt: "Sample image" },
      { src: "/sample-image-2.jpg", alt: "Another sample image" }
    ];
  }

  private generateScreenshotPreview(url: string, title: string): string {
    // Generate an SVG-based preview showing the page structure
    // In production, this would be replaced by actual Playwright screenshots
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="60" fill="#f8f9fa"/>
        <text x="20" y="35" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">${title}</text>
        
        <!-- URL bar representation -->
        <rect x="20" y="80" width="760" height="40" fill="#e9ecef" rx="4"/>
        <text x="30" y="105" font-family="monospace" font-size="12" fill="#666">${url}</text>
        
        <!-- Content area -->
        <rect x="20" y="140" width="760" height="420" fill="#fff" stroke="#dee2e6" stroke-width="1" rx="4"/>
        
        <!-- Simulated content blocks -->
        <rect x="40" y="160" width="200" height="20" fill="#e9ecef" rx="2"/>
        <rect x="40" y="190" width="300" height="15" fill="#f8f9fa" rx="2"/>
        <rect x="40" y="215" width="250" height="15" fill="#f8f9fa" rx="2"/>
        
        <!-- Simulated navigation -->
        <rect x="40" y="250" width="100" height="30" fill="#007bff" rx="4"/>
        <text x="60" y="270" font-family="Arial, sans-serif" font-size="12" fill="white">Button</text>
        
        <rect x="160" y="250" width="100" height="30" fill="#6c757d" rx="4"/>
        <text x="185" y="270" font-family="Arial, sans-serif" font-size="12" fill="white">Link</text>
        
        <!-- Footer -->
        <text x="40" y="520" font-family="Arial, sans-serif" font-size="11" fill="#999">Live screenshot will appear here when Playwright is integrated</text>
        <text x="40" y="540" font-family="Arial, sans-serif" font-size="11" fill="#999">Current URL: ${url}</text>
      </svg>
    `;
    
    // Convert SVG to base64 data URL
    const base64 = Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

export const browserAutomation = new BrowserAutomation();
