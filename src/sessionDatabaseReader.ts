import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

// Use native module loading for better-sqlite3
let Database: any;

try {
  Database = require('better-sqlite3');
} catch (error) {
  console.warn('better-sqlite3 not available, database support disabled');
}

/**
 * Session database reader - queries the global Copilot chat history database
 */
export class SessionDatabaseReader {
  private dbPath: string;
  private lastQueryTime: number = 0;
  private processedSessionIds: Set<string> = new Set();

  constructor() {
    const appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    this.dbPath = path.join(
      appDataPath,
      'Code',
      'User',
      'globalStorage',
      'github.copilot-chat',
      'session-store.db'
    );
  }

  /**
   * Check if database exists
   */
  public exists(): boolean {
    return fs.existsSync(this.dbPath);
  }

  /**
   * Get the database path
   */
  public getPath(): string {
    return this.dbPath;
  }

  /**
   * Query sessions from the database
   */
  public queryRecentSessions(limitMinutes: number = 60): SessionRecord[] {
    if (!Database) {
      console.warn('SQLite not available');
      return [];
    }

    try {
      if (!fs.existsSync(this.dbPath)) {
        console.warn('Session database not found at:', this.dbPath);
        return [];
      }

      // Open database in read-only mode to avoid locking issues
      const db = new Database(this.dbPath, { readonly: true });
      
      try {
        // Query for recent chat sessions
        const query = `
          SELECT id, title, messages_count, created_at, updated_at, data
          FROM sessions
          WHERE updated_at > datetime('now', '-' || ? || ' minutes')
          ORDER BY updated_at DESC
          LIMIT 100
        `;

        const stmt = db.prepare(query);
        const sessions = stmt.all(limitMinutes) as SessionRecord[];

        return sessions;
      } finally {
        db.close();
      }
    } catch (error) {
      console.error('[SessionDB] Error querying sessions:', error);
      return [];
    }
  }

  /**
   * Extract chat messages from a session
   */
  public extractMessagesFromSession(session: SessionRecord): ChatMessage[] {
    const messages: ChatMessage[] = [];

    try {
      if (!session.data) {
        return messages;
      }

      // Try to parse session data
      let data: any = session.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      // Extract messages based on session structure
      if (data && data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          messages.push({
            id: msg.id || msg.messageId,
            role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'),
            content: msg.content || msg.text || '',
            timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          });
        }
      } else if (data && data.turns && Array.isArray(data.turns)) {
        // Alternative structure: turns-based
        for (const turn of data.turns) {
          if (turn.userMessage) {
            messages.push({
              id: turn.userMessage.id,
              role: 'user',
              content: turn.userMessage.content,
              timestamp: turn.userMessage.timestamp || new Date().toISOString(),
            });
          }
          if (turn.assistantMessage) {
            messages.push({
              id: turn.assistantMessage.id,
              role: 'assistant',
              content: turn.assistantMessage.content,
              timestamp: turn.assistantMessage.timestamp || new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error('[SessionDB] Error extracting messages:', error);
    }

    return messages;
  }

  /**
   * Check if we've already processed a session
   */
  public isSessionProcessed(sessionId: string): boolean {
    return this.processedSessionIds.has(sessionId);
  }

  /**
   * Mark a session as processed
   */
  public markSessionProcessed(sessionId: string): void {
    this.processedSessionIds.add(sessionId);
  }

  /**
   * Clear processed sessions older than specified time
   */
  public clearOldProcessedSessions(ageHours: number = 24): void {
    // In a real implementation, we'd track timestamps with processed sessions
    // For now, this is a placeholder
  }
}

/**
 * Session record from database
 */
export interface SessionRecord {
  id: string;
  title?: string;
  messages_count?: number;
  created_at?: string;
  updated_at?: string;
  data?: unknown;
}

/**
 * Chat message extracted from session
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
