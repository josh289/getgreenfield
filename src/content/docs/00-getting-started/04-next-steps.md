---
title: "Next Steps"
description: "Your learning path from beginner to advanced Banyan Platform developer"
category: "getting-started"
tags: ["learning-path", "roadmap", "tutorials"]
difficulty: "beginner"
estimated_time: "5 minutes"
prerequisites:
  - "Completed Installation and Setup"
  - "Created Your First Service"
  - "Know How to Call APIs"
last_updated: "2025-01-15"
status: "published"
---

# Next Steps

> **TL;DR:** You've completed the getting started guides! Here's your roadmap to becoming a Banyan Platform expert.

## Congratulations!

You've successfully:
- ✅ Set up your development environment
- ✅ Created your first microservice
- ✅ Called APIs using REST, GraphQL, and WebSocket
- ✅ Understood how the platform auto-generates APIs

**What's next?** This guide provides a learning path tailored to your goals.

## Learning Path Overview

```
BEGINNER               INTERMEDIATE           ADVANCED
───────────────────────────────────────────────────────
Getting Started    →   Tutorials          →   Advanced Guides
(You are here!)        Build real apps        Deep platform features

↓                      ↓                      ↓
Concepts               Patterns               Architecture
Understand how         Best practices         Design decisions
it works               & conventions          & optimization
```

## Your Next Steps by Goal

### Goal: Build a Complete Service

**Recommended Path:**

1. **[Tutorial: Building a User Service](../01-tutorials/building-user-service.md)** (30 min)
   - Add query handlers
   - Implement event sourcing
   - Add read models
   - Test your service

2. **[Tutorial: Event-Driven Communication](../01-tutorials/event-driven-communication.md)** (45 min)
   - Subscribe to events from other services
   - Publish domain events
   - Build event handlers
   - Handle event failures

3. **[Guide: Testing Handlers](../03-guides/testing-handlers.md)** (30 min)
   - Write unit tests
   - Test with message bus
   - Mock dependencies
   - Achieve 90%+ coverage

**Learning Outcomes:**
- Build production-ready services
- Understand event-driven architecture
- Write comprehensive tests
- Follow platform best practices

---

### Goal: Understand the Platform

**Recommended Path:**

1. **[Concept: Service Architecture](../02-concepts/service-architecture.md)** (15 min)
   - How services are structured
   - Handler discovery mechanism
   - Message bus communication
   - Service lifecycle

2. **[Concept: Contract System](../02-concepts/contracts.md)** (20 min)
   - Type-safe service contracts
   - Validation and permissions
   - API generation
   - Contract versioning

3. **[Concept: Event Sourcing](../02-concepts/event-sourcing.md)** (25 min)
   - Event store fundamentals
   - Aggregates and domain events
   - Projections and read models
   - Event replay

**Learning Outcomes:**
- Understand architectural decisions
- Know when to use each pattern
- Make informed design choices
- Debug issues effectively

---

### Goal: Add Advanced Features

**Recommended Path:**

1. **[Guide: Event Sourcing with Aggregates](../03-guides/event-sourcing-aggregates.md)** (45 min)
   - Create aggregates
   - Handle commands
   - Emit domain events
   - Maintain consistency

2. **[Guide: Cross-Service Communication](../03-guides/service-clients.md)** (30 min)
   - Create service clients
   - Call other services
   - Handle failures
   - Circuit breakers

3. **[Guide: Authorization Policies](../03-guides/authorization-policies.md)** (35 min)
   - Two-layer authorization
   - Permission-based rules
   - Policy-based logic
   - Custom policies

**Learning Outcomes:**
- Implement complex business logic
- Build distributed systems
- Add security controls
- Handle failures gracefully

---

### Goal: Deploy to Production

**Recommended Path:**

1. **[Guide: Production Configuration](../03-guides/production-config.md)** (25 min)
   - Environment variables
   - Secrets management
   - Health checks
   - Graceful shutdown

2. **[Guide: Monitoring and Observability](../03-guides/monitoring.md)** (40 min)
   - Distributed tracing
   - Metrics collection
   - Log aggregation
   - Alerting

3. **[Guide: Deployment Strategies](../03-guides/deployment.md)** (50 min)
   - Docker containers
   - Kubernetes deployment
   - Service discovery
   - Rolling updates

**Learning Outcomes:**
- Configure services for production
- Monitor system health
- Deploy reliably
- Troubleshoot in production

---

## Common Next Tasks

Here are the most common things developers do after the getting started guides:

### 1. Add a Query Handler

Create a handler to read data:

```typescript
// service/src/queries/GetUserHandler.ts
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import { GetUserQuery, type UserResult } from '@myorg/my-service-contracts';

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, UserResult> {
  constructor() {
    super();
  }

  async handle(query: GetUserQuery): Promise<UserResult> {
    // Read from database or read model
    return {
      userId: query.userId,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };
  }
}
```

**Learn more:** [Handler Patterns Guide](../03-guides/handler-patterns.md)

---

### 2. Add Event Sourcing

Store events instead of current state:

```typescript
// service/src/domain/UserAggregate.ts
import { Aggregate, ApplyEvent } from '@banyanai/platform-event-sourcing';
import { UserCreatedEvent, UserUpdatedEvent } from '@myorg/my-service-contracts';

export class UserAggregate extends Aggregate {
  private email: string = '';
  private firstName: string = '';
  private lastName: string = '';

  createUser(email: string, firstName: string, lastName: string): void {
    this.applyEvent(new UserCreatedEvent({
      userId: this.id,
      email,
      firstName,
      lastName,
      createdAt: new Date(),
    }));
  }

  @ApplyEvent(UserCreatedEvent)
  onUserCreated(event: UserCreatedEvent): void {
    this.email = event.email;
    this.firstName = event.firstName;
    this.lastName = event.lastName;
  }
}
```

**Learn more:** [Event Sourcing Guide](../03-guides/event-sourcing-aggregates.md)

---

### 3. Subscribe to Events

React to events from other services:

```typescript
// service/src/subscriptions/UserCreatedHandler.ts
import { EventSubscriptionHandler, EventSubscriptionHandlerDecorator } from '@banyanai/platform-base-service';
import { UserCreatedEvent } from '@other-service/contracts';
import { Logger } from '@banyanai/platform-telemetry';

@EventSubscriptionHandlerDecorator(UserCreatedEvent)
export class UserCreatedHandler extends EventSubscriptionHandler<UserCreatedEvent> {
  constructor() {
    super();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    Logger.info('User created in other service', { userId: event.userId });
    // React to event - send welcome email, create profile, etc.
  }
}
```

**Learn more:** [Event-Driven Communication Tutorial](../01-tutorials/event-driven-communication.md)

---

### 4. Call Another Service

Use service clients for cross-service communication:

```typescript
// service/src/clients/NotificationServiceClient.ts
import { ServiceClient } from '@banyanai/platform-client-system';
import { SendEmailCommand } from '@notification-service/contracts';

export class NotificationServiceClient extends ServiceClient {
  async sendWelcomeEmail(userId: string, email: string): Promise<void> {
    await this.sendCommand(SendEmailCommand, {
      to: email,
      subject: 'Welcome!',
      body: `Welcome user ${userId}!`,
    });
  }
}

// Use in handler
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(
    private readonly notifications: NotificationServiceClient
  ) {
    super();
  }

  async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    const userId = `user-${Date.now()}`;

    // Call notification service
    await this.notifications.sendWelcomeEmail(userId, command.email);

    return { userId, email: command.email, createdAt: new Date().toISOString() };
  }
}
```

**Learn more:** [Service Clients Guide](../03-guides/service-clients.md)

---

## Skill Level Progression

### Beginner → Intermediate

**You're ready for intermediate topics when you can:**
- Create services with commands and queries
- Call APIs using REST/GraphQL/WebSocket
- Write basic tests for handlers
- Understand service contracts

**Focus on:**
- Event sourcing patterns
- Cross-service communication
- Read models and projections
- Testing strategies

**Recommended:** Complete all tutorials in [Tutorials section](../01-tutorials/README.md)

---

### Intermediate → Advanced

**You're ready for advanced topics when you can:**
- Build event-sourced aggregates
- Implement cross-service workflows
- Write comprehensive tests
- Deploy services to Docker

**Focus on:**
- Saga patterns for distributed transactions
- Advanced authorization policies
- Performance optimization
- Production monitoring

**Recommended:** Deep dive into [Advanced Guides](../03-guides/README.md#advanced)

---

## Documentation Structure

Here's how the documentation is organized:

### 📘 Getting Started (You are here!)
Quick guides to get you productive fast
- Installation
- Your First Service
- Calling APIs
- Next Steps

### 📗 Tutorials
Step-by-step guides to build real features
- Building a User Service
- Event-Driven Communication
- Adding Authentication
- Implementing Sagas

### 📙 Concepts
Understanding how the platform works
- Service Architecture
- Contract System
- Event Sourcing
- Message Bus
- Authorization

### 📕 Guides
How to accomplish specific tasks
- Handler Patterns
- Testing Handlers
- Service Clients
- Event Sourcing with Aggregates
- Production Configuration

### 📓 Reference
Complete API documentation
- REST Endpoints
- GraphQL Schema
- WebSocket Protocol
- Platform Packages

### 🔧 Troubleshooting
Common issues and solutions
- Common Errors
- Debugging Guide
- Performance Issues

---

## Recommended Reading Order

### Week 1: Foundation
1. ✅ Getting Started (completed!)
2. [Concept: Service Architecture](../02-concepts/service-architecture.md)
3. [Tutorial: Building a User Service](../01-tutorials/building-user-service.md)
4. [Guide: Testing Handlers](../03-guides/testing-handlers.md)

**Goal:** Build and test a complete CRUD service

---

### Week 2: Events
1. [Concept: Event Sourcing](../02-concepts/event-sourcing.md)
2. [Tutorial: Event-Driven Communication](../01-tutorials/event-driven-communication.md)
3. [Guide: Event Sourcing with Aggregates](../03-guides/event-sourcing-aggregates.md)
4. [Guide: Read Models](../03-guides/read-models.md)

**Goal:** Build event-sourced services that communicate

---

### Week 3: Integration
1. [Concept: Message Bus](../02-concepts/message-bus.md)
2. [Guide: Service Clients](../03-guides/service-clients.md)
3. [Tutorial: Implementing Sagas](../01-tutorials/implementing-sagas.md)
4. [Guide: Error Handling](../03-guides/error-handling.md)

**Goal:** Build distributed workflows across services

---

### Week 4: Production
1. [Concept: Authorization](../02-concepts/authorization.md)
2. [Guide: Production Configuration](../03-guides/production-config.md)
3. [Guide: Monitoring and Observability](../03-guides/monitoring.md)
4. [Guide: Deployment Strategies](../03-guides/deployment.md)

**Goal:** Deploy services to production

---

## Quick Reference

Bookmark these for frequent reference:

### Most Used Commands

```bash
# Start development environment
docker compose up -d
pnpm run dev

# Run tests
pnpm run test

# Type checking
pnpm run type-check

# Quality checks before commit
./platform/scripts/quality-check-all.sh
```

### Most Used Imports

```typescript
// Base service
import { BaseService } from '@banyanai/platform-base-service';
import { CommandHandler, QueryHandler, EventSubscriptionHandler } from '@banyanai/platform-base-service';
import { CommandHandlerDecorator, QueryHandlerDecorator, EventSubscriptionHandlerDecorator } from '@banyanai/platform-base-service';

// Contracts
import { Command, Query, Event } from '@banyanai/platform-contract-system';

// Event sourcing
import { Aggregate, ApplyEvent } from '@banyanai/platform-event-sourcing';

// Logging
import { Logger } from '@banyanai/platform-telemetry';

// Types
import type { AuthenticatedUser } from '@banyanai/platform-core';
```

### Most Used Patterns

**Command Handler:**
```typescript
@CommandHandlerDecorator(MyCommand)
export class MyCommandHandler extends CommandHandler<MyCommand, MyResult> {
  async handle(command: MyCommand, user: AuthenticatedUser | null): Promise<MyResult> {
    // Business logic
  }
}
```

**Query Handler:**
```typescript
@QueryHandlerDecorator(MyQuery)
export class MyQueryHandler extends QueryHandler<MyQuery, MyResult> {
  async handle(query: MyQuery): Promise<MyResult> {
    // Read data
  }
}
```

**Event Handler:**
```typescript
@EventSubscriptionHandlerDecorator(MyEvent)
export class MyEventHandler extends EventSubscriptionHandler<MyEvent> {
  async handle(event: MyEvent): Promise<void> {
    // React to event
  }
}
```

---

## Getting Help

### Documentation
- Search the docs (Ctrl+K in most doc viewers)
- Check [Troubleshooting](../05-troubleshooting/README.md)
- Review [Common Errors](../05-troubleshooting/common-errors.md)

### Code Examples
- Browse [platform/services/](../../platform/services/) for reference implementations
- Check test files (`*.test.ts`) for usage examples
- Look at [microservice-template/](../../microservice-template/) for structure

### Community
- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Questions and community help
- Stack Overflow - Tag questions with `banyan-platform`

---

## What Makes You Productive?

Focus on these habits:

### ✅ Do:
- Run tests frequently (`pnpm run test`)
- Use hot-reload during development (`pnpm run dev`)
- Check types before committing (`pnpm run type-check`)
- Read error messages carefully (they're helpful!)
- Use GraphiQL to explore APIs ([http://localhost:3003/graphql](http://localhost:3003/graphql))
- View traces in Jaeger ([http://localhost:16686](http://localhost:16686))

### ❌ Don't:
- Write infrastructure code (platform handles it)
- Use HTTP/REST inside services (use message bus)
- Skip tests (90% coverage required)
- Commit without running quality checks
- Use `any` types (use strict TypeScript)
- Ignore TypeScript errors (fix them!)

---

## Your Feedback Matters

This is a living platform - your feedback shapes it!

**Found an issue in the docs?**
- Submit a pull request
- Open an issue on GitHub
- Suggest improvements

**Want a feature?**
- Check if it's already planned
- Describe your use case
- Contribute if you can!

**Built something cool?**
- Share in GitHub Discussions
- Write a blog post
- Contribute examples

---

## Ready to Build!

You now have:
- ✅ A working development environment
- ✅ Your first microservice running
- ✅ Knowledge of how to call APIs
- ✅ A learning path to follow
- ✅ Resources to reference

**Pick your next step from above and start building!**

The platform handles all the infrastructure complexity - you focus on solving business problems.

---

## Additional Resources

### Official Documentation
- [Platform README](../../README.md) - Project overview
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [Contributing Guide](../../CONTRIBUTING.md) - How to contribute

### External Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Docker Documentation](https://docs.docker.com/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [Postman](https://www.postman.com/) - API testing
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management

**Happy building!** 🚀
