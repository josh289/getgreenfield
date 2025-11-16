---
title: "Documentation Navigation Guide"
---

# Documentation Navigation Guide

> 🎯 **Goal**: Help you find the right documentation quickly and understand how to use it effectively

This guide explains how the Banyan Platform documentation is organized, which section to use when, and how to get the most value from the docs.

## Quick Navigation Rules

### Choose documentation by your goal:

| I want to... | Go to... | Why |
|--------------|----------|-----|
| **Get started fast** | [Getting Started](./00-getting-started/README.md) | Quickest path from zero to working service (35 min) |
| **Learn by building** | [Tutorials](./01-tutorials/README.md) | Hands-on learning with step-by-step projects |
| **Understand why** | [Concepts](./02-concepts/README.md) | Deep dive into architecture and design decisions |
| **Solve a specific problem** | [Guides](./03-guides/README.md) | Task-oriented instructions for common scenarios |
| **Look up API details** | [Reference](./04-reference/README.md) | Complete technical specifications and APIs |
| **Fix an error** | [Troubleshooting](./05-troubleshooting/README.md) | Solutions to common problems and errors |
| **See working code** | [Examples](./06-examples/README.md) | Complete, runnable example applications |

## Documentation Organization Philosophy

This documentation follows the **Divio Documentation System**, which organizes content by purpose:

```
Documentation Types
────────────────────────────────────────────────────────────────────

LEARNING-ORIENTED           │  UNDERSTANDING-ORIENTED
(I want to learn)           │  (I want to understand why)
                           │
Getting Started ──────────┼─────────── Concepts
Tutorials                  │            Architecture
Hands-on practice          │            Patterns
Step-by-step               │            Design decisions
                           │
────────────────────────────┼────────────────────────────────────────
                           │
PROBLEM-ORIENTED           │  INFORMATION-ORIENTED
(I have a specific goal)   │  (I need to look up details)
                           │
Guides ────────────────────┼─────────── Reference
How-to instructions        │            API specifications
Task completion            │            Technical details
Quick solutions            │            Complete documentation
                           │
Troubleshooting            │
Error resolution           │
```

## Reading Recommendations by Role

### Backend Developer (New to Banyan)
**Time commitment**: 8 hours over 1 week

```
Day 1: Quick Start (35 minutes)
└─ Getting Started (all guides)

Days 2-3: Hands-On Learning (6 hours)
├─ Todo Service Tutorial (90 min)
├─ User Management Tutorial (2 hrs)
└─ Blog Platform Tutorial (3 hrs)

Days 4-5: Understanding (90 minutes)
├─ CQRS Pattern Concept
├─ Event Sourcing Concept
└─ Message Bus Architecture

As Needed: Reference
└─ Keep Decorator Reference open while coding
```

### Full-Stack Developer
**Time commitment**: 10 hours over 2 weeks

```
Week 1: Backend Basics (6.5 hours)
├─ Getting Started (35 min)
├─ Todo Service Tutorial (90 min)
├─ User Management Tutorial (2 hrs)
├─ API Gateway Concept (15 min)
└─ REST API Reference (as needed)

Week 2: Real-Time Features (3.5 hours)
├─ Real-Time Notifications Tutorial (2 hrs)
├─ Event Sourcing Concept (30 min)
└─ GraphQL API Reference (as needed)
```

### Platform Engineer
**Time commitment**: 25 hours over 4 weeks

```
Week 1: Foundation (8 hours)
├─ Getting Started (35 min)
├─ All Beginner Tutorials (6 hrs)
└─ All Architecture Concepts (60 min)

Week 2: Advanced Patterns (10 hours)
├─ All Intermediate Tutorials (9 hrs)
└─ All Pattern Concepts (90 min)

Weeks 3-4: Deep Dive (7 hours)
├─ All Advanced Tutorials (14 hrs, select 1-2)
├─ All Infrastructure Concepts (60 min)
└─ Platform Package Reference (ongoing)
```

### DevOps Engineer
**Time commitment**: 5 hours

```
Day 1: Understanding the Platform (2 hours)
├─ Getting Started (35 min)
├─ Zero Infrastructure Design Concept (15 min)
├─ Message Bus Architecture Concept (15 min)
└─ Service Deployment Concept (10 min)

Days 2-3: Operations Focus (3 hours)
├─ Scalability Concept (15 min)
├─ Telemetry and Observability Concept (15 min)
├─ Distributed Tracing Concept (15 min)
├─ Message Bus Reliability Concept (10 min)
└─ Troubleshooting sections (as needed)
```

## Common Documentation Scenarios

### Scenario 1: "I'm brand new to Banyan"
**Path**: Getting Started → Beginner Tutorials → Concepts (as curious)

1. Start with [Installation](./00-getting-started/01-installation.md) (5 min)
2. Complete [Your First Service](./00-getting-started/02-your-first-service.md) (15 min)
3. Try [Calling APIs](./00-getting-started/03-calling-apis.md) (10 min)
4. Review [Next Steps](./00-getting-started/04-next-steps.md) (5 min)
5. Pick a beginner tutorial that interests you
6. Read related concepts when curious about "why"

### Scenario 2: "I need to build a feature"
**Path**: Guides → Reference (for details) → Troubleshooting (if stuck)

1. Identify your task in [Guides](./03-guides/README.md)
2. Follow the how-to guide
3. Look up API details in [Reference](./04-reference/README.md) as needed
4. If errors occur, check [Troubleshooting](./05-troubleshooting/README.md)

### Scenario 3: "I'm getting an error"
**Path**: Troubleshooting → Concepts (if confused) → Examples (to see working code)

1. Start with [Troubleshooting by Symptom](./05-troubleshooting/by-symptom/)
2. If not found, try [Troubleshooting by Component](./05-troubleshooting/by-component/)
3. Check [Common Errors](./05-troubleshooting/common-errors/) for error codes
4. If still stuck, read related [Concepts](./02-concepts/README.md) to understand
5. Compare with working [Examples](./06-examples/README.md)

### Scenario 4: "I want to understand the architecture"
**Path**: Concepts → Examples → Reference (for specifics)

1. Read [Concept Dependency Graph](./02-concepts/README.md#concept-dependency-graph)
2. Follow recommended reading order for your level
3. See concepts in action via [Examples](./06-examples/README.md)
4. Dive into [Reference](./04-reference/README.md) for technical details

### Scenario 5: "I'm looking for an API signature"
**Path**: Reference (direct lookup)

1. Go directly to [Reference](./04-reference/README.md)
2. Choose the relevant subsection:
   - [REST API](./04-reference/rest-api/) for HTTP endpoints
   - [GraphQL API](./04-reference/graphql-api/) for GraphQL schema
   - [Decorators](./04-reference/decorators/) for `@` decorators
   - [Platform Packages](./04-reference/platform-packages/) for TypeScript APIs
   - [Message Protocols](./04-reference/message-protocols/) for message formats
3. Use browser search (Cmd/Ctrl+F) to find specific APIs

### Scenario 6: "I learn best by example"
**Path**: Examples → Tutorials → Guides (to replicate patterns)

1. Browse [Examples](./06-examples/README.md) to find similar use cases
2. Study the complete working code
3. Follow related [Tutorials](./01-tutorials/README.md) for guided learning
4. Use [Guides](./03-guides/README.md) to adapt patterns to your needs

## Documentation Conventions Explained

### Visual Indicators

**Callout Boxes:**

> 💡 **Best Practice**: Recommended approaches and proven patterns

> ⚠️ **Warning**: Important caveats, gotchas, or things that could go wrong

> 🎯 **Goal**: What you'll accomplish in this section or document

> 🔧 **Configuration**: Environment settings or setup requirements

> ✨ **New Feature**: Recently added capabilities in latest versions

### Difficulty Levels

- 🟢 **Beginner**: New to the platform (0-1 week experience)
  - No prior Banyan knowledge required
  - Assumes basic TypeScript/Node.js familiarity
  - Suitable for getting started

- 🟡 **Intermediate**: Comfortable with basics (1-4 weeks experience)
  - Completed Getting Started
  - Built at least one service
  - Understand CQRS and handler concepts

- 🔴 **Advanced**: Experienced with platform (1+ months experience)
  - Production experience with Banyan
  - Deep understanding of patterns
  - Ready for complex topics and customization

### Time Estimates

All documentation includes realistic time estimates:
- **Minutes** (5-30 min): Quick reads, specific guides
- **Hours** (1-6 hrs): Tutorials, comprehensive concepts
- **Total paths**: Combined time for complete learning paths

Time estimates assume:
- Reading at normal pace
- Typing code yourself (not copy/paste)
- Testing code as you go
- Brief experimentation

### Progress Indicators

In linear guides (Getting Started, Tutorials), you'll see:

```
You are here: Installation → **Your First Service** → Call APIs → Next Steps
```

This helps you track progress through multi-step journeys.

### Code Example Conventions

```bash
# Shell commands (run in terminal)
docker compose up
```

```typescript
// TypeScript code (add to your project)
@CommandHandler()
export class CreateUserHandler { }
```

```
# Output (what you should see)
Service started successfully on port 3000
```

## Searching the Documentation

### Built-in Navigation

1. **Main README**: Overview and "Navigate by Goal" section
2. **Section READMEs**: Detailed tables of contents for each section
3. **Cross-references**: Links to related docs throughout

### Browser Search

Use Cmd/Ctrl+F to search within a page for:
- Decorator names: `@CommandHandler`
- Error messages: `"Service not found"`
- Concepts: `"event sourcing"`
- API methods: `.send()`

### Finding Related Docs

Every document includes:
- **Prerequisites**: What to read before
- **Related**: Links to related concepts/guides
- **Next Steps**: Where to go after

## Tips for Effective Documentation Use

### 1. Start Broad, Then Narrow

Don't jump straight to reference docs. Follow this pattern:
1. Understand concept (Why?)
2. See tutorial/example (How in practice?)
3. Read guide (How for my use case?)
4. Check reference (Exact syntax?)

### 2. Keep Reference Docs Open

While coding, keep these open in browser tabs:
- [Quick Reference](./QUICK_REFERENCE.md)
- [Decorator Reference](./04-reference/decorators/)
- [REST API Reference](./04-reference/rest-api/) or [GraphQL Reference](./04-reference/graphql-api/)

### 3. Learn Prerequisites First

If a document feels confusing, check its Prerequisites section. You may need to read foundation concepts first.

### 4. Use "What You'll Learn" Sections

Every tutorial and concept starts with learning objectives. Scan these to decide if it's what you need.

### 5. Try Code Examples

Don't just read - type and run the code. Understanding comes from experimentation.

### 6. Follow Recommended Paths

The documentation suggests reading orders. Following them saves time compared to jumping around randomly.

## Documentation Sections Deep Dive

### [Getting Started](./00-getting-started/README.md)
**When to use**: Your very first exposure to Banyan
**Structure**: Linear progression (do steps 1→2→3→4)
**Time**: 35 minutes total
**Output**: Working service you can call via API

### [Tutorials](./01-tutorials/README.md)
**When to use**: Learning through hands-on building
**Structure**: Organized by skill level (Beginner → Intermediate → Advanced)
**Time**: 90 minutes to 6 hours per tutorial
**Output**: Working feature + understanding of concepts

### [Concepts](./02-concepts/README.md)
**When to use**: Understanding "why" behind the platform
**Structure**: Dependency graph (foundation → advanced)
**Time**: 15-30 minutes per concept
**Output**: Mental model for decision-making

### [Guides](./03-guides/README.md)
**When to use**: Accomplishing a specific task
**Structure**: Organized by domain (Service Dev, API, Security, Data)
**Time**: 15-60 minutes per guide
**Output**: Completed task

### [Reference](./04-reference/README.md)
**When to use**: Looking up exact syntax or specifications
**Structure**: Organized by API type (REST, GraphQL, Decorators, etc.)
**Time**: 2-5 minutes per lookup
**Output**: Exact API signature or parameter details

### [Troubleshooting](./05-troubleshooting/README.md)
**When to use**: Something isn't working
**Structure**: By Symptom, Component, or Error Code
**Time**: 5-30 minutes
**Output**: Error resolved or clear next steps

### [Examples](./06-examples/README.md)
**When to use**: Seeing complete, working implementations
**Structure**: By use case or feature type
**Time**: 30 minutes to 2 hours per example
**Output**: Working code to study or adapt

## Getting Help

If you can't find what you need:

1. **Check the search terms** in section READMEs for common scenarios
2. **Review the Main README** "Navigate by Goal" section
3. **Browse Examples** for similar use cases
4. **Read this Navigation Guide** for documentation structure
5. **Check Troubleshooting** even for documentation questions

## Documentation Feedback

Found a broken link? Confusing explanation? Missing example?

The documentation improves with your feedback. See the main repository for contribution guidelines.

---

**Ready to navigate?** → [Main Documentation](./README.md) | [Quick Reference](./QUICK_REFERENCE.md)
