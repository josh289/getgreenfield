---
title: "AI Query Patterns"
---

# AI Query Patterns

This document provides guidance for AI agents on how to route and answer different types of queries when working with the Banyan Platform documentation.

## Overview

AI agents should recognize common query patterns and route them to the appropriate documentation resources. This ensures efficient and accurate responses to user questions.

## Pattern Categories

### 1. Error-Based Queries

**Pattern Recognition:**
- Queries containing error codes, exception names, or error descriptions
- Keywords: "error", "exception", "failed", "broken", "not working"
- Error code formats: `HANDLER_NOT_DISCOVERED`, `MESSAGE_BUS_CONNECTION_FAILED`, etc.

**Routing Strategy:**

```json
{
  "pattern": "error-based",
  "triggers": [
    "I'm getting error X",
    "Error: HANDLER_NOT_DISCOVERED",
    "Why am I seeing [error message]",
    "Exception thrown when...",
    "Failed to...",
    "[Service] is throwing errors"
  ],
  "routing": {
    "primary": "05-troubleshooting/common-errors/error-catalog.md",
    "secondary": "DOCUMENTATION_MAP.json:byError",
    "tertiary": "05-troubleshooting/by-symptom/"
  }
}
```

**Example Queries:**

```
Q: "I'm getting HANDLER_NOT_DISCOVERED error"
→ Route to: error-catalog.md#handler-not-discovered
→ Also check: handlers-not-discovered.md (by symptom)

Q: "MESSAGE_BUS_CONNECTION_FAILED when starting service"
→ Route to: message-bus-issues.md
→ Also check: service-wont-start.md

Q: "Authentication keeps failing"
→ Route to: authentication-errors.md
→ Also check: auth-service-issues.md
```

**Response Strategy:**
1. Identify the specific error from the error catalog
2. Provide immediate fix/workaround
3. Link to root cause explanation
4. Suggest related troubleshooting steps

---

### 2. Task-Based Queries

**Pattern Recognition:**
- Action-oriented queries asking "how to" accomplish something
- Keywords: "how do I", "how to", "I want to", "I need to", "create", "implement", "setup"
- Goal-focused rather than problem-focused

**Routing Strategy:**

```json
{
  "pattern": "task-based",
  "triggers": [
    "How do I [action]",
    "How to [action]",
    "I want to [action]",
    "I need to [action]",
    "Steps to [action]",
    "Guide for [action]"
  ],
  "routing": {
    "primary": "DOCUMENTATION_MAP.json:byTask",
    "secondary": "03-guides/",
    "tertiary": "01-tutorials/"
  }
}
```

**Example Queries:**

```
Q: "How do I create a new service?"
→ Route to: 00-getting-started/02-your-first-service.md
→ Also show: 03-guides/service-development/creating-services.md

Q: "I want to add event sourcing to my service"
→ Route to: 03-guides/service-development/data-access-patterns.md
→ Also show: 02-concepts/patterns/event-sourcing-pattern.md

Q: "How do I implement policy-based authorization?"
→ Route to: 03-guides/security/policy-based-authorization.md
→ Also show: 04-reference/decorators/authorization.md

Q: "Steps to setup Jaeger tracing"
→ Route to: 05-troubleshooting/debugging-tools/jaeger-tracing.md
→ Also show: 02-concepts/architecture/correlation-and-tracing.md
```

**Response Strategy:**
1. Start with step-by-step guide
2. Include code examples
3. Link to related concepts for deeper understanding
4. Suggest next steps or related tasks

---

### 3. Concept Queries

**Pattern Recognition:**
- Theoretical or explanatory questions
- Keywords: "what is", "explain", "tell me about", "describe", "what are", "difference between"
- Focus on understanding rather than implementation

**Routing Strategy:**

```json
{
  "pattern": "concept-based",
  "triggers": [
    "What is [concept]",
    "Explain [concept]",
    "Tell me about [concept]",
    "Describe [concept]",
    "What are [concept]",
    "How does [concept] work",
    "Difference between X and Y"
  ],
  "routing": {
    "primary": "02-concepts/",
    "secondary": "DOCUMENTATION_MAP.json:concepts",
    "tertiary": "00-getting-started/"
  }
}
```

**Example Queries:**

```
Q: "What is a correlation ID?"
→ Route to: 02-concepts/architecture/correlation-and-tracing.md
→ Also show: 05-troubleshooting/debugging-tools/correlation-id-tracking.md

Q: "Explain the CQRS pattern"
→ Route to: 02-concepts/patterns/cqrs-pattern.md
→ Also show: 03-guides/service-development/writing-handlers.md

Q: "What is the message bus architecture?"
→ Route to: 02-concepts/architecture/message-bus-architecture.md
→ Also show: 03-guides/infrastructure/message-bus.md

Q: "How does two-layer authorization work?"
→ Route to: 02-concepts/architecture/two-layer-authorization.md
→ Also show: 03-guides/security/overview.md
```

**Response Strategy:**
1. Provide clear conceptual explanation
2. Include diagrams or visual representations if available
3. Explain the "why" behind the concept
4. Link to practical guides for implementation
5. Compare with related concepts

---

### 4. Debugging Queries

**Pattern Recognition:**
- Symptoms without specific errors
- Keywords: "why isn't", "not working", "doesn't work", "can't", "unable to", "debugging"
- Behavior-focused: "X should happen but Y happens instead"

**Routing Strategy:**

```json
{
  "pattern": "debugging",
  "triggers": [
    "Why isn't [X] working",
    "[X] doesn't work",
    "Can't get [X] to work",
    "Unable to [X]",
    "[X] not showing up",
    "How do I debug [X]"
  ],
  "routing": {
    "primary": "05-troubleshooting/by-symptom/",
    "secondary": "05-troubleshooting/debugging-tools/",
    "tertiary": "05-troubleshooting/by-component/"
  }
}
```

**Example Queries:**

```
Q: "Why aren't my handlers being discovered?"
→ Route to: 05-troubleshooting/by-symptom/handlers-not-discovered.md
→ Also show: 03-guides/service-development/writing-handlers.md

Q: "API calls are failing but I don't know why"
→ Route to: 05-troubleshooting/by-symptom/api-calls-failing.md
→ Also show: 05-troubleshooting/debugging-tools/correlation-id-tracking.md

Q: "How do I debug a slow request?"
→ Route to: 05-troubleshooting/debugging-tools/jaeger-tracing.md
→ Also show: 05-troubleshooting/by-symptom/performance-issues.md

Q: "Service won't start"
→ Route to: 05-troubleshooting/by-symptom/service-wont-start.md
→ Also show: 05-troubleshooting/debugging-tools/log-analysis.md
```

**Response Strategy:**
1. Diagnose symptom from description
2. Provide systematic debugging steps
3. Recommend appropriate debugging tools
4. Link to common causes and solutions
5. Include commands for investigation

---

### 5. Reference Queries

**Pattern Recognition:**
- Looking for specific API details, parameters, or options
- Keywords: "parameters", "options", "API", "decorator", "arguments", "signature", "syntax"
- Specific component names: "@CommandHandler", "BaseService.start()", etc.

**Routing Strategy:**

```json
{
  "pattern": "reference",
  "triggers": [
    "What parameters does [X] take",
    "[Decorator] options",
    "API reference for [X]",
    "Syntax for [X]",
    "[X] arguments",
    "Configuration options for [X]"
  ],
  "routing": {
    "primary": "04-reference/",
    "secondary": "DOCUMENTATION_MAP.json:byDecorator",
    "tertiary": "DOCUMENTATION_MAP.json:byPackage"
  }
}
```

**Example Queries:**

```
Q: "What parameters does @CommandHandler take?"
→ Route to: 04-reference/decorators/command-handlers.md
→ Also show: 03-guides/service-development/writing-handlers.md

Q: "BaseService.start() options"
→ Route to: 04-reference/platform-packages/base-service.md
→ Also show: 00-getting-started/02-your-first-service.md

Q: "GraphQL API endpoints"
→ Route to: 04-reference/graphql-api/overview.md
→ Also show: 03-guides/api-integration/graphql-api.md

Q: "@RequirePolicy decorator syntax"
→ Route to: 04-reference/decorators/authorization.md
→ Also show: 03-guides/security/policy-based-authorization.md
```

**Response Strategy:**
1. Provide exact syntax/signature
2. List all parameters with types
3. Show example usage
4. Link to practical guide for context
5. Include common patterns

---

## Query Routing Decision Tree

```
User Query
    │
    ├─ Contains error code/exception? ──────────► ERROR-BASED
    │                                              - error-catalog.md
    │                                              - by-symptom/
    │
    ├─ Starts with "How do I/to..."? ─────────────► TASK-BASED
    │                                               - DOCUMENTATION_MAP:byTask
    │                                               - 03-guides/
    │
    ├─ Starts with "What is/Explain..."? ─────────► CONCEPT-BASED
    │                                                - 02-concepts/
    │                                                - architecture/patterns/
    │
    ├─ Contains "why isn't/not working"? ─────────► DEBUGGING
    │                                                - by-symptom/
    │                                                - debugging-tools/
    │
    ├─ Asks for "parameters/options/API"? ────────► REFERENCE
    │                                                - 04-reference/
    │                                                - decorators/packages/
    │
    └─ Unclear intent? ───────────────────────────► CLARIFY
                                                     Ask user to specify:
                                                     - Are you seeing an error?
                                                     - What are you trying to do?
                                                     - What should happen vs. what is happening?
```

## Multi-Pattern Queries

Some queries match multiple patterns. Handle by priority:

### Example: "How do I fix HANDLER_NOT_DISCOVERED error?"

**Patterns Matched:**
1. Task-based: "How do I fix..."
2. Error-based: "HANDLER_NOT_DISCOVERED"

**Response Strategy:**
1. Primary: Treat as ERROR-BASED (immediate problem)
2. Start with error catalog entry
3. Then provide task-based solution steps
4. Link to concept explanation for understanding

**Response Structure:**
```markdown
This error occurs when... [error explanation from catalog]

To fix this:
1. [Step-by-step from task guide]
2. [Steps continue]

**Why this happens:**
[Link to concept: handler discovery mechanism]

**See also:**
- Full guide: handlers-not-discovered.md
- Concept: service-development/writing-handlers.md
```

### Example: "What's the best way to implement event sourcing?"

**Patterns Matched:**
1. Concept-based: "What's the best way" (asking for understanding)
2. Task-based: "implement event sourcing" (asking how to do it)

**Response Strategy:**
1. Primary: Treat as TASK-BASED (action-oriented)
2. Start with step-by-step guide
3. Include conceptual understanding
4. Provide reference details

**Response Structure:**
```markdown
To implement event sourcing:
1. [Steps from guide]

**Conceptual Overview:**
Event sourcing means... [from concepts]

**Code Example:**
[From guide]

**See also:**
- Concept: event-sourcing-pattern.md
- Reference: @Aggregate decorator
- Tutorial: event-sourcing-service tutorial
```

## Context-Aware Routing

### User Skill Level Detection

Detect skill level from query complexity:

```
Beginner indicators:
- "How do I get started"
- "Basic", "simple", "first"
- Questions about installation/setup

→ Route to: 00-getting-started/, basic guides

Intermediate indicators:
- Questions about specific features
- Integration scenarios
- "How do I connect X to Y"

→ Route to: 03-guides/, 02-concepts/

Advanced indicators:
- Performance optimization
- Architecture questions
- Custom implementation details

→ Route to: advanced guides, 02-concepts/architecture/
```

### Progressive Disclosure

Structure responses to support learning:

```markdown
**Quick Answer:** [Immediate solution]

**Explanation:** [Why this works]

**Learn More:**
- Concept: [Deeper understanding]
- Advanced: [Related advanced topics]
- Reference: [Complete API docs]
```

## Response Templates

### For Error-Based Queries

```markdown
## Error: [ERROR_NAME]

**Quick Fix:**
[Immediate steps to resolve]

**Root Cause:**
[Why this error occurs]

**Prevention:**
[How to avoid this in the future]

**Related:**
- Symptom guide: [link]
- Component guide: [link]
- Related errors: [links]
```

### For Task-Based Queries

```markdown
## How to [Task Name]

**Prerequisites:**
- [Required knowledge/setup]

**Steps:**
1. [Step 1]
2. [Step 2]
   ```typescript
   // Code example
   ```
3. [Step 3]

**Common Issues:**
- [Issue 1]: [Solution]
- [Issue 2]: [Solution]

**Next Steps:**
- [Related task 1]
- [Related task 2]

**Learn More:**
- Concept: [link]
- Reference: [link]
```

### For Concept Queries

```markdown
## [Concept Name]

**In Brief:**
[One-sentence summary]

**The Problem:**
[What problem does this solve?]

**The Solution:**
[How does this concept address it?]

**How It Works:**
[Technical explanation]

**Benefits:**
- [Benefit 1]
- [Benefit 2]

**When to Use:**
[Use cases]

**Practical Application:**
- Guide: [link to implementation guide]
- Example: [link to code example]

**Related Concepts:**
- [Related 1]
- [Related 2]
```

## Special Cases

### Platform-Specific Questions

For questions about platform architecture or design decisions:

```
Q: "Why does the platform use message bus instead of direct HTTP?"
→ Route to: 02-concepts/architecture/message-bus-architecture.md
→ Include: Design principles from CLAUDE.md
```

### Comparison Questions

For "X vs Y" or "difference between" queries:

```
Q: "Difference between Command and Query?"
→ Route to: 02-concepts/patterns/cqrs-pattern.md
→ Include: Side-by-side comparison from concept docs
→ Link to: Practical examples for each
```

### Migration/Upgrade Questions

```
Q: "How do I migrate from version X to Y?"
→ Route to: Migration guides (if available)
→ Fallback to: CHANGELOG or release notes
→ Include: Breaking changes list
```

## AI Agent Best Practices

1. **Always Check Multiple Sources:**
   - Primary routing target
   - Related concepts for context
   - Troubleshooting for common issues

2. **Provide Code Examples:**
   - Use examples from documentation
   - Show before/after for fixes
   - Include full context (imports, setup)

3. **Link Liberally:**
   - Main answer source
   - Related concepts
   - Next steps
   - Alternative approaches

4. **Validate Paths:**
   - Check DOCUMENTATION_MAP.json first
   - Verify file exists before referencing
   - Fall back to similar topics if exact match missing

5. **Consider User Context:**
   - Are they debugging? → Prioritize troubleshooting
   - Are they learning? → Prioritize concepts
   - Are they implementing? → Prioritize guides

6. **Handle Ambiguity:**
   - If query unclear, ask clarifying questions
   - Offer multiple interpretation paths
   - Let user choose their focus

## Query Pattern Examples Library

### Error Pattern Examples

```
✓ "Error: HANDLER_NOT_DISCOVERED"
✓ "Getting authentication errors"
✓ "Message bus connection failed"
✓ "Contract validation error when calling API"
✓ "Aggregate not found exception"
```

### Task Pattern Examples

```
✓ "How do I create a command handler?"
✓ "I want to add correlation ID tracking"
✓ "Steps to implement a saga"
✓ "How to test my handlers"
✓ "I need to setup Jaeger"
```

### Concept Pattern Examples

```
✓ "What is event sourcing?"
✓ "Explain correlation IDs"
✓ "What's the difference between @Command and @Query?"
✓ "How does the message bus work?"
✓ "Tell me about two-layer authorization"
```

### Debugging Pattern Examples

```
✓ "Why aren't my handlers being discovered?"
✓ "Service won't start"
✓ "API calls failing but no error message"
✓ "Slow performance on queries"
✓ "Events not being received"
```

### Reference Pattern Examples

```
✓ "What parameters does @CommandHandler accept?"
✓ "BaseService.start() options"
✓ "GraphQL mutation syntax"
✓ "@RequirePolicy decorator reference"
✓ "Message envelope structure"
```

## Summary

AI agents should:

1. **Identify query pattern** using keywords and structure
2. **Route to primary source** via DOCUMENTATION_MAP.json
3. **Enrich with related content** from concepts, guides, and references
4. **Structure response** using appropriate template
5. **Validate all paths** before providing links
6. **Consider user context** for response depth

This ensures consistent, accurate, and helpful responses across all documentation navigation scenarios.
