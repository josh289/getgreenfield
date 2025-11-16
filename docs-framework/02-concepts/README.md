# Concepts

> 🎯 **Goal**: Build a deep mental model of how the platform works and why it's designed this way

This section provides in-depth explanations of the Banyan platform's architecture, design patterns, and underlying principles. Understanding these concepts will help you make better design decisions and troubleshoot effectively.

## Concept Dependency Graph

Understanding concepts in the right order accelerates learning. Follow this dependency graph:

```
Foundation Concepts (Read First)
────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LAYER 1: Core Philosophy (30 minutes)                          │
│                                                                 │
│     ┌─────────────────────────────────────┐                    │
│     │  Zero Infrastructure Design         │                    │
│     │  "Why Banyan exists"                │                    │
│     └──────────────┬──────────────────────┘                    │
│                    │                                            │
│                    ▼                                            │
│     ┌─────────────────────────────────────┐                    │
│     │  Message Bus Architecture           │                    │
│     │  "How services communicate"         │                    │
│     └──────────────┬──────────────────────┘                    │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     ▼
Core Patterns (Read Second)
────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LAYER 2: Essential Patterns (60 minutes)                       │
│                                                                 │
│     ┌─────────────────────────────────────┐                    │
│     │  CQRS Pattern                       │                    │
│     │  "Separating reads from writes"     │                    │
│     └──────┬───────────────────┬──────────┘                    │
│            │                   │                                │
│            ▼                   ▼                                │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Handler Discovery │  │ Domain Modeling  │                   │
│  │ "Auto-registration"│  │ "Business logic" │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
Advanced Patterns (Read Third)
────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LAYER 3: Advanced Patterns (90 minutes)                        │
│                                                                 │
│     ┌─────────────────────────────────────┐                    │
│     │  Event Sourcing                     │                    │
│     │  "State as events"                  │                    │
│     └──────┬───────────────────┬──────────┘                    │
│            │                   │                                │
│            ▼                   ▼                                │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Two-Layer Auth   │  │ Saga Pattern     │                   │
│  │ "Security model" │  │ "Distributed TX" │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
Infrastructure (Read As Needed)
────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LAYER 4: Operational Concerns (60 minutes)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Telemetry    │  │ Scalability  │  │ Event Store  │        │
│  │ & Tracing    │  │ Patterns     │  │ Design       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Message Bus  │  │ Deployment   │  │ Caching      │        │
│  │ Reliability  │  │ Strategy     │  │ Strategy     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Recommended Reading Order

### For Quick Understanding (1 hour)
**Goal**: Understand enough to build services effectively

1. [Zero Infrastructure Design](./architecture/) (15 min)
   - Why the platform exists
   - What problems it solves

2. [Message Bus Architecture](./architecture/) (15 min)
   - How services communicate
   - Why no direct HTTP calls

3. [CQRS Pattern](./patterns/) (15 min)
   - Command vs Query separation
   - Why it matters

4. [Handler Discovery](./patterns/) (15 min)
   - Convention over configuration
   - How handlers are auto-registered

### For Deep Understanding (3 hours)
**Goal**: Understand architectural decisions and trade-offs

**Phase 1: Foundation** (30 min)
1. Zero Infrastructure Design
2. Message Bus Architecture
3. Service Discovery
4. API Gateway

**Phase 2: Core Patterns** (60 min)
5. CQRS Pattern
6. Domain Modeling
7. Handler Discovery
8. Event Sourcing

**Phase 3: Advanced Patterns** (60 min)
9. Two-Layer Authorization
10. Saga Pattern
11. Read Model Projections

**Phase 4: Infrastructure** (30 min)
12. Telemetry and Observability
13. Message Bus Reliability
14. Event Store Design

### For Platform Extension (5 hours)
**Goal**: Understand internals to extend platform capabilities

Read all concepts in dependency order, then:
- Review [Platform Packages](../04-reference/platform-packages/)
- Study [Platform Extensions Tutorial](../01-tutorials/advanced/)
- Examine platform source code

## Content Organization

### [Architecture](./architecture/) - How It Works
> ⏱️ 60 minutes total | 🟡 Intermediate

Core architectural components and how they interact:

| Concept | Time | Difficulty | Prerequisites |
|---------|------|------------|---------------|
| [Message Bus Architecture](./architecture/) | 15 min | 🟢 Beginner | None |
| [Service Discovery](./architecture/) | 15 min | 🟡 Intermediate | Message Bus |
| [API Gateway](./architecture/) | 15 min | 🟡 Intermediate | Service Discovery |
| [Zero Infrastructure Design](./architecture/) | 15 min | 🟢 Beginner | None |
| [Distributed Tracing](./architecture/) | 15 min | 🟡 Intermediate | API Gateway |

**What you'll understand:**
- ✅ Why services communicate exclusively via message bus
- ✅ How API Gateway translates HTTP/GraphQL to messages
- ✅ How services discover and call each other
- ✅ How distributed tracing works across services
- ✅ Why there's no infrastructure code in services

### [Patterns](./patterns/) - Why It Works
> ⏱️ 90 minutes total | 🟡 Intermediate

Design patterns and best practices used throughout the platform:

| Concept | Time | Difficulty | Prerequisites |
|---------|------|------------|---------------|
| [CQRS Pattern](./patterns/) | 20 min | 🟡 Intermediate | Message Bus |
| [Event Sourcing](./patterns/) | 30 min | 🔴 Advanced | CQRS |
| [Domain Modeling](./patterns/) | 15 min | 🟢 Beginner | CQRS |
| [Two-Layer Authorization](./patterns/) | 15 min | 🟡 Intermediate | Domain Modeling |
| [Saga Pattern](./patterns/) | 30 min | 🔴 Advanced | Event Sourcing |
| [Handler Discovery](./patterns/) | 15 min | 🟢 Beginner | CQRS |

**What you'll understand:**
- ✅ Why commands and queries are separated
- ✅ How state is stored as event sequences
- ✅ How to express business logic without infrastructure
- ✅ How permissions and policies work together
- ✅ How distributed transactions are coordinated
- ✅ How handlers are auto-discovered

### [Infrastructure](./infrastructure/) - Operational Concerns
> ⏱️ 60 minutes total | 🔴 Advanced

Platform infrastructure and operational concerns:

| Concept | Time | Difficulty | Prerequisites |
|---------|------|------------|---------------|
| [Telemetry and Observability](./infrastructure/) | 15 min | 🟡 Intermediate | Distributed Tracing |
| [Service Deployment](./infrastructure/) | 10 min | 🟡 Intermediate | Zero Infrastructure |
| [Scalability](./infrastructure/) | 15 min | 🔴 Advanced | Message Bus |
| [Message Bus Reliability](./infrastructure/) | 10 min | 🟡 Intermediate | Message Bus |
| [Event Store](./infrastructure/) | 15 min | 🔴 Advanced | Event Sourcing |
| [Caching Strategy](./infrastructure/) | 10 min | 🟡 Intermediate | CQRS |

**What you'll understand:**
- ✅ How metrics, logs, and traces are collected
- ✅ How services are deployed and scaled
- ✅ How horizontal scaling works
- ✅ How message delivery is guaranteed
- ✅ How events are persisted in PostgreSQL
- ✅ How query results are cached in Redis

## Concepts by Use Case

### I want to understand...

**How services communicate**
→ [Message Bus Architecture](./architecture/) (15 min)
→ [Service Discovery](./architecture/) (15 min)

**How to separate concerns**
→ [CQRS Pattern](./patterns/) (20 min)
→ [Domain Modeling](./patterns/) (15 min)

**How to handle state**
→ [Event Sourcing](./patterns/) (30 min)
→ [Event Store](./infrastructure/) (15 min)

**How security works**
→ [Two-Layer Authorization](./patterns/) (15 min)
→ [API Gateway](./architecture/) (15 min)

**How to debug issues**
→ [Distributed Tracing](./architecture/) (15 min)
→ [Telemetry and Observability](./infrastructure/) (15 min)

**How to scale services**
→ [Scalability](./infrastructure/) (15 min)
→ [Message Bus Reliability](./infrastructure/) (10 min)

**How distributed transactions work**
→ [Saga Pattern](./patterns/) (30 min)
→ [Event Sourcing](./patterns/) (30 min)

## How to Read Concept Docs

Each concept document follows this structure:

```
1. Overview
   └─ What this concept is
   └─ Why it matters

2. The Problem
   └─ What problem does this solve?
   └─ Traditional approaches

3. The Solution
   └─ How Banyan solves it
   └─ Key design decisions

4. How It Works
   └─ Detailed explanation
   └─ Diagrams and examples

5. Benefits and Trade-offs
   └─ Advantages
   └─ Limitations
   └─ When to use

6. Implementation Details
   └─ Technical specifics
   └─ Code examples

7. Related Concepts
   └─ Prerequisites
   └─ Next steps
```

> 💡 **Best Practice**: Read "Overview" and "The Problem" sections first to understand context before diving into implementation details.

## Learning by Role

### Backend Developer
**Focus**: Understand patterns for building services

```
30 minutes: Essential reading
├─ Zero Infrastructure Design
├─ CQRS Pattern
└─ Handler Discovery

60 minutes: Deep dive
├─ Event Sourcing
├─ Domain Modeling
└─ Two-Layer Authorization
```

### Full-Stack Developer
**Focus**: Understand how frontend interacts with platform

```
45 minutes: Essential reading
├─ API Gateway
├─ Message Bus Architecture
├─ CQRS Pattern
└─ Service Discovery

30 minutes: Real-time features
├─ Event Sourcing
└─ WebSocket Subscriptions
```

### Platform Engineer
**Focus**: Understand internals for extension and operations

```
3 hours: Comprehensive reading
├─ All Architecture concepts (60min)
├─ All Patterns concepts (90min)
└─ All Infrastructure concepts (60min)
```

### DevOps Engineer
**Focus**: Understand deployment and operations

```
60 minutes: Operations focus
├─ Service Deployment
├─ Scalability
├─ Telemetry and Observability
├─ Message Bus Reliability
└─ Distributed Tracing
```

## Relationship to Other Documentation

### Before Reading Concepts
> ✅ **Recommended**: Complete [Getting Started](../00-getting-started/README.md) first

Having hands-on experience makes concepts more concrete and easier to understand.

### While Reading Concepts
- **See it in action**: [Examples](../06-examples/README.md) demonstrate concepts
- **Look up details**: [Reference](../04-reference/README.md) provides API specifics
- **Clarify confusion**: [Troubleshooting](../05-troubleshooting/README.md) addresses common misunderstandings

### After Reading Concepts
- **Apply knowledge**: [Tutorials](../01-tutorials/README.md) let you practice
- **Solve problems**: [Guides](../03-guides/README.md) show how to implement patterns
- **Build services**: Use concepts to make better design decisions

## Quick Concept Lookup

| If you're wondering... | Read this concept... |
|------------------------|---------------------|
| Why no HTTP between services? | Message Bus Architecture |
| Why separate commands and queries? | CQRS Pattern |
| How do events become state? | Event Sourcing |
| How does auto-discovery work? | Handler Discovery |
| How do permissions work? | Two-Layer Authorization |
| How do I debug across services? | Distributed Tracing |
| How do distributed transactions work? | Saga Pattern |
| How does caching work? | Caching Strategy |
| How does the platform scale? | Scalability |
| Why no infrastructure code? | Zero Infrastructure Design |

---

**Start learning** → [Zero Infrastructure Design](./architecture/) (15 minutes, 🟢 Beginner)
