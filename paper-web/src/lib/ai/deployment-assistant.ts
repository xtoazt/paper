/**
 * AI Deployment Assistant
 * Intelligent deployment help using LLM7.io
 */

import { getLLM7Client, ChatMessage } from './llm7-client';

export interface FrameworkDetectionResult {
  framework: string;
  version?: string;
  confidence: number;
  buildCommand?: string;
  outputDir?: string;
  envVars?: string[];
}

export interface BuildOptimizationSuggestion {
  type: 'performance' | 'size' | 'security' | 'best-practice';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  code?: string;
}

export interface ErrorDiagnosis {
  error: string;
  cause: string;
  solution: string;
  preventionTips: string[];
}

export class DeploymentAssistant {
  private client = getLLM7Client();
  private conversationHistory: ChatMessage[] = [];

  /**
   * Detect framework from package.json
   */
  async detectFramework(packageJson: any): Promise<FrameworkDetectionResult> {
    const prompt = `Analyze this package.json and detect the web framework being used. Return a JSON object with: framework, version, confidence (0-1), buildCommand, outputDir, and envVars (array of common env vars needed).

package.json:
\`\`\`json
${JSON.stringify(packageJson, null, 2)}
\`\`\`

Return ONLY valid JSON, no markdown or explanation.`;

    try {
      const response = await this.client.chat(
        prompt,
        'You are an expert at detecting web frameworks and build configurations. Always return valid JSON.',
        'fast'
      );

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse framework detection response');
    } catch (error) {
      console.error('[AI] Framework detection failed:', error);
      
      // Fallback detection
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['next']) return { framework: 'Next.js', confidence: 0.9, buildCommand: 'npm run build', outputDir: '.next' };
      if (deps['react']) return { framework: 'React', confidence: 0.8, buildCommand: 'npm run build', outputDir: 'build' };
      if (deps['vue']) return { framework: 'Vue', confidence: 0.8, buildCommand: 'npm run build', outputDir: 'dist' };
      if (deps['@angular/core']) return { framework: 'Angular', confidence: 0.9, buildCommand: 'npm run build', outputDir: 'dist' };
      if (deps['svelte']) return { framework: 'Svelte', confidence: 0.8, buildCommand: 'npm run build', outputDir: 'public/build' };
      
      return { framework: 'Unknown', confidence: 0, buildCommand: 'npm run build', outputDir: 'dist' };
    }
  }

  /**
   * Get build optimization suggestions
   */
  async getBuildOptimizations(
    framework: string,
    buildConfig: any
  ): Promise<BuildOptimizationSuggestion[]> {
    const prompt = `As an expert in ${framework} optimization, analyze this build configuration and provide 3-5 specific optimization suggestions. Focus on bundle size, performance, and best practices.

Build Config:
\`\`\`json
${JSON.stringify(buildConfig, null, 2)}
\`\`\`

Return a JSON array of suggestions with: type, title, description, impact, and optional code example.`;

    try {
      const response = await this.client.chat(
        prompt,
        'You are a performance optimization expert. Always return valid JSON arrays.',
        'default'
      );

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse optimization suggestions');
    } catch (error) {
      console.error('[AI] Build optimization failed:', error);
      
      // Fallback suggestions
      return [
        {
          type: 'performance',
          title: 'Enable Code Splitting',
          description: 'Split your code into smaller chunks for faster initial load.',
          impact: 'high'
        },
        {
          type: 'size',
          title: 'Tree Shaking',
          description: 'Remove unused code from your bundles.',
          impact: 'medium'
        }
      ];
    }
  }

  /**
   * Diagnose build error
   */
  async diagnoseError(
    error: string,
    context: { framework?: string; logs?: string }
  ): Promise<ErrorDiagnosis> {
    const prompt = `Diagnose this build error and provide a solution:

Framework: ${context.framework || 'Unknown'}
Error: ${error}
${context.logs ? `Logs:\n${context.logs}` : ''}

Return JSON with: error (summary), cause, solution, and preventionTips (array).`;

    try {
      const response = await this.client.chat(
        prompt,
        'You are an expert at debugging build errors. Always return valid JSON.',
        'fast'
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse error diagnosis');
    } catch (error) {
      console.error('[AI] Error diagnosis failed:', error);
      
      return {
        error: 'Build Error',
        cause: 'Unable to diagnose automatically',
        solution: 'Check build logs for more details',
        preventionTips: ['Review documentation', 'Check dependencies']
      };
    }
  }

  /**
   * Generate optimal configuration
   */
  async generateConfig(
    framework: string,
    requirements: string[]
  ): Promise<string> {
    const prompt = `Generate an optimal ${framework} configuration for Paper Network deployment with these requirements:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Return the complete configuration file content.`;

    try {
      const response = await this.client.chat(
        prompt,
        'You are an expert at creating optimal build configurations.',
        'default'
      );

      return response;
    } catch (error) {
      console.error('[AI] Config generation failed:', error);
      return '// Failed to generate configuration';
    }
  }

  /**
   * Get best practices for framework
   */
  async getBestPractices(framework: string): Promise<string[]> {
    const prompt = `List 5 critical best practices for deploying ${framework} applications to a P2P network like Paper Network. Be specific and actionable.

Return a JSON array of strings.`;

    try {
      const response = await this.client.chat(
        prompt,
        'You are a deployment expert. Always return valid JSON arrays.',
        'fast'
      );

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse best practices');
    } catch (error) {
      console.error('[AI] Best practices failed:', error);
      
      return [
        'Optimize bundle size',
        'Enable caching',
        'Use environment variables',
        'Test before deploying',
        'Monitor performance'
      ];
    }
  }

  /**
   * Interactive chat with deployment assistant
   */
  async chat(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Get response
    const response = await this.client.conversation(
      [
        {
          role: 'system',
          content: 'You are an AI deployment assistant for Paper Network, a decentralized P2P hosting platform. Help users deploy their applications efficiently. Be concise, helpful, and provide actionable advice.'
        },
        ...this.conversationHistory
      ],
      'default'
    );

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });

    // Keep history manageable (last 10 messages)
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    return response;
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

// Singleton instance
let assistantInstance: DeploymentAssistant | null = null;

/**
 * Get singleton deployment assistant instance
 */
export function getDeploymentAssistant(): DeploymentAssistant {
  if (!assistantInstance) {
    assistantInstance = new DeploymentAssistant();
  }
  return assistantInstance;
}
