import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CopilotLogWatcher, TurnCompletedPayload, setOutputChannel } from './telemetryWatcher';
import { TokenCalculator } from './tokenizerEngine';
import { TokenViewProvider } from './tokenViewProvider';
import { PromptAnalyzer } from './promptAnalyzer';

let logWatchers: Map<string, CopilotLogWatcher> = new Map(); // Multi-workspace support
let tokenCalculator: TokenCalculator | null = null;
let tokenViewProvider: TokenViewProvider | null = null;
let analysisWebviewPanel: vscode.WebviewPanel | null = null;
let outputChannel: vscode.OutputChannel | null = null;
let logWatchersInitialized = false;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Copilot AI Token Inspector');
  setOutputChannel(outputChannel);

  // Initialize components
  initializeTokenCalculator(context);
  initializeTokenViewProvider(context);
  registerCommands(context);
  registerConfigurationWatcher(context);

  logWatchersInitialized = true;
  initializeCopilotLogWatcher(context);
  context.subscriptions.push({ dispose: stopAllLogWatchers });
}

/**
 * Initialize token calculator
 */
function initializeTokenCalculator(context: vscode.ExtensionContext): void {
  tokenCalculator = new TokenCalculator();
}

/**
 * Initialize token view provider (webview)
 */
function initializeTokenViewProvider(
  context: vscode.ExtensionContext
): void {
  tokenViewProvider = new TokenViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TokenViewProvider.viewType,
      tokenViewProvider
    )
  );
}

/**
 * Auto-detect all Copilot log paths across all workspaces
 */
function getVsCodeStoragePaths(): string[] {
  const productDirectories = ['Code', 'Code - Insiders'];
  let basePath: string;

  switch (process.platform) {
    case 'win32':
      basePath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      break;
    case 'darwin':
      basePath = path.join(os.homedir(), 'Library', 'Application Support');
      break;
    default:
      basePath = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
      break;
  }

  const paths = productDirectories.map((directory) =>
    path.join(basePath, directory, 'User', 'workspaceStorage')
  );
  const portablePath = process.env.VSCODE_PORTABLE;
  if (portablePath) {
    paths.unshift(path.join(portablePath, 'user-data', 'User', 'workspaceStorage'));
  }

  return paths;
}

function autoDetectAllCopilotLogPaths(): Map<string, string> {
  const workspacePaths = new Map<string, string>();
  
  try {
    for (const storagePath of getVsCodeStoragePaths()) {
      if (!fs.existsSync(storagePath)) {
        continue;
      }

      for (const workspace of fs.readdirSync(storagePath)) {
        const transcriptsPath = path.join(
          storagePath,
          workspace,
          'GitHub.copilot-chat',
          'transcripts'
        );
        if (fs.existsSync(transcriptsPath)) {
          const workspaceId = `${path.basename(path.dirname(path.dirname(storagePath)))}-${workspace}`;
          workspacePaths.set(workspaceId, transcriptsPath);
        }
      }
    }

    return workspacePaths;
  } catch (error) {
    return workspacePaths;
  }
}

/**
 * Auto-detect single Copilot log path (backwards compatibility)
 */
function autoDetectCopilotLogPath(): string {
  return autoDetectAllCopilotLogPaths().values().next().value || '';
}

/**
 * Get the current model being used (from settings or Copilot config)
 */
function getCurrentModel(): string {
  try {
    // Try to get from Copilot settings
    const copilotConfig = vscode.workspace.getConfiguration('github.copilot');
    const copilotModel = copilotConfig.get<string>('preferredModel');
    if (copilotModel) {
      return copilotModel;
    }
  } catch (e) {
    // Fallback if settings don't exist
  }

  try {
    // Try Copilot Chat settings
    const chatConfig = vscode.workspace.getConfiguration('github.copilot-chat');
    const chatModel = chatConfig.get<string>('selectedModel');
    if (chatModel) {
      return chatModel;
    }
  } catch (e) {
    // Fallback
  }

  // Try our extension settings
  const config = vscode.workspace.getConfiguration('copilotTokenInspector');
  return config.get<string>('defaultModelEncoding', 'gpt-4o');
}

/**
 * Show analysis results in a webview panel
 */
function showAnalysisPanel(context: vscode.ExtensionContext, analysis: any): void {
  // Reuse existing panel or create new one
  if (analysisWebviewPanel) {
    analysisWebviewPanel.reveal(vscode.ViewColumn.Beside);
  } else {
    analysisWebviewPanel = vscode.window.createWebviewPanel(
      'copilotAnalysisPanel',
      'Copilot Usage Analysis',
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    );
    analysisWebviewPanel.onDidDispose(() => {
      analysisWebviewPanel = null;
    });
  }

  // Generate HTML content
  analysisWebviewPanel.webview.html = generateAnalysisHTML(analysis);
}

/**
 * Initialize Copilot log watchers for all workspaces
 */
function initializeCopilotLogWatcher(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('copilotTokenInspector');
  const configuredPath = config.get<string>('otelTraceFilePath', '');

  // If a single path is configured, use backwards-compatible mode
  if (configuredPath) {
    initializeSingleWatcher(context, configuredPath, 'configured');
    return;
  }

  // Auto-detect all workspaces
  const workspacePaths = autoDetectAllCopilotLogPaths();

  if (workspacePaths.size === 0) {
    vscode.window.showWarningMessage(
      'Copilot Token Inspector: No Copilot chat history found in any workspace. Please ensure you have used Copilot Chat in at least one VS Code workspace.',
      'Open Settings'
    ).then((selection) => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'copilotTokenInspector.otelTraceFilePath'
        );
      }
    });
    return;
  }

  // Initialize a watcher for each workspace
  for (const [workspaceId, transcriptsPath] of workspacePaths) {
    initializeSingleWatcher(context, transcriptsPath, workspaceId);
  }

}

/**
 * Initialize a single log watcher for a specific workspace
 */
function initializeSingleWatcher(
  context: vscode.ExtensionContext,
  transcriptsPath: string,
  workspaceId: string
): void {
  try {
    if (!fs.existsSync(transcriptsPath)) {
      return;
    }

    const watcher = new CopilotLogWatcher(transcriptsPath, workspaceId);
    logWatchers.set(workspaceId, watcher);

    // Listen for turn completion events from this workspace
    watcher.on('turnCompleted', (payload: TurnCompletedPayload) => {
      handleTurnCompleted(context, payload);
    });

    // Start watching
    watcher.start();

    vscode.window.showInformationMessage(
      `Copilot Token Inspector: Watching workspace ${workspaceId.substring(0, 8)}...`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showWarningMessage(
      `Copilot Token Inspector: Could not initialize watcher for ${workspaceId} - ${message}`
    );
  }
}

function stopAllLogWatchers(): void {
  for (const watcher of logWatchers.values()) {
    watcher.stop();
  }
  logWatchers.clear();
}

/**
 * Handle a completed turn
 */
function handleTurnCompleted(
  context: vscode.ExtensionContext,
  payload: TurnCompletedPayload
): void {
  if (!tokenCalculator || !tokenViewProvider) {
    return;
  }

  // Calculate metrics
  const metrics = tokenCalculator.calculateMetrics(
    payload.promptText,
    payload.responseText,
    payload.model,
    payload.inputTokens,
    payload.outputTokens
  );

  // Store the last run text preview and workspace info
  tokenViewProvider.setLastRunText(payload.promptText, payload.responseText, payload.workspaceId);

  // Update session state and webview
  tokenViewProvider.updateWithTurnMetrics(metrics);

  // Show notification for first turn
  const sessionState = tokenViewProvider.getSessionState();
  if (sessionState.turnCount === 1) {
    vscode.window.showInformationMessage(
      `Copilot Token Inspector tracking started - Model: ${metrics.model}`
    );
  }
}

/**
 * Generate HTML for analysis panel
 */
function generateAnalysisHTML(analysis: any): string {
  const skillStars = (score: number) => {
    const fullStars = Math.round(score / 2);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  const taskBreakdownHTML = Object.entries(analysis.taskBreakdown)
    .filter(([_, count]: any) => count > 0)
    .map(([task, count]: any) => 
      `<div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>${task}</span>
        <strong>${count}</strong>
      </div>`
    )
    .join('');

  const modelDistHTML = Object.entries(analysis.modelDistribution)
    .map(([model, count]: any) => 
      `<div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>${model}</span>
        <strong>${count}</strong>
      </div>`
    )
    .join('');

  const inappropriateHTML = analysis.inappropriateModels.length > 0
    ? analysis.inappropriateModels
        .map((item: any) => `
          <div style="background-color: var(--vscode-inputValidation-warningBackground); border-left: 3px solid var(--vscode-inputValidation-warningBorder); padding: 8px; margin: 8px 0; border-radius: 2px;">
            <div style="font-size: 12px; margin-bottom: 4px;"><strong>❌ Wrong Model:</strong></div>
            <div style="font-size: 11px; margin-bottom: 6px; opacity: 0.9;">Prompt: ${item.prompt.substring(0, 100)}...</div>
            <div style="font-size: 11px; margin-bottom: 4px;"><strong>Used:</strong> ${item.usedModel}</div>
            <div style="font-size: 11px;"><strong>Suggested:</strong> ${item.suggestedModel}</div>
          </div>
        `)
        .join('')
    : '<div style="text-align: center; opacity: 0.7; padding: 16px;">✅ All model selections were appropriate!</div>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          padding: 20px;
          margin: 0;
          line-height: 1.6;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid var(--vscode-focusBorder);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 8px 0;
        }
        .subtitle {
          color: var(--vscode-descriptionForeground);
          font-size: 14px;
          margin: 0;
        }
        .metric-card {
          background-color: var(--vscode-panel-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .metric-card h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--vscode-descriptionForeground);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .skill-rating {
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          margin: 16px 0;
          color: var(--vscode-notificationLink-foreground);
        }
        .skill-breakdown {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .skill-item {
          background-color: var(--vscode-editor-background);
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid var(--vscode-progressBar-background);
        }
        .skill-item-label {
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          margin-bottom: 4px;
        }
        .skill-item-score {
          font-size: 18px;
          font-weight: bold;
        }
        .strengths, .improvements {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .strengths li, .improvements li {
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
        }
        .strengths li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--vscode-testing-iconPassed);
          font-weight: bold;
        }
        .improvements li:before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--vscode-inputValidation-warningBorder);
          font-weight: bold;
        }
        .recommendations {
          background-color: var(--vscode-inputValidation-infoBackground);
          border-left: 4px solid var(--vscode-inputValidation-infoBorder);
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .recommendations h4 {
          margin: 0 0 8px 0;
          color: var(--vscode-inputValidation-infoForeground);
        }
        .recommendations ol {
          margin: 0;
          padding-left: 20px;
        }
        .recommendations li {
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">📊 AI Prompting Analysis Report</h1>
          <p class="subtitle">Detailed analysis of ${analysis.totalInteractions} interactions</p>
        </div>

        <!-- Overall Skill Rating -->
        <div class="metric-card">
          <h3>⭐ Overall Skill Rating</h3>
          <div class="skill-rating">${analysis.skillRating.overallScore}/10</div>
          <div class="skill-breakdown">
            <div class="skill-item">
              <div class="skill-item-label">Debugging</div>
              <div class="skill-item-score">${analysis.skillRating.debuggingSkill}/10 ${skillStars(analysis.skillRating.debuggingSkill)}</div>
            </div>
            <div class="skill-item">
              <div class="skill-item-label">Prompt Crafting</div>
              <div class="skill-item-score">${analysis.skillRating.promptCrafting}/10 ${skillStars(analysis.skillRating.promptCrafting)}</div>
            </div>
            <div class="skill-item">
              <div class="skill-item-label">Task Focus</div>
              <div class="skill-item-score">${analysis.skillRating.taskFocus}/10 ${skillStars(analysis.skillRating.taskFocus)}</div>
            </div>
            <div class="skill-item">
              <div class="skill-item-label">AI Efficiency</div>
              <div class="skill-item-score">${analysis.skillRating.aiUsageEfficiency}/10 ${skillStars(analysis.skillRating.aiUsageEfficiency)}</div>
            </div>
          </div>
        </div>

        <!-- Strengths -->
        <div class="metric-card">
          <h3>💪 Strengths</h3>
          <ul class="strengths">
            ${analysis.skillRating.strengths.map((s: string) => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <!-- Areas to Improve -->
        <div class="metric-card">
          <h3>🚀 Areas to Improve</h3>
          <ul class="improvements">
            ${analysis.skillRating.improvement.map((i: string) => `<li>${i}</li>`).join('')}
          </ul>
        </div>

        <!-- Recommendations -->
        <div class="recommendations">
          <h4>📋 Key Recommendations</h4>
          <ol>
            ${analysis.overallRecommendations.map((r: string) => `<li>${r}</li>`).join('')}
          </ol>
        </div>

        <!-- Copilot Usage Snapshot -->
        <div class="metric-card">
          <h3>⚡ Copilot Usage Snapshot</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Estimated Input Tokens</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.estimatedInputTokens.toLocaleString()}</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Estimated Output Tokens</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.estimatedOutputTokens.toLocaleString()}</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Technical Task Focus</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.technicalTaskPercentage}%</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Most Used Model</div>
              <div style="font-size: 16px; font-weight: bold; word-break: break-word;">${analysis.mostUsedModel || 'Unknown'}</div>
            </div>
          </div>
          <div style="margin-top: 12px; color: var(--vscode-descriptionForeground); font-size: 12px;">
            Token values are estimates based on transcript text length and are not Copilot billing totals.
          </div>
        </div>

        <!-- Task Breakdown -->
        <div class="metric-card">
          <h3>📑 Task Breakdown</h3>
          ${taskBreakdownHTML}
        </div>

        <!-- Model Distribution -->
        <div class="metric-card">
          <h3>🤖 Model Distribution</h3>
          ${modelDistHTML}
        </div>

        <!-- Inappropriate Model Usage -->
        <div class="metric-card">
          <h3>⚠️ Model Selection Review</h3>
          ${inappropriateHTML}
        </div>

        <!-- Summary Stats -->
        <div class="metric-card">
          <h3>📊 Summary Statistics</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Total Interactions</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.totalInteractions}</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Avg Prompt Quality</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.averagePromptQuality}/10</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Avg Response Size</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.averageResponseLength.toLocaleString()} chars</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Avg Prompt Size</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.averagePromptLength.toLocaleString()} chars</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Long Responses</div>
              <div style="font-size: 20px; font-weight: bold;">${analysis.longResponseCount}</div>
            </div>
            <div>
              <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Model Issues Found</div>
              <div style="font-size: 20px; font-weight: bold; color: var(--vscode-inputValidation-warningBorder);">${analysis.inappropriateModelCount}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Register extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Reset session command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'copilotTokenInspector.resetSession',
      () => {
        if (tokenViewProvider) {
          const sessionState = tokenViewProvider.getSessionState();
          vscode.window.showInformationMessage(
            `Session cleared. Previous session: ${sessionState.turnCount} turns, ${sessionState.totalSessionTokens.toLocaleString()} tokens`
          );
        }
      }
    )
  );

  // Export metrics command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'copilotTokenInspector.exportMetrics',
      () => {
        if (tokenViewProvider) {
          const sessionState = tokenViewProvider.getSessionState();
          vscode.window.showInformationMessage(
            `Exported metrics: ${sessionState.turnCount} turns, ${sessionState.totalSessionTokens.toLocaleString()} tokens`
          );
        }
      }
    )
  );

  // Analyze chat history command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'copilotTokenInspector.analyzeHistory',
      async () => {
        try {
          const transcriptPath = autoDetectCopilotLogPath();
          if (!transcriptPath) {
            vscode.window.showErrorMessage('No Copilot chat history found');
            return;
          }

          // Get the most recent transcript file
          const files = fs.readdirSync(transcriptPath).filter(f => f.endsWith('.jsonl'));
          if (files.length === 0) {
            vscode.window.showErrorMessage('No transcript files found');
            return;
          }

          files.sort((a, b) => {
            const aTime = fs.statSync(path.join(transcriptPath, a)).mtimeMs;
            const bTime = fs.statSync(path.join(transcriptPath, b)).mtimeMs;
            return bTime - aTime;
          });

          const latestFile = path.join(transcriptPath, files[0]);
          
          vscode.window.showInformationMessage('📊 Analyzing chat history...');
          
          const analyzer = new PromptAnalyzer(latestFile);
          const analysis = await analyzer.analyzeTranscript();
          
          // Show analysis in a webview panel
          showAnalysisPanel(context, analysis);
          
          // Show summary message
          const skillLevel = analysis.skillRating.overallScore >= 8 ? '⭐⭐⭐⭐⭐' :
                            analysis.skillRating.overallScore >= 6 ? '⭐⭐⭐⭐' :
                            analysis.skillRating.overallScore >= 4 ? '⭐⭐⭐' : '⭐⭐';
          
          vscode.window.showInformationMessage(
            `📊 Analysis Complete! Skill Rating: ${analysis.skillRating.overallScore}/10 ${skillLevel}`
          );
        } catch (error) {
          console.error('Error analyzing chat history:', error);
          vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        }
      }
    )
  );

  // Test with demo data command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'copilotTokenInspector.testWithDemoData',
      () => {
        const demoPayload: TurnCompletedPayload = {
          promptText: 'What is the best way to implement caching in TypeScript?',
          responseText: 'Caching is a technique to store frequently accessed data to improve performance. In TypeScript, you can implement caching using:\n\n1. In-Memory Cache: Store data in a Map or object\n2. LRU Cache: Implement Least Recently Used eviction policy\n3. External Cache: Use Redis or Memcached\n\nHere is an example of a simple in-memory cache:',
          model: 'gpt-4o',
          inputTokens: 45,
          outputTokens: 250,
          timestamp: Date.now()
        };

        handleTurnCompleted(context, demoPayload);
        vscode.window.showInformationMessage(
          'Demo turn processed! Check the Token Inspector to see the results.'
        );
      }
    )
  );

  // Show config command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'copilotTokenInspector.showConfig',
      () => {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'copilotTokenInspector'
        );
      }
    )
  );
}

/**
 * Register configuration change watcher
 */
function registerConfigurationWatcher(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('copilotTokenInspector')) {
        const config = vscode.workspace.getConfiguration('copilotTokenInspector');

        // Reinitialize log watcher if path changed
        if (event.affectsConfiguration('copilotTokenInspector.otelTraceFilePath')) {
          stopAllLogWatchers();
          initializeCopilotLogWatcher(context);
          vscode.window.showInformationMessage(
            'Copilot Token Inspector: Log watcher reinitialized'
          );
        }

        // Reload pricing if model encoding changed
        if (
          event.affectsConfiguration(
            'copilotTokenInspector.defaultModelEncoding'
          )
        ) {
          vscode.window.showInformationMessage(
            'Copilot Token Inspector: Model encoding updated'
          );
        }
      }
    })
  );
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  stopAllLogWatchers();
}
