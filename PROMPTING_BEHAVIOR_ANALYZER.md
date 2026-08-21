# 🎯 AI Prompting Behavior Analysis Feature

## Overview

The Copilot Token Inspector now includes a comprehensive **Prompting Behavior Analyzer** that automatically:

1. **Analyzes your entire chat history** from Copilot interactions
2. **Evaluates model selection appropriateness** for each task
3. **Rates your prompt quality and AI usage skill**
4. **Identifies wrong model choices** and suggests alternatives
5. **Provides personalized improvement recommendations**

---

## How to Use

### Quick Start

1. **Click the "📊 Analyze" button** in the Copilot Token Inspector panel
2. The analyzer will scan your chat history
3. Results open in the Output Panel labeled **"Copilot Usage Analysis"**

### What You'll See

```
=== COPILOT USAGE ANALYSIS ===

📊 OVERALL METRICS
Total Interactions: 28
Average Prompt Quality: 6.8/10
Inappropriate Model Usages: 3

⭐ SKILL RATING: 7/10
  • Debugging Skill: 8/10
  • Prompt Crafting: 6.5/10
  • Task Focus: 7.5/10
  • AI Usage Efficiency: 7/10

💪 STRENGTHS:
  ✓ Strong debugging methodology
  ✓ Focused on technical problem-solving

🚀 AREAS TO IMPROVE:
  • Improve prompt clarity and specificity
  • Match models better to task requirements

📋 RECOMMENDATIONS:
  → Reduce off-topic queries (3 time/date queries detected)
  → Your technical problem-solving approach is effective - continue this
  → Start prompts with "Expected: X, Actual: Y, Already tried: Z"
```

---

## Skill Rating System

### Overall Score: 1-10

| Range | Level | Status |
|-------|-------|--------|
| 8-10 | Expert | ⭐⭐⭐⭐⭐ You're using AI optimally |
| 6-7 | Proficient | ⭐⭐⭐⭐ Good skills with room to improve |
| 4-5 | Developing | ⭐⭐⭐ Building your AI prompting skills |
| 1-3 | Beginner | ⭐⭐ Focus on fundamentals first |

### Component Scores

#### 1. **Debugging Skill** (1-10)
- **What it measures:** How well you use AI for problem-solving and issue resolution
- **Score based on:** Frequency of debugging tasks and quality of problem descriptions
- **How to improve:** Include error messages, stack traces, and steps to reproduce

#### 2. **Prompt Crafting** (1-10)
- **What it measures:** Clarity, specificity, and context in your prompts
- **Score based on:**
  - ✅ Length of prompt (should be 20-300 characters)
  - ✅ Inclusion of error messages or code
  - ✅ Specificity and avoid vague language ("something", "thing", "stuff")
  - ✅ Contextual information ("already tried", "expected vs actual")
- **How to improve:** 
  ```
  ❌ Poor: "its not detecting the changes"
  ✅ Good: "The extension should detect file changes. 
           Expected: tokens update in UI
           Actual: tokens show 0
           Already tried: checked file path"
  ```

#### 3. **Task Focus** (1-10)
- **What it measures:** Are you using AI for appropriate technical tasks?
- **Score based on:** Ratio of technical tasks vs off-topic queries
- **How to improve:** Reduce time/date/factual queries; use system tools instead

#### 4. **AI Usage Efficiency** (1-10)
- **What it measures:** Are you choosing appropriate models for each task?
- **Score based on:** 
  - How often you match model capabilities to task complexity
  - Avoiding over-complex models for simple queries
  - Preventing under-powered models for complex tasks
- **How to improve:** Understand model capabilities and pick accordingly

---

## Understanding Model Appropriateness

### Model Selection Matrix

| Task Type | Good Models | Why | Avoid |
|-----------|------------|-----|-------|
| **Debugging** | GPT-4, Claude-3.5 | Need reasoning ability | 3.5-turbo for complex issues |
| **Code Generation** | GPT-4o, Claude-3.5 | Strong code quality | Older models |
| **Architecture** | GPT-4, Claude-3 Opus | Strategic thinking | Smaller models |
| **Simple Queries** | GPT-3.5, Claude-Haiku | Efficient | o1, o3 (expensive reasoning) |
| **Explanation** | Any model | Task dependent | Reasoning models |
| **Time/Date** | ❌ None | Use system tools | Don't waste AI tokens |

### Wrong Model Detection

The analyzer identifies when you used an inappropriate model:

```
Inappropriate Model Usage #1:
  Prompt: "what is todays date"
  Used Model: GPT-4o
  Suggestion: Use system tools instead of AI

Inappropriate Model Usage #2:
  Prompt: "optimize this query for speed"
  Used Model: GPT-3.5-turbo
  Suggestion: GPT-4 or Claude-3.5 for better optimization insights
```

---

## Task Classification

The analyzer automatically categorizes your prompts:

| Category | Indicators | Ideal Model |
|----------|-----------|------------|
| **Debugging** | error, bug, fix, wrong, not working, crash | GPT-4, Claude-3.5 |
| **Code Generation** | generate, create, write, code, function | GPT-4o, Claude-3.5 |
| **Architectural Advice** | architecture, design, pattern, structure | GPT-4 |
| **Refactoring** | refactor, improve, optimize, clean up | GPT-4, Claude |
| **Testing** | test, unit test, e2e, mock, coverage | Any capable model |
| **Documentation** | document, explain, comment, readme | GPT-3.5 or better |
| **Explanation** | explain, what is, how does, describe | GPT-3.5 or better |
| **Optimization** | optimize, performance, efficiency | GPT-4 |
| **Factual Query** | Simple knowledge questions | Any model |
| **Time/Date Query** | What time, date, day | ❌ Use system tools |

---

## Prompt Quality Scoring

### Clarity (1-10)
- Measures: Is the question understandable?
- Improved by:
  - ✅ Questions (use `?`)
  - ✅ Length (20-300 chars is ideal)
  - ✅ Action words (what, how, why)
  - ❌ Vague language (something, thing)

### Specificity (1-10)
- Measures: How precise is the request?
- Improved by:
  - ✅ Include error messages or code
  - ✅ Exact filenames, function names
  - ✅ Use terms like "specifically", "exactly"
  - ❌ Avoid vague terms ("something", "thing")

### Context Provided (1-10)
- Measures: How much background information?
- Improved by:
  - ✅ "Already tried: ..."
  - ✅ "Expected: X, Actual: Y"
  - ✅ Error messages and stack traces
  - ✅ Relevant file/function/class names

### Overall Score Formula
```
Overall = (Clarity + Specificity + Context) / 3
```

---

## Improvement Suggestions

The analyzer provides up to 3 actionable suggestions per prompt:

### Example Suggestions:
```
🎯 Add more context to clarify your question
🎯 Be more specific about the issue (include error messages, code snippets)
💡 Include what you've already tried and the expected vs actual behavior
🔍 Avoid vague terms - be specific about what needs fixing
⏰ Use system tools for time/date queries instead of AI
📝 Add more details to get better responses
```

---

## Recommendations Based on Your Patterns

The analyzer generates recommendations based on:

1. **Your strength areas** → Encourage continuing
2. **Your weak areas** → Suggest specific improvements
3. **Off-topic usage** → Quantify time-wasting queries
4. **Model efficiency** → Identify mismatches

Example recommendations:
- "Focus on providing more context and being specific in prompts"
- "Start prompts with 'Expected: X, Actual: Y, Already tried: Z'"
- "Reduce off-topic queries (3 time/date queries detected)"
- "Your technical problem-solving approach is effective - continue this"

---

## Best Practices for Better Ratings

### ✅ DO:
1. **Start with context:** Expected behavior, actual behavior, what you tried
2. **Include error messages:** Copy-paste actual error text
3. **Be specific:** Use exact names, not "something" or "thing"
4. **Match models to tasks:** Simple queries don't need GPT-4
5. **Focus on technical tasks:** Save time/date queries for system tools
6. **Ask for debugging help:** This is where AI excels
7. **Batch related questions:** Reduces back-and-forth

### ❌ DON'T:
1. **Vague language:** "Something is wrong" → Describe what specifically
2. **Over-rely on complex models:** Simple queries = simple models
3. **Ask system questions:** Time/date/weather → use OS tools
4. **One-word prompts:** Provide context
5. **Repeat same questions:** Verify AI's answer then continue
6. **Ask for immediate verification:** Let AI explain reasoning first

---

## Example Analysis Scenarios

### Scenario 1: Strong Debugger
```
⭐ SKILL RATING: 8/10
Task Breakdown:
  - Debugging: 12 interactions
  - Code Generation: 8
  - Refactoring: 4
  
STRENGTHS:
  ✓ Strong debugging methodology
  ✓ Clear error descriptions
  ✓ Appropriate model selection

RECOMMENDATION: Continue this excellent debugging practice!
```

### Scenario 2: Good Prompts, Wrong Models
```
⭐ SKILL RATING: 6.5/10
Average Prompt Quality: 7.5/10
Inappropriate Models: 5

ISSUE: Your prompts are good, but you're using wrong models
EXAMPLE:
  - Used GPT-3.5 for architecture (should be GPT-4)
  - Used GPT-4 for simple queries (waste of tokens)

RECOMMENDATION: Study the model selection matrix
```

### Scenario 3: Lots of Off-Topic Queries
```
⭐ SKILL RATING: 5/10
Off-Topic Queries: 8 (time/date/general facts)

ISSUE: 22% of queries are not technical
IMPACT: 
  - Wasting AI tokens
  - Getting worse responses than system tools
  - Reducing focus

RECOMMENDATION: Use system tools for:
  - Time: Taskbar/system clock
  - Date: Calendar app
  - Weather: Weather widget
```

---

## Command Reference

### Command: `copilotTokenInspector.analyzeHistory`
- **Trigger:** Click "📊 Analyze" button in Token Inspector panel
- **Output:** Opens "Copilot Usage Analysis" output channel
- **Shows:** Complete analysis report with all metrics and recommendations
- **Time:** ~1-2 seconds for typical history (20-100 interactions)

---

## Interpreting Different Ratings

### Rating: 9-10 ⭐⭐⭐⭐⭐
**Expert AI User**
- You understand model capabilities deeply
- Your prompts are clear, specific, and contextual
- You rarely waste tokens on off-topic queries
- Focus is on technical problem-solving
- Continue current practices!

### Rating: 7-8 ⭐⭐⭐⭐
**Skilled AI User**
- Strong technical problem-solving
- Good prompt quality with minor improvements needed
- Mostly appropriate model selection
- **Action:** Apply specific recommendations to reach 9+

### Rating: 5-6 ⭐⭐⭐
**Developing Skills**
- Some off-topic or vague prompts
- Model selection could be better optimized
- Good foundation, needs focused improvement
- **Action:** Follow prompt crafting best practices

### Rating: 3-4 ⭐⭐
**Early Stage**
- Many vague or unclear prompts
- Frequent off-topic queries
- Model selection needs work
- **Action:** Start with clarity basics, add context

### Rating: 1-2 ⭐
**Beginner**
- Minimal context in prompts
- Heavy off-topic usage
- Model efficiency is low
- **Action:** Review "Best Practices" section

---

## Advanced: Understanding the Analytics

### Data Collected
The analyzer scans:
- **Prompt text:** Length, vocabulary, clarity indicators
- **Response text:** Size, relevance
- **Model used:** For appropriateness check
- **Task type:** Automatic classification
- **Patterns:** Consistency in approach

### NOT Collected
- ✅ Actual sensitive data is NOT stored
- ✅ Tokens are NOT sent to external services
- ✅ Prompts are analyzed locally only
- ✅ Results shown locally only

### Metrics Explained

**Turn Count:** Total number of interactions (question-answer pairs)

**Average Prompt Quality:** Mean score of all prompts (1-10)
- Shows consistency of your prompt quality
- Higher = more consistent, clear prompts

**Task Breakdown:** Distribution of task types
- Helps identify if you're using AI optimally
- Shows focus areas

**Model Distribution:** Which models you use most
- Helps identify if you're over-using expensive models
- Shows model preference

**Inappropriate Models:** Count of wrong model choices
- Non-zero = opportunity to save tokens or get better results
- Specific examples provided for learning

---

## Troubleshooting

### "No Copilot chat history found"
- **Cause:** No transcript files found in expected location
- **Fix:** Use Copilot Chat at least once, then retry
- **Location:** `%APPDATA%\Code\User\workspaceStorage\{id}\GitHub.copilot-chat\transcripts\`

### Analysis is slow
- **Cause:** Large transcript file (100+ interactions)
- **Normal:** Takes 2-5 seconds for large histories
- **Note:** File is analyzed locally on your machine

### No inappropriate models detected
- **Status:** ✅ Great! Your model selection is good
- **Next Step:** Focus on prompt quality improvements

### All tasks classified as "unknown"
- **Cause:** Very brief or unclear prompts
- **Fix:** Add more detail so classifier can identify task type
- **Example:** Instead of "fix", say "debug this error"

---

## Next Steps

1. **Run the analyzer:** Click "📊 Analyze" button
2. **Review your rating:** Which component is lowest?
3. **Read specific recommendations:** Tailored to your patterns
4. **Apply improvements:** Start with #1 recommendation
5. **Re-analyze in a week:** Track progress

---

## Tips for Better Skill Rating

| Goal | Action | Impact |
|------|--------|--------|
| Improve clarity | Add context first | +1-2 points |
| Improve specificity | Include error messages | +2-3 points |
| Better model selection | Study matrix, apply it | +1-2 points |
| Reduce off-topic queries | Use system tools instead | +1-2 points |
| Focus on technical tasks | Do 10 debugging prompts | +1 point |

---

## Learn More

For detailed guidance on specific aspects:
- **Prompt engineering:** See `PROMPT_ENGINEERING.md`
- **Model capabilities:** See `MODEL_GUIDE.md`
- **Debugging best practices:** See `DEBUGGING_GUIDE.md`
- **Token optimization:** See README.md

---

**Happy prompting! 🚀**
