import * as vscode from 'vscode';
import * as path from 'path';
import { TurnTokenMetrics } from './tokenizerEngine';

/**
 * Session state for accumulated tokens
 */
export interface SessionState {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalSessionTokens: number;
  lastTurnMetrics?: TurnTokenMetrics;
  turnCount: number;
  warningTriggered: boolean;
  trackingDate: string;
  lastPromptPreview?: string;    // First few lines of last prompt
  lastResponsePreview?: string;  // First few lines of last response
  workspaceId?: string;          // Which workspace this turn came from
  promptRating?: number;         // 1-5 star rating for prompt quality
  promptSuggestion?: string;     // AI-generated suggestion for optimization
}

/**
 * TokenViewProvider manages the Webview UI panel
 */
export class TokenViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'copilotTokenInspector.tokenView';

  private webview?: vscode.WebviewView;
  private sessionState: SessionState = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalSessionTokens: 0,
    turnCount: 0,
    warningTriggered: false,
    trackingDate: this.getLocalDateKey(),
  };

  private maxSessionTokenWarning: number = 100000;
  private contextModelMaxTokens: Record<string, number> = {
    'gpt-4o': 128000,
    'gpt-4': 8192,
    'gpt-4-turbo': 128000,
    'o3-mini': 128000,
    'gpt-3.5-turbo': 4096,
    'claude-3.5-sonnet': 200000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'gemini-1.5-pro': 1000000,
    'gemini-1.5-flash': 1000000,
  };

  constructor(
    private context: vscode.ExtensionContext,
    private readonly onViewResolved?: () => void
  ) {
    // Load configuration
    const config = vscode.workspace.getConfiguration('copilotTokenInspector');
    this.maxSessionTokenWarning = config.get('maxSessionTokenWarning') || 100000;

    // Load saved session state if available
    this.loadSessionState();
  }

  /**
   * Webview provider lifecycle method
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.webview = webviewView;

    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getWebviewContent(
      webviewView.webview
    );

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage((message) => {
      this.handleWebviewMessage(message);
    });

    this.onViewResolved?.();
  }

  /**
   * Generate HTML content for the webview
   */
  private getWebviewContent(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Copilot Token Inspector</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 16px;
          }

          .container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .card {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
          }

          .card-header {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-descriptionForeground);
          }

          .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
          }

          .metric-row:last-child {
            border-bottom: none;
          }

          .metric-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
          }

          .metric-value {
            font-size: 14px;
            font-weight: 500;
            font-family: 'Monaco', 'Courier New', monospace;
          }

          .progress-container {
            margin-top: 8px;
          }

          .progress-bar {
            width: 100%;
            height: 6px;
            background-color: var(--vscode-progressBar-background);
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background-color: var(--vscode-inputValidation-errorBackground);
            transition: width 0.3s ease;
          }

          .progress-label {
            font-size: 11px;
            margin-top: 4px;
            color: var(--vscode-descriptionForeground);
          }

          .warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border-left: 4px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 8px;
          }

          .button-group {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }

          button {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--vscode-button-border);
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s ease;
          }

          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }

          button:active {
            background-color: var(--vscode-button-separator);
          }

          .secondary-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }

          .secondary-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }

          .empty-state {
            text-align: center;
            padding: 24px 16px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
          }

          .empty-state-icon {
            font-size: 32px;
            margin-bottom: 8px;
            opacity: 0.5;
          }

          .model-tag {
            display: inline-block;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            margin-top: 4px;
          }

          .estimated-badge {
            display: inline-block;
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 10px;
            margin-left: 4px;
          }

          .highlight {
            color: var(--vscode-notificationLink-foreground);
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Last Turn Card -->
          <div class="card">
            <div class="card-header">Last Turn</div>
            <div id="lastTurnContent">
              <div class="empty-state">
                <div class="empty-state-icon">💤</div>
                <div>No Copilot turns detected yet. Start a conversation to track tokens.</div>
              </div>
            </div>
          </div>

          <!-- Daily Usage -->
          <div class="card">
            <div class="card-header">Today's Usage</div>
            <div id="sessionContent">
              <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div>Waiting for Copilot activity...</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="button-group">
            <button onclick="clearSession()">Clear Session</button>
            <button class="secondary-button" onclick="exportMetrics()">Export</button>
            <button class="secondary-button" onclick="analyzeHistory()">📊 Analyze</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function clearSession() {
            if (confirm('Are you sure you want to clear all session tokens?')) {
              vscode.postMessage({ command: 'resetSession' });
            }
          }

          function exportMetrics() {
            vscode.postMessage({ command: 'exportMetrics' });
          }

          function analyzeHistory() {
            vscode.postMessage({ command: 'analyzeHistory' });
          }

          // Listen for messages from the extension
          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'updateState') {
              updateDisplay(message.payload);
            }
          });

          function updateDisplay(state) {
            updateLastTurn(state);
            updateSessionProgress(state);
          }

          function updateLastTurn(state) {
            const container = document.getElementById('lastTurnContent');
            if (!state.lastTurnMetrics) {
              container.innerHTML = \`
                <div class="empty-state">
                  <div class="empty-state-icon">💤</div>
                  <div>No Copilot turns detected yet.</div>
                </div>
              \`;
              return;
            }

            const metrics = state.lastTurnMetrics;

            let previewHTML = '';
            if (state.lastPromptPreview) {
              const promptPreview = state.lastPromptPreview
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
              const modelName = metrics.model || 'unknown';
              previewHTML += '<div style="margin-bottom: 12px; padding: 8px; background-color: var(--vscode-editor-selectionBackground); border-left: 3px solid var(--vscode-notificationLink-foreground); border-radius: 2px;"><div class="metric-label" style="margin-bottom: 4px;">📝 Prompt <span style="font-size: 10px; color: var(--vscode-descriptionForeground);">[' + modelName + ']</span></div><div style="font-size: 11px; color: var(--vscode-editor-foreground); font-family: monospace; white-space: pre-wrap; word-break: break-word;">' + promptPreview + '</div></div>';
            }
            if (state.lastResponsePreview) {
              const responsePreview = state.lastResponsePreview
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
              previewHTML += '<div style="margin-bottom: 12px; padding: 8px; background-color: var(--vscode-editor-selectionBackground); border-left: 3px solid var(--vscode-terminalAnsiGreen); border-radius: 2px;"><div class="metric-label" style="margin-bottom: 4px;">💬 Response:</div><div style="font-size: 11px; color: var(--vscode-editor-foreground); font-family: monospace; white-space: pre-wrap; word-break: break-word;">' + responsePreview + '</div></div>';
            }

            container.innerHTML = \`
              \${previewHTML}
              <div class="metric-row">
                <span class="metric-label">Input Tokens</span>
                <span class="metric-value">\${metrics.inputTokens.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Output Tokens</span>
                <span class="metric-value">\${metrics.outputTokens.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total</span>
                <span class="metric-value highlight">\${metrics.totalTokens.toLocaleString()}</span>
              </div>
              <div class="progress-label">
                \${metrics.isEstimate ? 'Visible chat token estimate; hidden Copilot context is not included.' : 'Token counts supplied by the Copilot transcript.'}
              </div>
              \${state.promptSuggestion ? \`
                <div style="margin-top: 12px; padding: 8px; background-color: var(--vscode-inputValidation-infoBackground); border-left: 3px solid var(--vscode-inputValidation-infoBorder); border-radius: 2px;">
                  <div class="metric-label" style="margin-bottom: 4px;">💡 Suggestion:</div>
                  <div style="font-size: 12px; color: var(--vscode-editor-foreground); line-height: 1.6; white-space: pre-wrap; word-break: break-word; font-family: monospace;">\${state.promptSuggestion}</div>
                </div>
              \` : ''}
              \${state.promptRating ? \`
                <div style="margin-top: 12px; padding: 8px; background-color: var(--vscode-editor-selectionBackground); border-radius: 2px;">
                  <div class="metric-label" style="margin-bottom: 4px;">⭐ Prompt Quality:</div>
                  <div style="font-size: 14px; letter-spacing: 2px;">\${'★'.repeat(state.promptRating)}\${'☆'.repeat(5 - state.promptRating)}</div>
                </div>
              \` : ''}
            \`;
          }

          function updateSessionProgress(state) {
            const container = document.getElementById('sessionContent');
            if (state.turnCount === 0) {
              container.innerHTML = \`
                <div class="empty-state">
                  <div class="empty-state-icon">📊</div>
                  <div>Waiting for Copilot activity...</div>
                </div>
              \`;
              return;
            }

            const isCritical = state.totalSessionTokens > state.maxSessionTokenWarning;

            let warningHTML = '';
            if (isCritical) {
              warningHTML = \`
                <div class="warning">
                  ⚠️ Today's usage has exceeded \${state.maxSessionTokenWarning.toLocaleString()} tokens.
                </div>
              \`;
            }

            container.innerHTML = \`
              \${warningHTML}
              <div class="metric-row">
                <span class="metric-label">Turns Today</span>
                <span class="metric-value">\${state.turnCount}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Tokens Today</span>
                <span class="metric-value highlight">\${state.totalSessionTokens.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Input / Output Today</span>
                <span class="metric-value">\${state.totalInputTokens.toLocaleString()} / \${state.totalOutputTokens.toLocaleString()}</span>
              </div>
              <div class="progress-label">
                Local date: \${state.trackingDate}. Counts reset automatically at local midnight.
              </div>
            \`;
          }
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Handle messages from the webview
   */
  private handleWebviewMessage(message: { command: string }): void {
    switch (message.command) {
      case 'resetSession':
        this.resetSession();
        break;
      case 'exportMetrics':
        this.exportMetrics();
        break;
      case 'analyzeHistory':
        vscode.commands.executeCommand('copilotTokenInspector.analyzeHistory');
        break;
    }
  }

  /**
   * Set the last run text preview (first few lines of prompt/response)
   */
  public setLastRunText(promptText: string, responseText: string, workspaceId?: string): void {
    // Get first 150 characters or first 3 lines, whichever is shorter
    const getPreview = (text: string, maxChars: number = 150): string => {
      const lines = text.split('\n').slice(0, 3).join('\n').trim();
      if (lines.length > maxChars) {
        return lines.substring(0, maxChars) + '...';
      }
      return lines;
    };

    this.sessionState.lastPromptPreview = getPreview(promptText);
    this.sessionState.lastResponsePreview = getPreview(responseText);
    if (workspaceId) {
      this.sessionState.workspaceId = workspaceId.substring(0, 8) + '...';
    }
  }

  /**
   * Update session state with new turn metrics
   */
  public updateWithTurnMetrics(metrics: TurnTokenMetrics): void {
    this.resetDailyUsageIfNeeded();

    this.sessionState.totalInputTokens += metrics.inputTokens;
    this.sessionState.totalOutputTokens += metrics.outputTokens;
    this.sessionState.totalSessionTokens += metrics.totalTokens;
    this.sessionState.lastTurnMetrics = metrics;
    this.sessionState.turnCount += 1;

    // Generate prompt rating and suggestion based on prompt quality
    this.generatePromptAnalysis(this.sessionState.lastPromptPreview || '');

    // Check warning threshold
    if (
      !this.sessionState.warningTriggered &&
      this.sessionState.totalSessionTokens > this.maxSessionTokenWarning
    ) {
      this.sessionState.warningTriggered = true;
      vscode.window.showWarningMessage(
        `Copilot Token Inspector: Session tokens exceed ${this.maxSessionTokenWarning.toLocaleString()} threshold!`
      );
    }

    // Save state
    this.saveSessionState();

    // Update webview
    this.updateWebview();
  }

  /**
   * Update webview display
   */
  private updateWebview(): void {
    if (this.webview) {
      const stateToSend = {
        ...this.sessionState,
        maxSessionTokenWarning: this.maxSessionTokenWarning,
      };

      // Send message immediately without delay for real-time updates
      this.webview.webview.postMessage({
        command: 'updateState',
        payload: stateToSend,
      });
    }
  }

  /**
   * Generate prompt rating and optimization suggestions
   */
  private generatePromptAnalysis(promptText: string): void {
    // Rate the prompt quality based on various factors
    let rating = 3; // Default middle rating

    // Check for clarity indicators
    if (promptText.length > 100) {
      rating = 4; // Longer prompts are often more detailed
    }
    if (promptText.length > 300) {
      rating = 5; // Very detailed prompts
    }

    // Check for question marks (well-formulated questions)
    if ((promptText.match(/\?/g) || []).length > 0) {
      rating = Math.min(5, rating + 1);
    }

    // Check for specific keywords that indicate good prompts
    const goodKeywords = ['explain', 'analyze', 'compare', 'implement', 'fix', 'optimize', 'test'];
    const hasGoodKeywords = goodKeywords.some(keyword =>
      promptText.toLowerCase().includes(keyword)
    );
    if (hasGoodKeywords) {
      rating = Math.min(5, rating + 1);
    }

    // Provide suggestions for improvement
    let suggestion = '';
    if (promptText.length < 50) {
      suggestion = 'Add more context to your prompt for better results. Include specific details about what you want to achieve.';
    } else if (promptText.includes('plz') || promptText.includes('pls')) {
      suggestion = 'Use complete words (e.g., "please" instead of "plz") for clearer communication with the AI.';
    } else if (!promptText.match(/[.!?]$/)) {
      suggestion = 'Consider ending your prompt with a punctuation mark for better clarity.';
    } else if (promptText.toLowerCase().includes('todo') || promptText.toLowerCase().includes('something')) {
      suggestion = 'Be more specific about what you need. Replace vague terms with concrete descriptions.';
    } else {
      suggestion = 'Your prompt is well-structured! Keep providing clear, specific requests for best results.';
    }

    this.sessionState.promptRating = Math.max(1, Math.min(5, rating));
    this.sessionState.promptSuggestion = suggestion;
  }

  /**
   * Reset session state
   */
  private resetSession(): void {
    this.sessionState = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalSessionTokens: 0,
      turnCount: 0,
      warningTriggered: false,
      trackingDate: this.getLocalDateKey(),
    };
    this.saveSessionState();
    this.updateWebview();
    vscode.window.showInformationMessage('Copilot Token Inspector: Session cleared');
  }

  /**
   * Export metrics to file
   */
  private exportMetrics(): void {
    const timestamp = new Date().toISOString();
    const filename = `token-metrics-${timestamp.replace(/[:.]/g, '-')}.json`;
    const data = JSON.stringify(
      {
        exportedAt: timestamp,
        sessionState: this.sessionState,
      },
      null,
      2
    );

    const uri = vscode.Uri.file(
      path.join(this.context.globalStoragePath, filename)
    );
    vscode.workspace.fs.writeFile(uri, Buffer.from(data)).then(() => {
      vscode.window.showInformationMessage(
        `Metrics exported to ${uri.fsPath}`
      );
    });
  }

  /**
   * Save session state to storage
   */
  private saveSessionState(): void {
    this.context.globalState.update('copilotTokenInspector.sessionState', this.sessionState);
  }

  /**
   * Load session state from storage
   */
  private loadSessionState(): void {
    const saved = this.context.globalState.get<SessionState>(
      'copilotTokenInspector.sessionState'
    );
    if (saved) {
      this.sessionState = saved;
      this.resetDailyUsageIfNeeded();
    }
  }

  /**
   * Generate a date key using the user's local time zone.
   */
  private getLocalDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Reset counters when a new local calendar day begins.
   */
  private resetDailyUsageIfNeeded(): void {
    const currentDate = this.getLocalDateKey();
    if (this.sessionState.trackingDate === currentDate) {
      return;
    }

    this.sessionState.totalInputTokens = 0;
    this.sessionState.totalOutputTokens = 0;
    this.sessionState.totalSessionTokens = 0;
    this.sessionState.turnCount = 0;
    this.sessionState.warningTriggered = false;
    this.sessionState.trackingDate = currentDate;
  }

  /**
   * Get current session state
   */
  public getSessionState(): SessionState {
    return { ...this.sessionState };
  }
}
