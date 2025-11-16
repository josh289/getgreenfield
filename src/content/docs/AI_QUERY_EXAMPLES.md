---
title: "AI Query Routing Examples"
---

# AI Query Routing Examples

This document demonstrates how AI agents should route various user queries using the AI optimization features.

## Overview

Each example shows:
1. **User Query** - What the user asks
2. **Pattern Match** - Which pattern(s) the query matches
3. **Routing** - Where to find the primary information
4. **Related Content** - Additional helpful resources
5. **Response Strategy** - How to structure the answer

---

## Error-Based Queries

### Example 1: Specific Error Code

**User Query:**
```
"I'm getting HANDLER_NOT_DISCOVERED error when starting my service"
```

**Pattern Match:** `errorPatterns`
- Trigger: Error code "HANDLER_NOT_DISCOVERED"
- Confidence: High (exact error code match)

**Routing:**
```
Primary: 05-troubleshooting/common-errors/error-catalog.md#handler-not-discovered
Secondary: 05-troubleshooting/by-symptom/handlers-not-discovered.md
```

**Related Content:**
```javascript
{
  "guide": "03-guides/service-development/writing-handlers.md",
  "reference": "04-reference/decorators/command-handlers.md",
  "debugging": "05-troubleshooting/debugging-tools/log-analysis.md"
}
```

**Response Strategy:**
```markdown
## Error: HANDLER_NOT_DISCOVERED

**Quick Fix:**
1. Check handler file location (must be in /commands/, /queries/, or /subscriptions/)
2. Verify decorator is present (@CommandHandler, @QueryHandler, etc.)
3. Ensure handler class is exported

**Root Cause:**
[Explanation from error catalog]

**See also:**
- Full troubleshooting guide: handlers-not-discovered.md
- Handler development guide: writing-handlers.md
```

---

### Example 2: Generic Error Message

**User Query:**
```
"Getting authentication errors when calling the API"
```

**Pattern Match:** `errorPatterns` + `debuggingPatterns`
- Trigger: "authentication errors" (generic)
- Confidence: Medium (symptom rather than specific error)

**Routing:**
```
Primary: 05-troubleshooting/by-symptom/authentication-errors.md
Secondary: 05-troubleshooting/by-component/auth-service-issues.md
Reference: 04-reference/authentication.md
```

**Related Content:**
```javascript
{
  "concept": "02-concepts/architecture/two-layer-authorization.md",
  "guide": "03-guides/security/authentication.md",
  "debugging": "05-troubleshooting/debugging-tools/correlation-id-tracking.md"
}
```

**Response Strategy:**
```markdown
## Authentication Errors

**Diagnostic Steps:**
1. Check if you're including authentication token
2. Verify token format and expiration
3. Check correlation ID in error response

**Common Causes:**
- Missing or expired token
- Insufficient permissions
- Service not registered

**Debugging:**
Use correlation ID from error to trace request:
[Link to correlation-id-tracking.md]
```

---

## Task-Based Queries

### Example 3: How-To Query

**User Query:**
```
"How do I create a command handler for my service?"
```

**Pattern Match:** `taskPatterns`
- Trigger: "How do I create"
- Confidence: High (clear task-oriented query)

**Routing:**
```
Primary: 03-guides/service-development/writing-handlers.md
Reference: 04-reference/decorators/command-handlers.md
```

**Related Content:**
```javascript
{
  "prerequisite": "00-getting-started/02-your-first-service.md",
  "concept": "02-concepts/patterns/cqrs-pattern.md",
  "nextStep": "03-guides/service-development/defining-contracts.md",
  "troubleshooting": "05-troubleshooting/by-symptom/handlers-not-discovered.md"
}
```

**Response Strategy:**
```markdown
## Creating a Command Handler

**Prerequisites:**
[Check if user has created a service]

**Steps:**
1. Create file in /commands/ directory
2. Define command handler class
   ```typescript
   import { CommandHandler } from '@banyanai/platform-cqrs';

   @CommandHandler(CreateUserCommand)
   export class CreateUserHandler {
     async handle(input: CreateUserInput) {
       // Implementation
     }
   }
   ```
3. Export the handler
4. Service will auto-discover on startup

**Next Steps:**
- Define contracts: defining-contracts.md
- Test your handler: testing-services.md

**Common Issues:**
[Link to handlers-not-discovered.md]
```

---

### Example 4: Implementation Query

**User Query:**
```
"I want to add event sourcing to my existing service"
```

**Pattern Match:** `taskPatterns`
- Trigger: "I want to add"
- Confidence: High
- Complexity: Intermediate/Advanced

**Routing:**
```
Primary: 03-guides/service-development/data-access-patterns.md
Concept: 02-concepts/patterns/event-sourcing-pattern.md
Reference: 04-reference/decorators/event-sourcing.md
```

**Related Content:**
```javascript
{
  "prerequisite": "03-guides/service-development/writing-handlers.md",
  "concepts": [
    "02-concepts/patterns/aggregate-pattern.md",
    "02-concepts/patterns/read-model-pattern.md"
  ],
  "example": "06-examples/event-sourced-service/README.md",
  "troubleshooting": "05-troubleshooting/by-symptom/event-sourcing-issues.md"
}
```

**Response Strategy:**
```markdown
## Adding Event Sourcing

**Understanding Event Sourcing:**
[Brief explanation from concept doc]

**Prerequisites:**
- Existing service with command handlers
- Understanding of CQRS pattern

**Implementation Steps:**
1. Define your aggregate
2. Create domain events
3. Implement event handlers
4. Create read models

[Detailed guide from data-access-patterns.md]

**Complete Example:**
See: event-sourced-service example

**Learn More:**
- Concept: event-sourcing-pattern.md
- Reference: @Aggregate decorator
```

---

## Concept Queries

### Example 5: What Is Question

**User Query:**
```
"What is a correlation ID and how does it work?"
```

**Pattern Match:** `conceptPatterns`
- Trigger: "What is"
- Confidence: High

**Routing:**
```
Primary: 02-concepts/architecture/correlation-and-tracing.md
Practical: 05-troubleshooting/debugging-tools/correlation-id-tracking.md
Advanced: 04-reference/message-protocols/w3c-trace-context.md
```

**Related Content:**
```javascript
{
  "relatedConcepts": [
    "02-concepts/architecture/message-bus-architecture.md",
    "OpenTelemetry integration"
  ],
  "practicalGuide": "05-troubleshooting/debugging-tools/jaeger-tracing.md",
  "whenToUse": "Debugging distributed systems, tracking requests"
}
```

**Response Strategy:**
```markdown
## Correlation IDs

**In Brief:**
A correlation ID is a unique identifier that tracks a request through its entire lifecycle across multiple services.

**The Problem:**
In distributed systems, a single request may touch many services. Without correlation IDs, it's impossible to trace the request flow or correlate logs across services.

**The Solution:**
The platform automatically generates and propagates correlation IDs using AsyncLocalStorage, enabling end-to-end request tracking without any developer code.

**How It Works:**
[Technical explanation from concept doc]

**Practical Usage:**
[Link to correlation-id-tracking.md for debugging scenarios]

**See Also:**
- Jaeger Tracing: jaeger-tracing.md
- Message Bus: message-bus-architecture.md
```

---

### Example 6: Comparison Question

**User Query:**
```
"What's the difference between a Command and a Query?"
```

**Pattern Match:** `conceptPatterns`
- Trigger: "difference between"
- Confidence: High
- Type: Comparison

**Routing:**
```
Primary: 02-concepts/patterns/cqrs-pattern.md
Reference:
  - 04-reference/decorators/command-handlers.md
  - 04-reference/decorators/query-handlers.md
```

**Related Content:**
```javascript
{
  "guide": "03-guides/service-development/writing-handlers.md",
  "examples": [
    "Command example: CreateUserCommand",
    "Query example: GetUserQuery"
  ]
}
```

**Response Strategy:**
```markdown
## Command vs Query

**Command:**
- Modifies state (creates, updates, deletes)
- Returns minimal data (usually just IDs)
- May trigger events
- Example: CreateUserCommand, UpdateOrderCommand

**Query:**
- Reads data without modification
- Returns full data structures
- No side effects
- Example: GetUserQuery, ListOrdersQuery

**CQRS Pattern:**
[Explanation from cqrs-pattern.md]

**In Practice:**
[Code examples showing both]

**Learn More:**
- Guide: writing-handlers.md
- Reference: @CommandHandler, @QueryHandler
```

---

## Debugging Queries

### Example 7: Why Isn't X Working

**User Query:**
```
"Why aren't my event handlers receiving events?"
```

**Pattern Match:** `debuggingPatterns`
- Trigger: "Why aren't"
- Confidence: High
- Component: Event handlers

**Routing:**
```
Primary: 05-troubleshooting/by-symptom/handlers-not-discovered.md
Component: Message bus section
```

**Related Content:**
```javascript
{
  "debugging": [
    "05-troubleshooting/debugging-tools/rabbitmq-management.md",
    "05-troubleshooting/debugging-tools/log-analysis.md",
    "05-troubleshooting/debugging-tools/correlation-id-tracking.md"
  ],
  "guide": "03-guides/service-development/writing-handlers.md",
  "messageBus": "05-troubleshooting/by-component/message-bus-issues.md"
}
```

**Response Strategy:**
```markdown
## Event Handlers Not Receiving Events

**Diagnostic Steps:**

1. **Verify handler is discovered:**
   ```bash
   docker logs my-service | grep "Handler discovery"
   ```
   Should show eventHandlers > 0

2. **Check RabbitMQ:**
   - Open http://localhost:15672
   - Check if events queue exists
   - Look for messages in queue

3. **Verify event is published:**
   Check publisher logs for event publication

4. **Check handler signature:**
   Must match event type exactly

**Common Causes:**
- Handler in wrong directory (should be /subscriptions/)
- Wrong decorator (@EventSubscriptionHandler not @EventHandler)
- Event type mismatch
- RabbitMQ not running

**Debugging Tools:**
[Links to RabbitMQ Management, log analysis]
```

---

## Reference Queries

### Example 8: API Reference

**User Query:**
```
"What parameters does @CommandHandler take?"
```

**Pattern Match:** `referencePatterns`
- Trigger: "What parameters"
- Confidence: High
- Type: Decorator reference

**Routing:**
```
Primary: 04-reference/decorators/command-handlers.md#commandhandler
Guide: 03-guides/service-development/writing-handlers.md
```

**Related Content:**
```javascript
{
  "concept": "02-concepts/patterns/cqrs-pattern.md",
  "relatedDecorators": [
    "@QueryHandler",
    "@EventSubscriptionHandler"
  ]
}
```

**Response Strategy:**
```markdown
## @CommandHandler Decorator

**Signature:**
```typescript
function CommandHandler(commandType: any): ClassDecorator
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| commandType | Class | Yes | The command class this handler processes |

**Usage Example:**
```typescript
import { CommandHandler } from '@banyanai/platform-cqrs';
import { CreateUserCommand } from './contracts';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(input: CreateUserInput): Promise<CreateUserOutput> {
    // Handler implementation
  }
}
```

**See Also:**
- Guide: writing-handlers.md
- Concept: cqrs-pattern.md
- Related: @QueryHandler, @EventSubscriptionHandler
```

---

## Multi-Pattern Queries

### Example 9: Error + Task Combined

**User Query:**
```
"I'm getting HANDLER_NOT_DISCOVERED error. How do I fix it?"
```

**Pattern Match:** `errorPatterns` + `taskPatterns`
- Primary: errorPatterns (error code present)
- Secondary: taskPatterns (asking for fix)
- Strategy: Address error first, then provide fix steps

**Routing:**
```
Primary: 05-troubleshooting/common-errors/error-catalog.md#handler-not-discovered
Task: 05-troubleshooting/by-symptom/handlers-not-discovered.md
Guide: 03-guides/service-development/writing-handlers.md
```

**Response Strategy:**
```markdown
## Fixing HANDLER_NOT_DISCOVERED Error

**What This Error Means:**
[Error explanation from catalog]

**Quick Fix:**
1. Verify handler file location
   ```bash
   ls -la src/commands/
   ls -la src/queries/
   ```

2. Check for decorator
   ```bash
   grep -r "@CommandHandler" src/commands/
   ```

3. Ensure export
   ```typescript
   export class MyCommandHandler { }
   ```

**Detailed Troubleshooting:**
[Link to handlers-not-discovered.md]

**Proper Handler Structure:**
[Link to writing-handlers.md guide]

**Prevention:**
Follow handler naming conventions and directory structure from the start.
```

---

### Example 10: Concept + Task Combined

**User Query:**
```
"What is event sourcing and how do I implement it?"
```

**Pattern Match:** `conceptPatterns` + `taskPatterns`
- Primary: taskPatterns (user wants implementation)
- Secondary: conceptPatterns (needs understanding)
- Strategy: Brief concept, then focus on implementation

**Routing:**
```
Task: 03-guides/service-development/data-access-patterns.md
Concept: 02-concepts/patterns/event-sourcing-pattern.md
Example: 06-examples/event-sourced-service/README.md
```

**Response Strategy:**
```markdown
## Implementing Event Sourcing

**Brief Concept:**
Event sourcing stores state as a sequence of events rather than current state snapshots. This provides complete audit trails and enables time travel debugging.

[1-2 paragraphs from concept doc]

**Implementation Steps:**

1. **Define Your Aggregate**
   ```typescript
   @Aggregate()
   export class User {
     // Aggregate root
   }
   ```

2. **Create Domain Events**
   [Steps from guide]

3. **Implement Event Handlers**
   [Steps from guide]

4. **Create Read Models**
   [Steps from guide]

**Complete Example:**
See the event-sourced-service example for a full implementation.

**Deep Dive:**
For architectural understanding: event-sourcing-pattern.md
```

---

## Skill-Level Adaptation

### Example 11: Beginner Query

**User Query:**
```
"I'm new to this. How do I create my first service?"
```

**Skill Level Detection:** Beginner
- Indicator: "I'm new to this"
- Indicator: "first service"

**Routing:**
```
Start: 00-getting-started/01-installation.md
Primary: 00-getting-started/02-your-first-service.md
Next: 00-getting-started/03-calling-apis.md
```

**Response Strategy:**
```markdown
## Creating Your First Service

**Welcome!** Let's get you started.

**Prerequisites:**
First, make sure you have the development environment setup:
[Link to installation.md]

**Step-by-Step Tutorial:**
Follow this guide which walks you through creating a simple service:
[Link to your-first-service.md]

The guide covers:
1. Using the CLI to create a service
2. Understanding the generated structure
3. Creating your first command handler
4. Starting your service

**After You Finish:**
Next, learn how to call your service:
[Link to calling-apis.md]

**Learning Path:**
You're on the beginner path. After these basics, check out:
- Writing Handlers guide
- Defining Contracts guide
```

---

### Example 12: Advanced Query

**User Query:**
```
"How can I optimize read model projection performance for high-throughput event streams?"
```

**Skill Level Detection:** Advanced
- Indicator: "optimize performance"
- Indicator: "high-throughput"
- Technical terminology

**Routing:**
```
Primary: 05-troubleshooting/by-component/read-model-issues.md#performance
Concept: 02-concepts/patterns/read-model-pattern.md
Advanced: Performance optimization techniques
```

**Response Strategy:**
```markdown
## Optimizing Read Model Projections

**Performance Strategies:**

1. **Batch Processing**
   Process events in batches rather than one-by-one

2. **Parallel Projections**
   Run multiple projection handlers in parallel

3. **Denormalization**
   Pre-compute expensive joins in projections

4. **Incremental Updates**
   Only update changed fields

5. **Materialized Views**
   Use database materialized views for complex aggregations

**Implementation:**
[Detailed technical implementation]

**Monitoring:**
Use Jaeger to identify projection bottlenecks:
[Link to jaeger-tracing.md]

**Related:**
- Read model pattern: read-model-pattern.md
- Event sourcing architecture: event-sourcing-pattern.md
```

---

## Summary

These examples demonstrate:

1. **Pattern matching** routes queries appropriately
2. **Multi-pattern handling** addresses compound questions
3. **Related content** enriches answers
4. **Skill-level adaptation** tailors response depth
5. **Progressive disclosure** guides learning paths

AI agents should use these patterns to provide consistent, comprehensive, and contextually appropriate responses.
