---
# YAML Frontmatter - Required fields for all guide docs
title: "How to [Accomplish Specific Task]"
description: "[Brief description of what this guide helps accomplish - max 160 chars]"
category: "guides"
tags: ["how-to", "task"]
difficulty: "intermediate"  # beginner | intermediate | advanced
estimated_time: "15 minutes"  # Estimated completion time
prerequisites: []  # List required knowledge or setup
use_cases: []  # When to use this guide
last_updated: "YYYY-MM-DD"
status: "draft"  # draft | review | published
---

<!--
GUIDE TEMPLATE USAGE INSTRUCTIONS:

This template is for task-oriented documentation that helps users accomplish specific goals.
Use this template when creating docs that:
- Explain how to complete a specific task
- Provide step-by-step instructions
- Focus on practical "how-to" knowledge
- Address a specific use case or problem

STRUCTURE GUIDELINES:
1. Be task-focused - one clear goal
2. Provide direct, actionable steps
3. Assume users know WHY (link to concepts for background)
4. Include variations and options where relevant
5. Show complete, working examples

GUIDE vs TUTORIAL vs CONCEPT:
- Guide: "How to Implement Command Handlers" (task-focused)
- Tutorial: "Build a Task Management System" (learning-focused)
- Concept: "Understanding CQRS" (knowledge-focused)

FRONTMATTER TIPS:
- title: Start with "How to..." for clarity
- description: What will users be able to do?
- use_cases: Help users find relevant guides
- tags: Include specific technologies/patterns used
-->

# How to [Accomplish Specific Task]

> **Goal:** [One sentence describing what users will accomplish]

## Overview

[Brief introduction explaining what this guide covers and when to use it. 2-3 sentences.]

### When to Use This Guide

Use this guide when you need to:
- [Use case 1]
- [Use case 2]
- [Use case 3]

### Prerequisites

Before starting, ensure you have:
- [Prerequisite 1 with link]
- [Prerequisite 2 with link]
- [Required knowledge or setup]

## Quick Reference

[Optional: If there's a TL;DR version for experienced users]

```typescript
// Minimal example for quick reference
```

## Approach

[Explain the general approach/strategy for accomplishing this task. Give users context before diving into steps.]

### Options

[If there are multiple valid approaches, outline them here]

- **Option 1: [Approach Name]** - [When to use, pros/cons]
- **Option 2: [Approach Name]** - [When to use, pros/cons]

This guide focuses on [chosen approach] because [rationale].

## Step-by-Step Instructions

### Step 1: [First Action]

[Brief explanation of what this step accomplishes]

```typescript
// Code example with comments
```

**Key Points:**
- [Important detail 1]
- [Important detail 2]

### Step 2: [Second Action]

[Brief explanation of what this step accomplishes]

```typescript
// Code example with comments
```

**Configuration Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `option1` | string | [Description] | `'value'` |
| `option2` | number | [Description] | `100` |

### Step 3: [Third Action]

[Continue pattern as needed]

```typescript
// Code example
```

## Complete Example

[Provide a complete, working example that ties everything together]

```typescript
// Complete implementation
// Users should be able to copy and run this
```

### Directory Structure

```
project/
├── src/
│   ├── [relevant files]
│   └── [relevant files]
└── [config files]
```

## Variations

### Variation 1: [Specific Use Case]

[Explain when and why to use this variation]

```typescript
// Modified implementation for this use case
```

### Variation 2: [Another Use Case]

[Explain when and why to use this variation]

```typescript
// Modified implementation
```

## Testing Your Implementation

[Show how to verify the implementation works]

### Unit Tests

```typescript
// Example test
```

### Integration Tests

```typescript
// Example integration test
```

### Manual Verification

```bash
# Commands to verify manually
```

Expected output:
```
[What success looks like]
```

## Common Patterns

### Pattern 1: [Common Pattern Name]

[When to use this pattern with the task]

```typescript
// Pattern implementation
```

### Pattern 2: [Common Pattern Name]

[When to use this pattern]

```typescript
// Pattern implementation
```

## Performance Considerations

[If relevant, discuss performance implications]

- **[Consideration 1]**: [Impact and recommendations]
- **[Consideration 2]**: [Impact and recommendations]

## Security Considerations

[If relevant, discuss security implications]

- **[Consideration 1]**: [Risk and mitigation]
- **[Consideration 2]**: [Risk and mitigation]

## Best Practices

1. **[Best Practice 1]**
   ```typescript
   // Good example
   ```

   **Why:** [Explanation]

2. **[Best Practice 2]**
   ```typescript
   // Good example
   ```

   **Why:** [Explanation]

## Anti-Patterns to Avoid

### Anti-Pattern 1: [What NOT to do]

```typescript
// Bad example - don't do this
```

**Why This Is Bad:** [Explanation]

**Instead, Do This:**
```typescript
// Good example
```

### Anti-Pattern 2: [What NOT to do]

[Continue pattern]

## Troubleshooting

### Issue: [Common Problem 1]

**Symptoms:** [How to recognize this issue]

**Cause:** [Why this happens]

**Solution:**
```typescript
// Fix
```

### Issue: [Common Problem 2]

[Continue pattern]

[Link to comprehensive troubleshooting guide if available]

## Related Guides

- [Link to related how-to guide]
- [Link to complementary guide]
- [Link to advanced techniques]

## Reference

### Configuration Reference

[Link to detailed configuration documentation]

### API Reference

[Link to relevant API documentation]

### Example Projects

- [Link to example repository or code]
- [Link to additional examples]

## Next Steps

Now that you've completed this task:

- [Suggested next guide or tutorial]
- [Related advanced topic]
- [Link to concept documentation for deeper understanding]

## Additional Resources

- [Link to concept documentation]
- [Link to API reference]
- [Link to example code]
- [External resources if relevant]
