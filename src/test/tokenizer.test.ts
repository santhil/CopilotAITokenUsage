import * as assert from 'assert';
import { PromptAnalyzer } from '../promptAnalyzer';
import { CopilotLogWatcher } from '../telemetryWatcher';
import { TokenCalculator } from '../tokenizerEngine';

describe('PromptAnalyzer smart model recommendations', () => {
  it('should recommend Claude for debugging prompts', () => {
    const analyzer = new PromptAnalyzer('dummy.jsonl');
    const recommendation = analyzer.getSmartModelRecommendation(
      'My React app crashes after login with TypeError: Cannot read property map of undefined',
      'debugging'
    );

    assert.strictEqual(recommendation.recommendedModel, 'claude-3.5-sonnet');
    assert.ok(recommendation.reason.toLowerCase().includes('debugging'));
  });

  it('should recommend GPT-4o for architectural advice', () => {
    const analyzer = new PromptAnalyzer('dummy.jsonl');
    const recommendation = analyzer.getSmartModelRecommendation(
      'Design a scalable event-driven architecture for a payment service',
      'architectural-advice'
    );

    assert.strictEqual(recommendation.recommendedModel, 'gpt-4o');
    assert.ok(recommendation.reason.toLowerCase().includes('architecture'));
  });
});

describe('Copilot model detection', () => {
  it('should not invent a model when transcript has no model metadata', () => {
    const watcher = new CopilotLogWatcher('fake-path', 'workspace-1');
    const detectedModel = (watcher as any).detectCurrentModel();

    assert.strictEqual(detectedModel, 'unknown');
  });
});

describe('TokenCalculator', () => {
  let calculator: TokenCalculator;

  beforeEach(() => {
    calculator = new TokenCalculator();
  });

  it('should count tokens for OpenAI models', () => {
    const metrics = calculator.calculateMetrics(
      'Hello world',
      'This is a response',
      'gpt-4o'
    );

    assert.ok(metrics.inputTokens > 0);
    assert.ok(metrics.outputTokens > 0);
    assert.ok(metrics.totalTokens > 0);
  });

  it('should calculate tokens for GPT-4o', () => {
    const metrics = calculator.calculateMetrics(
      'test',
      'response',
      'gpt-4o',
      100,
      200
    );

    assert.strictEqual(metrics.inputTokens, 100);
    assert.strictEqual(metrics.outputTokens, 200);
    assert.strictEqual(metrics.totalTokens, 300);
  });

  it('should handle empty strings', () => {
    const metrics = calculator.calculateMetrics('', '', 'gpt-4o');
    assert.strictEqual(metrics.inputTokens, 0);
    assert.strictEqual(metrics.outputTokens, 0);
  });

  it('should use raw tokens if provided', () => {
    const metrics = calculator.calculateMetrics(
      'prompt',
      'response',
      'gpt-4o',
      100,
      50
    );

    assert.strictEqual(metrics.inputTokens, 100);
    assert.strictEqual(metrics.outputTokens, 50);
  });

  it('should support Claude models', () => {
    const metrics = calculator.calculateMetrics(
      'hello',
      'hi there',
      'claude-3.5-sonnet'
    );

    assert.ok(metrics.inputTokens >= 0);
    assert.ok(metrics.outputTokens >= 0);
  });

  it('should list supported models', () => {
    const models = calculator.getSupportedModels();
    assert.ok(Object.keys(models).length > 0);
  });

  it('should calculate credits', () => {
    const metrics = calculator.calculateMetrics(
      'test',
      'response',
      'gpt-4o',
      50,
      100
    );

    assert.ok(metrics.totalTokens > 0);
  });
});

describe('Session Management', () => {
  it('should accumulate tokens across turns', () => {
    const calculator = new TokenCalculator();
    let total = 0;

    for (let i = 0; i < 3; i++) {
      const metrics = calculator.calculateMetrics(
        'prompt',
        'response',
        'gpt-4o'
      );
      total += metrics.totalTokens;
    }

    assert.ok(total > 0);
  });

  it('should reset state properly', () => {
    const calc1 = new TokenCalculator();
    const metric1 = calc1.calculateMetrics('test', 'response', 'gpt-4o');

    const calc2 = new TokenCalculator();
    const metric2 = calc2.calculateMetrics('test', 'response', 'gpt-4o');

    assert.strictEqual(metric1.totalTokens, metric2.totalTokens);
  });
});
