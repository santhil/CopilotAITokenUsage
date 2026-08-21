# Privacy Policy

**Effective Date:** August 19, 2026  
**Last Updated:** August 19, 2026

## Overview

Copilot AI Token Usage ("the Extension") is committed to protecting your privacy. This policy explains how the Extension handles data.

---

## 1. Data Collection & Processing

### What We Collect
- **Copilot Chat Transcripts**: Read-only access to chat history from your local VS Code workspace
- **Token Metrics**: Input/output token counts, model names, timestamps
- **Usage Analysis**: Task categorization, prompt quality scores, interaction patterns

### What We Do NOT Collect
- ❌ No data is sent to any external servers
- ❌ No personal information (name, email, workplace, IP address)
- ❌ No system information (device ID, OS version, plugins)
- ❌ No browsing data or analytics
- ❌ No cookies or tracking pixels
- ❌ No telemetry or usage statistics

---

## 2. Data Storage

### Where Your Data Lives
All data remains **exclusively on your local machine**:
- Stored in VS Code workspace storage directory
- Never transmitted over the network
- Not backed up to cloud services
- Not accessible to the Extension developers

### Data Residency
- **Single Machine**: Data exists only on the computer running VS Code
- **No Cloud Sync**: Even if you use VS Code cloud sync, this Extension does not participate
- **No Remote Access**: No remote connections or backdoors

---

## 3. Data Retention

### How Long Data Is Kept
- **Transcript Data**: Retained as long as it exists in your local VS Code workspace
- **Analysis Results**: Stored in VS Code workspace storage; deleted when you clear extension data
- **Automatic Cleanup**: Delete any time via "Reset Session" command in Extension

### User Control
You have complete control:
```
Command: Copilot Token Inspector: Reset Session
Effect: Clears all cached metrics and analysis data
Scope: Only affects this VS Code workspace
```

---

## 4. Data Security

### Technical Safeguards
- **Offline Processing**: All analysis happens locally, no API calls
- **File-Based Storage**: Uses standard VS Code secure storage APIs
- **No Encryption Needed**: Data never leaves your machine
- **No Authentication**: No accounts, logins, or external dependencies

### Your Responsibilities
- Keep VS Code and extensions updated
- Secure your machine with OS-level protections
- Review analysis results privately before sharing

---

## 5. Third-Party Access

### Who Has Access
- **Only You**: Exclusive access to your analysis and transcripts
- **No Sharing**: The Extension does not share data with:
  - GitHub (except reading Copilot transcripts you already have locally)
  - Microsoft (no telemetry to Copilot backend)
  - Analytics services
  - Any external parties

### Open Source Exceptions
If this Extension is open-sourced:
- Code is publicly visible
- Your data remains private (code visibility ≠ data access)
- Community contributions are subject to code review

---

## 6. Permissions & Consent

### Required VS Code Permissions
- **Read Chat Transcripts**: Access to local transcript files (necessary for core function)
- **Write to Workspace Storage**: Store analysis results locally
- **Configuration Access**: Read user preferences for model encoding

### No Hidden Permissions
All permissions are declared in `package.json` and shown during installation.

---

## 7. For Organizations & Teams

### Team Lead Considerations
- **No Centralized Monitoring**: This Extension does not provide team dashboards or cloud reporting
- **Individual Tool Only**: Each developer runs this independently
- **Optional Sharing**: Teams can share *analysis results* manually if desired
- **Privacy Preserved**: Even if shared, raw transcript data stays local

### Enterprise Deployment
If your organization uses this Extension:
1. Each user's data remains private by default
2. Administrators cannot monitor individual analyses
3. No network traffic to scan or block
4. No software licensing keys or phone-home mechanisms

---

## 8. Data Portability & Deletion

### Export Your Data
- **Analysis Results**: Manually copy from the UI panel
- **Raw Transcripts**: Already in your local VS Code workspace
- **No Lock-In**: Data is yours to keep or delete

### Permanent Deletion
```
Steps to delete all Extension data:
1. Run: Copilot Token Inspector: Reset Session
2. Delete VS Code workspace storage folder
3. Uninstall the Extension
All traces are removed immediately
```

---

## 9. Changes to This Policy

### Updates
- We may update this policy to clarify practices
- **No Behavior Changes**: Updates will not change how data is handled
- Notification: Updates will be documented in release notes

---

## 10. Your Rights

### You Have The Right To:
✅ Know what data the Extension processes  
✅ Control when analysis happens  
✅ Delete all data at any time  
✅ Uninstall without consequences  
✅ Use the Extension offline forever  
✅ Review this policy in plain language  

---

## 11. Contact & Support

### Questions About Privacy?
- Check the **FAQ.md** for common questions
- Review **SECURITY.md** for technical details
- Open an issue on GitHub with privacy concerns
- **No account needed** - open discussion

### Data Breach Notification
Since no data leaves your machine, breaches cannot occur at our end. However:
- If VS Code itself has a security issue, update immediately
- Your machine's security is your responsibility

---

## 12. GDPR & CCPA Compliance

### For EU Users (GDPR)
✅ **Personal Data**: Minimal (none by default)  
✅ **Processing Consent**: Not needed (no processing of personal data)  
✅ **Data Subject Rights**: You control your data completely  
✅ **Right to Erasure**: Delete via Reset Session command  

### For California Users (CCPA)
✅ **Data Sale**: We do not sell any data  
✅ **Data Sharing**: Data is never shared  
✅ **Opt-Out**: Not applicable (no collection)  
✅ **Privacy Rights**: You control all data  

---

## 13. Summary: Privacy By Design

```
┌─────────────────────────────────────────┐
│  LOCAL MACHINE                          │
│  ┌─────────────────────────────────┐   │
│  │  VS Code                        │   │
│  │  ├─ Copilot Transcripts (local) │   │
│  │  ├─ Token Inspector Analysis    │   │
│  │  └─ Workspace Storage (local)   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  NO NETWORK TRAFFIC                     │
│  NO EXTERNAL SERVERS                    │
│  NO DATA COLLECTION                     │
└─────────────────────────────────────────┘
```

---

**Last Updated:** August 19, 2026  
**Version:** 1.0

For questions or concerns, please open a GitHub issue or contact the development team.
