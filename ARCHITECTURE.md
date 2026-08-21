# Architecture Guide

This document describes the overall architecture and design patterns of the Copilot Token Inspector extension.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│         VS Code Extension Host Process                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ extension.ts (Main Entry Point)                  │  │
│  │ - Activates all components                       │  │
│  │ - Manages lifecycle & disposables                │  │
│  │ - Registers commands & event handlers            │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▼                               │
│  ┌───────────────────────┬───────────────────────────┐  │
│  │                       │                           │  │
│  ▼                       ▼                           ▼  │
│  CopilotLogWatcher      TokenCalculator         TokenViewProvider
│  (File Watcher)         (Token Counting)         (Webview UI)
│  │                      │                           │  │
│  │ Monitors OTel logs   │ Calculates tokens        │ │ Renders UI
│  │ Parses JSON streams  │ Computes costs           │ │ Updates state
│  │ Emits events         │ Supports multi-models    │ │ Persists data
│  │                      │                         │ │
│  └─────────┬────────────┴──────────────┬──────────┘  │
│            │                           │            │
│            ▼                           ▼            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Session State Management                        │  │
│  │ - globalState (VS Code storage)                 │  │
│  │ - Accumulates token metrics                     │  │
│  │ - Persists across sessions                      │  │
│  └─────────────────────────────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Webview View (Rendered in Secondary Sidebar)    │  │
│  │ - Real-time token display                       │  │
│  │ - Session progress visualization                │  │
│  │ - User action handling                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└─────────────────────────────────────────────────────────┘
         │                                    ▲
         │ Reads Copilot logs                 │ postMessage
         ▼                                    │
    ┌─────────────────────┐       ┌───────────────────┐
    │ Copilot Chat Logs   │       │ Webview JavaScript│
    │ (OTel JSON)         │       │ (onDidReceiveMsg) │
    └─────────────────────┘       └───────────────────┘
```

## Data Flow Architecture

### Turn Processing Pipeline

```
Copilot Chat ──→ OTel Trace Log ──→ CopilotLogWatcher
                                         │
                                         ▼
                              Parse JSON → Extract Turn Data
                                         │
                                         ▼ TurnCompletedPayload
                                    
                              TokenCalculator
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
                 Count Tokens (Model-specific)    Calculate Cost
                          │                             │
                   Raw Token Metrics               Price Rates
                          │                             │
                          └──────────────┬──────────────┘
                                        │
                                        ▼ TurnTokenMetrics
                                    
                              TokenViewProvider
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                  Update Session State        Post to Webview
                          │                           │
                   Persist globalState         Update UI Display
                                         │
                                         ▼
                              User sees metrics
                              in real-time
```

## Component Responsibilities

### 1. Extension Host (`extension.ts`)

**Role**: Orchestrator and lifecycle manager

**Responsibilities**:
- Initialize all components in correct order
- Register commands
- Listen to configuration changes
- Clean up resources on deactivation
- Dispatch messages between components

**Key Functions**:
```typescript
activate(context)          // Called on extension load
deactivate()               // Called on extension unload
initializeTokenCalculator()
initializeTokenViewProvider()
initializeCopilotLogWatcher()
registerCommands()
registerConfigurationWatcher()
handleTurnCompleted()      // Bridge between watcher → calculator → UI
```

### 2. Telemetry Watcher (`telemetryWatcher.ts`)

**Role**: File system monitoring and event source

**Responsibilities**:
- Monitor Copilot OTel trace files
- Parse JSON streaming logs (NDJSON)
- Extract structured turn data
- Emit `turnCompleted` events
- Handle file read errors gracefully

**Key Classes**:
```typescript
CopilotLogWatcher
  - start()                    // Begin watching
  - stop()                     // Stop watching
  - processLogFile()           // Handle file changes
  - parseLogLine()             // Parse single JSON record
  - extractTurnData()          // Extract prompt/response/model
  - emit('turnCompleted', payload)
```

**Event Payload**:
```typescript
TurnCompletedPayload {
  promptText: string
  responseText: string
  model: string
  inputTokens?: number         // From log if available
  outputTokens?: number        // From log if available
  timestamp: number
}
```

### 3. Token Calculator (`tokenizerEngine.ts`)

**Role**: Token counting and cost calculation engine

**Responsibilities**:
- Count tokens using model-specific tokenizers
- Fall back to estimation for unsupported models
- Calculate costs based on pricing rates
- Estimate GitHub AI Credits
- Support configurable pricing

**Key Classes**:
```typescript
TokenCalculator
  - calculateMetrics()         // Main entry point
  - countInputTokens()         // Model-specific input counting
  - countOutputTokens()        // Model-specific output counting
  - calculateCost()            // USD cost estimation
  - updatePricingRates()       // Update model pricing
  - getSupportedModels()       // List all models
```

**Tokenizer Strategy**:
```
Model Detection
    │
    ├─→ OpenAI (gpt-*, o1*, o3*)
    │       └─→ tiktoken (cl100k_base or o200k_base)
    │
    ├─→ Anthropic (claude*)
    │       └─→ @anthropic-ai/tokenizer
    │
    └─→ Unknown / Google
            └─→ Character estimation (~4 chars/token)
                  └─→ Mark as isEstimate: true
```

**Output Format**:
```typescript
TurnTokenMetrics {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  isEstimate: boolean
  estimatedCostUSD?: number
  estimatedCredits?: number   // ≈ cost * 100
}
```

### 4. Token View Provider (`tokenViewProvider.ts`)

**Role**: UI rendering and state persistence

**Responsibilities**:
- Create and manage Webview view
- Render HTML/CSS/JS UI
- Maintain session state
- Persist state to VS Code storage
- Handle user interactions
- Update webview in real-time

**Key Classes**:
```typescript
TokenViewProvider implements vscode.WebviewViewProvider
  - resolveWebviewView()       // Create webview
  - getWebviewContent()        // Generate HTML
  - updateWithTurnMetrics()    // Update on new turn
  - handleWebviewMessage()     // Process user actions
  - updateWebview()            // Send state to UI
  - resetSession()             // Clear metrics
  - saveSessionState()         // Persist to storage
  - loadSessionState()         // Load from storage
  - exportMetrics()            // Export to file
```

**Session State Structure**:
```typescript
SessionState {
  totalInputTokens: number
  totalOutputTokens: number
  totalSessionTokens: number
  lastTurnMetrics?: TurnTokenMetrics
  turnCount: number
  estimatedTotalCostUSD: number
  estimatedTotalCredits: number
  warningTriggered: boolean
}
```

**Communication Protocol**:
```
Extension ──→ Webview (via postMessage)
  {
    command: 'updateState',
    payload: SessionState
  }

Webview ──→ Extension (via postMessage)
  {
    command: 'resetSession' | 'exportMetrics'
  }
```

## Design Patterns

### 1. Event-Driven Architecture

Components communicate through events rather than direct calls:

```typescript
// Log watcher emits events
logWatcher.on('turnCompleted', (payload) => {
  // Extension handles in bridge function
  handleTurnCompleted(context, payload);
});
```

**Benefits**:
- Loose coupling between components
- Easy to add new listeners
- Testable in isolation

### 2. Dependency Injection

Components receive dependencies through constructors:

```typescript
class TokenViewProvider {
  constructor(private context: vscode.ExtensionContext) {}
}

// Created and injected in extension.ts
const provider = new TokenViewProvider(context);
```

**Benefits**:
- Easier to test
- Dependencies are explicit
- Easy to swap implementations

### 3. Strategy Pattern

Different tokenization strategies per model family:

```typescript
if (this.isOpenAIModel(model)) {
  return this.countOpenAITokens(text, model);
} else if (this.isAnthropicModel(model)) {
  return this.countAnthropicTokens(text);
} else {
  return this.estimateTokens(text);
}
```

**Benefits**:
- Easy to add new model families
- Clear separation of concerns
- Testable strategies

### 4. Observer Pattern

Webview observes extension state changes:

```typescript
// Extension updates view when metrics arrive
tokenViewProvider.updateWithTurnMetrics(metrics);

// Webview listens for updates
window.addEventListener('message', (event) => {
  if (event.data.command === 'updateState') {
    updateDisplay(event.data.payload);
  }
});
```

### 5. Singleton Pattern

Single instances of core components:

```typescript
let tokenCalculator: TokenCalculator | null = null;
let logWatcher: CopilotLogWatcher | null = null;
let tokenViewProvider: TokenViewProvider | null = null;

// Created once and reused
export function activate(context: vscode.ExtensionContext) {
  initializeTokenCalculator(context);
  // ...
}
```

## State Management

### Extension State (globalState)

Persists across VS Code sessions:

```typescript
// Save
context.globalState.update(
  'copilotTokenInspector.sessionState',
  sessionState
);

// Load
const saved = context.globalState.get<SessionState>(
  'copilotTokenInspector.sessionState'
);
```

**Scope**: Global to user's VS Code installation

**Lifecycle**: Cleared when user manually resets via UI button

### Configuration State (workspace settings)

User-configurable settings:

```typescript
const config = vscode.workspace.getConfiguration('copilotTokenInspector');
const maxWarning = config.get<number>('maxSessionTokenWarning');
```

**Scope**: User-level or workspace-level

**Lifecycle**: Persists across sessions; user-editable

### Runtime State (In-Memory)

Transient state during extension session:

```typescript
// In TokenViewProvider
private sessionState: SessionState = { /* ... */ };

// In CopilotLogWatcher
private lastProcessedPosition: Map<string, number> = new Map();
```

**Scope**: Extension instance only

**Lifecycle**: Cleared on extension deactivation

## Extension Lifecycle

### Activation Sequence

1. **VS Code loads extension manifest** (`package.json`)
2. **Activation events triggered** (e.g., view opened)
3. **`activate(context)` called**
   - Initialize TokenCalculator
   - Initialize TokenViewProvider
   - Initialize CopilotLogWatcher
   - Register commands
   - Setup configuration watchers
4. **User sees Token Inspector view**
5. **Copilot turns are detected and tracked**

### Deactivation Sequence

1. **User closes VS Code or disables extension**
2. **`deactivate()` called**
   - Stop CopilotLogWatcher (closes file watcher)
   - Dispose all subscriptions
   - Clean up event listeners
3. **Session state auto-saved** (via globalState)
4. **Extension unloaded**

### Configuration Changes

```typescript
vscode.workspace.onDidChangeConfiguration((event) => {
  // Reactive re-initialization
  if (event.affectsConfiguration('copilotTokenInspector.otelTraceFilePath')) {
    logWatcher.stop();
    initializeCopilotLogWatcher(context);
  }
});
```

## Error Handling Strategy

### Layered Error Handling

```
UI Layer (Webview)
     ↓ Catches uncaught JS errors
Extension Layer (TypeScript)
     ↓ Try-catch in critical sections
     ↓ Fallback tokenizers if primary fails
File I/O Layer
     ↓ Handle locked files, permission errors
     ↓ Graceful degradation for incomplete reads
```

### Recovery Mechanisms

1. **Tokenizer Fallbacks**:
   ```typescript
   try {
     return this.countOpenAITokens(text);
   } catch (error) {
     return this.estimateTokens(text); // Fallback
   }
   ```

2. **File Read Retries**:
   - Incremental position tracking
   - Skip unparseable lines
   - Continue on I/O errors

3. **UI Fallbacks**:
   - Empty state indicators
   - Graceful degradation
   - User-friendly error messages

## Performance Considerations

### Optimization Techniques

1. **Lazy Tokenization**
   - Only tokenize when turn completes
   - Not during typing or thinking

2. **Incremental File Reading**
   - Track last processed byte position
   - Only read new data
   - Avoid re-parsing entire file

3. **Batched UI Updates**
   - One update per turn
   - Not per keystroke or frame

4. **Async Processing**
   - File watching runs in background
   - Tokenization doesn't block UI
   - No main thread blocking

### Resource Management

| Resource | Management |
|----------|-----------|
| File Handles | Closed immediately after reading |
| Event Listeners | Cleaned up in deactivate() |
| Webview | Disposed when view closes |
| Timers | None used (avoiding polling except file watch) |
| Memory | Session state cleared on reset |

## Security Considerations

### Data Privacy

1. **Log Files**: Read locally only
2. **Session State**: Stored in VS Code secure storage
3. **No External Calls**: All processing local
4. **No Analytics**: No data sent to external servers

### Input Validation

1. **File Paths**: Validated before access
2. **JSON Parsing**: Try-catch wraps all JSON.parse()
3. **Configuration**: Type-checked from VS Code settings
4. **Webview Messages**: Validated before processing

### Code Injection Prevention

1. **No eval()**: Never used
2. **String Interpolation**: Careful in HTML generation
3. **User Input**: Sanitized before display
4. **DOM Access**: Limited to known structure

## Testing Architecture

### Unit Test Structure

```
Tests
  │
  ├─ TokenCalculator Tests
  │    ├─ Model-specific token counting
  │    ├─ Cost calculations
  │    ├─ Fallback estimation
  │    └─ Edge cases
  │
  └─ Session Accumulator Tests
       ├─ Multi-turn accumulation
       ├─ Warning threshold detection
       └─ Session reset
```

### Mocking Strategy

- No external dependencies mocked (directly use libraries)
- File I/O mocked when testing CopilotLogWatcher
- Webview mocked when testing TokenViewProvider
- TokenCalculator fully isolated (no external calls)

### Test Isolation

Each test:
- Creates fresh component instance
- Uses setup/teardown for initialization
- No shared state between tests
- Cleans up resources after completion

## Extension Points

### Planned Extension Areas

1. **Custom Tokenizers**: Add more model families
2. **Alternative Log Formats**: Support different trace formats
3. **Export Formats**: CSV, Google Sheets, Discord webhooks
4. **Pricing APIs**: Fetch live rates from provider APIs
5. **Analytics Dashboard**: Weekly/monthly reports
6. **Team Analytics**: Shared usage tracking

### Plugin Architecture

Future versions could support plugins:

```typescript
interface TokenizerPlugin {
  modelPattern: RegExp;
  countTokens(text: string): number;
}

// Register custom tokenizer
tokenCalculator.registerPlugin(myCustomTokenizer);
```

## Deployment Architecture

### Package Structure

```
copilot-token-inspector-0.1.0.vsix
│
├── extension.js (bundled)
├── package.json
├── README.md
└── media/
    └── token-icon.svg
```

### Distribution Channels

1. **VS Code Marketplace**: Official distribution
2. **GitHub Releases**: Pre-release builds
3. **Direct VSIX Install**: For custom builds

## Conclusion

The architecture follows SOLID principles:

- **S**ingle Responsibility: Each component has one clear purpose
- **O**pen/Closed: Easy to extend (new models, UI changes)
- **L**iskov Substitution: Components are independently testable
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Depends on abstractions (events)

This design ensures maintainability, testability, and extensibility.
