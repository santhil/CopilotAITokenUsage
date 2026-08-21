import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';

let chokidarLib: any = null;

try {
  chokidarLib = require('chokidar');
} catch (error) {
  console.warn('[CopilotLogWatcher] chokidar unavailable; log watching is disabled.', error instanceof Error ? error.message : error);
}

// Global output channel for logging
let globalOutputChannel: vscode.OutputChannel | null = null;

export function setOutputChannel(channel: vscode.OutputChannel): void {
  globalOutputChannel = channel;
}

function log(message: string): void {
  if (globalOutputChannel) {
    globalOutputChannel.appendLine(message);
  }
}

/**
 * Payload passed when a turn completes
 */
export interface TurnCompletedPayload {
  promptText: string;
  responseText: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  timestamp: number;
  workspaceId?: string; // Which workspace this chat came from
}

/**
 * Represents an OTel span or log entry
 */
interface OTelSpan {
  name: string;
  attributes?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  events?: Array<{ name: string; attributes?: Record<string, unknown> }>;
  startTime?: number;
  endTime?: number;
}

/**
 * Represents a Copilot Chat transcript event
 */
interface TranscriptEvent {
  type: string;
  data?: Record<string, unknown> | unknown;
  id?: string;
  timestamp?: string;
  parentId?: string | null;
}

/**
 * CopilotLogWatcher monitors the Copilot OTel trace logs and emits turn completion events
 */
type WatcherHandle = {
  on: (event: string, listener: (...args: any[]) => void) => void;
  close?: () => void;
};

export class CopilotLogWatcher extends EventEmitter {
  private watcher: WatcherHandle | null = null;
  private otelTraceFilePath: string;
  private lastProcessedPosition: Map<string, number> = new Map();
  private pendingPartialLine: Map<string, string> = new Map();
  private pendingAssistantEvents: Map<string, TranscriptEvent> = new Map();
  private emittedAssistantIds: Set<string> = new Set();
  private recentUserMessages: Array<{ id: string; content: string }> = [];
  private consumedUserMessageIds: Set<string> = new Set();
  private cachedDetectedModel: string | null = null;
  private cachedModelAt: number = 0;
  private disposables: vscode.Disposable[] = [];
  private messageBuffer: Map<string, unknown> = new Map(); // Track messages by ID
  private currentTranscriptFile: string | null = null; // Track the active transcript file
  private fileCheckInterval: NodeJS.Timeout | null = null; // Periodically check for new session files
  private pollInterval: NodeJS.Timeout | null = null; // Fallback polling for content in current file
  private workspaceId: string; // Track which workspace this watcher belongs to

  constructor(otelTraceFilePath: string, workspaceId: string) {
    super();
    this.otelTraceFilePath = otelTraceFilePath;
    this.workspaceId = workspaceId;
  }

  /**
   * Start watching for log file changes
   */
  public start(): void {
    if (!this.otelTraceFilePath) {
      log('ERROR: OTel trace file path not configured');
      vscode.window.showWarningMessage(
        'Copilot Token Inspector: OTel trace file path not configured. Please set copilotTokenInspector.otelTraceFilePath'
      );
      return;
    }

    log('[Start] Watcher initializing for: ' + this.otelTraceFilePath);

    // Check if path exists
    if (!fs.existsSync(this.otelTraceFilePath)) {
      log('ERROR: Log path does not exist: ' + this.otelTraceFilePath);
      vscode.window.showErrorMessage(
        `Copilot Token Inspector: Log directory does not exist: ${this.otelTraceFilePath}`
      );
      return;
    }

    // Determine if we're watching a directory or file
    const stats = fs.statSync(this.otelTraceFilePath);
    const logDir = stats.isDirectory() ? this.otelTraceFilePath : path.dirname(this.otelTraceFilePath);
    const filePattern = stats.isDirectory()
      ? path.join(this.otelTraceFilePath, '*.jsonl')  // Only watch .jsonl files directly in the folder
      : this.otelTraceFilePath;

    log('[Watcher] Watching directory: ' + logDir + ' Pattern: ' + filePattern);

    if (!chokidarLib) {
      log('[Watcher] chokidar is unavailable; activation continues in degraded mode without file watching.');
      vscode.window.showWarningMessage(
        'Copilot Token Inspector: file watching is unavailable in this build, so transcript tracking is disabled.'
      );
      return;
    }

    // Initialize chokidar watcher
    this.watcher = chokidarLib.watch(filePattern, {
      persistent: true,
      usePolling: true,
      interval: 350,  // Low-CPU polling frequency
      awaitWriteFinish: {
        stabilityThreshold: 180,  // Low-CPU write settle time
        pollInterval: 180,
      },
      ignored: /(^|[\/\\])\.|node_modules/,
    });

    this.watcher!.on('add', (filePath: string) => {
      log('[Watcher] File added: ' + path.basename(filePath));
      this.onTranscriptFileEvent(filePath);
    });

    this.watcher!.on('change', (filePath: string) => {
      log('[Watcher] File changed: ' + path.basename(filePath));
      this.onTranscriptFileEvent(filePath);
    });

    this.watcher!.on('error', (error: Error) => {
      log('[Watcher] Error: ' + error.message);
      vscode.window.showErrorMessage(
        `Copilot Token Inspector: Watcher error - ${error.message}`
      );
    });

    // Periodically check for newer session files
    this.fileCheckInterval = setInterval(() => {
      this.checkForNewerTranscript();
    }, 1200); // Check every 1.2s for new sessions

    // CRITICAL FALLBACK: Continuously poll for changes
    // This catches messages even if chokidar events stop firing
    this.pollInterval = setInterval(() => {
      if (this.currentTranscriptFile && fs.existsSync(this.currentTranscriptFile)) {
        // Force re-read of current file to catch any appended content
        this.processLogFile(this.currentTranscriptFile);
      } else if (!this.currentTranscriptFile) {
        // Fallback: if no file set yet, check for any transcript files
        const newerFile = this.findMostRecentTranscript();
        if (newerFile) {
          log('[Poll] Found transcript: ' + path.basename(newerFile));
          this.currentTranscriptFile = newerFile;
          this.lastProcessedPosition.delete(newerFile);
          this.pendingPartialLine.delete(newerFile);
          this.processLogFile(newerFile);
        }
      }
    }, 700); // Poll every 700ms for new content in current file

    log('[Start] Log watcher started successfully');
    vscode.window.showInformationMessage(
      `Copilot Token Inspector: Watching logs at ${this.otelTraceFilePath}`
    );

    // Find and process the current most recent transcript
    const currentFile = this.findMostRecentTranscript();
    if (currentFile) {
      this.currentTranscriptFile = currentFile;
      log('[Start] Found existing transcript: ' + path.basename(currentFile));
      this.processLogFile(currentFile);
    } else {
      log('[Start] No existing transcript files found. Waiting for first message...');
      const filesInFolder = fs.readdirSync(this.otelTraceFilePath).filter(f => f.endsWith('.jsonl'));
      log('[Start] Current .jsonl files in folder: ' + (filesInFolder.length === 0 ? '(none)' : filesInFolder.join(', ')));
    }
  }

  /**
   * Handle transcript file add/change events
   */
  private onTranscriptFileEvent(filePath: string): void {
    log('[FileEvent] Detected event on: ' + path.basename(filePath));
    
    // Small delay to ensure file is fully written before processing
    setTimeout(() => {
      // Check if this is a newer session than the current one
      if (!this.currentTranscriptFile) {
        this.currentTranscriptFile = filePath;
        log('[FileEvent] ✓ Set as current (was none): ' + path.basename(filePath));
        // Ensure position is reset for new file
        this.lastProcessedPosition.delete(filePath);
        this.pendingPartialLine.delete(filePath);
      } else {
        // If this file is newer than the current one, switch to it
        const currentStats = fs.statSync(this.currentTranscriptFile);
        const fileStats = fs.statSync(filePath);

        if (fileStats.mtimeMs > currentStats.mtimeMs) {
          log('[FileEvent] ✓ Switched to newer: ' + path.basename(filePath) + ' was: ' + path.basename(this.currentTranscriptFile));
          this.currentTranscriptFile = filePath;
          // Reset position for new file - will read entire file on first pass
          this.lastProcessedPosition.delete(filePath);
          this.pendingPartialLine.delete(filePath);
          // Also clear message buffer to avoid confusion between sessions
          this.messageBuffer.clear();
          this.pendingAssistantEvents.clear();
          this.emittedAssistantIds.clear();
          this.recentUserMessages = [];
          this.consumedUserMessageIds.clear();
        } else {
          log('[FileEvent] ✗ File is older, keeping current: ' + path.basename(this.currentTranscriptFile));
        }
      }

      // Process the file (will handle reading entire file if position is not set)
      log('[FileEvent] Processing: ' + path.basename(this.currentTranscriptFile));
      this.processLogFile(this.currentTranscriptFile);
    }, 80);  // Delay to let writes settle before reading
  }

  /**
   * Find the most recently modified transcript file
   */
  private findMostRecentTranscript(): string | null {
    try {
      if (!fs.existsSync(this.otelTraceFilePath)) {
        return null;
      }

      const files = fs.readdirSync(this.otelTraceFilePath)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(this.otelTraceFilePath, f));

      if (files.length === 0) {
        return null;
      }

      // Sort by modification time, most recent first
      files.sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtimeMs - statA.mtimeMs;
      });

      const mostRecent = files[0];
      log(
        'Most recent transcript: ' +
          path.basename(mostRecent) +
          ' Modified: ' +
          new Date(fs.statSync(mostRecent).mtimeMs).toISOString()
      );
      return mostRecent;
    } catch (error) {
      log('Error finding most recent transcript: ' + (error instanceof Error ? error.message : String(error)));
      return null;
    }
  }

  /**
   * Periodically check if a newer transcript file has appeared
   */
  private checkForNewerTranscript(): void {
    try {
      const newerFile = this.findMostRecentTranscript();
      if (newerFile && newerFile !== this.currentTranscriptFile) {
        log('[FileCheck] Detected newer transcript, switching to: ' + path.basename(newerFile));
        log('[FileCheck] Was watching: ' + (this.currentTranscriptFile ? path.basename(this.currentTranscriptFile) : 'none'));
        this.currentTranscriptFile = newerFile;
        this.lastProcessedPosition.delete(newerFile);
        this.pendingPartialLine.delete(newerFile);
        this.processLogFile(newerFile);
      }
    } catch (error) {
      // Silently fail, don't spam errors
    }
  }

  /**
   * Process a log file and extract turns
   */
  private processLogFile(filePath: string): void {
    try {
      const stats = fs.statSync(filePath);
      const currentPosition = this.lastProcessedPosition.get(filePath) || 0;

      log(`[ProcessFile] ${path.basename(filePath)} - Size: ${stats.size}, Last pos: ${currentPosition}`);

      // If no new data, return
      if (stats.size <= currentPosition) {
        log('[ProcessFile] ✗ No new data (already processed)');
        return;
      }

      const bytesToRead = stats.size - currentPosition;
      log(`[ProcessFile] ✓ Reading ${bytesToRead} new bytes`);
      
      const buffer = Buffer.alloc(bytesToRead);
      const fd = fs.openSync(filePath, 'r');

      try {
        fs.readSync(fd, buffer, 0, bytesToRead, currentPosition);
        const rawChunk = buffer.toString('utf-8');
        const previousPartial = this.pendingPartialLine.get(filePath) || '';
        const content = previousPartial + rawChunk;

        this.lastProcessedPosition.set(filePath, stats.size);

        // NDJSON can be written in chunks; keep trailing incomplete JSON for next read.
        const lastNewlineIndex = content.lastIndexOf('\n');
        if (lastNewlineIndex === -1) {
          const trimmed = content.trim();
          // Some writers flush complete JSON records without a trailing newline.
          if (trimmed.length > 0 && this.tryProcessSingleJsonLine(trimmed, filePath)) {
            this.pendingPartialLine.set(filePath, '');
          } else {
            this.pendingPartialLine.set(filePath, content);
          }
          return;
        }

        const parseableContent = content.slice(0, lastNewlineIndex);
        const trailingPartial = content.slice(lastNewlineIndex + 1);
        let nextPartial = trailingPartial;

        const trailingTrimmed = trailingPartial.trim();
        if (trailingTrimmed.length > 0 && this.tryProcessSingleJsonLine(trailingTrimmed, filePath)) {
          nextPartial = '';
        }

        this.pendingPartialLine.set(filePath, nextPartial);

        // Parse JSON lines (NDJSON format)
        const lines = parseableContent
          .split('\n')
          .filter((line) => line.trim().length > 0);

        log(`Processing ${lines.length} new lines from ${path.basename(filePath)}`);

        // First pass: populate message buffer with ALL new events
        const events: TranscriptEvent[] = [];
        for (const line of lines) {
          try {
            const record = JSON.parse(line) as TranscriptEvent;
            this.ingestRecord(record);

            events.push(record);
          } catch (e) {
            // Skip unparseable lines, but keep a trace for diagnostics
            log('[ProcessFile] Skipped unparseable line (possibly partial write)');
          }
        }

        // Second pass: emit turn completed events now that buffer is populated
        for (const event of events) {
          this.handleTurnEvent(event);
        }

        // Retry assistant events that could not be resolved earlier.
        this.retryPendingAssistantEvents();
      } finally {
        fs.closeSync(fd);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while reading log file';
      log('ERROR in processLogFile: ' + message);
      vscode.window.showWarningMessage(
        `Copilot Token Inspector: Error processing log file - ${message}`
      );
    }
  }

  /**
   * Try to parse and process a single JSON event line.
   */
  private tryProcessSingleJsonLine(line: string, filePath: string): boolean {
    try {
      const record = JSON.parse(line) as TranscriptEvent;
      this.ingestRecord(record);
      this.handleTurnEvent(record);
      this.retryPendingAssistantEvents();
      log('[ProcessFile] Parsed no-newline JSON event from ' + path.basename(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Store record in buffers used for turn correlation.
   */
  private ingestRecord(record: TranscriptEvent): void {
    if (record.id) {
      this.messageBuffer.set(record.id, record);
    }

    if (record.type === 'user.message' && record.id && record.data && typeof record.data === 'object') {
      const userData = record.data as Record<string, unknown>;
      const userText = this.extractTextFromUnknown(userData.content);
      if (userText && userText.trim().length > 0) {
        this.recentUserMessages.push({ id: record.id, content: userText });
        if (this.recentUserMessages.length > 200) {
          this.recentUserMessages.shift();
        }
      }
    }
  }

  /**
   * Parse a single log line from transcript format
   */
  private parseTurnEvent(record: TranscriptEvent): boolean {
    try {
      // Look for assistant.message events that complete a turn
      if (record.type === 'assistant.message' && record.data && typeof record.data === 'object') {
        if (record.id && this.emittedAssistantIds.has(record.id)) {
          return true;
        }

        const data = record.data as Record<string, unknown>;
        const content = this.extractTextFromUnknown(data.content);
        
        if (content) {
          // Find the corresponding user message through parent chain
          const userFromChain = this.findUserMessageForTurn(record);
          const fallbackUser = userFromChain ? null : this.getLatestUnmatchedUserMessage();
          const userContent = userFromChain ?? fallbackUser?.content ?? null;

          if (userContent) {
            log('Detected Copilot turn - User: ' + userContent.substring(0, 50) + '...');
            const payload = this.extractTurnDataFromTranscript(userContent, content, record, data);
            if (payload) {
              log('Emitting turn completed: model=' + payload.model + ', in=' + payload.inputTokens + ', out=' + payload.outputTokens);
              this.emit('turnCompleted', payload);
              if (fallbackUser?.id) {
                this.consumedUserMessageIds.add(fallbackUser.id);
              }
              if (record.id) {
                this.emittedAssistantIds.add(record.id);
                this.pendingAssistantEvents.delete(record.id);
              }
              return true;
            }
          }
        }

        return false;
      }

      return false;
    } catch (error) {
      log('ERROR in parseTurnEvent: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }

  /**
   * Route event through parser and keep unresolved assistant events for retry.
   */
  private handleTurnEvent(record: TranscriptEvent): void {
    if (record.type !== 'assistant.message') {
      return;
    }

    const emitted = this.parseTurnEvent(record);
    if (!emitted && record.id) {
      this.pendingAssistantEvents.set(record.id, record);
    }
  }

  /**
   * Retry pending assistant events after more transcript context is available.
   */
  private retryPendingAssistantEvents(): void {
    if (this.pendingAssistantEvents.size === 0) {
      return;
    }

    const pending = Array.from(this.pendingAssistantEvents.entries());
    for (const [id, event] of pending) {
      if (this.parseTurnEvent(event)) {
        this.pendingAssistantEvents.delete(id);
      }
    }
  }

  /**
   * Return most recent user message that has not yet been consumed by fallback matching.
   */
  private getLatestUnmatchedUserMessage(): { id: string; content: string } | null {
    for (let i = this.recentUserMessages.length - 1; i >= 0; i--) {
      const entry = this.recentUserMessages[i];
      if (!this.consumedUserMessageIds.has(entry.id)) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Find the user message that corresponds to this assistant message
   */
  private findUserMessageForTurn(assistantMsg: TranscriptEvent): string | null {
    try {
      let currentId = assistantMsg.parentId;
      let depth = 0;
      const maxDepth = 20; // Prevent infinite loops

      while (currentId && depth < maxDepth) {
        const parent = this.messageBuffer.get(currentId);
        if (!parent) break;

        const parentEvent = parent as TranscriptEvent;
        if (parentEvent.type === 'user.message' && parentEvent.data) {
          const data = parentEvent.data as Record<string, unknown>;
          return this.extractTextFromUnknown(data.content);
        }

        currentId = parentEvent.parentId;
        depth++;
      }
    } catch (error) {
      log('ERROR finding user message: ' + (error instanceof Error ? error.message : String(error)));
    }
    return null;
  }

  /**
   * Check if record represents a Copilot chat turn (deprecated - kept for compatibility)
   */
  private isCopilotChatTurn(record: unknown): boolean {
    const event = record as TranscriptEvent;
    return !!(event && typeof event === 'object' && event.type === 'assistant.message');
  }

  /**
   * Extract textual content from transcript fields that may be string/array/object.
   */
  private extractTextFromUnknown(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            const textCandidate = obj.text ?? obj.content ?? obj.value;
            return typeof textCandidate === 'string' ? textCandidate : '';
          }
          return '';
        })
        .filter((part) => part.length > 0);

      return parts.length > 0 ? parts.join('') : null;
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const textCandidate = obj.text ?? obj.content ?? obj.value;
      return typeof textCandidate === 'string' ? textCandidate : null;
    }

    return null;
  }

  /**
   * Extract turn data from transcript format
   */
  private extractTurnDataFromTranscript(
    promptText: string,
    responseText: string,
    assistantMsg: TranscriptEvent,
    assistantData?: Record<string, unknown>
  ): TurnCompletedPayload | null {
    // Try to get model from various sources in order of preference
    let model = this.detectCurrentModel();

    if (assistantData) {
      // Try common field names for model info in case it's stored in transcript
      const modelField =
        assistantData.model ||
        assistantData.modelId ||
        assistantData.modelName ||
        assistantData.llmModel ||
        assistantData.selectedModel;

      if (modelField && typeof modelField === 'string') {
        model = modelField;
      } else if (assistantData.metadata && typeof assistantData.metadata === 'object') {
        const metadata = assistantData.metadata as Record<string, unknown>;

        const metaModel = metadata.model || metadata.modelId || metadata.modelName;
        if (metaModel && typeof metaModel === 'string') {
          model = metaModel;
        }
      }
    }

    // Only emit if we have meaningful content
    if (!promptText || !responseText) {
      return null;
    }

    // Use raw transcript counts only when Copilot provides them. Otherwise the
    // TokenCalculator applies the most appropriate available tokenizer.
    const inputTokens = this.findTranscriptTokenCount(assistantData, [
      'inputTokens',
      'promptTokens',
      'promptTokenCount',
    ]);
    const outputTokens = this.findTranscriptTokenCount(assistantData, [
      'outputTokens',
      'completionTokens',
      'responseTokenCount',
    ]);

    const timestamp = assistantMsg.timestamp
      ? new Date(assistantMsg.timestamp).getTime()
      : Date.now();

    return {
      promptText,
      responseText,
      model,
      inputTokens,
      outputTokens,
      timestamp,
      workspaceId: this.workspaceId,
    };
  }

  /**
   * Read an optional numeric token count from a transcript record or metadata.
   */
  private findTranscriptTokenCount(
    data: Record<string, unknown> | undefined,
    keys: string[]
  ): number | undefined {
    if (!data) {
      return undefined;
    }

    const sources: Array<Record<string, unknown>> = [data];
    if (data.metadata && typeof data.metadata === 'object') {
      sources.push(data.metadata as Record<string, unknown>);
    }
    if (data.usage && typeof data.usage === 'object') {
      sources.push(data.usage as Record<string, unknown>);
    }

    for (const source of sources) {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
          return value;
        }
      }
    }

    return undefined;
  }

  /**
   * Detect current model from VS Code settings or defaults
   */
  private detectCurrentModel(): string {
    const now = Date.now();
    if (this.cachedDetectedModel && now - this.cachedModelAt < 3000) {
      return this.cachedDetectedModel;
    }

    try {
      // Try Copilot Chat settings - check multiple possible setting keys
      const chatConfig = vscode.workspace.getConfiguration('github.copilot-chat');
      
      const possibleKeys = [
        'selectedModel',
        'model',
        'currentModel',
        'preferredModel',
        'defaultModel',
      ];
      
      for (const key of possibleKeys) {
        const value = chatConfig.get<string>(key);
        if (value && typeof value === 'string' && value.length > 0) {
          this.cachedDetectedModel = value;
          this.cachedModelAt = now;
          return value;
        }
      }
    } catch (e) {
      // Ignore unavailable settings.
    }

    try {
      // Try general Copilot settings
      const copilotConfig = vscode.workspace.getConfiguration('github.copilot');
      
      const possibleKeys = [
        'preferredModel',
        'model',
        'selectedModel',
        'defaultModel',
      ];
      
      for (const key of possibleKeys) {
        const value = copilotConfig.get<string>(key);
        if (value && typeof value === 'string' && value.length > 0) {
          this.cachedDetectedModel = value;
          this.cachedModelAt = now;
          return value;
        }
      }
    } catch (e) {
      // Ignore unavailable settings.
    }

    try {
      // Fallback: parse VS Code renderer logs where ChatModelSelection is recorded.
      const fromRendererLogs = this.detectModelFromRendererLogs();
      if (fromRendererLogs) {
        this.cachedDetectedModel = fromRendererLogs;
        this.cachedModelAt = now;
        return fromRendererLogs;
      }
    } catch (e) {
      // Ignore renderer log lookup failures.
    }

    try {
      // Try our extension settings
      const config = vscode.workspace.getConfiguration('copilotTokenInspector');
      const defaultModel = config.get<string>('defaultModelEncoding', 'gpt-4o');
      if (defaultModel && defaultModel.length > 0) {
        this.cachedDetectedModel = defaultModel;
        this.cachedModelAt = now;
        return defaultModel;
      }
    } catch (e) {
      // Ignore extension config lookup failures.
    }

    // Ultimate fallback
    log('[Model] ⚠️ No model found in settings, using hardcoded fallback: gpt-4o');
    return 'gpt-4o';
  }

  /**
   * Parse the latest ChatModelSelection entry from VS Code renderer logs.
   */
  private detectModelFromRendererLogs(): string | null {
    const appDataPath = process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming');
    const logsRoot = path.join(appDataPath, 'Code', 'logs');
    if (!fs.existsSync(logsRoot)) {
      return null;
    }

    const sessionDirs = fs
      .readdirSync(logsRoot)
      .map((name) => path.join(logsRoot, name))
      .filter((fullPath) => {
        try {
          return fs.statSync(fullPath).isDirectory();
        } catch {
          return false;
        }
      })
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
      .slice(0, 3);

    const rendererLogs: string[] = [];
    for (const sessionDir of sessionDirs) {
      for (const child of fs.readdirSync(sessionDir)) {
        const childPath = path.join(sessionDir, child);
        const rendererPath = path.join(childPath, 'renderer.log');
        if (fs.existsSync(rendererPath)) {
          rendererLogs.push(rendererPath);
        }
      }
    }

    const sortedRendererLogs = rendererLogs
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
      .slice(0, 8);

    for (const logFile of sortedRendererLogs) {
      try {
        const text = fs.readFileSync(logFile, 'utf-8');
        const lines = text.split(/\r?\n/).reverse();
        for (const line of lines) {
          if (!line.includes('ChatModelSelection')) {
            continue;
          }

          const model = this.extractModelFromChatSelectionLine(line);
          if (model) {
            return model;
          }
        }
      } catch {
        // Continue scanning remaining log files.
      }
    }

    return null;
  }

  /**
   * Extract model token from a single ChatModelSelection log line.
   */
  private extractModelFromChatSelectionLine(line: string): string | null {
    const patterns = [
      /currentModel="([^"]+)"/,
      /model="([^"]+)"/,
      /resultModel="([^"]+)"/,
      /storedModel="([^"]+)"/,
      /rememberedModel="([^"]+)"/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (!match || !match[1]) {
        continue;
      }

      const value = match[1].trim();
      if (!value) {
        continue;
      }

      // Keep "copilot/auto" only as a last resort if nothing else is found.
      if (value === 'copilot/auto') {
        continue;
      }

      return value;
    }

    const autoMatch = line.match(/(currentModel|model|resultModel|storedModel|rememberedModel)="(copilot\/auto)"/);
    if (autoMatch && autoMatch[2]) {
      return autoMatch[2];
    }

    return null;
  }

  /**
   * Estimate tokens using basic heuristic (roughly 4 chars = 1 token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Stop watching
   */
  public stop(): void {
    if (this.watcher) {
      this.watcher.close?.();
      this.watcher = null;
    }
    if (this.fileCheckInterval) {
      clearInterval(this.fileCheckInterval);
      this.fileCheckInterval = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.removeAllListeners();
  }

  /**
   * Get disposables for cleanup
   */
  public getDisposables(): vscode.Disposable[] {
    return this.disposables;
  }
}
