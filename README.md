# Copilot Token Inspector

A powerful VS Code extension for real-time token usage tracking and cost analysis of GitHub Copilot Chat sessions.

## Features

✨ **Real-time Token Tracking**
- Monitors Copilot Chat turns in real-time
- Displays input and output tokens for each turn
- Accumulates session-wide token metrics

📊 **Multi-Model Support**
- OpenAI models (GPT-4o, GPT-4, GPT-4-Turbo, o3-mini, GPT-3.5-Turbo)
- Anthropic Claude (3.5 Sonnet, 3 Opus, 3 Sonnet, 3 Haiku)
- Google Gemini models with fallback estimation
- Automatic tokenizer selection per model family

💰 **Cost Estimation**
- Real-time cost calculation in USD
- GitHub AI Credits estimation
- Configurable pricing rates per model
- Session-wide cost accumulation

⚠️ **Session Warnings**
- Configurable token threshold warnings
- Context window progress visualization
- Session state persistence

🔧 **Extensible Configuration**
- Choose default model encoding
- Set session token warning thresholds
- Specify OTel trace log paths
- Toggle cost tracking

## Installation

### From VSIX (Manual Installation)

```bash
# Build the extension
npm install
npm run compile
npm run esbuild

# Package as VSIX
vsce package

# Install in VS Code
code --install-extension copilot-token-inspector-0.1.0.vsix
```

### From Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Open the folder in VS Code
4. Press `F5` to launch the extension in debug mode

## Configuration

Configure the extension via VS Code Settings (`Cmd/Ctrl + ,` and search for "Copilot Token Inspector"):

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `copilotTokenInspector.defaultModelEncoding` | enum | `gpt-4o` | Default model for token calculation |
| `copilotTokenInspector.maxSessionTokenWarning` | number | `100000` | Token threshold to trigger warnings |
| `copilotTokenInspector.otelTraceFilePath` | string | `` | Path to Copilot OTel trace logs |
| `copilotTokenInspector.enableCostTracking` | boolean | `true` | Enable cost estimation feature |

### Example Configuration (settings.json)

```json
{
  "copilotTokenInspector.defaultModelEncoding": "gpt-4o",
  "copilotTokenInspector.maxSessionTokenWarning": 100000,
  "copilotTokenInspector.otelTraceFilePath": "/Users/yourname/Library/Application Support/Code/User/workspaceStorage",
  "copilotTokenInspector.enableCostTracking": true
}
```

## Finding Copilot OTel Log Path

The GitHub Copilot Chat extension stores OTel logs in different locations based on your OS:

### macOS
```
~/Library/Application Support/Code/User/workspaceStorage/*/GitHub.copilot-chat/debug-logs
```

### Windows
```
C:\Users\{username}\AppData\Roaming\Code\User\workspaceStorage\{id}\GitHub.copilot-chat\debug-logs
```

### Linux
```
~/.config/Code/User/workspaceStorage/*/GitHub.copilot-chat/debug-logs
```

## Usage

1. **Start a conversation** with GitHub Copilot Chat in VS Code
2. **Open the Token Inspector view** - Click on the "Token Inspector" view in the Secondary Sidebar (Chat container)
3. **Monitor in real-time** - The UI updates with each Copilot turn showing:
   - Input tokens (from your prompt)
   - Output tokens (from Copilot's response)
   - Total turn tokens
   - Estimated cost in USD
   - Estimated GitHub AI Credits

4. **Track session progress** - The Session Progress card shows:
   - Number of turns
   - Accumulated session tokens
   - Input/Output token breakdown
   - Context window fill percentage
   - Warning indicator if threshold exceeded

5. **Manage session** - Use buttons to:
   - **Clear Session** - Reset all accumulated metrics
   - **Export** - Save session metrics to a JSON file

## Commands

| Command | Description |
|---------|-------------|
| `Copilot Token Inspector: Clear Token Counter` | Reset session state |
| `Copilot Token Inspector: Export Session Metrics` | Export metrics to file |

## Architecture

### Components

#### `tokenizerEngine.ts` - Token Calculation
- Multi-model tokenizer support
- Uses `tiktoken` for OpenAI models
- Uses `@anthropic-ai/tokenizer` for Claude models
- Character-based estimation fallback
- Cost calculation with configurable pricing

#### `telemetryWatcher.ts` - Log Monitoring
- File system watcher for OTel trace logs
- JSON streaming parser (NDJSON format)
- Turn completion event emitter
- Error handling for locked/incomplete files

#### `tokenViewProvider.ts` - UI/Webview
- VS Code Webview View Provider
- Theme-aware HTML/CSS UI
- Real-time state updates via postMessage
- Session state persistence

#### `extension.ts` - Lifecycle Management
- Activates all components
- Registers commands and event handlers
- Configuration change monitoring
- Proper disposal and cleanup

## Development

### Build

```bash
# Compile TypeScript
npm run compile

# Build with esbuild (bundled)
npm run esbuild

# Watch mode for development
npm run esbuild-watch
```

### Testing

```bash
# Run unit tests
npm test

# Run specific test file
npm test -- --grep "TokenCalculator"
```

### Debug

1. Press `F5` in VS Code to launch extension in debug mode
2. Set breakpoints in the code
3. Open the Extension Debug Console to see logs

## Pricing Information

Current pricing rates (as of 2024) per 1M tokens:

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $5.00 | $15.00 |
| GPT-4 Turbo | $10.00 | $30.00 |
| GPT-4 | $30.00 | $60.00 |
| GPT-3.5-Turbo | $0.50 | $1.50 |
| o3-mini | $0.20 | $0.80 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |
| Gemini 1.5 Pro | $1.25 | $5.00 |

*Note: Prices are estimates and may change. Always refer to official provider pricing.*

## Troubleshooting

### Extension not detecting Copilot turns

1. Verify Copilot Chat is enabled in VS Code
2. Check the OTel trace file path in settings
3. Ensure the log directory exists and is readable
4. Check the extension output channel for error messages

### Token counts seem high/low

- Different models use different tokenizers
- If marked as "Estimated", local tokenization is used as fallback
- Try updating the default model encoding in settings

### Cost calculations don't match provider invoices

- This extension uses public pricing rates which may differ from your actual rates
- GitHub AI Credit rates are estimated (1 credit ≈ $0.01)
- Use the export feature to verify against your billing dashboard

## Performance Considerations

- File watching uses a 1-second poll interval to avoid excessive CPU usage
- Large log files are read incrementally (streaming)
- Token calculation is lazy-loaded (only on turn completion)
- Session state is persisted in VS Code's global storage
- Webview updates are batched per turn

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License. The license text is included in the extension package.

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation and troubleshooting guide

## Disclaimer

This extension is not affiliated with GitHub, OpenAI, Anthropic, or Google. Token counts and cost estimates are based on public documentation and may vary. Always refer to official provider documentation for accurate pricing and token calculations.

## Changelog

### Version 0.1.0
- Initial release
- Real-time token tracking for Copilot Chat
- Multi-model tokenizer support
- Cost estimation feature
- Session state management
- Webview UI with theme support
- Comprehensive unit tests
