# Quick Start Guide

Get the Copilot Token Inspector extension up and running in 5 minutes.

## Installation (30 seconds)

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Copilot Token Inspector"
4. Click Install

### From GitHub (Development Mode)
```bash
git clone https://github.com/yourusername/copilot-token-inspector.git
cd copilot-token-inspector
npm install
code .
# Press F5 to run in debug mode
```

## Configuration (1 minute)

### Step 1: Find Your Copilot Logs

Open Terminal/PowerShell and run:

**macOS:**
```bash
ls ~/Library/Application\ Support/Code/User/workspaceStorage/
```

**Windows:**
```powershell
Get-ChildItem "$env:APPDATA\Code\User\workspaceStorage" | Select-Object Name
```

**Linux:**
```bash
ls ~/.config/Code/User/workspaceStorage/
```

Look for a folder with a pattern like `1c8baab65d711e6dc7c7b8e0be7e1484/GitHub.copilot-chat/debug-logs`

### Step 2: Configure Extension

1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "Copilot Token Inspector"
3. Set `otelTraceFilePath` to the log directory you found

**Example Setting:**
```json
{
  "copilotTokenInspector.otelTraceFilePath": "/Users/yourname/Library/Application Support/Code/User/workspaceStorage/1c8baab65d711e6dc7c7b8e0be7e1484/GitHub.copilot-chat/debug-logs"
}
```

### Step 3: Choose Default Model (Optional)

Set `copilotTokenInspector.defaultModelEncoding` to your primary model:
- `gpt-4o` (default)
- `claude-3.5-sonnet`
- `gemini-1.5-pro`

## Usage (2 minutes)

### 1. Open Token Inspector View

- In the VS Code Activity Bar, find the Chat icon
- Look for "Token Inspector" in the Secondary Sidebar
- Click to expand the view

### 2. Start a Copilot Chat

1. Open Copilot Chat (Ctrl+L or Cmd+L)
2. Ask Copilot any question
3. Watch the Token Inspector update in real-time!

### 3. View Metrics

The Token Inspector shows:

**Last Turn Card:**
- Input Tokens: Tokens in your prompt
- Output Tokens: Tokens in Copilot's response
- Total: Sum of input + output
- Estimated Cost: USD cost for this turn
- Est. Credits: GitHub AI Credits used

**Session Progress Card:**
- Turns: Number of turns in this session
- Total Tokens: Accumulated tokens
- Input/Output Ratio: Breakdown
- Total Cost: Accumulated USD cost
- Progress Bar: Context window usage

### 4. Manage Session

- **Clear Session**: Reset counters to start fresh
- **Export**: Save metrics to JSON file

## Features at a Glance

### Real-Time Tracking ⚡
Updates instantly as Copilot responds

### Multi-Model Support 🤖
- OpenAI: GPT-4o, GPT-4, o3-mini
- Anthropic: Claude 3.5 Sonnet, 3 Opus
- Google: Gemini 1.5 Pro/Flash
- Fallback: Character-based estimation

### Cost Calculation 💰
- Per-token pricing from model providers
- USD cost estimation
- GitHub AI Credits projection
- Session-wide totals

### Smart Warnings ⚠️
- Alert when session tokens exceed threshold
- Visual progress bar for context windows
- Configurable warning limits

### Data Persistence 💾
- Session state saved automatically
- Export metrics anytime
- Load previous sessions on restart

## Common Questions

### Q: Why doesn't the extension detect my turns?

**A:** Check these in order:
1. Is Copilot Chat installed? (Install from Extensions if not)
2. Is `otelTraceFilePath` configured? (Check Settings)
3. Does the log directory exist? (Create if missing)
4. Try a fresh Copilot conversation to generate logs

### Q: Token counts seem wrong?

**A:** Different models use different tokenizers:
- Exact: OpenAI and Claude use official tokenizers
- Estimated: Gemini and unknown models use ~4 chars/token approximation
- Look for the "Estimated" badge if counts are approximate

### Q: Why is cost $0?

**A:** Make sure `enableCostTracking` is enabled in Settings (defaults to true)

### Q: Can I use multiple models in one session?

**A:** Yes! Each turn's model is detected and costs calculated separately.

### Q: Where is my session data stored?

**A:** VS Code's secure global storage (synced if you have Settings Sync enabled)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+L / Cmd+L | Open Copilot Chat |
| Ctrl+Shift+X | Open Extensions |
| Ctrl+, | Open Settings |
| Ctrl+Shift+Y | Open Debug Console (development) |
| F5 | Run Extension (development mode) |

## Tips & Tricks

### Tip 1: Monitor Costs Over Time
Export metrics regularly to track spending patterns across sessions.

### Tip 2: Set Realistic Warnings
For GPT-4o users: Set warning at 80k-100k tokens (leaves room before 128k limit)

### Tip 3: Compare Models
Use "Clear Session" and try different models to compare token efficiency.

### Tip 4: Use with Settings Sync
Enable Settings Sync to sync configuration across machines.

### Tip 5: Check the Extension Output
When debugging, open Output Panel (Ctrl+Shift+U) and select "Copilot Token Inspector" channel.

## Next Steps

### Read More
- [Full README](README.md) - Complete documentation
- [Development Guide](DEVELOPMENT.md) - For developers
- [Architecture](ARCHITECTURE.md) - System design

### Get Involved
- Report issues on [GitHub Issues](https://github.com/yourusername/copilot-token-inspector/issues)
- Suggest features in [GitHub Discussions](https://github.com/yourusername/copilot-token-inspector/discussions)
- Contribute code via [Pull Requests](https://github.com/yourusername/copilot-token-inspector/pulls)

### Troubleshooting
- Check the [Troubleshooting section in README](README.md#troubleshooting)
- Run tests: `npm test`
- Enable debug logging in VS Code settings

## Uninstall

Remove the extension from VS Code Extensions panel or run:
```bash
code --uninstall-extension copilot-extensions.copilot-token-inspector
```

Session data will be preserved in case you reinstall.

## Support

Need help?
- 📖 Check [README.md](README.md)
- 🐛 File an [issue](https://github.com/yourusername/copilot-token-inspector/issues)
- 💬 Start a [discussion](https://github.com/yourusername/copilot-token-inspector/discussions)
- 📧 Email: support@example.com

---

**Happy token tracking! 🚀**
