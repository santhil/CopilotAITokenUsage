import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Analysis result for a single interaction
 */
export interface InteractionAnalysis {
  promptText: string;
  responseText: string;
  model: string;
  promptLength: number;
  responseLength: number;
  taskCategory: TaskCategory;
  promptQuality: PromptQualityScore;
  modelAppropriate: boolean;
  modelSuggestion?: string;
  timestamp?: string;
  suggestions: string[];
  smartModelRecommendation?: SmartModelRecommendation;
}

/**
 * Task categories for classification
 */
export type TaskCategory = 
  | 'debugging'
  | 'code-generation'
  | 'architectural-advice'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'explanation'
  | 'optimization'
  | 'factual-query'
  | 'time-date-query'
  | 'unknown';

/**
 * Prompt quality metrics
 */
export interface PromptQualityScore {
  clarity: number;           // 1-10
  specificity: number;       // 1-10
  contextProvided: number;   // 1-10
  overallScore: number;      // 1-10
}

/**
 * Overall usage analysis
 */
export interface UsageAnalysis {
  totalInteractions: number;
  taskBreakdown: Record<TaskCategory, number>;
  averagePromptQuality: number;
  averageResponseLength: number;
  averagePromptLength: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  technicalTaskPercentage: number;
  longResponseCount: number;
  inappropriateModelCount: number;
  inappropriateModels: Array<{
    prompt: string;
    usedModel: string;
    suggestedModel: string;
  }>;
  skillRating: SkillRating;
  overallRecommendations: string[];
  smartModelRecommendations: Record<string, SmartModelRecommendation>;
}

export interface SmartModelRecommendation {
  recommendedModel: string;
  reason: string;
  costProfile: 'efficient' | 'balanced' | 'premium';
}

/**
 * Skill rating result
 */
export interface SkillRating {
  overallScore: number;      // 1-10
  debuggingSkill: number;    // 1-10
  promptCrafting: number;    // 1-10
  taskFocus: number;         // 1-10
  aiUsageEfficiency: number; // 1-10
  improvement: string[];
  strengths: string[];
}

/**
 * Analyzes user prompting behavior and AI model usage
 */
export class PromptAnalyzer {
  private transcriptPath: string;
  private interactions: InteractionAnalysis[] = [];

  constructor(transcriptPath: string) {
    this.transcriptPath = transcriptPath;
  }

  /**
   * Analyze all interactions in a transcript file
   */
  async analyzeTranscript(): Promise<UsageAnalysis> {
    await this.loadTranscript();
    return this.generateAnalysis();
  }

  /**
   * Load and parse transcript file
   */
  private async loadTranscript(): Promise<void> {
    if (!fs.existsSync(this.transcriptPath)) {
      console.warn('Transcript file not found:', this.transcriptPath);
      return;
    }

    const content = fs.readFileSync(this.transcriptPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    const messageBuffer: Map<string, any> = new Map();
    let userMessages: Map<string, string> = new Map();

    // First pass: collect messages
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.id) {
          messageBuffer.set(event.id, event);
        }
        if (event.type === 'user.message' && event.data?.content) {
          userMessages.set(event.id, event.data.content);
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Second pass: match user + assistant pairs
    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        if (event.type === 'assistant.message' && event.data?.content) {
          const userContent = this.findUserMessage(event, messageBuffer, userMessages);
          
          if (userContent) {
            const analysis = this.analyzeInteraction(
              userContent,
              event.data.content,
              event.data.model || 'unknown',
              event.timestamp
            );
            this.interactions.push(analysis);
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  /**
   * Find corresponding user message via parent chain
   */
  private findUserMessage(
    assistantMsg: any,
    messageBuffer: Map<string, any>,
    userMessages: Map<string, string>
  ): string | null {
    let currentId = assistantMsg.parentId;
    let depth = 0;
    const maxDepth = 20;

    while (currentId && depth < maxDepth) {
      const msg = messageBuffer.get(currentId);
      if (!msg) break;

      // Check if this is a user message
      if (msg.type === 'user.message' && msg.data?.content) {
        return msg.data.content;
      }

      currentId = msg.parentId;
      depth++;
    }

    return null;
  }

  /**
   * Analyze a single interaction
   */
  private analyzeInteraction(
    promptText: string,
    responseText: string,
    model: string,
    timestamp?: string
  ): InteractionAnalysis {
    const taskCategory = this.classifyTask(promptText);
    const promptQuality = this.scorePromptQuality(promptText);
    const modelAppropriate = this.isModelAppropriate(taskCategory, model);
    const modelSuggestion = modelAppropriate ? undefined : this.suggestBetterModel(taskCategory, model);
    const suggestions = this.generateSuggestions(promptText, promptQuality, taskCategory);
    const smartModelRecommendation = this.getSmartModelRecommendation(promptText, taskCategory);

    return {
      promptText: promptText.substring(0, 200),
      responseText: responseText.substring(0, 200),
      model,
      promptLength: promptText.length,
      responseLength: responseText.length,
      taskCategory,
      promptQuality,
      modelAppropriate,
      modelSuggestion,
      timestamp,
      suggestions,
      smartModelRecommendation,
    };
  }

  /**
   * Classify task type from prompt
   */
  private classifyTask(prompt: string): TaskCategory {
    const lower = prompt.toLowerCase();

    // Keywords for each category
    const debuggingKeywords = ['debug', 'error', 'bug', 'fix', 'wrong', 'not working', 'issue', 'problem', 'crash', 'fail'];
    const codeGenKeywords = ['generate', 'create', 'write', 'code', 'function', 'class', 'method', 'implement'];
    const architectureKeywords = ['architecture', 'design', 'pattern', 'structure', 'approach', 'strategy'];
    const refactoringKeywords = ['refactor', 'improve', 'optimize', 'clean up', 'restructure'];
    const testingKeywords = ['test', 'unit test', 'e2e', 'mock', 'spec', 'coverage'];
    const documentationKeywords = ['document', 'comment', 'explain', 'readme', 'wiki', 'comment'];
    const explanationKeywords = ['explain', 'what is', 'how does', 'why', 'describe'];
    const optimizationKeywords = ['optimize', 'performance', 'speed', 'efficient', 'memory'];
    const timeKeywords = ['date', 'time', 'now', 'today', 'tomorrow', 'week', 'month'];

    // Check for matches
    if (debuggingKeywords.some(k => lower.includes(k))) return 'debugging';
    if (codeGenKeywords.some(k => lower.includes(k))) return 'code-generation';
    if (architectureKeywords.some(k => lower.includes(k))) return 'architectural-advice';
    if (refactoringKeywords.some(k => lower.includes(k))) return 'refactoring';
    if (testingKeywords.some(k => lower.includes(k))) return 'testing';
    if (documentationKeywords.some(k => lower.includes(k))) return 'documentation';
    if (optimizationKeywords.some(k => lower.includes(k))) return 'optimization';
    if (timeKeywords.some(k => lower.includes(k))) return 'time-date-query';
    if (explanationKeywords.some(k => lower.includes(k))) return 'explanation';

    return 'unknown';
  }

  /**
   * Score prompt quality
   */
  private scorePromptQuality(prompt: string): PromptQualityScore {
    let clarity = 5;
    let specificity = 5;
    let contextProvided = 5;

    // Clarity scoring
    if (prompt.length < 10) clarity = 2;
    else if (prompt.length > 100) clarity += 2;
    else if (prompt.length > 200) clarity += 1;

    if (prompt.includes('?')) clarity += 1;
    if (prompt.split(' ').length > 15) clarity += 1;
    if (prompt.includes('what') || prompt.includes('how') || prompt.includes('why')) clarity += 1;

    // Specificity scoring
    if (prompt.includes('specific')) specificity += 2;
    if (prompt.includes('error') || prompt.includes('code')) specificity += 2;
    if (prompt.includes('exactly') || prompt.includes('precisely')) specificity += 1;
    if (prompt.match(/[A-Z][a-z]+\w+/g)) specificity += 1; // Code-like identifiers

    // Context provided
    if (prompt.includes('already tried') || prompt.includes('attempted')) contextProvided += 3;
    if (prompt.includes('expected') && prompt.includes('actual')) contextProvided += 3;
    if (prompt.includes('error message') || prompt.includes('stack')) contextProvided += 2;
    if (prompt.includes('file') || prompt.includes('function') || prompt.includes('class')) contextProvided += 1;

    // Vague language penalty
    if (prompt.includes('something')) specificity -= 2;
    if (prompt.includes('thing')) specificity -= 1;
    if (prompt.includes('stuff')) specificity -= 2;
    if (prompt.includes('not sure')) clarity -= 1;

    // Normalize scores to 1-10
    clarity = Math.min(10, Math.max(1, clarity));
    specificity = Math.min(10, Math.max(1, specificity));
    contextProvided = Math.min(10, Math.max(1, contextProvided));

    const overallScore = Math.round((clarity + specificity + contextProvided) / 3);

    return {
      clarity,
      specificity,
      contextProvided,
      overallScore,
    };
  }

  /**
   * Check if model choice is appropriate for task
   */
  private isModelAppropriate(taskCategory: TaskCategory, model: string): boolean {
    const lower = model.toLowerCase();

    // Time/date queries shouldn't use any model
    if (taskCategory === 'time-date-query') return false;

    // Code generation typically needs more capable models
    if (taskCategory === 'code-generation') {
      return lower.includes('gpt-4') || lower.includes('claude-3') || lower.includes('o3');
    }

    // Architectural advice benefits from larger models
    if (taskCategory === 'architectural-advice') {
      return lower.includes('gpt-4') || lower.includes('claude-3') || lower.includes('gemini');
    }

    // Debugging works well with most models
    if (taskCategory === 'debugging') {
      return true;
    }

    // Simple queries can use smaller models
    if (taskCategory === 'factual-query' || taskCategory === 'explanation') {
      return !lower.includes('o1') && !lower.includes('o3'); // Don't use reasoning models for simple queries
    }

    return true;
  }

  /**
   * Suggest better model for task
   */
  private suggestBetterModel(taskCategory: TaskCategory, currentModel: string): string {
    const lower = currentModel.toLowerCase();

    if (taskCategory === 'time-date-query') {
      return 'Use system tools instead of AI';
    }

    if (taskCategory === 'code-generation') {
      if (!lower.includes('gpt-4') && !lower.includes('claude')) {
        return 'GPT-4 or Claude-3.5 for better code quality';
      }
    }

    if (taskCategory === 'debugging') {
      if (lower.includes('3.5')) {
        return 'Consider GPT-4 or Claude-3.5 for complex debugging';
      }
    }

    if (taskCategory === 'architectural-advice') {
      if (!lower.includes('gpt-4') && !lower.includes('claude')) {
        return 'GPT-4 for better architectural insights';
      }
    }

    return '';
  }

  /**
   * Recommend the best model for a prompt based on task type and prompt complexity
   */
  public getSmartModelRecommendation(prompt: string, taskCategory: TaskCategory): SmartModelRecommendation {
    const lowerPrompt = prompt.toLowerCase();
    const isComplex = lowerPrompt.length > 1200 || /stack trace|error:|exception|architecture|design system|migration|refactor/.test(lowerPrompt);

    if (taskCategory === 'debugging') {
      return {
        recommendedModel: 'claude-3.5-sonnet',
        reason: 'Debugging prompts often benefit from strong reasoning and careful, context-aware analysis.',
        costProfile: isComplex ? 'balanced' : 'efficient',
      };
    }

    if (taskCategory === 'architectural-advice') {
      return {
        recommendedModel: 'gpt-4o',
        reason: 'Architecture prompts require higher reasoning quality and broad system-level tradeoff analysis.',
        costProfile: 'premium',
      };
    }

    if (taskCategory === 'code-generation') {
      return {
        recommendedModel: isComplex ? 'gpt-4o' : 'gpt-4o',
        reason: 'Code generation benefits from strong synthesis, consistency, and structured output.',
        costProfile: 'balanced',
      };
    }

    if (taskCategory === 'refactoring' || taskCategory === 'optimization') {
      return {
        recommendedModel: 'gpt-4o',
        reason: 'Refactoring and optimization work best with a capable model that can preserve correctness while improving structure.',
        costProfile: 'balanced',
      };
    }

    if (taskCategory === 'testing') {
      return {
        recommendedModel: 'gpt-4o',
        reason: 'Testing tasks need good reasoning to propose relevant edge cases and precise assertions.',
        costProfile: 'efficient',
      };
    }

    if (taskCategory === 'documentation' || taskCategory === 'explanation' || taskCategory === 'factual-query') {
      return {
        recommendedModel: 'gpt-4o-mini',
        reason: 'These tasks are usually lower complexity and can be handled efficiently with a cheaper model.',
        costProfile: 'efficient',
      };
    }

    if (taskCategory === 'time-date-query') {
      return {
        recommendedModel: 'n/a',
        reason: 'Use a system clock or tool instead of an AI model for current time and date tasks.',
        costProfile: 'efficient',
      };
    }

    return {
      recommendedModel: 'gpt-4o',
      reason: 'This prompt is ambiguous; a capable general-purpose model is the safest default choice.',
      costProfile: 'balanced',
    };
  }

  private buildSmartModelRecommendations(): Record<string, SmartModelRecommendation> {
    const tasks: TaskCategory[] = [
      'debugging',
      'code-generation',
      'architectural-advice',
      'refactoring',
      'testing',
      'documentation',
      'explanation',
      'optimization',
      'factual-query',
      'time-date-query',
      'unknown',
    ];

    const recommendations: Record<string, SmartModelRecommendation> = {};
    for (const task of tasks) {
      recommendations[task] = this.getSmartModelRecommendation(this.getPromptExampleForTask(task), task);
    }

    return recommendations;
  }

  private getPromptExampleForTask(taskCategory: TaskCategory): string {
    switch (taskCategory) {
      case 'debugging':
        return 'My React app crashes with TypeError: Cannot read properties of undefined after login';
      case 'code-generation':
        return 'Generate a TypeScript function that validates email addresses and returns a reusable result object';
      case 'architectural-advice':
        return 'Design a scalable microservice architecture for a checkout workflow with event-driven processing';
      case 'refactoring':
        return 'Refactor this service to reduce duplication and separate validation from business logic';
      case 'testing':
        return 'Write unit tests for the transaction service including edge cases and error handling';
      case 'documentation':
        return 'Document how the API authentication flow works for new developers';
      case 'explanation':
        return 'Explain how async/await works in JavaScript and when to use it';
      case 'optimization':
        return 'Optimize this data processing pipeline to reduce memory usage and latency';
      case 'factual-query':
        return 'What is the difference between a hash map and a tree map in Java';
      case 'time-date-query':
        return 'What is the current date and time in UTC?';
      default:
        return 'Help me decide the best approach for this engineering problem';
    }
  }

  /**
   * Generate improvement suggestions with example prompts
   */
  private generateSuggestions(prompt: string, quality: PromptQualityScore, taskCategory: TaskCategory): string[] {
    const suggestions: string[] = [];

    if (quality.clarity < 6) {
      suggestions.push('🎯 Add more context to clarify your question\n   Better: "I have a React component that displays a list. How do I implement sorting by clicking column headers?"');
    }

    if (quality.specificity < 6) {
      suggestions.push('🎯 Be specific - include error messages or code snippets\n   Better: "I get TypeError: Cannot read property map of undefined on line 45. Here\'s my code: [paste code]"');
    }

    if (quality.contextProvided < 6) {
      suggestions.push('💡 Add what you\'ve tried and expected vs actual results\n   Better: "I tried Array.sort() but it\'s sorting lexicographically. I need numeric sort. Expected: [1,2,10], Got: [1,10,2]"');
    }

    if (taskCategory === 'time-date-query') {
      suggestions.push('⏰ Use system tools for time/date queries\n   Better: Use your computer\'s clock or calendar app instead of asking AI for current time');
    }

    if (prompt.includes('something') || prompt.includes('thing')) {
      suggestions.push('🔍 Replace vague terms with specifics\n   Better: Instead of "fix something", say "fix the login validation to reject passwords shorter than 8 chars"');
    }

    if (prompt.length < 20) {
      suggestions.push('📝 Provide more details and context\n   Better: Expand with your environment, what you\'ve tried, errors encountered');
    }

    if (taskCategory === 'unknown') {
      suggestions.push('🤔 Be clearer about your goal\n   Better: State the problem clearly, what you\'re trying to achieve, and what you\'ve already tried');
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Generate overall analysis
   */
  private generateAnalysis(): UsageAnalysis {
    const taskBreakdown: Record<TaskCategory, number> = {
      'debugging': 0,
      'code-generation': 0,
      'architectural-advice': 0,
      'refactoring': 0,
      'testing': 0,
      'documentation': 0,
      'explanation': 0,
      'optimization': 0,
      'factual-query': 0,
      'time-date-query': 0,
      'unknown': 0,
    };

    const inappropriateModels: Array<{prompt: string; usedModel: string; suggestedModel: string}> = [];
    let totalQuality = 0;
    let totalPromptLength = 0;
    let totalResponseLength = 0;
    let longResponseCount = 0;

    for (const interaction of this.interactions) {
      taskBreakdown[interaction.taskCategory]++;

      totalQuality += interaction.promptQuality.overallScore;
      totalPromptLength += interaction.promptLength;
      totalResponseLength += interaction.responseLength;
      if (interaction.responseLength >= 4000) {
        longResponseCount++;
      }

      if (!interaction.modelAppropriate && interaction.modelSuggestion) {
        inappropriateModels.push({
          prompt: interaction.promptText,
          usedModel: interaction.model,
          suggestedModel: interaction.modelSuggestion,
        });
      }
    }

    const averagePromptQuality = this.interactions.length > 0 
      ? Math.round(totalQuality / this.interactions.length)
      : 0;

    const averageResponseLength = this.interactions.length > 0
      ? Math.round(totalResponseLength / this.interactions.length)
      : 0;

    const averagePromptLength = this.interactions.length > 0
      ? Math.round(totalPromptLength / this.interactions.length)
      : 0;

    const technicalTaskCount =
      taskBreakdown['debugging'] +
      taskBreakdown['code-generation'] +
      taskBreakdown['architectural-advice'] +
      taskBreakdown['refactoring'] +
      taskBreakdown['testing'] +
      taskBreakdown['documentation'] +
      taskBreakdown['optimization'];
    const technicalTaskPercentage = this.interactions.length > 0
      ? Math.round((technicalTaskCount / this.interactions.length) * 100)
      : 0;

    const skillRating = this.calculateSkillRating(taskBreakdown, averagePromptQuality, inappropriateModels.length);
    const overallRecommendations = this.generateRecommendations(taskBreakdown, skillRating, averagePromptQuality);
    const smartModelRecommendations = this.buildSmartModelRecommendations();

    return {
      totalInteractions: this.interactions.length,
      taskBreakdown,
      averagePromptQuality,
      averageResponseLength,
      averagePromptLength,
      estimatedInputTokens: Math.ceil(totalPromptLength / 4),
      estimatedOutputTokens: Math.ceil(totalResponseLength / 4),
      technicalTaskPercentage,
      longResponseCount,
      inappropriateModelCount: inappropriateModels.length,
      inappropriateModels: inappropriateModels.slice(0, 5), // Top 5
      skillRating,
      overallRecommendations,
      smartModelRecommendations,
    };
  }

  /**
   * Calculate skill rating
   */
  private calculateSkillRating(
    taskBreakdown: Record<TaskCategory, number>,
    promptQuality: number,
    inappropriateModelCount: number
  ): SkillRating {
    const strengths: string[] = [];
    const improvement: string[] = [];

    // Debugging skill
    const debuggingCount = taskBreakdown['debugging'] || 0;
    const debuggingSkill = debuggingCount > 2 ? 8 : debuggingCount > 0 ? 6 : 3;
    if (debuggingCount > 2) strengths.push('Strong debugging methodology');
    else improvement.push('Practice more debugging tasks');

    // Prompt crafting skill
    const promptCrafting = Math.round((promptQuality / 10) * 10);
    if (promptCrafting > 7) strengths.push('Clear and specific prompts');
    else improvement.push('Improve prompt clarity and specificity');

    // Task focus
    const techTaskCount = (taskBreakdown['debugging'] || 0) + 
                         (taskBreakdown['code-generation'] || 0) +
                         (taskBreakdown['refactoring'] || 0);
    const timeQueryCount = taskBreakdown['time-date-query'] || 0;
    const totalTasks = Object.values(taskBreakdown).reduce((a, b) => a + b, 0);
    const focusRatio = totalTasks > 0 ? techTaskCount / totalTasks : 0;
    const taskFocus = Math.round(focusRatio * 10);
    
    if (timeQueryCount > 2) improvement.push('Reduce off-topic time/date queries');
    if (focusRatio > 0.75) strengths.push('Focused on technical problem-solving');

    // AI usage efficiency
    const aiUsageEfficiency = inappropriateModelCount === 0 ? 9 : 
                             inappropriateModelCount < 3 ? 7 : 5;
    if (aiUsageEfficiency > 7) strengths.push('Appropriate model selection');
    else improvement.push('Match models better to task requirements');

    const overallScore = Math.round((debuggingSkill + promptCrafting + taskFocus + aiUsageEfficiency) / 4);

    return {
      overallScore,
      debuggingSkill,
      promptCrafting,
      taskFocus,
      aiUsageEfficiency,
      improvement,
      strengths,
    };
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(
    taskBreakdown: Record<TaskCategory, number>,
    skillRating: SkillRating,
    promptQuality: number
  ): string[] {
    const recommendations: string[] = [];

    if (skillRating.overallScore < 5) {
      recommendations.push('Focus on providing more context and being specific in prompts');
    }

    if (promptQuality < 6) {
      recommendations.push('Start prompts with "Expected: X, Actual: Y, Already tried: Z"');
    }

    const techTaskCount = (taskBreakdown['debugging'] || 0) + 
                         (taskBreakdown['code-generation'] || 0) +
                         (taskBreakdown['refactoring'] || 0);
    const timeQueryCount = taskBreakdown['time-date-query'] || 0;

    if (timeQueryCount > 0) {
      recommendations.push(`Reduce off-topic queries (${timeQueryCount} time/date queries detected)`);
    }

    if (techTaskCount > 0) {
      recommendations.push('Your technical problem-solving approach is effective - continue this');
    }

    if (skillRating.aiUsageEfficiency < 7) {
      recommendations.push('Match model capabilities to task complexity better');
    }

    if (skillRating.promptCrafting < 7) {
      recommendations.push('Include error messages and code snippets in debugging prompts');
    }

    return recommendations.slice(0, 4); // Top 4 recommendations
  }

  /**
   * Export analysis as formatted text
   */
  formatAnalysis(analysis: UsageAnalysis): string {
    let output = '=== COPILOT USAGE ANALYSIS ===\n\n';

    output += `📊 OVERALL METRICS\n`;
    output += `Total Interactions: ${analysis.totalInteractions}\n`;
    output += `Average Prompt Quality: ${analysis.averagePromptQuality}/10\n`;
    output += `Estimated Input Tokens: ${analysis.estimatedInputTokens}\n`;
    output += `Estimated Output Tokens: ${analysis.estimatedOutputTokens}\n`;
    output += `Technical Task Focus: ${analysis.technicalTaskPercentage}%\n`;
    output += `Long Responses: ${analysis.longResponseCount}\n`;
    output += `Inappropriate Model Usages: ${analysis.inappropriateModelCount}\n\n`;

    output += `⭐ SKILL RATING: ${analysis.skillRating.overallScore}/10\n`;
    output += `  • Debugging Skill: ${analysis.skillRating.debuggingSkill}/10\n`;
    output += `  • Prompt Crafting: ${analysis.skillRating.promptCrafting}/10\n`;
    output += `  • Task Focus: ${analysis.skillRating.taskFocus}/10\n`;
    output += `  • AI Usage Efficiency: ${analysis.skillRating.aiUsageEfficiency}/10\n\n`;

    output += `💪 STRENGTHS:\n`;
    analysis.skillRating.strengths.forEach(s => output += `  ✓ ${s}\n`);

    output += `\n🚀 AREAS TO IMPROVE:\n`;
    analysis.skillRating.improvement.forEach(i => output += `  • ${i}\n`);

    output += `\n📋 RECOMMENDATIONS:\n`;
    analysis.overallRecommendations.forEach(r => output += `  → ${r}\n`);

    return output;
  }
}
