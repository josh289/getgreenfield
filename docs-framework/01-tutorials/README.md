# Tutorials

> 🎯 **Goal**: Build real features while learning platform concepts through hands-on practice

This section contains step-by-step tutorials that guide you through building real features with the Banyan platform. Each tutorial builds working code and explains key concepts as you progress.

## Learning Path by Experience Level

```
Your Tutorial Journey
────────────────────────────────────────────────────────────────────────────────

🟢 BEGINNER (0-1 week experience)          ⏱️ Total: 6 hours
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Week 1: Core Patterns                                          │
│  ├─ Todo Service (90min)          → Basic CRUD operations       │
│  ├─ User Management (2hrs)        → Authentication patterns     │
│  └─ Blog Platform (3hrs)          → Complete application        │
│                                                                 │
│  ✓ Commands, queries, and events                               │
│  ✓ Handler auto-discovery                                      │
│  ✓ Basic testing patterns                                      │
│  ✓ API Gateway integration                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
🟡 INTERMEDIATE (1-4 weeks experience)     ⏱️ Total: 9 hours
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Weeks 2-4: Advanced Patterns                                   │
│  ├─ Event-Sourced Orders (4hrs)   → Event sourcing deep dive   │
│  ├─ Multi-Service Workflow (3hrs) → Service integration        │
│  └─ Real-Time Notifications (2hrs)→ WebSocket subscriptions    │
│                                                                 │
│  ✓ Event store and aggregates                                  │
│  ✓ Read model projections                                      │
│  ✓ Service-to-service communication                            │
│  ✓ Two-layer authorization                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
🔴 ADVANCED (1+ months experience)         ⏱️ Total: 14 hours
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Month 2+: Enterprise Patterns                                  │
│  ├─ Saga Orchestration (6hrs)     → Distributed transactions   │
│  ├─ Custom Read Models (4hrs)     → Performance optimization   │
│  └─ Platform Extensions (4hrs)    → Custom infrastructure      │
│                                                                 │
│  ✓ Saga pattern implementation                                 │
│  ✓ Custom projections and indexes                              │
│  ✓ Performance tuning                                          │
│  ✓ Platform extension points                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Tutorial Selector

### I want to learn...

**Basic CRUD operations** → [Todo Service](./beginner/) (90 min, 🟢 Beginner)
- Create, read, update, delete operations
- Command and query handlers
- Basic validation

**User authentication** → [User Management](./beginner/) (2 hrs, 🟢 Beginner)
- User registration and login
- Password hashing
- JWT token generation

**Complete application** → [Blog Platform](./beginner/) (3 hrs, 🟢 Beginner)
- Posts, comments, and categories
- Multi-entity relationships
- Full CRUD workflows

**Event sourcing** → [Event-Sourced Orders](./intermediate/) (4 hrs, 🟡 Intermediate)
- Event store implementation
- Aggregate root pattern
- Event replay and projections

**Service integration** → [Multi-Service Workflow](./intermediate/) (3 hrs, 🟡 Intermediate)
- Service-to-service calls
- Generated service clients
- Error handling across services

**Real-time features** → [Real-Time Notifications](./intermediate/) (2 hrs, 🟡 Intermediate)
- WebSocket subscriptions
- Event broadcasting
- Real-time UI updates

**Distributed transactions** → [Saga Orchestration](./advanced/) (6 hrs, 🔴 Advanced)
- Saga pattern implementation
- Compensation logic
- Long-running workflows

**Performance optimization** → [Custom Read Models](./advanced/) (4 hrs, 🔴 Advanced)
- Custom projection strategies
- Database indexing
- Caching patterns

**Platform customization** → [Platform Extensions](./advanced/) (4 hrs, 🔴 Advanced)
- Custom decorators
- Middleware integration
- Infrastructure extension points

## Tutorial Catalog

### 🟢 Beginner Tutorials

| Tutorial | Time | Focus | Prerequisites |
|----------|------|-------|---------------|
| [Todo Service](./beginner/) | 90 min | CRUD operations, basic handlers | Getting Started completed |
| [User Management](./beginner/) | 2 hrs | Authentication, password handling | Todo Service |
| [Blog Platform](./beginner/) | 3 hrs | Multi-entity app, relationships | User Management |

**Total beginner path**: 6 hours

### 🟡 Intermediate Tutorials

| Tutorial | Time | Focus | Prerequisites |
|----------|------|-------|---------------|
| [Event-Sourced Orders](./intermediate/) | 4 hrs | Event sourcing, aggregates | All beginner tutorials |
| [Multi-Service Workflow](./intermediate/) | 3 hrs | Service integration | Event-Sourced Orders |
| [Real-Time Notifications](./intermediate/) | 2 hrs | WebSocket, subscriptions | Multi-Service Workflow |

**Total intermediate path**: 9 hours

### 🔴 Advanced Tutorials

| Tutorial | Time | Focus | Prerequisites |
|----------|------|-------|---------------|
| [Saga Orchestration](./advanced/) | 6 hrs | Distributed transactions | All intermediate tutorials |
| [Custom Read Models](./advanced/) | 4 hrs | Performance, projections | Saga Orchestration |
| [Platform Extensions](./advanced/) | 4 hrs | Custom infrastructure | Custom Read Models |

**Total advanced path**: 14 hours

## How to Use These Tutorials

### 1. Choose Your Starting Point

**Never used Banyan?** → Start with 🟢 Beginner tutorials

**Completed Getting Started?** → Try [Todo Service](./beginner/) first

**Understand CQRS basics?** → Jump to 🟡 Intermediate tutorials

**Production experience?** → Explore 🔴 Advanced tutorials

### 2. Follow Best Practices

> 💡 **Best Practice**: Type code yourself instead of copying/pasting for better retention

**Recommended approach:**
1. Read the entire tutorial introduction first
2. Follow steps in order without skipping
3. Test after each major section
4. Complete the checkpoint exercises
5. Review the "What You Built" summary

### 3. Learn Actively

- **Experiment**: Try variations to see what happens
- **Break things**: Understanding errors deepens learning
- **Complete exercises**: Practice reinforces concepts
- **Check solutions**: Compare your work with provided examples

### 4. Track Your Progress

**Beginner milestones:**
- ✅ Create command handlers
- ✅ Create query handlers
- ✅ Handle domain events
- ✅ Test via message bus

**Intermediate milestones:**
- ✅ Implement event sourcing
- ✅ Build read model projections
- ✅ Integrate multiple services
- ✅ Add authorization policies

**Advanced milestones:**
- ✅ Orchestrate sagas
- ✅ Optimize read performance
- ✅ Extend platform capabilities
- ✅ Handle production scenarios

## Tutorial Format

Every tutorial follows the same structure for consistency:

```
1. Introduction
   └─ What you'll build
   └─ What you'll learn
   └─ Time estimate

2. Prerequisites
   └─ Required knowledge
   └─ Required tutorials
   └─ Required setup

3. Learning Objectives
   └─ Skills you'll gain
   └─ Concepts you'll understand

4. Step-by-Step Instructions
   └─ Numbered steps
   └─ Code examples
   └─ Explanations
   └─ Checkpoints

5. What You Built
   └─ Summary of accomplishments
   └─ Diagram of architecture

6. Exercises
   └─ Practice challenges
   └─ Extension ideas

7. Next Steps
   └─ Related tutorials
   └─ Recommended reading
```

## Getting Help

If you get stuck during a tutorial:

### 1. Check Checkpoints
Every tutorial includes verification steps to ensure you're on track. If a checkpoint fails, review the previous section.

### 2. Review Related Docs
- **Concepts**: Understand the "why" → [Concepts](../02-concepts/README.md)
- **Guides**: Quick how-to reference → [Guides](../03-guides/README.md)
- **Reference**: API specifications → [Reference](../04-reference/README.md)

### 3. Use Diagnostic Tools
```bash
# View service logs
docker compose logs -f service-name

# Check distributed traces
open http://localhost:16686

# Inspect message bus
open http://localhost:15672
```

### 4. Visit Troubleshooting
- [By Symptom](../05-troubleshooting/by-symptom/) - "Handler not called"
- [By Component](../05-troubleshooting/by-component/) - "Message bus issues"
- [Common Errors](../05-troubleshooting/common-errors/) - Error codes

### 5. Study Working Examples
Every tutorial concept has a complete working example → [Examples](../06-examples/README.md)

## Recommended Learning Paths

### For Backend Developers
**Time**: 10 hours over 2 weeks

```
Week 1: Foundations
├─ Todo Service (90min)
├─ User Management (2hrs)
└─ Blog Platform (3hrs)

Week 2: Advanced Patterns
├─ Event-Sourced Orders (4hrs)
└─ Multi-Service Workflow (3hrs)
```

### For Full-Stack Developers
**Time**: 13 hours over 3 weeks

```
Week 1: Backend Basics
├─ Todo Service (90min)
├─ User Management (2hrs)
└─ Blog Platform (3hrs)

Week 2: Real-Time Features
├─ Event-Sourced Orders (4hrs)
└─ Real-Time Notifications (2hrs)

Week 3: Integration
└─ Multi-Service Workflow (3hrs)
```

### For Platform Engineers
**Time**: 20 hours over 4 weeks

```
Weeks 1-2: All Beginner + Intermediate (15hrs)

Weeks 3-4: Advanced
├─ Saga Orchestration (6hrs)
├─ Custom Read Models (4hrs)
└─ Platform Extensions (4hrs)
```

## Before You Start

> ✅ **Prerequisites**: Completed [Getting Started](../00-getting-started/README.md) (35 minutes)

> 🔧 **Setup**: Platform running via `docker compose up`

> ⏱️ **Time**: Block uninterrupted time for each tutorial

> 💡 **Tip**: Keep the [Quick Reference](../QUICK_REFERENCE.md) open while coding

---

**Ready to build?** → [Start with Todo Service](./beginner/) (90 minutes, 🟢 Beginner)
