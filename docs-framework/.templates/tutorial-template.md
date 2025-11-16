---
# YAML Frontmatter - Required fields for all tutorial docs
title: "[Your Tutorial Title]"
description: "[Brief description of what users will build/learn - max 160 chars]"
category: "tutorials"
tags: ["hands-on", "learning"]
difficulty: "intermediate"  # beginner | intermediate | advanced
estimated_time: "30 minutes"  # Estimated completion time
prerequisites: []  # List required knowledge or completed guides
learning_objectives: []  # What users will be able to do after
last_updated: "YYYY-MM-DD"
status: "draft"  # draft | review | published
---

<!--
TUTORIAL TEMPLATE USAGE INSTRUCTIONS:

This template is for hands-on learning experiences that teach concepts through building.
Use this template when creating docs that:
- Walk through building a complete feature or application
- Teach concepts through practical implementation
- Provide step-by-step instructions with explanations
- Result in a working example users can reference

STRUCTURE GUIDELINES:
1. Build something real and useful
2. Explain WHY as well as HOW at each step
3. Include complete, working code examples
4. Show the evolution - don't jump to the final solution
5. End with a working example users can run

TUTORIAL vs GUIDE:
- Tutorial: "Learn by building a task management system"
- Guide: "How to implement command handlers"

FRONTMATTER TIPS:
- title: Project-focused (e.g., "Build a User Management Service")
- description: What will they build?
- tags: Include relevant patterns/technologies used
- learning_objectives: Specific skills they'll gain
- estimated_time: Tutorials are typically 20-60 minutes
-->

# [Your Tutorial Title]

> **What You'll Build:** [One sentence describing the end result]

## Overview

[Introduction explaining what this tutorial covers, what users will build, and what they'll learn. Include a brief explanation of why this matters.]

### Learning Objectives

By the end of this tutorial, you will be able to:

- [Specific skill 1]
- [Specific skill 2]
- [Specific skill 3]
- [Specific skill 4]

### Prerequisites

Before starting this tutorial, you should:

- [Prerequisite 1 with link]
- [Prerequisite 2 with link]
- [Required setup or knowledge]

### What We're Building

[Describe the final application/feature. Consider including a simple diagram or architecture overview.]

Key features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

## Setup

[Initial setup steps needed before the tutorial]

### Project Structure

```
project-name/
├── src/
│   ├── commands/
│   ├── queries/
│   └── events/
├── package.json
└── tsconfig.json
```

### Install Dependencies

```bash
npm install @banyanai/platform-core
```

## Part 1: [First Major Section]

[Explain what we're building in this section and why]

### Step 1: [First Step Name]

[Explain what this step accomplishes and the concepts involved]

Create the file `src/[filename].ts`:

```typescript
// Complete, working code example
// Include comments explaining key concepts
```

**Key Concepts:**
- [Concept 1 explanation]
- [Concept 2 explanation]

### Step 2: [Second Step Name]

[Continue building, explaining each step]

```typescript
// Progressive code example
```

### Test Your Progress

[Provide a way to verify this section works]

```bash
# Test command
```

Expected output:
```
[What success looks like]
```

## Part 2: [Second Major Section]

[Continue pattern for each major section]

### Step 1: [Step Name]

[Explanation and code]

### Step 2: [Step Name]

[Explanation and code]

## Part 3: [Third Major Section]

[Continue building on previous sections]

## Bringing It All Together

[Show how all the pieces connect]

### Complete Code

[Provide links to complete, working example code if available]

### Running the Application

```bash
# Commands to run the complete application
```

### Testing the Features

[Show how to test each feature you built]

1. [Test feature 1]
   ```bash
   # Test command
   ```

2. [Test feature 2]
   ```bash
   # Test command
   ```

## Understanding What We Built

[Recap the architecture and explain how it works]

### Key Patterns Used

- **[Pattern 1]**: [Brief explanation]
- **[Pattern 2]**: [Brief explanation]
- **[Pattern 3]**: [Brief explanation]

### How It Works

[Walk through the flow of the application]

## Extending the Example

Now that you have a working example, try:

- [Enhancement idea 1]
- [Enhancement idea 2]
- [Enhancement idea 3]

## Next Steps

Continue your learning journey:

- [Link to related tutorial]
- [Link to advanced concepts]
- [Link to reference documentation]

## Complete Code Reference

[Link to complete, working code repository or gist]

## Troubleshooting

### [Common Issue 1]

**Problem:** [Description]

**Solution:** [Fix]

### [Common Issue 2]

**Problem:** [Description]

**Solution:** [Fix]

## Additional Resources

- [Related concept documentation]
- [API reference]
- [Example projects]
- [Community resources]
