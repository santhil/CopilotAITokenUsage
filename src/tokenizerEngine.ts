let tiktokenLib: any = null;

try {
  tiktokenLib = require('tiktoken');
} catch (error) {
  console.warn('[TokenCalculator] tiktoken unavailable; falling back to heuristic token counting.', error instanceof Error ? error.message : error);
}

/**
 * Represents token metrics for a turn
 */
export interface TurnTokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  isEstimate: boolean;
}

/**
 * Pricing rates per 1M tokens
 */
interface PricingRates {
  inputPer1M: number;
  outputPer1M: number;
}

/**
 * TokenCalculator handles token counting across multiple model families
 */
export class TokenCalculator {
  private modelPricingRates: Record<string, PricingRates> = {
    'gpt-4o': { inputPer1M: 5.0, outputPer1M: 15.0 },
    'gpt-4': { inputPer1M: 30.0, outputPer1M: 60.0 },
    'gpt-4-turbo': { inputPer1M: 10.0, outputPer1M: 30.0 },
    'o3-mini': { inputPer1M: 0.2, outputPer1M: 0.8 },
    'gpt-3.5-turbo': { inputPer1M: 0.5, outputPer1M: 1.5 },
    'claude-3.5-sonnet': { inputPer1M: 3.0, outputPer1M: 15.0 },
    'claude-3-opus': { inputPer1M: 15.0, outputPer1M: 75.0 },
    'claude-3-sonnet': { inputPer1M: 3.0, outputPer1M: 15.0 },
    'claude-3-haiku': { inputPer1M: 0.8, outputPer1M: 4.0 },
    'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.0 },
    'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  };

  constructor() {
    // TokenCalculator initialized
  }

  /**
   * Calculate token metrics for a turn
   */
  public calculateMetrics(
    promptText: string,
    responseText: string,
    model: string,
    rawInputTokens?: number,
    rawOutputTokens?: number
  ): TurnTokenMetrics {
    let inputTokens = rawInputTokens || 0;
    let outputTokens = rawOutputTokens || 0;
    let isEstimate = !rawInputTokens || !rawOutputTokens;

    // If raw tokens not provided, calculate using model-specific tokenizers
    if (!rawInputTokens) {
      inputTokens = this.countInputTokens(promptText, model);
    }
    if (!rawOutputTokens) {
      outputTokens = this.countOutputTokens(responseText, model);
    }

    const totalTokens = inputTokens + outputTokens;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      model,
      isEstimate,
    };
  }

  /**
   * Count input tokens for a model
   */
  private countInputTokens(text: string, model: string): number {
    if (this.isOpenAIModel(model)) {
      return this.countOpenAITokens(text, model);
    } else if (this.isAnthropicModel(model)) {
      return this.countAnthropicTokens(text);
    } else {
      // Fallback: character-based estimation (~4 chars per token)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Count output tokens for a model
   */
  private countOutputTokens(text: string, model: string): number {
    // Same logic applies to output
    return this.countInputTokens(text, model);
  }

  /**
   * Check if model is from OpenAI
   */
  private isOpenAIModel(model: string): boolean {
    return (
      model.includes('gpt-') ||
      model.includes('o1') ||
      model.includes('o3') ||
      model.startsWith('text-davinci')
    );
  }

  /**
   * Check if model is from Anthropic
   */
  private isAnthropicModel(model: string): boolean {
    return model.includes('claude');
  }

  /**
   * Count tokens using tiktoken (OpenAI models)
   */
  private countOpenAITokens(text: string, model: string): number {
    if (!tiktokenLib) {
      return Math.ceil(text.length / 4);
    }

    try {
      let encoding: any;

      // Determine appropriate encoding based on model
      if (model.includes('o200k') || model.includes('o1') || model.includes('o3')) {
        encoding = tiktokenLib.get_encoding('o200k_base');
      } else {
        encoding = tiktokenLib.get_encoding('cl100k_base');
      }

      const tokens = encoding.encode(text);
      if (typeof encoding.free === 'function') {
        encoding.free();
      }
      return tokens.length;
    } catch (error) {
      console.warn(
        `Failed to count OpenAI tokens: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      // Fallback to character-based estimation
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Count tokens using Anthropic tokenizer
   */
  private countAnthropicTokens(text: string): number {
    try {
      // Fallback to character-based estimation (~4 chars per token)
      // In production, would use @anthropic-ai/tokenizer when available
      return Math.ceil(text.length / 4);
    } catch (error) {
      console.warn(
        `Failed to count Anthropic tokens: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      // Fallback to character-based estimation
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Find closest matching model pricing rates
   */
  private findClosestModelRates(
    model: string
  ): PricingRates | undefined {
    for (const [key, rates] of Object.entries(this.modelPricingRates)) {
      if (model.toLowerCase().includes(key.toLowerCase())) {
        return rates;
      }
    }
    return undefined;
  }

  /**
   * Update pricing rates (for configuration changes)
   */
  public updatePricingRates(model: string, rates: PricingRates): void {
    this.modelPricingRates[model] = rates;
  }

  /**
   * Get all supported models with their pricing
   */
  public getSupportedModels(): Record<string, PricingRates> {
    return { ...this.modelPricingRates };
  }
}
