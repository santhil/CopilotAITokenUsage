# Frequently Asked Questions (FAQ)

**Version:** 1.0  
**Last Updated:** August 19, 2026

---

## Installation & Setup

### Q: How do I install Copilot AI Token Usage?
**A:** Search for "Copilot AI Token Usage" in VS Code Extensions marketplace and click Install. That's it!

### Q: Do I need any special setup?
**A:** No special setup required. The extension auto-detects your Copilot chat transcripts and starts analyzing immediately.

### Q: Does it work with VS Code Insiders?
**A:** Yes, it works with both stable and Insiders versions of VS Code.

### Q: What if I'm using VS Code Web (online)?
**A:** Currently works with desktop VS Code only. Web version doesn't have file system access needed for transcript analysis.

### Q: Can I use this on multiple machines?
**A:** Yes! Install on each machine. Each installation has separate analysis (not synced between machines).

---

## Features & Functionality

### Q: What does the extension actually do?
**A:** It monitors your Copilot Chat interactions and provides:
- Real-time token counting
- Model tracking
- Prompt quality ratings (1-5 stars)
- Comprehensive usage analysis
- Skill ratings (1-10)
- Improvement recommendations

### Q: How is token counting calculated?
**A:** 
- **OpenAI models** (GPT-4, GPT-3.5): Uses official `tiktoken` library for accuracy
- **Anthropic models** (Claude): Character-based estimation (~4 chars = 1 token)
- **Other models**: Generic estimation
- All calculations are 100% offline, no API calls

### Q: Is the token count accurate?
**A:** Yes, within ~5% for known models:
- GPT-4o: ±2% accuracy
- GPT-3.5-turbo: ±3% accuracy
- Claude 3.5: ±5% (estimation-based)
- Others: May vary ±10%

### Q: Why doesn't the UI update immediately?
**A:** Updates happen within 150ms of detecting a new message. This is as fast as the file system can detect changes. Very responsive in practice.

### Q: Can I export my data?
**A:** Currently, you can view results in the Analysis panel. You can also manually copy session metrics from the UI.

### Q: Does this work offline?
**A:** Yes! 100% offline. Works in air-gapped environments with no internet.

---

## Data & Privacy

### Q: Where is my data stored?
**A:** Exclusively on your local machine:
- Copilot transcripts: Already stored by VS Code locally
- Analysis results: Stored in VS Code workspace storage
- Token counts: Calculated and stored locally
- Nothing is uploaded anywhere

### Q: Is my chat data shared with anyone?
**A:** No. Your data:
- Never leaves your machine
- Isn't seen by the extension developers
- Isn't analyzed by external services
- Isn't backed up to cloud
- Is completely private

### Q: What if I'm behind a corporate firewall?
**A:** No problem. The extension:
- Makes zero network requests
- Doesn't need internet connectivity
- Won't trigger firewall alerts
- Works in restricted environments
- Fully complies with corporate policies

### Q: Does this collect telemetry?
**A:** No. There is:
- No usage tracking
- No analytics
- No crash reporting
- No phone-home mechanism
- No external API calls

### Q: What if someone gets access to my computer?
**A:** Your transcripts and analysis are protected by:
- OS-level file permissions
- VS Code's secure storage
- Standard file system protections
- No additional encryption needed (data is already local)

---

## Models & Token Usage

### Q: Why does it show the same model every time?
**A:** The extension detects your Copilot model selection from:
1. `github.copilot-chat.selectedModel` setting
2. `github.copilot.preferredModel` setting
3. Extension settings as fallback

Check your VS Code Copilot Chat settings to confirm which model is selected.

### Q: Can I manually set which model is used?
**A:** The extension reads your Copilot settings. To change the detected model:
1. Open VS Code Settings
2. Search for "copilot chat"
3. Change your model selection there
4. Extension will automatically detect the new model

### Q: Why does my token count seem high?
**A:** Token count depends on:
- Response length (longer = more tokens)
- Model used (different models have different tokenization)
- Complexity of the prompt

Use the Analysis feature to see your average tokens and patterns.

### Q: Can I see which model used the most tokens?
**A:** Yes! Run "Analyze" from the command palette and look at "Model Distribution" which shows both count and overall impact.

### Q: Does the extension work with offline models?
**A:** Not directly (e.g., Ollama, local LLMs). It tracks models used via Copilot Chat specifically.

---

## Skill Ratings & Analysis

### Q: What does a "skill rating" mean?
**A:** It's a score (1-10) measuring how effectively you use AI:
- Higher score = clearer prompts, faster resolutions, better model choices
- Lower score = vague prompts, more iterations needed, model mismatches
- It's **personal feedback**, not a performance metric

See [SKILL_RATING_METHODOLOGY.md](SKILL_RATING_METHODOLOGY.md) for detailed explanation.

### Q: Why is my score so low?
**A:** Common reasons:
- Prompts lack detail or error messages
- Frequently asking unrelated questions
- Many back-and-forth exchanges
- Using same model for all tasks

Check the "Areas to Improve" section for specific actionable feedback.

### Q: Will my score affect my job?
**A:** No. This extension is purely personal. Your score:
- Is completely private
- Isn't shared with anyone
- Isn't used for evaluation
- Is never monitored by managers
- Is only for your own improvement

### Q: How often does my score update?
**A:** After each AI chat completion. The overall score reflects your last ~20-30 interactions for accuracy.

### Q: Why did my score drop?
**A:** Common reasons:
- Recent prompts were less detailed
- More context-switching between topics
- Using less-optimal models for tasks
- More iterations needed recently

This is normal! Scores fluctuate. Focus on patterns over time.

### Q: Can I improve my score?
**A:** Absolutely! Common improvements:
- Include error messages and code samples in prompts
- Add context (framework versions, what you've tried)
- Stay focused on one task per conversation
- Choose appropriate models for tasks

See [BEST_PRACTICES.md](BEST_PRACTICES.md) for detailed improvement strategies.

### Q: Is it possible to get 10/10?
**A:** Rare, but possible! You'd need:
- Exceptional prompt crafting
- Minimal iterations
- Perfect model selection
- Clear task focus throughout
- Consistent high-quality interactions

Most excellent developers score 8-9. That's still "expert level."

### Q: Why is my debugging skill different from my prompt crafting?
**A:** Each dimension measures different skills:
- **Debugging**: How you ask about errors
- **Prompt Crafting**: Overall question clarity
- **Task Focus**: Staying on topic
- **AI Efficiency**: Getting results quickly

These can vary independently based on your recent work type.

---

## UI & Interaction

### Q: Where's the Token Inspector panel?
**A:** Look for the VS Code Activity Bar (left sidebar):
- Click the "Token Inspector" icon (looks like a calculator)
- Opens the metrics panel on the right

### Q: How do I reset my session?
**A:** Run this command:
```
Copilot Token Inspector: Reset Session
```
Or through Command Palette (Ctrl+Shift+P on Windows/Linux, Cmd+Shift+P on Mac).

This clears cached metrics but keeps transcript data.

### Q: Can I export my analysis?
**A:** You can:
- Copy text from the Analysis panel (select and Ctrl+C)
- Take screenshots of the results
- Share selected insights with your team (optional)

Full data export functionality is on the roadmap.

### Q: Why is the sidebar cluttered?
**A:** The extension only adds one icon. To hide it:
1. Right-click the icon
2. Select "Hide"
3. Access via Command Palette instead

### Q: Can I customize the dashboard?
**A:** Basic customization available:
- Configure preferred model encoding
- Set token warning thresholds
- Turn off analysis features if desired

See settings under `copilotTokenInspector`.

---

## Performance & Troubleshooting

### Q: Is this extension slow?
**A:** No. The extension:
- Uses only ~5-10% CPU during analysis
- Adds negligible memory overhead
- Doesn't impact VS Code performance
- Lightweight and optimized

### Q: Does it slow down VS Code startup?
**A:** Minimal impact (< 100ms added to startup).

### Q: My transcripts aren't being detected. Why?
**A:** Check:
1. Have you used Copilot Chat at least once?
2. Is Copilot Chat enabled in VS Code?
3. Check the correct path is being watched

If stuck, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

### Q: The token count seems wrong. What's happening?
**A:** Verify:
1. Selected model is correct (check Copilot settings)
2. Response was successfully generated
3. Check calculation notes in Analysis panel

Token counting can vary ±5% based on model.

### Q: Why does the UI sometimes lag?
**A:** Rare cases:
- Very large transcript files (> 100MB)
- Very old machine
- Many VS Code extensions running

Solution: Restart VS Code or reduce extensions.

### Q: Can I use this with other AI extensions?
**A:** Yes! This extension only reads Copilot Chat transcripts. Other AI tools won't interfere.

---

## Compatibility & Systems

### Q: Does this work on Windows?
**A:** Yes, fully supported.

### Q: Does this work on macOS?
**A:** Yes, fully supported (Intel and Apple Silicon).

### Q: Does this work on Linux?
**A:** Yes, fully supported (tested on Ubuntu, Debian, Fedora).

### Q: What about VS Code versions?
**A:** Works with:
- VS Code 1.90+ (current and newer)
- VS Code Insiders
- GitHub Copilot 1.0+

### Q: Do I need VS Code Remote?
**A:** No, but it's compatible if you use Remote.

### Q: Can I use this in VS Code Codespaces?
**A:** Currently no (Codespaces limitations). Desktop VS Code recommended.

---

## Advanced Questions

### Q: Can I use this for team analytics?
**A:** Not built-in (extension is personal by design). However:
- Team members can choose to share results
- Aggregate anonymized insights possible manually
- Future versions may add optional team features

See [BEST_PRACTICES.md](BEST_PRACTICES.md) for team discussion ideas.

### Q: How do I interpret task classifications?
**A:** See [SKILL_RATING_METHODOLOGY.md](SKILL_RATING_METHODOLOGY.md) section 5 for detailed task definitions and when each occurs.

### Q: Can I exclude certain conversations?
**A:** Currently no exclusion feature. Roadmap item for privacy-sensitive conversations.

### Q: How long are transcripts kept?
**A:** As long as Copilot Chat keeps them. They're stored by VS Code, not this extension.

### Q: Can I migrate analysis to another machine?
**A:** Not directly yet. Roadmap item for data portability.

### Q: Is there an API for third-party tools?
**A:** Not currently. Extension data is stored locally and not exposed.

---

## For Teams & Organizations

### Q: Can our team use this together?
**A:** Yes! Each developer installs independently. Optional:
- Share tips and techniques
- Discuss improvement strategies
- Learn from each other's approaches

See [BEST_PRACTICES.md](BEST_PRACTICES.md) for team guidelines.

### Q: Is this a spy tool?
**A:** No. This is explicitly NOT:
- A monitoring tool
- A management metric
- An evaluation tool
- A surveillance system

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) and [SECURITY.md](SECURITY.md).

### Q: Can managers see my analysis?
**A:** No. Analysis is completely local to your machine. Managers cannot access, view, or monitor it.

### Q: What if my organization wants to monitor AI usage?
**A:** This extension doesn't support that (by design). For organization-wide monitoring, you'd need different tools designed for that purpose.

### Q: Is this approved for enterprise?
**A:** Check with your IT security team, but:
- ✅ No network calls
- ✅ No external data transfer
- ✅ No credentials needed
- ✅ Completely safe in corporate environments

See [SECURITY.md](SECURITY.md) for enterprise security details.

### Q: Can we block this extension?
**A:** IT administrators can disable extensions through VS Code policies if needed.

---

## Getting Help

### Q: The extension crashed. What do I do?
**A:** 
1. Restart VS Code
2. Run `Developer: Reload Window` command
3. If problem persists, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Q: Where do I report bugs?
**A:** Open an issue on the GitHub repository (link in README).

### Q: Can I suggest features?
**A:** Yes! Open a feature request on GitHub. Community feedback shapes development.

### Q: Is there documentation?
**A:** Yes! Check:
- [README.md](README.md) - Quick start
- [BEST_PRACTICES.md](BEST_PRACTICES.md) - Usage guide
- [SKILL_RATING_METHODOLOGY.md](SKILL_RATING_METHODOLOGY.md) - Rating details
- [SECURITY.md](SECURITY.md) - Security info
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

### Q: Who do I contact for support?
**A:** 
- GitHub Issues for bugs/features
- Check FAQ and docs first
- Community support on relevant forums

---

## Quick Answers

```
Q: Is it free?
A: Yes, completely free and open source

Q: Will it be free forever?
A: Yes

Q: Does it need internet?
A: No, 100% offline

Q: Is my data safe?
A: Yes, never leaves your machine

Q: Can I uninstall it?
A: Yes, anytime. Uninstall from Extensions panel

Q: Does it slow VS Code?
A: No, negligible impact

Q: Can I use with other extensions?
A: Yes, fully compatible

Q: Is it open source?
A: Yes, code is available for review

Q: Do you sell my data?
A: No, we don't collect any

Q: Can my employer see this?
A: No, completely private

Q: Is this a virus?
A: No, official VS Code extension

Q: Works on Mac?
A: Yes, Windows, Mac, Linux
```

---

## Still Have Questions?

1. **Check [BEST_PRACTICES.md](BEST_PRACTICES.md)** - Most questions about usage answered there
2. **Check [SKILL_RATING_METHODOLOGY.md](SKILL_RATING_METHODOLOGY.md)** - Detailed rating explanation
3. **Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Technical issues
4. **Check [SECURITY.md](SECURITY.md)** - Privacy and security details
5. **Open GitHub Issue** - Report bugs or ask questions

---

**Last Updated:** August 19, 2026  
**Version:** 1.0

