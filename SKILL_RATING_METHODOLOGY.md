# Skill Rating Methodology

**Version:** 1.0  
**Last Updated:** August 19, 2026

## Overview

The Skill Rating system in Copilot AI Token Usage provides a comprehensive assessment of how effectively you use AI models in development. This document explains:

1. **What** we measure
2. **How** we calculate scores
3. **Why** each dimension matters
4. **How to interpret** your results
5. **How to improve** your rating

---

## 1. Core Philosophy

### What Is Skill Rating?

Skill Rating measures your ability to:
- ✅ Ask clear, specific questions
- ✅ Choose the right AI model for the task
- ✅ Focus AI on productive, on-topic work
- ✅ Use responses efficiently without wasteful iterations

### What It Is NOT

- ❌ Performance review score
- ❌ Management metric
- ❌ Comparison to other developers
- ❌ Measure of coding ability
- ❌ Job evaluation criteria

**Intended Use**: Personal improvement tool to help you get better results from AI.

---

## 2. Four Skill Dimensions

### Dimension 1: Debugging Skill (20% Weight)

**Definition**: Your ability to use AI effectively for finding and fixing bugs.

#### How It's Measured
- Frequency of "debugging" and "troubleshooting" queries
- Prompt quality when asking about errors
- Whether you include:
  - Error messages
  - Stack traces
  - Expected vs. actual behavior
  - Steps to reproduce
- Response clarity and whether fixes work first try

#### Scoring Factors
```
+1 point: Included full error message
+1 point: Described steps to reproduce
+1 point: Mentioned expected behavior
+1 point: Provided code context
+1 point: Error resolved in 1-2 iterations
-1 point: Vague error description ("it doesn't work")
-1 point: Multiple back-and-forth exchanges needed
-1 point: Asking same question multiple times
```

#### Skill Levels
```
Score 1-3/10: Share error messages, context, steps to reproduce
Score 4-6/10: Good debugging questions, sometimes needs clarification
Score 7-8/10: Clear, well-structured debugging prompts
Score 9-10/10: Expert-level debugging with reproduction steps
```

---

### Dimension 2: Prompt Crafting (25% Weight)

**Definition**: Your ability to write clear, specific, actionable prompts.

#### How It's Measured

**Clarity Score**
- Does the AI understand what you're asking?
- Absence of ambiguous pronouns ("it", "this")
- Clear statement of desired outcome
- Specific constraints mentioned

**Specificity Score**
- Level of detail provided
- Context about your codebase/framework
- Exact behavior requested (not vague)
- Technical requirements stated

**Context Score**
- Relevant code snippets included
- Framework/library versions mentioned
- Previous attempts explained
- Why you're asking explained

#### Scoring Factors

```
HIGH QUALITY PROMPT (8-10/10):
  "I have a React component in TypeScript that accepts 
   a JSON object with nested properties. When I call 
   setState on a nested property, the render isn't 
   triggering. Can you explain why and show how to fix 
   this? I'm using React 18.2."

MID QUALITY PROMPT (5-7/10):
  "Why isn't my component updating? How do I fix the 
   state problem?"

LOW QUALITY PROMPT (1-4/10):
  "It's broken. Fix it."
```

#### Scoring Breakdown
```
Score 1-3/10: Vague, unclear, missing context
Score 4-6/10: Clear intent, moderate context
Score 7-8/10: Well-structured, specific, good context
Score 9-10/10: Precise, comprehensive, all details included
```

---

### Dimension 3: Task Focus (20% Weight)

**Definition**: How well you stay on-task and use AI for appropriate work.

#### How It's Measured

**Task Coherence**
- How frequently you switch between unrelated topics
- Whether you continue related follow-ups vs. random new tasks
- Session drift analysis

**Off-Topic Detection**
```
PRODUCTIVE USE:
✅ Debugging → Explaining fix → Testing → Related optimization

OFF-TOPIC USE:
❌ Coding → Random technology question → Dinner recipe → Back to coding
❌ Debugging one file → Totally different codebase question
```

**Appropriate AI Use**
- For tasks where AI adds value (coding, debugging, architecture)
- Not for tasks better solved other ways (time queries, factual answers)
- Reasonable request complexity for chosen model

#### Scoring Factors
```
+2 points: Session focuses on 1-2 related topics
+1 point: Natural follow-up questions on same topic
-1 point: Context switch to unrelated topic
-2 points: Frequently jumping between projects/languages
-1 point: Using AI for time/date queries
-1 point: Multiple one-off random questions
```

#### Skill Levels
```
Score 1-3/10: Frequent task switching, scattered queries
Score 4-6/10: Generally focused, occasional off-topic
Score 7-8/10: Good focus, productive session flow
Score 9-10/10: Excellent focus, coherent task progression
```

---

### Dimension 4: AI Efficiency (15% Weight)

**Definition**: Getting maximum value per AI query.

#### How It's Measured

**Iteration Count**
- Follow-up questions on same topic
- Back-and-forth refinement
- Whether you clarified based on first response

**Response Utilization**
- Response length proportional to request
- Whether responses are used or discarded
- Prompt clarity preventing "no, I meant..." responses

**Model Appropriateness**
- Right model for the task type
- Not using overkill models for simple queries
- Not underpowering on complex tasks

#### Scoring Factors
```
+2 points: Resolved in 1 query, response used fully
+1 point: 2-3 related queries, builds on previous response
-1 point: Needed 4+ back-and-forth exchanges
-2 points: Asked similar question multiple times
-1 point: Long response but only small part used
```

#### Skill Levels
```
Score 1-3/10: Many iterations needed, inefficient refinement
Score 4-6/10: Usually resolves in 2-3 iterations
Score 7-8/10: Efficient, often resolves first time
Score 9-10/10: Expert efficiency, minimal iterations
```

---

## 3. Overall Skill Rating Calculation

### Formula

```
Overall Score = (
  Debugging Skill × 0.20 +
  Prompt Crafting × 0.25 +
  Task Focus × 0.20 +
  AI Efficiency × 0.15 +
  Bonus Points × 0.20
) / 10
```

### Bonus Points (up to 2 points)

These additional factors can boost your score:

```
+0.5: Excellent security awareness (mentioning security concerns)
+0.5: Performance optimization thinking (asking about efficiency)
+0.5: Good architectural thinking (high-level design questions)
+0.5: Learning mindset (asking "why" questions)
```

### Minimum & Maximum

```
Minimum: 1/10 (no useful interactions)
Maximum: 10/10 (expert-level use across all dimensions)
Practical Range: 2-9/10 (most developers fall here)
```

---

## 4. Rating Distribution

### What Score Ranges Mean

```
╔═════════════════════════════════════════════════════════╗
║  9-10/10: EXPERT LEVEL                                 ║
║  ├─ Exceptional prompt crafting                        ║
║  ├─ Minimal iterations needed                          ║
║  ├─ Perfectly matched model selection                  ║
║  └─ Recommendation: Mentor others / Share practices    ║
╠═════════════════════════════════════════════════════════╣
║  7-8/10: PROFICIENT                                    ║
║  ├─ Clear, specific prompts                            ║
║  ├─ Usually gets it right first time                   ║
║  ├─ Good model selection                               ║
║  └─ Recommendation: Solidify weak areas                ║
╠═════════════════════════════════════════════════════════╣
║  5-6/10: INTERMEDIATE                                  ║
║  ├─ Generally clear prompts                            ║
║  ├─ Often needs 2-3 iterations                         ║
║  ├─ Reasonable model choices                           ║
║  └─ Recommendation: Focus on clarity and specificity   ║
╠═════════════════════════════════════════════════════════╣
║  3-4/10: DEVELOPING                                    ║
║  ├─ Prompts lack detail/context                        ║
║  ├─ Frequently needs clarification                     ║
║  ├─ Occasional model mismatches                        ║
║  └─ Recommendation: Review best practices guide        ║
╠═════════════════════════════════════════════════════════╣
║  1-2/10: BEGINNER                                      ║
║  ├─ Vague or unclear prompts                           ║
║  ├─ Many back-and-forth iterations                     ║
║  ├─ Frequent model selection issues                    ║
║  └─ Recommendation: Read the user guide & practice     ║
╚═════════════════════════════════════════════════════════╝
```

---

## 5. Task Classification System

The Extension categorizes your prompts into 11 task types:

### 1. **Debugging** (Highest Value)
- Finding and fixing bugs
- Troubleshooting errors
- Stack trace analysis
- Root cause investigation

**AI Value**: ⭐⭐⭐⭐⭐ Excellent  
**Best Model**: gpt-4o, claude-3.5-sonnet

### 2. **Code Generation** (High Value)
- Writing new functions/classes
- Boilerplate creation
- Implementation from specs

**AI Value**: ⭐⭐⭐⭐⭐ Excellent  
**Best Model**: gpt-4o, claude-3.5-sonnet

### 3. **Architecture/Design** (High Value)
- System design decisions
- Pattern recommendations
- Structure/organization

**AI Value**: ⭐⭐⭐⭐⭐ Excellent  
**Best Model**: gpt-4o, claude-3.5-sonnet

### 4. **Refactoring** (High Value)
- Code improvement
- Performance optimization
- Readability enhancement

**AI Value**: ⭐⭐⭐⭐⭐ Excellent  
**Best Model**: gpt-4o, claude-3.5-sonnet

### 5. **Testing** (High Value)
- Writing unit tests
- Test strategy
- Coverage analysis

**AI Value**: ⭐⭐⭐⭐ Good  
**Best Model**: gpt-4o, claude-3.5-sonnet

### 6. **Documentation** (Medium-High Value)
- Writing docs/comments
- API documentation
- User guides

**AI Value**: ⭐⭐⭐⭐ Good  
**Best Model**: Any (gpt-4o preferred)

### 7. **Explanation** (Medium Value)
- Understanding existing code
- Learning concepts
- Algorithm explanation

**AI Value**: ⭐⭐⭐ Decent  
**Best Model**: gpt-4o (for complex), gpt-3.5-turbo (for simple)

### 8. **Optimization** (Medium Value)
- Performance tuning
- Resource efficiency
- Scaling strategies

**AI Value**: ⭐⭐⭐⭐ Good  
**Best Model**: gpt-4o, claude-3.5-sonnet

### 9. **Factual Query** (Low-Medium Value)
- Library documentation
- Framework features
- Tool capabilities

**AI Value**: ⭐⭐ Okay  
**Best Model**: gpt-3.5-turbo (cost-effective)

### 10. **Time/Date Query** (Low Value - Use Docs Instead)
- "What is the current date?"
- "How many days until..."
- Direct factual lookups

**AI Value**: ⭐ Poor (better to search docs)  
**Best Model**: Not recommended (search documentation instead)

### 11. **Unknown** (Unclassified)
- Ambiguous/unclear prompts
- Off-topic queries
- Random questions

**AI Value**: ⚠️ Varies  
**Best Model**: Context-dependent

---

## 6. Model Appropriateness Matrix

The Extension validates whether you chose the right model for the task:

### Model Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                   GPT-4o (Recommended)                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ Complex reasoning tasks                                  │
│ ✅ Advanced debugging                                       │
│ ✅ Architecture decisions                                   │
│ ✅ Multi-language support                                   │
│ ✅ Edge case handling                                       │
│ ❌ Simple factual queries (overkill)                        │
│                                                              │
│ Use When: Complex tasks, debugging, architecture           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            Claude 3.5 Sonnet (Alternative)                  │
├─────────────────────────────────────────────────────────────┤
│ ✅ Code generation                                          │
│ ✅ Documentation writing                                    │
│ ✅ Refactoring assistance                                   │
│ ✅ Testing strategies                                       │
│ ✅ Thoughtful explanations                                  │
│ ❌ Some edge cases may need clarification                   │
│                                                              │
│ Use When: Code work, documentation, learning               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            GPT-3.5 Turbo (Budget/Simple)                    │
├─────────────────────────────────────────────────────────────┤
│ ✅ Simple code snippets                                     │
│ ✅ Basic explanations                                       │
│ ✅ Quick factual lookups                                    │
│ ✅ Code style questions                                     │
│ ❌ Complex reasoning                                        │
│ ❌ Difficult debugging                                      │
│ ❌ Architecture decisions                                   │
│                                                              │
│ Use When: Simple tasks, learning, cost optimization        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            Gemini 1.5 Pro (Alternative)                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ Long context windows                                     │
│ ✅ Multi-file analysis                                      │
│ ✅ Large document processing                                │
│ ✅ General programming                                      │
│ ⚠️  Still developing in some areas                          │
│                                                              │
│ Use When: Large codebases, document analysis               │
└─────────────────────────────────────────────────────────────┘
```

### Appropriateness Scoring

The Extension flags model mismatches:

```
✅ APPROPRIATE:
  Task: Debugging complex race condition
  Model: gpt-4o
  Status: ✓ Good choice

⚠️  SUBOPTIMAL:
  Task: Simple string formatting
  Model: gpt-4o
  Status: ⚠️ Works but overkill (gpt-3.5-turbo would be better)

❌ INAPPROPRIATE:
  Task: Complex architecture decision
  Model: gpt-3.5-turbo
  Status: ✗ Poor choice (gpt-4o recommended)

❌ VERY INAPPROPRIATE:
  Task: Simple time query ("What time is it?")
  Model: gpt-4o
  Status: ✗ Use documentation/search instead
```

---

## 7. How Your Score Changes

### What Improves Your Rating

✅ **Prompt Crafting**
- Add error messages to bug reports
- Include code snippets
- Specify framework versions
- Explain what you tried already

✅ **Task Focus**
- Keep conversations on one topic
- Complete one task before starting another
- Minimize random queries

✅ **Debugging Skill**
- Include stack traces
- Describe steps to reproduce
- Mention expected vs. actual behavior
- Show what you already tried

✅ **AI Efficiency**
- Ask follow-up questions based on response
- Incorporate feedback into next query
- Build on previous answers

### What Decreases Your Rating

❌ **Poor Prompts**
- Vague descriptions ("it's broken")
- No context or code examples
- Missing error messages
- "Fix this for me" without explanation

❌ **Off-Topic Use**
- Frequently switching between unrelated topics
- Random factual queries during coding sessions
- Using AI for things better solved other ways

❌ **Inefficiency**
- Asking same question multiple times
- Needing 10+ iterations to get result
- Not reading/using the AI's response
- Unclear follow-ups requiring clarification

❌ **Poor Model Choice**
- Using gpt-4o for simple questions
- Using gpt-3.5-turbo for complex debugging
- Using AI for time queries instead of checking clock

---

## 8. Interpreting Your Analysis Report

### The Report Shows

**Overall Score**: Your composite rating (1-10)

**Skill Breakdown**:
```
Debugging Skill:    7/10 ★★★★☆☆☆ (Good)
Prompt Crafting:    6/10 ★★★☆☆☆☆ (Developing)
Task Focus:         8/10 ★★★★★☆☆ (Proficient)
AI Efficiency:      6/10 ★★★☆☆☆☆ (Developing)
```

**Strengths** (What you do well)
- Example: "Excellent at including error messages in bug reports"
- Example: "Stays focused on single task per conversation"

**Areas to Improve** (Where you can get better)
- Example: "Include more code context in prompts"
- Example: "Reduce iterations by clarifying requirements upfront"

**Recommendations** (Actionable steps)
- "When asking about errors, include the full stack trace and reproduction steps"
- "Read the model capability guide before choosing between models"
- "Take time to craft clear prompts; small effort saves iterations"

**Model Distribution** (Which models you used)
```
gpt-4o:          45%
gpt-3.5-turbo:   35%
claude-3.5:      20%
```

**Task Breakdown** (What types of work)
```
Debugging:       25% (good - high value)
Code Generation: 30% (good - high value)
Explanation:     15% (okay)
Factual Query:   15% (room to improve - use docs)
Other:           15%
```

---

## 9. Limitations & Caveats

### What This Rating Does NOT Measure

❌ **Coding Quality**: This rates AI usage, not your actual code quality  
❌ **Productivity**: Doesn't measure features built or bugs fixed  
❌ **Intelligence**: Not an IQ or capability measure  
❌ **Performance**: Not comparing you to other developers  
❌ **Employability**: Should never be used for hiring/firing  

### Accuracy Limitations

⚠️ **Task Classification**: Sometimes misclassifies complex prompts  
⚠️ **Quality Estimation**: Based on heuristics, not semantic understanding  
⚠️ **Model Appropriateness**: Suggestions based on general guidelines  
⚠️ **Small Sample Size**: Needs 20+ interactions for accuracy  
⚠️ **Language Bias**: Better with English prompts  

### When Scores Might Be Misleading

```
❌ Using AI rarely → Score may be artificially high
   (You haven't had enough interactions to show weaknesses)

❌ Using AI on diverse tasks → Score may not represent typical work
   (Random queries skew analysis)

❌ Testing/learning → Score may be low but not reflective
   (Experimental prompts score poorly)

❌ Specific domain → Score may be too general
   (Architecture work scores differently than bugfixing)
```

---

## 10. Best Practices to Improve Rating

### Immediate (< 1 week)
1. **Include Error Messages**: Copy stack traces into prompts
2. **Add Code Context**: Paste relevant code snippets
3. **Specify Versions**: Mention framework/library versions
4. **Describe Attempts**: Explain what you already tried

### Short Term (1-2 weeks)
5. **Match Models to Tasks**: Read the model matrix
6. **Stay Focused**: Keep conversations on one topic
7. **Use Follow-ups**: Ask clarifying questions based on responses
8. **Read Responses Fully**: Use complete AI responses, don't skip parts

### Long Term (1 month+)
9. **Learn Patterns**: Study high-quality prompts from analysis
10. **Build Templates**: Create reusable prompt structures
11. **Experiment**: Try different approaches for same problem
12. **Share Knowledge**: Discuss with team what works

---

## 11. Using This For Team Learning

### NOT For Performance Reviews
```
❌ DO NOT use this rating in evaluations
❌ DO NOT compare scores between developers
❌ DO NOT use this for promotion decisions
❌ DO NOT share scores without consent
```

### Appropriate Team Use
```
✅ Personal learning tool (individual only)
✅ Coaching discussions (if developer chooses to share)
✅ Best practices sharing (share techniques, not scores)
✅ Team training (learning how AI works effectively)
✅ Anonymized aggregate trends (not individual scores)
```

---

## 12. Model Recommendations by Scenario

### When to Use GPT-4o
```
✅ Complex debugging with unclear root cause
✅ Architectural decisions with trade-offs
✅ Multi-language refactoring
✅ Performance optimization strategy
✅ Security review or vulnerability analysis
```

### When to Use Claude 3.5
```
✅ Writing clear documentation
✅ Generating well-structured test cases
✅ Code refactoring for readability
✅ Explaining complex algorithms
✅ Best practices for pattern implementation
```

### When to Use GPT-3.5
```
✅ Simple code snippets (< 20 lines)
✅ Basic framework questions
✅ Learning simple concepts
✅ Quick "how-to" answers
✅ Cost-sensitive non-critical tasks
```

### When NOT to Use AI
```
❌ "What time is it?" → Check your clock
❌ "Is Tuesday the 5th or 12th?" → Check calendar
❌ "What's the latest Python version?" → Search official docs
❌ "How do I spell X?" → Use spell checker
❌ "Memorize this API" → Read documentation
```

---

## 13. FAQ About Skill Rating

### Q: Why is my score so low?
**A:** Your skill in using AI for development can improve! Review the "Areas to Improve" section. Common issues:
- Vague prompts without context
- Not including error messages or code
- Asking too many unrelated questions
- Taking many iterations to resolve issues

Start with the "Immediate" improvements above.

### Q: Will this score affect my job?
**A:** No. This is personal analytics only. It's not shared with your manager or organization. Use it solely for self-improvement.

### Q: How often does the score update?
**A:** Each time you complete an AI chat interaction. The overall rating updates based on your last 20-30 interactions.

### Q: Can I improve my score by gaming it?
**A:** The system measures *effectiveness*, not effort. Asking high-quality questions naturally results in better ratings. You can't game genuine improvement!

### Q: What if I get different scores in different projects?
**A:** Likely! Debugging tasks score differently than documentation. Switching projects changes your mix of task types. This is normal and valuable data.

### Q: My score dropped. Did something change?
**A:** No change to the algorithm. Score fluctuates based on your recent interactions. A few poor-quality prompts can temporarily lower an otherwise high score.

### Q: Should I share my score with my team?
**A:** That's your choice! If useful for:
- Peer learning ("I scored 7 for prompt crafting, here's what helped")
- Team improvement ("Our team averages 6.5 for debugging")
- Mentoring ("Here's how I improved from 4 to 8")

But never mandatory, never used for comparison.

---

## 14. Continuous Improvement Cycle

```
┌─────────────────────────────────────────┐
│ 1. Get Your Skill Rating              │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 2. Read "Areas to Improve" Section      │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 3. Pick ONE area to focus on            │
│    (e.g., Better prompt crafting)       │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 4. Apply recommendations in your work   │
│    (Concrete, daily changes)            │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 5. Have 5-10 more AI interactions       │
│    (Let new behavior settle in)         │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 6. Run analysis again                   │
│    (Check if score improved)            │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 7. Pick next area to improve            │
│    (Repeat cycle)                       │
└─────────────────────────────────────────┘
```

---

## Summary

The Skill Rating system provides **honest, actionable feedback** on how effectively you use AI in development. It's designed to:

✅ Help you improve through specific, measurable feedback  
✅ Never compare you to others (personal metric only)  
✅ Provide concrete steps to level up  
✅ Respect your privacy (local analysis only)  
✅ Support learning and skill development  

Remember: **You control how you use AI. This score just helps you use it better.**

---

**Questions?** See [FAQ.md](FAQ.md) or [BEST_PRACTICES.md](BEST_PRACTICES.md)

