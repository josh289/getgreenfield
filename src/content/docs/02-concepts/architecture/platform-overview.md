---
title: "Platform Overview"
description: "High-level architecture of the banyan-core microservices platform with zero infrastructure code"
category: "concepts"
tags: ["architecture", "overview", "platform"]
difficulty: "beginner"
related_concepts:
  - "message-bus-architecture.md"
  - "event-sourcing-architecture.md"
  - "service-discovery.md"
  - "api-gateway.md"
prerequisites: []
last_updated: "2025-01-15"
status: "published"
---

# Platform Overview

> **Core Idea:** A TypeScript microservices platform that abstracts away all infrastructure complexity, enabling developers to write pure business logic without any infrastructure code.

## Overview

The banyan-core platform is built on a revolutionary principle: developers should focus on solving business problems, not managing infrastructure. Through automatic handler discovery, one-line service startup, and comprehensive abstractions, the platform eliminates typical microservices overhead.

The platform's mission is simple but ambitious: **Enable developers to create enterprise-grade microservices by writing only domain logic.**

## The Problem

Traditional microservices development forces teams to spend significant time on infrastructure concerns:

### Example Scenario

```typescript
// Traditional microservices approach - lots of infrastructure code
import express from 'express';
import amqp from 'amqplib';
import { Pool } from 'pg';
import winston from 'winston';
import opentelemetry from '@opentelemetry/api';

const app = express();
const rabbitConnection = await amqp.connect('amqp://localhost');
const channel = await rabbitConnection.createChannel();
const db = new Pool({ /* config */ });
const logger = winston.createLogger({ /* config */ });
const tracer = opentelemetry.trace.getTracer('my-service');

// Setup HTTP routes
app.post('/users', async (req, res) => {
  const span = tracer.startSpan('create-user');
  try {
    // Business logic buried in infrastructure
    const user = await createUser(req.body);
    await channel.publish('events', 'user.created', Buffer.from(JSON.stringify(user)));
    res.json(user);
  } catch (err) {
    logger.error('Failed to create user', err);
    res.status(500).json({ error: err.message });
  } finally {
    span.end();
  }
});

app.listen(3000);
```

**Why This Matters:**
- 80% of code is infrastructure, only 20% is business logic
- Tracing, logging, error handling repeated in every handler
- HTTP/REST tightly coupled to business logic
- Manual message bus integration error-prone
- No compile-time safety for service communication
- Team velocity slows as infrastructure complexity grows

## The Solution

The banyan-core platform eliminates infrastructure code through automatic abstraction and convention-based patterns.

### Core Principles

The platform is built on these foundational principles:

1. **Zero Infrastructure Code**: Services contain only domain logic - no HTTP servers, message queues, databases, tracing, etc.

2. **Message Bus Only**: All inter-service communication through RabbitMQ with no direct HTTP calls between services

3. **Zero Magic Strings**: TypeScript const types provide compile-time safety for all service communication

4. **Convention over Configuration**: Handler discovery, contract broadcasting, service registration all automatic

5. **Protocol Independence**: Services don't know about HTTP/REST - API Gateway handles protocol translation

6. **Two-Layer Authorization**: Permission-based at gateway (who can call what) + policy-based at handlers (business rules)

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Applications                          │
│                    (Web, Mobile, Desktop, APIs)                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP/REST/GraphQL/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API Gateway                                 │
│  • Protocol Translation (HTTP → Message Bus)                        │
│  • Permission-Based Authorization (Layer 1)                         │
│  • Dynamic Route Generation from Contracts                          │
│  • Correlation ID Management                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Message Bus (RabbitMQ)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Platform Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐          │
│  │   Service    │  │   Service    │  │     Service     │          │
│  │  Discovery   │  │     Auth     │  │   (Business)    │          │
│  └──────────────┘  └──────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │ All services communicate via Message Bus
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ RabbitMQ │  │PostgreSQL│  │  Redis   │  │  Jaeger  │           │
│  │(Messages)│  │ (Events) │  │ (Cache)  │  │ (Traces) │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation in the Platform

### Key Components

The platform consists of several layers that work together seamlessly:

- **Platform Packages**: TypeScript packages providing core abstractions (`@banyanai/platform-*`)
  - `core`: Foundational types and utilities
  - `contract-system`: Type-safe service contracts
  - `message-bus-client`: RabbitMQ abstraction with automatic correlation
  - `cqrs`: Command/Query pattern implementation
  - `event-sourcing`: Event store with PostgreSQL
  - `base-service`: One-line service startup
  - `client-system`: Auto-generated service clients
  - `telemetry`: OpenTelemetry integration

- **Infrastructure Services**: Platform-level services
  - `api-gateway`: Protocol translation and routing
  - `auth-service`: Authentication and user management
  - `service-discovery`: Contract registry and health monitoring

- **Developer Tools**: CLI and templates
  - `@banyanai/platform-cli`: Service creation tool
  - `microservice-template`: Standard service template

### Code Example

Here's the same user creation feature with banyan-core:

```typescript
// commands/CreateUserCommand.ts
import { Command } from '@banyanai/platform-cqrs';

@Command()
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string
  ) {}
}

// commands/CreateUserHandler.ts
import { CommandHandler } from '@banyanai/platform-cqrs';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // ONLY business logic - no infrastructure code
    const user = await this.userRepository.create({
      email: command.email,
      name: command.name
    });

    return { userId: user.id, success: true };
  }
}

// main.ts - Complete service startup
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  serviceName: 'user-service',
  version: '1.0.0'
});
```

**Key Points:**
- No HTTP server configuration
- No message bus setup code
- No tracing or logging code
- No database connection management
- Handlers auto-discovered from `/commands/` folder
- Complete distributed tracing automatic
- Type-safe service communication via contracts

## Benefits and Trade-offs

### Benefits

- **Developer Velocity**: Teams focus 100% on business logic, not infrastructure
- **Type Safety**: Compile-time validation prevents runtime communication errors
- **Enterprise Features Built-In**: Tracing, metrics, event sourcing, authorization all included
- **Protocol Independence**: Business logic decoupled from HTTP/REST protocols
- **Automatic Observability**: Full distributed tracing with zero instrumentation code
- **Rapid Prototyping**: New services in minutes with production-grade infrastructure

### Trade-offs

- **Learning Curve**: Requires understanding platform patterns and conventions
- **Platform Lock-in**: Services depend on platform abstractions
- **Message Bus Overhead**: All communication through RabbitMQ (no direct HTTP)
- **Debugging Complexity**: Async message-based flow requires different debugging approach

### When to Use This Platform

Use banyan-core when:
- Building new microservices from scratch
- Team wants to focus on business logic, not infrastructure
- Need enterprise features (tracing, event sourcing, etc.) without implementation effort
- Want compile-time safety for service communication
- Scaling team and need consistent patterns across services

Avoid banyan-core when:
- Migrating large existing monolith (consider strangler pattern first)
- Need direct HTTP service-to-service calls
- Team unfamiliar with TypeScript or message-based architectures
- Simple CRUD application without complex business logic

## Comparison with Alternatives

### Banyan-Core vs Traditional Microservices

| Aspect | Banyan-Core | Traditional |
|--------|-------------|-------------|
| Infrastructure Code | Zero - abstracted by platform | 60-80% of codebase |
| Service Startup | One line: `BaseService.start()` | 100+ lines of setup code |
| Inter-Service Communication | Type-safe contracts, message bus | HTTP/REST with manual clients |
| Observability | Automatic distributed tracing | Manual instrumentation required |
| Authorization | Two-layer (permissions + policies) | Custom implementation per service |
| Protocol Support | HTTP/REST/GraphQL/WebSocket | Usually HTTP/REST only |

Choose banyan-core for greenfield projects where team velocity and consistency matter. Choose traditional approach for simple services or when migrating existing systems.

### Banyan-Core vs NestJS

| Aspect | Banyan-Core | NestJS |
|--------|-------------|---------|
| Focus | Pure business logic, zero infrastructure | Structured HTTP applications |
| Communication | Message bus only | HTTP/REST primary |
| Type Safety | Compile-time contract validation | Runtime validation decorators |
| Event Sourcing | Built-in with PostgreSQL | Plugin/manual implementation |
| Protocol Independence | Complete (services don't see HTTP) | HTTP-centric architecture |

Choose banyan-core for microservices with complex domain logic. Choose NestJS for HTTP-first applications or when REST endpoints are primary interface.

## Real-World Examples

### Example 1: E-commerce Order Service

```typescript
// commands/PlaceOrderCommand.ts
@Command()
export class PlaceOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address
  ) {}
}

// commands/PlaceOrderHandler.ts
@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryClient: InventoryServiceClient  // Auto-injected
  ) {}

  async handle(command: PlaceOrderCommand) {
    // Check inventory - type-safe cross-service call
    const availability = await this.inventoryClient.checkAvailability({
      items: command.items
    });

    if (!availability.allAvailable) {
      throw new InsufficientInventoryError();
    }

    // Create order - event sourcing automatic
    const order = await this.orderRepository.create({
      userId: command.userId,
      items: command.items,
      shippingAddress: command.shippingAddress
    });

    return { orderId: order.id, status: 'placed' };
  }
}
```

**Outcome:** Order service handles complex business logic (inventory checks, order creation) without any infrastructure code. Distributed tracing automatically connects order creation to inventory service call.

### Example 2: User Notification Service

```typescript
// events/UserRegisteredHandler.ts
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  constructor(
    private emailService: EmailServiceClient
  ) {}

  async handle(event: UserRegisteredEvent) {
    // React to user registration event
    await this.emailService.sendWelcomeEmail({
      to: event.email,
      name: event.name
    });

    // No manual event subscription code
    // No correlation ID management code
    // Handler automatically discovered
  }
}
```

**Outcome:** Notification service reacts to events with zero message bus code. Correlation IDs automatically propagated from original user registration request.

## Related Concepts

This overview connects to detailed architecture concepts:

- [Message Bus Architecture](message-bus-architecture.md) - RabbitMQ-based communication
- [Event Sourcing Architecture](event-sourcing-architecture.md) - Event store implementation
- [Service Discovery](service-discovery.md) - Contract registry and health monitoring
- [API Gateway](api-gateway.md) - Protocol translation and routing
- [Two-Layer Authorization](two-layer-authorization.md) - Permission + policy model

And to key patterns:

- [CQRS Pattern](../patterns/cqrs-pattern.md) - Command/Query separation
- [Event Sourcing Pattern](../patterns/event-sourcing-pattern.md) - Event-driven persistence
- [Saga Pattern](../patterns/saga-pattern.md) - Distributed transactions

## Common Patterns

### Pattern 1: Command-Query Service

Services typically separate state-modifying commands from read-only queries:

```typescript
// commands/ - State changes
CreateUserHandler, UpdateUserHandler, DeleteUserHandler

// queries/ - Read operations with caching
GetUserHandler, SearchUsersHandler, GetUserStatisticsHandler

// events/ - React to external events
UserRegisteredHandler, OrderPlacedHandler
```

### Pattern 2: Event-Driven Integration

Services communicate through domain events rather than direct calls:

```typescript
// Service A publishes event
await eventStore.save(new OrderPlacedEvent({ orderId, items }));

// Service B reacts to event (different process/service)
@EventHandler(OrderPlacedEvent)
class ProcessPaymentHandler {
  async handle(event: OrderPlacedEvent) {
    // Process payment for order
  }
}
```

## Common Misconceptions

### Misconception 1: "Message bus adds too much latency"

**Reality:** RabbitMQ adds ~5-10ms overhead, which is negligible compared to network latency and database queries. Platform targets sub-100ms for commands and sub-50ms for queries.

**Why This Matters:** Teams often prematurely optimize for direct HTTP calls, sacrificing type safety, observability, and resilience for minimal performance gain.

### Misconception 2: "Zero infrastructure code means less control"

**Reality:** Platform provides escape hatches for advanced scenarios. Services can access EventStore, MessageBusClient, and ReadModelManager directly when needed.

**Why This Matters:** Platform abstractions handle 90% of use cases, but developers retain full control for the remaining 10%.

### Misconception 3: "GraphQL/REST differences require different service implementations"

**Reality:** Services expose contracts, API Gateway translates to GraphQL/REST/WebSocket. Same service code supports all protocols.

**Why This Matters:** Teams can support multiple client types (web, mobile, GraphQL, REST) without changing service code.

## Best Practices

1. **Keep Services Focused**
   - One service per bounded context
   - Clear domain boundaries
   - Example: `user-service`, `order-service`, `inventory-service` vs monolithic `e-commerce-service`

2. **Use Type-Safe Contracts**
   - Define contracts for all service communication
   - Leverage compile-time validation
   - Example: `CreateOrderContract` prevents typos and breaking changes

3. **Follow Handler Conventions**
   - Commands in `/commands/` folder
   - Queries in `/queries/` folder
   - Event handlers in `/events/` folder
   - Enables automatic discovery

4. **Design for Event Sourcing**
   - Model aggregates with clear boundaries
   - Events represent past facts, not future intentions
   - Use read models for query optimization

5. **Implement Two-Layer Authorization**
   - Layer 1: Permissions at API Gateway (who can call this?)
   - Layer 2: Policies at handlers (does this specific request meet business rules?)

## Practical Applications

Now that you understand the platform architecture, explore these guides:

- [Quick Start Guide](../../01-getting-started/quick-start.md) - Build your first service
- [Creating Commands and Queries](../../03-guides/cqrs/creating-commands-queries.md)
- [Working with Events](../../03-guides/event-sourcing/working-with-events.md)
- [Service-to-Service Communication](../../03-guides/communication/service-to-service.md)

## Further Reading

### Internal Resources
- [Message Bus Architecture](message-bus-architecture.md) - Deep dive into RabbitMQ implementation
- [BaseService Reference](../../04-reference/platform-packages/base-service.md) - Complete API documentation
- [Contract System](../../04-reference/platform-packages/contract-system.md) - Type-safe contracts

### External Resources
- [Microservices Patterns](https://microservices.io/patterns/) - Martin Fowler's pattern catalog
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/) - Eric Evans' DDD resources
- [Event Sourcing Fundamentals](https://martinfowler.com/eaaDev/EventSourcing.html) - Martin Fowler on event sourcing

## Glossary

**Aggregate**: A cluster of domain objects that can be treated as a single unit for data changes.

**Contract**: Type-safe definition of a service operation (command, query, or event) with input/output types.

**CQRS**: Command Query Responsibility Segregation - pattern separating read and write operations.

**Domain Event**: A record of something that happened in the domain (e.g., `OrderPlaced`, `UserRegistered`).

**Event Sourcing**: Persisting application state as a sequence of events rather than current state.

**Handler**: A class that processes a command, query, or event following platform conventions.

**Read Model**: Optimized projection of event-sourced data for query performance.

**Service Discovery**: Platform service that tracks service health and contract registrations.
