# Project Structure & File Guide

Complete reference of all files in the Copilot Token Inspector extension project.

## Core Extension Files

### `src/extension.ts`
**Purpose**: Main entry point and lifecycle manager  
**Key Exports**: `activate()`, `deactivate()`  
**Responsibilities**:
- Initialize TokenCalculator, TokenViewProvider, and CopilotLogWatcher
- Register commands (resetSession, exportMetrics, showConfig)
- Setup configuration change watchers
- Bridge between components (handle turn completion events)
- Manage subscriptions and cleanup

**Size**: ~200 LOC  
**Dependencies**: vscode, telemetryWatcher, tokenizerEngine, tokenViewProvider

---

### `src/telemetryWatcher.ts`
**Purpose**: File system watcher for Copilot OTel trace logs  
**Key Exports**: `CopilotLogWatcher`, `TurnCompletedPayload`  
**Responsibilities**:
- Monitor OTel trace files using chokidar
- Parse NDJSON log streams incrementally
- Extract turn data (prompt, response, model, tokens)
- Emit `turnCompleted` events
- Handle file read errors and locked files

**Key Classes**:
- `CopilotLogWatcher` - EventEmitter subclass
  - `start()` - Begin monitoring
  - `stop()` - Clean up watcher
  - `processLogFile()` - Handle new log data
  - `parseLogLine()` - Parse JSON OTel records
  - `extractTurnData()` - Extract turn metadata

**Size**: ~300 LOC  
**Dependencies**: fs, path, events, chokidar, vscode

---

### `src/tokenizerEngine.ts`
**Purpose**: Multi-model token counting and cost calculation  
**Key Exports**: `TokenCalculator`, `TurnTokenMetrics`  
**Responsibilities**:
- Count tokens using model-specific tokenizers
- Calculate costs based on pricing rates
- Estimate GitHub AI Credits
- Support for OpenAI (tiktoken), Anthropic, and fallback estimation
- Provide configurable pricing tables

**Key Classes**:
- `TokenCalculator`
  - `calculateMetrics()` - Main calculation entry point
  - `countInputTokens()` / `countOutputTokens()` - Delegate to model-specific methods
  - `countOpenAITokens()` - Use tiktoken
  - `countAnthropicTokens()` - Use @anthropic-ai/tokenizer
  - `calculateCost()` - USD estimation
  - `updatePricingRates()` - Dynamic pricing updates

**Size**: ~350 LOC  
**Dependencies**: vscode, tiktoken, @anthropic-ai/tokenizer

---

### `src/tokenViewProvider.ts`
**Purpose**: Webview UI panel for token display and control  
**Key Exports**: `TokenViewProvider`, `SessionState`  
**Responsibilities**:
- Implement VSCode WebviewViewProvider interface
- Render HTML/CSS/JS UI
- Manage session state and persistence
- Handle webview messages (resetSession, exportMetrics)
- Update UI in real-time

**Key Classes**:
- `TokenViewProvider`
  - `resolveWebviewView()` - Create webview
  - `getWebviewContent()` - Generate HTML/CSS/JS
  - `updateWithTurnMetrics()` - Update on new turn
  - `updateWebview()` - Send state to UI
  - `saveSessionState()` / `loadSessionState()` - Persist to storage
  - `resetSession()` - Clear metrics
  - `exportMetrics()` - Export to file
  - `handleWebviewMessage()` - Process user actions

**UI Features**:
- Last Turn Card (input/output tokens, cost, credits)
- Session Progress Card (turns, total tokens, progress bar)
- Clear Session button
- Export Metrics button
- Theme-aware CSS (dark/light mode)
- Warning indicators

**Size**: ~600 LOC  
**Dependencies**: vscode, path

---

### `src/test/tokenizer.test.ts`
**Purpose**: Comprehensive unit tests using Mocha  
**Test Suites**:
1. **TokenCalculator** (13 tests)
   - Token counting for OpenAI models
   - Token counting for Claude models
   - Estimation for unknown models
   - Raw token usage
   - Cost calculation
   - Credits estimation
   - Empty string handling
   - Large text handling
   - Model support verification
   - Pricing structure validation
   - Concurrent calculations

2. **Session Accumulator** (3 tests)
   - Multi-turn accumulation
   - Warning threshold detection
   - Session reset functionality

**Coverage**:
- ✅ Multi-model token counting
- ✅ Fallback estimation mechanisms
- ✅ Cost calculations per model
- ✅ Credit estimation
- ✅ Session accumulation
- ✅ Error handling

**Size**: ~450 LOC  
**Dependencies**: mocha, assert, tiktoken, @anthropic-ai/tokenizer

---

## Configuration Files

### `package.json`
**Purpose**: Extension manifest and npm configuration  
**Key Sections**:
- `name`, `displayName`, `version` - Extension metadata
- `engines` - VS Code version requirement (1.90.0+)
- `activationEvents` - When extension activates (on view open)
- `main` - Entry point (./out/extension.js)
- `contributes` - VS Code extensions:
  - `viewsContainers` - "Token Inspector" in Chat sidebar
  - `views` - "Token Usage" webview
  - `configuration` - Settings for extension
  - `commands` - Clear tokens, export metrics commands
- `scripts` - Build, test, watch commands
- `dependencies` - Runtime deps (tiktoken, @anthropic-ai/tokenizer, chokidar, etc.)
- `devDependencies` - Dev deps (TypeScript, Mocha, esbuild, etc.)

**Manifest Settings**:
- `copilotTokenInspector.defaultModelEncoding` (enum: gpt-4o, claude-3.5-sonnet, gemini-1.5-pro)
- `copilotTokenInspector.maxSessionTokenWarning` (default: 100000)
- `copilotTokenInspector.otelTraceFilePath` (string path)
- `copilotTokenInspector.enableCostTracking` (boolean, default: true)

---

### `tsconfig.json`
**Purpose**: TypeScript compiler configuration  
**Key Settings**:
- `target: ES2020` - Modern JavaScript target
- `module: commonjs` - CommonJS modules for Node.js
- `outDir: ./out` - Compiled output directory
- `rootDir: ./src` - Source directory
- `strict: true` - Enable strict type checking
- `sourceMap: true` - Enable debugging

---

### `.eslintrc.json`
**Purpose**: Code quality and linting rules  
**Configuration**:
- Uses ESLint with TypeScript parser
- Extends `eslint:recommended`
- Warns on unused variables
- Allows console output (for logging)

---

### `.npmrc`
**Purpose**: npm configuration  
**Settings**:
- `legacy-peer-deps=false` - Strict peer dependency checking
- `engine-strict=true` - Enforce Node.js engine version
- `strict-ssl=true` - Require HTTPS for packages

---

### `.gitignore`
**Purpose**: Version control exclusions  
**Excluded**:
- `out/` - Compiled JavaScript
- `node_modules/` - Dependencies
- `*.vsix` - Packaged extensions
- `.env` - Environment secrets
- `coverage/` - Test coverage reports

---

## VS Code Configuration Files

### `.vscode/launch.json`
**Purpose**: Debug launch configurations  
**Configurations**:
1. **Run Extension** - Launch extension in debug mode with watch
2. **Run Tests** - Launch test suite in extension host

---

### `.vscode/tasks.json`
**Purpose**: Build and development tasks  
**Tasks**:
- `npm: compile` - TypeScript compilation
- `npm: watch` - Watch mode compilation
- `npm: esbuild` - Bundle with esbuild
- `npm: test` - Run unit tests

---

### `.vscode/settings.json`
**Purpose**: Recommended developer settings  
**Configuration**:
- Format on save with Prettier
- ESLint auto-fix on save
- TypeScript auto-detection
- File exclusions for performance

---

## Documentation Files

### `README.md`
**Purpose**: Complete user and developer documentation  
**Sections**:
- Features overview
- Installation instructions
- Configuration guide
- Usage guide
- Command reference
- Architecture overview
- Pricing information
- Troubleshooting
- Contributing guidelines
- Support information

**Length**: ~500 lines

---

### `QUICKSTART.md`
**Purpose**: Fast setup guide (5 minutes)  
**Sections**:
- Installation (30 sec)
- Configuration (1 min)
- Usage (2 min)
- FAQ
- Keyboard shortcuts
- Tips & tricks
- Next steps
- Support

**Length**: ~250 lines

---

### `DEVELOPMENT.md`
**Purpose**: Guide for developers extending the project  
**Sections**:
- Prerequisites and setup
- Project structure
- Development workflow
- Building instructions
- Testing guide
- Component deep dives
- Common development tasks
- Debugging tips
- Code quality
- Troubleshooting development issues
- Resources

**Length**: ~600 lines

---

### `ARCHITECTURE.md`
**Purpose**: System design and architecture documentation  
**Sections**:
- System overview diagram
- Data flow pipeline
- Component responsibilities
- Design patterns used
- State management strategy
- Extension lifecycle
- Error handling strategy
- Performance considerations
- Security considerations
- Testing architecture
- Extension points for future features
- Deployment architecture

**Length**: ~800 lines

---

## Media Files

### `media/token-icon.svg` (Placeholder)
**Purpose**: Extension icon in VS Code sidebar  
**Specifications**:
- SVG format
- Should be 64x64 pixels
- Dark and light theme compatible
- Shows token/metrics symbol

---

## Summary Statistics

| Category | Count | Total LOC |
|----------|-------|-----------|
| **Core Source** | 4 files | ~1,450 |
| **Tests** | 1 file | ~450 |
| **Config** | 6 files | ~150 |
| **VS Code** | 3 files | ~100 |
| **Documentation** | 4 files | ~2,150 |
| **Total** | 18 files | ~4,300 |

---

## Key File Dependencies

```
extension.ts (entry point)
  ├─→ telemetryWatcher.ts
  │    ├─ chokidar (file watching)
  │    └─ vscode (logging)
  │
  ├─→ tokenizerEngine.ts
  │    ├─ tiktoken (OpenAI models)
  │    ├─ @anthropic-ai/tokenizer (Claude models)
  │    └─ vscode (logging)
  │
  └─→ tokenViewProvider.ts
       ├─ tokenizerEngine.ts (types)
       ├─ vscode.WebviewViewProvider (interface)
       └─ path (file operations)

test/tokenizer.test.ts
  ├─ tokenizerEngine.ts
  ├─ mocha (test framework)
  └─ assert (assertions)
```

---

## Quick Reference

### To Modify Token Counting Logic
→ Edit `src/tokenizerEngine.ts`

### To Add New Configuration Setting
→ Edit `package.json` (contributes.configuration)  
→ Read in `src/extension.ts` (initializeTokenCalculator, etc.)

### To Change UI Layout
→ Edit `src/tokenViewProvider.ts` (getWebviewContent method)

### To Debug Log Parsing
→ Edit `src/telemetryWatcher.ts` (parseLogLine, extractTurnData methods)

### To Add Tests
→ Edit `src/test/tokenizer.test.ts`

### To Update Documentation
→ Edit `README.md`, `DEVELOPMENT.md`, or `ARCHITECTURE.md`

---

## Build Artifacts

Files generated during build (not committed):

```
out/
  ├─ extension.js
  ├─ telemetryWatcher.js
  ├─ tokenizerEngine.js
  ├─ tokenViewProvider.js
  ├─ test/
  │  └─ tokenizer.test.js
  └─ *.map (source maps)

copilot-token-inspector-0.1.0.vsix
  └─ Packaged extension for distribution
```

---

## Version History

### v0.1.0 (Current)
- Initial release
- Core features: token tracking, cost estimation, session management
- Multi-model support
- Webview UI with theme support
- Comprehensive unit tests
- Full documentation

### Future Versions
- Analytics dashboard
- Team collaboration features
- Custom tokenizer plugins
- Webhook export
- Live pricing API integration
