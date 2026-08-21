# Development Guide

This guide covers setting up, building, testing, and extending the Copilot Token Inspector extension.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **VS Code** 1.90.0 or higher
- **TypeScript** 5.3.3 or higher

## Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/copilot-token-inspector.git
cd copilot-token-inspector

# Install dependencies
npm install

# Open in VS Code
code .
```

## Project Structure

```
.
├── src/
│   ├── extension.ts              # Entry point - extension lifecycle
│   ├── telemetryWatcher.ts       # OTel log monitoring
│   ├── tokenizerEngine.ts        # Token counting & cost calculation
│   ├── tokenViewProvider.ts      # Webview UI provider
│   └── test/
│       └── tokenizer.test.ts     # Unit tests
├── out/                          # Compiled JavaScript (generated)
├── media/                        # Extension assets (icons, etc)
├── package.json                  # Extension manifest & dependencies
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # User documentation
├── DEVELOPMENT.md                # This file
├── .eslintrc.json                # Linting rules
├── .gitignore                    # Git ignore patterns
└── .vscode/
    ├── launch.json               # Debug configuration
    └── tasks.json                # Build tasks
```

## Development Workflow

### 1. Start Development Mode

```bash
# Terminal 1: Watch TypeScript compilation
npm run watch

# Terminal 2: Start VS Code extension in debug mode
code --extensionDevelopmentPath=. .
```

Or press `F5` in VS Code to launch the debug session.

### 2. Make Changes

- Edit files in `src/`
- TypeScript will auto-compile to `out/`
- Extension will auto-reload in debug window

### 3. Debug

1. Set breakpoints in VS Code (red dots on line numbers)
2. Open Debug Console (Ctrl+Shift+Y / Cmd+Shift+Y)
3. Step through code with debug controls
4. Inspect variables in Variables panel

### 4. Test Changes

```bash
# Compile first
npm run compile

# Run tests
npm test

# Watch tests
npm run watch
```

## Building

### Development Build (with source maps)
```bash
npm run esbuild
```

### Production Build (minified)
```bash
npm run vscode:prepublish
```

### Package as VSIX

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Create .vsix package
vsce package

# This creates copilot-token-inspector-0.1.0.vsix
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- --grep "TokenCalculator"
```

### Run Tests with Coverage
```bash
npm install --save-dev nyc
nyc npm test
```

### Test Structure

Tests are organized in `src/test/tokenizer.test.ts` using Mocha:

```typescript
suite('TokenCalculator', () => {
  let calculator: TokenCalculator;

  setup(() => {
    calculator = new TokenCalculator(true);
  });

  test('should count tokens correctly', () => {
    // Test implementation
  });
});
```

## Key Components Deep Dive

### TokenCalculator (`tokenizerEngine.ts`)

**Purpose**: Calculate tokens and costs for different models

**Key Methods**:
- `calculateMetrics()` - Main entry point, returns `TurnTokenMetrics`
- `countInputTokens()` - Model-specific input token counting
- `countOutputTokens()` - Model-specific output token counting
- `calculateCost()` - USD cost estimation
- `getSupportedModels()` - Returns all supported models and pricing

**Adding New Models**:
1. Add model pricing to `modelPricingRates` map:
```typescript
private modelPricingRates: Record<string, PricingRates> = {
  'new-model': { inputPer1M: 10.0, outputPer1M: 30.0 },
  // ... existing models
};
```

2. Update tokenizer selection logic if needed:
```typescript
if (this.isNewModelFamily(model)) {
  return this.countNewModelTokens(text);
}
```

### CopilotLogWatcher (`telemetryWatcher.ts`)

**Purpose**: Monitor OTel trace files and emit turn completion events

**Key Methods**:
- `start()` - Initialize file watcher
- `processLogFile()` - Read incremental log changes
- `parseLogLine()` - Parse JSON OTel records
- `extractTurnData()` - Extract prompt/response/model data
- `stop()` - Clean up resources

**Events**:
- `turnCompleted` - Emitted with `TurnCompletedPayload`

**Extending Log Parsing**:
```typescript
private extractTurnData(span: OTelSpan): TurnCompletedPayload | null {
  // Add custom attribute extraction logic here
  const customAttr = attrs['custom.field'];
  // ...
}
```

### TokenViewProvider (`tokenViewProvider.ts`)

**Purpose**: Manage Webview UI and session state

**Key Methods**:
- `resolveWebviewView()` - Create and configure webview
- `getWebviewContent()` - Generate HTML/CSS/JS
- `updateWithTurnMetrics()` - Update UI with new metrics
- `resetSession()` - Clear accumulated state

**Webview Communication**:
```typescript
// From extension to webview
webview.postMessage({
  command: 'updateState',
  payload: sessionState
});

// From webview to extension
onDidReceiveMessage((message) => {
  if (message.command === 'resetSession') {
    // Handle reset
  }
});
```

**Customizing UI**:
- Edit HTML in `getWebviewContent()` method
- CSS uses VS Code theme variables (e.g., `--vscode-editor-background`)
- JavaScript communicates via `acquireVsCodeApi()`

### Extension Lifecycle (`extension.ts`)

**Activation Flow**:
1. `activate()` called when extension activates
2. Initialize TokenCalculator
3. Register TokenViewProvider
4. Start CopilotLogWatcher
5. Register commands
6. Setup configuration watchers

**Configuration Watching**:
```typescript
vscode.workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('copilotTokenInspector')) {
    // React to configuration changes
  }
});
```

## Common Tasks

### Adding a New Model

1. Update `modelPricingRates` in `TokenCalculator`
2. Update `isOpenAIModel()` or `isAnthropicModel()` if needed
3. Add tests to verify token counting
4. Update README with pricing info

### Changing UI Layout

1. Edit HTML in `getWebviewContent()` method
2. Add/modify CSS styles within the style tag
3. Update JavaScript event handlers
4. Test in both light and dark VS Code themes

### Adding Configuration Setting

1. Add to `contributes.configuration` in `package.json`
2. Read in component constructors via `vscode.workspace.getConfiguration()`
3. Listen for changes in configuration watcher
4. Update README with setting documentation

### Adding a New Command

1. Add to `contributes.commands` in `package.json`
2. Register with `vscode.commands.registerCommand()` in `extension.ts`
3. Add implementation
4. Test command works via Command Palette

## Debugging Tips

### Enable Debug Logging

Add console.log statements (they appear in Extension Debug Console):
```typescript
console.log('Debug info:', variable);
```

### Inspect Extension Context

In VS Code, open the Extension Debug Console (Ctrl+Shift+Y) to see:
- Activation logs
- Command executions
- Error messages
- Custom console.log output

### Monitor File System

Check which files are being watched:
```typescript
console.log('Watching:', this.otelTraceFilePath);
```

### Test Tokenizers Independently

```typescript
// In debug console
const calc = new TokenCalculator(true);
const metrics = calc.calculateMetrics('test', 'response', 'gpt-4o');
console.log(metrics);
```

## Performance Optimization

### File Watching
- Current: 1-second poll interval
- Trade-off: CPU vs responsiveness
- Adjust in `chokidar` options if needed

### Token Counting
- Lazy evaluated (only when turn completes)
- Cached in session state
- Tokenizer libraries handle caching internally

### Webview Rendering
- Batched updates per turn
- No re-renders on every keystroke
- Efficient DOM updates via innerHTML

## Code Quality

### Linting

```bash
# Check for linting errors
npx eslint src/

# Auto-fix issues
npx eslint src/ --fix
```

### Type Checking

TypeScript strict mode is enabled in `tsconfig.json`:
- No `any` types without explicit `@ts-ignore`
- All variables must be typed
- Function returns must be typed

### Code Style

- Use 2-space indentation
- PascalCase for classes
- camelCase for functions/variables
- UPPER_SNAKE_CASE for constants
- Descriptive names (avoid abbreviations)

## Continuous Integration

### GitHub Actions (template)

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run compile
      - run: npm test
```

## Publishing

### To VS Code Marketplace

1. Create publisher account at https://marketplace.visualstudio.com
2. Generate Personal Access Token (PAT)
3. Publish:
```bash
vsce publish --pat <token>
```

### Version Bumping

Update version in `package.json` following semantic versioning:
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

## Troubleshooting Development

### "Module not found" errors

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run compile
```

### Webview not updating

- Check browser DevTools in webview (Help > Toggle Developer Tools)
- Verify `postMessage` calls are correct
- Check message handler in webview JavaScript

### Tests failing

- Run with verbose output: `npm test -- --reporter spec`
- Check for async/await issues
- Verify test dependencies are installed

### Extension not activating

- Check `activationEvents` in `package.json`
- Verify entry point file path is correct
- Check VS Code output channel for errors

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API Documentation](https://code.visualstudio.com/api/extension-guides/webview)
- [Mocha Testing Framework](https://mochajs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tiktoken Documentation](https://github.com/openai/js-tiktoken)
- [Anthropic Tokenizer Docs](https://docs.anthropic.com/en/api/tokens)

## Getting Help

- Check existing issues on GitHub
- Review VS Code extension samples
- Consult the troubleshooting section in README.md
- Open a new issue with reproduction steps
