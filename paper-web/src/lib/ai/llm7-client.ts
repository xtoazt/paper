/**
 * LLM7.io OpenAI Client
 * Free AI API integration for Paper Network
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: 'default' | 'fast' | 'pro';
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLM7Client {
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey: string = 'unused') {
    this.baseURL = 'https://api.llm7.io/v1';
    this.apiKey = apiKey;
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'default',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens,
          stream: request.stream || false
        })
      });

      if (!response.ok) {
        throw new Error(`LLM7 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[LLM7] Chat completion failed:', error);
      throw error;
    }
  }

  /**
   * Create a streaming chat completion
   */
  async *createChatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'default',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`LLM7 API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('[LLM7] Streaming completion failed:', error);
      throw error;
    }
  }

  /**
   * Simple chat helper
   */
  async chat(
    userMessage: string,
    systemMessage?: string,
    model?: 'default' | 'fast' | 'pro'
  ): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    messages.push({ role: 'user', content: userMessage });

    const response = await this.createChatCompletion({
      model: model || 'default',
      messages
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Multi-turn conversation
   */
  async conversation(
    messages: ChatMessage[],
    model?: 'default' | 'fast' | 'pro'
  ): Promise<string> {
    const response = await this.createChatCompletion({
      model: model || 'default',
      messages
    });

    return response.choices[0]?.message?.content || '';
  }
}

// Singleton instance
let llm7ClientInstance: LLM7Client | null = null;

/**
 * Get singleton LLM7 client instance
 */
export function getLLM7Client(apiKey?: string): LLM7Client {
  if (!llm7ClientInstance) {
    llm7ClientInstance = new LLM7Client(apiKey);
  }
  return llm7ClientInstance;
}

/**
 * Quick chat helper
 */
export async function quickChat(
  message: string,
  systemPrompt?: string
): Promise<string> {
  const client = getLLM7Client();
  return await client.chat(message, systemPrompt);
}
