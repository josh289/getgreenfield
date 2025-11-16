---
title: "Getting Started"
---

# Getting Started

> 🎯 **Goal**: Get from zero to a running microservice in 35 minutes

This section contains quick start guides to help you begin using the Banyan platform immediately. These guides focus on immediate results with minimal explanation - detailed concepts are covered in other sections.

## Your First Hour with Banyan

```
Your Learning Journey
─────────────────────────────────────────────────────────────────────
0min      5min           20min              30min        35min
│         │              │                  │            │
Setup     First          Call APIs          Understand   Next
Platform  Service                           Platform     Steps
│         │              │                  │            │
└─────────┴──────────────┴──────────────────┴────────────┘
```

## Prerequisites Checklist

Before starting, ensure you have:

- ✅ **Node.js 20 or later** installed ([Download](https://nodejs.org/))
- ✅ **Docker and Docker Compose** installed ([Download](https://www.docker.com/))
- ✅ **Basic TypeScript knowledge** (variables, functions, classes)
- ⚪ **Familiarity with microservices** (helpful but not required)

> 💡 **Best Practice**: Complete all four guides in order for the best learning experience

## Step-by-Step Learning Path

Follow these guides in order to build your first service:

### Step 1: [Installation](./01-installation.md)
> ⏱️ **Time**: 5 minutes | 🟢 **Difficulty**: Beginner

**What you'll do:**
- Clone the Banyan platform repository
- Start infrastructure with Docker Compose
- Verify all services are running

**You are here:** **Installation** → First Service → Call APIs → Next Steps

---

### Step 2: [Your First Service](./02-your-first-service.md)
> ⏱️ **Time**: 15 minutes | 🟢 **Difficulty**: Beginner

**What you'll do:**
- Create a new microservice using the CLI
- Write your first command handler
- Understand handler auto-discovery
- See your service register automatically

**You are here:** Installation → **Your First Service** → Call APIs → Next Steps

---

### Step 3: [Calling APIs](./03-calling-apis.md)
> ⏱️ **Time**: 10 minutes | 🟢 **Difficulty**: Beginner

**What you'll do:**
- Call your service via REST API
- Call your service via GraphQL API
- Use WebSocket subscriptions for real-time events
- Understand the API Gateway's role

**You are here:** Installation → First Service → **Call APIs** → Next Steps

---

### Step 4: [Next Steps](./04-next-steps.md)
> ⏱️ **Time**: 5 minutes | 🟢 **Difficulty**: Beginner

**What you'll do:**
- Explore what you just built
- Learn what the platform auto-generated
- Discover learning paths based on your goals
- Choose your next tutorial

**You are here:** Installation → First Service → Call APIs → **Next Steps**

---

## What You'll Build

By the end of these guides, you'll have:

```
my-first-service/
├── commands/
│   └── CreateItemHandler.ts      ← Processes state changes
├── queries/
│   └── GetItemHandler.ts         ← Reads data (with caching)
├── events/
│   └── ItemCreatedHandler.ts     ← Reacts to domain events
├── docker-compose.yml            ← Auto-generated
└── package.json                  ← Ready to run
```

**Plus, you'll understand:**
- ✅ How to create microservices without infrastructure code
- ✅ How handler auto-discovery works
- ✅ How services communicate via message bus
- ✅ How the API Gateway exposes REST and GraphQL APIs
- ✅ How to call your service from external clients

## Learning Time Commitment

| Guide | Time | Difficulty | Focus |
|-------|------|------------|-------|
| Installation | 5 min | 🟢 Beginner | Platform setup |
| Your First Service | 15 min | 🟢 Beginner | Service creation |
| Calling APIs | 10 min | 🟢 Beginner | API integration |
| Next Steps | 5 min | 🟢 Beginner | Learning paths |
| **Total** | **35 min** | 🟢 **Beginner** | **Complete getting started** |

## After Getting Started

Once you complete these guides, choose your learning path:

### Path 1: Hands-On Practice
> **Best for**: Learners who prefer building real features

Continue to [Tutorials](../01-tutorials/README.md):
- Build a complete Todo service (90 min)
- Add user authentication (2 hrs)
- Create a blog platform (3 hrs)

### Path 2: Deep Understanding
> **Best for**: Developers who want to understand architecture first

Continue to [Concepts](../02-concepts/README.md):
- Message Bus Architecture (20 min)
- CQRS Pattern (30 min)
- Event Sourcing (30 min)

### Path 3: Specific Tasks
> **Best for**: Developers with specific goals

Continue to [Guides](../03-guides/README.md):
- Writing command handlers
- Adding authentication
- Implementing event sourcing

## Get Help

If you encounter issues during setup:

1. **Check prerequisites**: Verify Node.js and Docker versions
2. **Read error messages**: Most errors indicate missing dependencies
3. **Visit troubleshooting**: [Service Won't Start](../05-troubleshooting/by-symptom/)
4. **Check logs**: `docker compose logs -f service-name`

> ⚠️ **Warning**: The platform requires Docker Compose v2.0 or later. Check with `docker compose version`.

## Quick Links

- [Installation Guide →](./01-installation.md)
- [Troubleshooting Common Setup Issues](../05-troubleshooting/by-symptom/)
- [Platform Architecture Overview](../02-concepts/architecture/)
- [Example Services](../06-examples/)

---

**Ready to start?** → [Install the Platform](./01-installation.md) (5 minutes)
