# Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** August 19, 2026

---

## Quick Diagnostics

### Issue Checklist

Before troubleshooting, check:
```
☐ VS Code is running latest version
☐ Copilot AI Token Usage extension is installed
☐ GitHub Copilot Chat extension is installed
☐ VS Code is not in restricted mode
☐ Workspace folder is trusted
☐ You've used Copilot Chat at least once
```

### Test Your Setup

1. Open VS Code
2. Use Copilot Chat (chat with any model)
3. Look for "Token Inspector" panel on the activity bar
4. Check if metrics appear in the panel

If you don't see metrics after step 3, continue troubleshooting below.

---

## Common Issues & Solutions

### Issue 1: "No Copilot chat history found"

**Symptom**: When running analysis, you see error: "No Copilot chat history found"

#### Cause
- Copilot Chat hasn't been used yet, OR
- Transcript folder is in unexpected location, OR
- VS Code workspace folder not properly configured

#### Solution

**Step 1: Verify Copilot Chat is working**
1. Open Copilot Chat (Ctrl+Shift+I on Windows/Linux, Cmd+Shift+I on Mac)
2. Type a simple question: "Hello"
3. Get a response back

If Copilot Chat doesn't work, install/enable it first.

**Step 2: Verify transcript folder exists**
```
Transcript location: %APPDATA%\Code\User\workspaceStorage\{workspaceId}\GitHub.copilot-chat\transcripts\
```

To find your workspace ID:
1. Open VS Code settings
2. Look in your current workspace settings
3. Or check: `%APPDATA%\Code\User\workspaceStorage\` folder

**Step 3: Use Copilot Chat at least once**
1. Open Copilot Chat in current workspace
2. Ask a question and get a response
3. A transcript file should now exist
4. Try analysis again

**Step 4: Restart VS Code**
- Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
- Type "Developer: Reload Window"
- Press Enter

#### If still not found
- Check VS Code has write permissions to `%APPDATA%`
- Try opening a different workspace folder
- See "Getting Help" section

---

### Issue 2: Extension Not Showing in Activity Bar

**Symptom**: Don't see the "Token Inspector" icon in VS Code activity bar

#### Cause
- Extension isn't installed
- Extension is disabled
- Extension is hidden
- VS Code needs restart

#### Solution

**Step 1: Check Installation**
1. Open Extensions panel (Ctrl+Shift+X on Windows/Linux, Cmd+Shift+X on Mac)
2. Search for "Copilot AI Token Usage"
3. If not listed, click "Install"
4. Wait for installation to complete

**Step 2: Check if Enabled**
In Extensions panel:
- Find "Copilot AI Token Usage"
- If there's a "Disable" button, it's already enabled ✓
- If there's an "Enable" button, click it

**Step 3: Unhide the View**
1. If extension is enabled but panel not visible:
2. Click the "Explorer" icon (top of activity bar)
3. Click the ... menu
4. Select "Views" and find "Token Inspector"
5. Click to show it

**Step 4: Restart VS Code**
- Close and reopen VS Code
- Or run "Developer: Reload Window"

**If still missing:**
- The extension may not be compatible with your VS Code version
- See "Getting Help" section

---

### Issue 3: No Metrics Appearing in Panel

**Symptom**: Token Inspector panel is visible, but shows no data even after using Copilot Chat

#### Cause
- Transcript not yet detected
- File watcher not properly initialized
- Transcript format changed
- VS Code settings issue

#### Solution

**Step 1: Use Copilot Chat**
1. Go to Copilot Chat tab
2. Ask a clear question
3. Wait for complete response
4. Switch back to Token Inspector panel

The panel should update within a few seconds.

**Step 2: Check File Watcher**
1. Open VS Code Terminal (Ctrl+` on Windows/Linux)
2. Look for messages about transcript files
3. If you see errors, note them down

**Step 3: Verify Workspace**
1. Make sure you're in a workspace (not single file)
2. File → Open Folder (select any folder)
3. Try again with Copilot Chat

**Step 4: Restart Everything**
1. Close VS Code completely
2. Wait 10 seconds
3. Reopen VS Code
4. Use Copilot Chat
5. Check Token Inspector panel

**Step 5: Check for Errors**
1. Open Developer Tools (Help → Toggle Developer Tools)
2. Look for red error messages
3. Note any errors
4. See "Getting Help" section

---

### Issue 4: Model Always Shows "gpt-4o"

**Symptom**: Token Inspector always shows "gpt-4o" even though you're using a different model

#### Cause
- Copilot Chat model setting not configured
- Extension not detecting from settings
- Using older Copilot version

#### Solution

**Step 1: Check Copilot Model Setting**
1. Press Ctrl+, (Cmd+, on Mac) to open Settings
2. Search: "copilot chat"
3. Look for "selectedModel" or similar setting
4. Verify it's set to your actual model

**Step 2: Set Copilot Preferred Model**
1. Settings → Search "github.copilot"
2. Set "preferredModel" to your model
3. Reload VS Code

**Step 3: Configure Extension Fallback**
1. Settings → Search "copilotTokenInspector"
2. Set "defaultModelEncoding" to your usual model
3. This is used when auto-detection fails

**Step 4: Verify Model Change**
1. Use Copilot Chat with the model you just set
2. Check Token Inspector panel
3. Model should now show correctly

**If model is still wrong:**
- Your Copilot Chat version may not expose model info
- Update Copilot Chat to latest version
- See "Getting Help" section

---

### Issue 5: Token Count Seems Inaccurate

**Symptom**: Token counts look too high or too low

#### Cause
- Model tokenization varies
- Large responses inflated by formatting
- Estimation method for non-OpenAI models
- File encoding issues

#### Solution

**Step 1: Understand Token Calculation**
- **OpenAI models**: Accurate within ±2%
- **Anthropic models**: Estimated (±5% accuracy)
- **Other models**: Rough estimate (±10% accuracy)

Token count naturally varies by model.

**Step 2: Compare to Official Tools**
For OpenAI models:
1. Visit: https://platform.openai.com/tokenizer
2. Paste your text
3. Compare the count

If significantly different, note the discrepancy.

**Step 3: Check Model Selection**
1. Verify correct model is selected
2. Different models tokenize differently
3. This is normal and expected

**Step 4: Report if Significantly Off**
- If OpenAI model token count is off by >5%
- If Anthropic model is off by >10%
- Report on GitHub with:
  - The text/prompt
  - Expected token count
  - Actual token count
  - Model used

---

### Issue 6: Analysis Feature Shows Errors

**Symptom**: Clicking "Analyze" shows an error message

#### Cause
- Transcript file corrupted
- Permission issues reading file
- Transcript file too large
- Outdated transcript format

#### Solution

**Step 1: Check Permissions**
Ensure VS Code has read permission:
```
Windows:
1. Find transcript file in %APPDATA%\Code\User\workspaceStorage\
2. Right-click → Properties
3. Security tab → Make sure readable

Mac/Linux:
1. Open Terminal
2. cd ~/Library/Application\ Support/Code/User/workspaceStorage/
3. ls -la to check permissions
```

**Step 2: Verify Transcript File**
1. Check file size isn't > 500MB (too large)
2. File should have `.jsonl` extension
3. Should contain readable JSON lines

**Step 3: Use Latest Transcript**
The analysis runs on the most recent transcript file:
1. Have a recent Copilot Chat
2. Close and reopen analysis
3. This creates new transcript for analysis

**Step 4: Restart VS Code**
1. Close VS Code
2. Delete analysis cache (if applicable)
3. Reopen VS Code
4. Try analysis again

**If error persists:**
- See "Getting Help" section
- Include the exact error message

---

### Issue 7: Extension Crashes or Becomes Unresponsive

**Symptom**: VS Code becomes slow or unresponsive when using Token Inspector

#### Cause
- Very large transcript file (> 100MB)
- Rare race condition in file watching
- Memory leak (unlikely but possible)
- Compatibility issue with other extensions

#### Solution

**Step 1: Reduce Transcript Size**
Large transcript files can cause slowness:
```
1. Navigate to: %APPDATA%\Code\User\workspaceStorage\{id}\GitHub.copilot-chat\transcripts\
2. Find large .jsonl files
3. Backup and delete old ones
4. Restart VS Code
```

**Step 2: Reload VS Code**
1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type "Developer: Reload Window"
3. Press Enter

This resets the extension without restarting VS Code.

**Step 3: Disable Other Extensions**
Large number of extensions can cause issues:
1. Disable other VS Code extensions
2. Enable only Copilot Token Inspector
3. Test performance
4. Re-enable extensions one at a time to find culprit

**Step 4: Update VS Code**
1. Check VS Code version (Help → About)
2. Update to latest if outdated
3. Restart VS Code
4. Try again

**Step 5: Uninstall and Reinstall**
1. Uninstall extension
2. Reload VS Code
3. Reinstall from marketplace
4. Reload VS Code again

---

### Issue 8: "Reset Session" Doesn't Clear Everything

**Symptom**: After resetting session, old data still appears

#### Cause
- Extension cache not fully cleared
- VS Code workspace storage needs cleanup
- Transcript file still has old data

#### Solution

**Step 1: Reset Session Properly**
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Copilot Token Inspector: Reset Session"
3. Press Enter
4. Reload VS Code ("Developer: Reload Window")

**Step 2: Clear Workspace Storage**
1. Navigate to: `%APPDATA%\Code\User\workspaceStorage\`
2. Find your workspace folder (named with random ID)
3. Delete the Token Inspector data:
   - Look for folders with this path pattern
   - Delete any cache files related to extension

**Step 3: Delete Transcript Files (Nuclear Option)**
⚠️ **Warning**: This deletes all Copilot Chat transcripts!

```
1. Navigate to: %APPDATA%\Code\User\workspaceStorage\{id}\GitHub.copilot-chat\transcripts\
2. Delete all .jsonl files
3. Restart VS Code
4. This forces complete fresh start
```

**Step 4: Restart VS Code**
1. Close VS Code completely
2. Wait 5 seconds
3. Reopen VS Code
4. Start fresh with Copilot Chat

---

### Issue 9: Analysis Panel Appears Blank

**Symptom**: Analysis runs but panel shows no content

#### Cause
- Analysis data not generated properly
- Panel rendering issue
- Transcript parsing failed

#### Solution

**Step 1: Check Console for Errors**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Take note of any errors

**Step 2: Try Analysis Again**
1. Use Copilot Chat a few times (at least 5 interactions)
2. Open Command Palette
3. Run "Copilot Token Inspector: Analyze"
4. Check if panel renders

**Step 3: Verify Transcript Data**
1. Navigate to transcript folder (see Issue 1)
2. Check `.jsonl` file exists and has content
3. File should have multiple lines of JSON

**Step 4: Reload Extension**
1. Command Palette → "Developer: Reload Window"
2. Try analysis again

---

### Issue 10: Can't Find Token Inspector Command

**Symptom**: Command palette doesn't show "Copilot Token Inspector" commands

#### Cause
- Extension not properly installed
- Extension disabled
- Command palette filter issue

#### Solution

**Step 1: Verify Installation**
1. Open Extensions (Ctrl+Shift+X)
2. Search "Copilot AI Token Usage"
3. Should show as installed and enabled

**Step 2: Clear Command Palette Filter**
1. Open Command Palette (Ctrl+Shift+P)
2. Type: "copilot" (full word)
3. Commands should appear

If still not found:
1. Ctrl+Shift+P → Type "reload"
2. Run "Developer: Reload Window"

**Step 3: Check Extension Settings**
1. Click the extension in Extensions panel
2. Check if it shows as "Active"
3. If disabled, click Enable

---

## Performance Issues

### Extension Making VS Code Slow?

**Check These:**

1. **Large Transcript Files**
   - Navigate to transcript folder
   - Check file sizes
   - Delete files > 100MB
   - Restart VS Code

2. **Many VS Code Extensions**
   - Disable other extensions one by one
   - Check if performance improves
   - Re-enable the culprit extensions carefully

3. **System Resources**
   - Check available RAM (need at least 500MB free)
   - Close other applications
   - Restart computer

4. **VS Code Version**
   - Update to latest version
   - Some older versions have performance issues

### Token Counting Taking Too Long?

- First analysis of large transcript takes time
- Subsequent analyses are faster (cached)
- This is normal for files with 1000+ interactions

---

## Network & Connectivity Issues

### "No internet" Error Messages?

This extension doesn't need internet, so:

**If you see network errors:**
1. This is likely a VS Code issue, not the extension
2. Try: "Developer: Reload Window"
3. Check VS Code can access its own resources
4. Restart VS Code completely

The extension works fully offline.

---

## Getting Help

### How to Report Issues Effectively

If you're stuck, report the issue with:

**Essential Information:**
```
1. VS Code version: [Help → About]
2. Extension version: [Extensions panel]
3. OS: [Windows/Mac/Linux]
4. What were you doing when it broke?
5. Error message (if any): [copy/paste exactly]
```

**Helpful Additions:**
```
6. Steps to reproduce
7. What you've already tried
8. Developer console errors (F12 → Console)
9. Any relevant log lines
```

### Where to Report Issues

- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For general questions
- **Email**: Contact development team directly

---

### Common Questions

**Q: Why is the extension not detecting my Chat?**
A: See Issue 1 - "No Copilot chat history found"

**Q: Why is my model name wrong?**
A: See Issue 4 - "Model Always Shows gpt-4o"

**Q: Why are tokens inaccurate?**
A: See Issue 5 - "Token Count Seems Inaccurate"

**Q: The panel is empty after analysis**
A: See Issue 9 - "Analysis Panel Appears Blank"

**Q: Extension is slow**
A: See "Performance Issues" section

---

## Advanced Troubleshooting

### Check Transcript File Directly

```powershell
# On Windows PowerShell
$transcriptPath = "$env:APPDATA\Code\User\workspaceStorage"
Get-ChildItem $transcriptPath -Recurse -Filter "*.jsonl"
```

```bash
# On Mac/Linux Terminal
find ~/Library/Application\ Support/Code/User/workspaceStorage -name "*.jsonl"
```

Look for `.jsonl` files. They should contain readable JSON.

### Check Extension Logs

1. Open Output panel (Ctrl+Shift+U)
2. Find "Token Inspector" in dropdown
3. Look for any error messages

### Reset Extension to Defaults

```
1. Delete extension settings:
   File → Preferences → Settings
   Search: copilotTokenInspector
   Reset all to defaults

2. Delete extension data:
   Command Palette → Developer: Reload Window

3. Reinstall if needed:
   Uninstall → Close VS Code → 
   Reopen → Reinstall from marketplace
```

---

## When All Else Fails

### Nuclear Reset (Start Fresh)

```
1. Uninstall extension
2. Close VS Code
3. Delete workspace storage for this workspace:
   %APPDATA%\Code\User\workspaceStorage\{your-workspace-id}\
4. Restart computer (optional but thorough)
5. Reopen VS Code
6. Reinstall extension
7. Use Copilot Chat
8. Extension should now work fresh
```

### Contact Support

If you've tried all troubleshooting steps:
1. Gather information from "How to Report Issues Effectively"
2. Open GitHub issue with all details
3. Wait for community/developer response
4. Or email development team

---

## Quick Checklist for Complete System Reset

If nothing works:

```
☐ VS Code closed completely
☐ Backup important data
☐ Uninstall extension
☐ Restart computer
☐ Delete workspace storage folder (risky - backup first)
☐ Reopen VS Code
☐ Reinstall extension
☐ Create new simple workspace folder
☐ Open that folder in VS Code
☐ Use Copilot Chat once
☐ Check if Token Inspector works
☐ Re-enable other extensions slowly
```

---

## Performance Benchmarks

For reference, expected performance on typical system:

```
Extension startup:       < 1 second
First chat detection:    < 2 seconds
Token counting:          < 100ms per chat
Analysis generation:     < 5 seconds (first time)
Analysis re-generation:  < 1 second (cached)
```

If significantly slower, see "Performance Issues" section.

---

## Frequently Troubleshot Issues

```
1. Extension not visible         → Issue 2
2. No chat data showing         → Issue 3
3. Wrong model displayed        → Issue 4
4. Token count off              → Issue 5
5. Analysis doesn't work        → Issue 6
6. Extension crashes            → Issue 7
7. Reset doesn't work           → Issue 8
8. Analysis panel blank         → Issue 9
9. Can't find commands          → Issue 10
10. Very slow performance       → Performance Issues
```

---

**Can't find your issue?** See "Getting Help" section to report it.

**Need more info?** Check [FAQ.md](FAQ.md) and [BEST_PRACTICES.md](BEST_PRACTICES.md).

