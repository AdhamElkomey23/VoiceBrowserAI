export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'private';
  categories?: number[];
  tags?: number[];
  featuredMedia?: number;
  excerpt?: string;
  meta?: Record<string, any>;
}

export interface WordPressResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class WordPressIntegration {
  private configs: Map<string, WordPressConfig> = new Map();

  setConfig(userId: string, config: WordPressConfig): void {
    this.configs.set(userId, config);
  }

  getConfig(userId: string): WordPressConfig | undefined {
    return this.configs.get(userId);
  }

  async testConnection(userId: string): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const response = await this.makeRequest(config, '/wp/v2/users/me');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Connection failed: ${error}` };
    }
  }

  async createPost(userId: string, post: WordPressPost): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const response = await this.makeRequest(config, '/wp/v2/posts', 'POST', post);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to create post: ${error}` };
    }
  }

  async updatePost(userId: string, postId: number, updates: Partial<WordPressPost>): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const response = await this.makeRequest(config, `/wp/v2/posts/${postId}`, 'POST', updates);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to update post: ${error}` };
    }
  }

  async getPosts(userId: string, params?: Record<string, any>): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await this.makeRequest(config, `/wp/v2/posts${queryString}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to fetch posts: ${error}` };
    }
  }

  async deletePost(userId: string, postId: number): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const response = await this.makeRequest(config, `/wp/v2/posts/${postId}`, 'DELETE');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to delete post: ${error}` };
    }
  }

  async getCategories(userId: string): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const response = await this.makeRequest(config, '/wp/v2/categories');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to fetch categories: ${error}` };
    }
  }

  async createCategory(userId: string, name: string, description?: string): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      const response = await this.makeRequest(config, '/wp/v2/categories', 'POST', {
        name,
        description: description || ''
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to create category: ${error}` };
    }
  }

  async uploadMedia(userId: string, file: Buffer, filename: string, mimeType: string): Promise<WordPressResponse> {
    const config = this.getConfig(userId);
    if (!config) {
      return { success: false, error: "WordPress configuration not found" };
    }

    try {
      // In a real implementation, this would upload the media file
      const response = await this.makeMediaRequest(config, '/wp/v2/media', file, filename, mimeType);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: `Failed to upload media: ${error}` };
    }
  }

  async bulkCreatePosts(userId: string, posts: WordPressPost[]): Promise<WordPressResponse> {
    const results = [];
    const errors = [];

    for (const post of posts) {
      try {
        const result = await this.createPost(userId, post);
        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({ post: post.title, error: result.error });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errors.push({ post: post.title, error: String(error) });
      }
    }

    return {
      success: errors.length === 0,
      data: { created: results, errors },
      error: errors.length > 0 ? `${errors.length} posts failed to create` : undefined
    };
  }

  private async makeRequest(config: WordPressConfig, endpoint: string, method = 'GET', data?: any): Promise<any> {
    const url = `${config.siteUrl}/wp-json${endpoint}`;
    const credentials = Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64');

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Voice-AI-Browser-Agent/1.0'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  private async makeMediaRequest(config: WordPressConfig, endpoint: string, file: Buffer, filename: string, mimeType: string): Promise<any> {
    const url = `${config.siteUrl}/wp-json${endpoint}`;
    const credentials = Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64');

    const formData = new FormData();
    formData.append('file', new Blob([file], { type: mimeType }), filename);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'User-Agent': 'Voice-AI-Browser-Agent/1.0'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }
}

export const wordpressIntegration = new WordPressIntegration();
