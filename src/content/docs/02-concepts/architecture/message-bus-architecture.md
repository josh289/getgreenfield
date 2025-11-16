---
title: "Message Bus Architecture"
description: "RabbitMQ-based message bus architecture enabling zero-infrastructure service communication"
category: "concepts"
tags: ["architecture", "messaging", "rabbitmq"]
difficulty: "intermediate"
related_concepts:
  - "platform-overview.md"
  - "service-discovery.md"
  - "api-gateway.md"
prerequisites:
  - "platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Message Bus Architecture

> **Core Idea:** All inter-service communication flows through RabbitMQ message bus with automatic correlation ID propagation, eliminating direct HTTP dependencies and enabling complete distributed tracing.

## Overview

The message bus is the nervous system of the banyan-core platform. Every service communication - commands, queries, events - flows through RabbitMQ, providing complete observability, type safety, and protocol independence.

Unlike traditional microservices that use direct HTTP calls between services, banyan-core enforces message bus-only communication. This architectural decision enables powerful abstractions while maintaining enterprise-grade reliability.

## The Problem

Traditional microservices architectures face significant challenges with direct service-to-service communication:

### Example Scenario

```typescript
// Traditional approach - direct HTTP calls
import axios from 'axios';

class OrderService {
  async createOrder(userId: string, items: OrderItem[]) {
    // Problem 1: Hardcoded URLs
    const userResponse = await axios.get(`http://user-service:3000/users/${userId}`);

    // Problem 2: Manual correlation ID propagation
    const inventoryResponse = await axios.post(
      'http://inventory-service:3000/check',
      { items },
      { headers: { 'x-correlation-id': req.headers['x-correlation-id'] } }
    );

    // Problem 3: No compile-time safety
    const paymentResponse = await axios.post(
      'http://payment-service:3000/charge',
      {
        amount: inventoryResponse.data.total, // Typo in response field? Runtime error!
        userId: userResponsse.data.id         // Another typo - won't know until production
      }
    );

    // Problem 4: No automatic retry or circuit breaking
    // Problem 5: Service discovery manual
    // Problem 6: No type checking on request/response
  }
}
```

**Why This Matters:**
- Runtime errors from typos and API contract changes
- Manual correlation ID management error-prone
- Service URLs hardcoded or require complex service discovery
- No automatic retry or circuit breaking
- Difficult to trace requests across services
- Testing requires mocking HTTP endpoints

## The Solution

The message bus architecture eliminates these problems through a central RabbitMQ broker with automatic abstractions.

### Core Principles

The message bus architecture is built on these principles:

1. **Single Source of Truth**: All service communication through one RabbitMQ broker

2. **Automatic Correlation**: Correlation IDs propagated automatically via AsyncLocalStorage

3. **Type-Safe Contracts**: TypeScript contracts ensure compile-time validation

4. **Pattern-Based Routing**: Commands, queries, and events use different exchange patterns

5. **Zero Configuration**: Services register handlers, platform manages routing

6. **Protocol Independence**: Business logic never sees HTTP, GraphQL, or WebSocket protocols

### How It Works

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Client Request Flow                            │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 1. HTTP/REST/GraphQL Request
                                 ▼
                         ┌───────────────┐
                         │  API Gateway  │
                         │               │
                         │ • Generate    │
                         │   Correlation │
                         │   ID          │
                         │ • Set Async   │
                         │   Context     │
                         └───────┬───────┘
                                 │
                                 │ 2. Publish to Message Bus
                                 │    (correlation ID in headers)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          RabbitMQ Broker                              │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Command Exchange│  │  Query Exchange │  │  Event Exchange  │   │
│  │    (Direct)     │  │    (Direct)     │  │    (Topic)       │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘   │
│           │                    │                     │              │
│           │ 3. Route by        │                     │              │
│           │    Service +       │                     │              │
│           │    Contract        │                     │              │
└───────────┼────────────────────┼─────────────────────┼──────────────┘
            │                    │                     │
            │                    │                     │
            ▼                    ▼                     ▼
    ┌──────────────┐    ┌──────────────┐     ┌──────────────┐
    │   Service A  │    │   Service B  │     │   Service C  │
    │              │    │              │     │              │
    │ • Handler    │    │ • Handler    │     │ • Handler    │
    │   receives   │    │   receives   │     │   receives   │
    │   with       │    │   with       │     │   with       │
    │   correlation│    │   correlation│     │   correlation│
    │   context    │    │   context    │     │   context    │
    └──────┬───────┘    └──────┬───────┘     └──────────────┘
           │                   │
           │ 4. Handler makes  │
           │    additional     │
           │    calls - same   │
           │    correlation    │
           │    ID automatic   │
           │                   │
           └───────────────────┘
```

## Implementation in the Platform

### Key Components

- **MessageBusClient**: Main abstraction for sending/receiving messages
  - Location: `platform/packages/message-bus-client/`
  - Provides `send()`, `publish()`, `subscribe()`, `registerHandler()`
  - Handles connection pooling, channel management, retry logic

- **MessageBusFactory**: Factory for creating configured clients
  - `createForDevelopment()`: Local development configuration
  - `createForProduction()`: Production with HA setup
  - `createForTesting()`: In-memory testing mode

- **CorrelationContext**: Automatic correlation ID management
  - Uses Node.js AsyncLocalStorage
  - Propagates correlation IDs transparently
  - Zero developer code required

- **Contract System**: Type-safe message definitions
  - Location: `platform/packages/contract-system/`
  - Defines input/output types
  - Compile-time validation
  - Runtime serialization/deserialization

### Exchange Patterns

The platform uses three RabbitMQ exchange patterns:

**1. Command Exchange (Direct)**
- One service handles each command
- Request-response pattern
- Routing key: `{serviceName}.{contractName}`
- Example: `user-service.CreateUser`

**2. Query Exchange (Direct)**
- One service handles each query
- Request-response with caching
- Routing key: `{serviceName}.{contractName}`
- Example: `order-service.GetOrder`

**3. Event Exchange (Topic)**
- Multiple services can subscribe
- Pub-sub pattern
- Routing key: `{eventType}.{aggregateType}`
- Example: `UserRegistered.User`

### Code Example

```typescript
// Service A - Sending a command
import { MessageBusClient } from '@banyanai/platform-message-bus-client';
import { CreateOrderContract } from './contracts';

class OrderService {
  constructor(private messageBus: MessageBusClient) {}

  async placeOrder(userId: string, items: OrderItem[]) {
    // Type-safe send with compile-time validation
    // Correlation ID automatically included from current context
    const result = await this.messageBus.send(
      CreateOrderContract,
      { userId, items }
    );

    return result; // TypeScript knows exact return type
  }
}

// Service B - Handling the command
import { CommandHandler } from '@banyanai/platform-cqrs';
import { CreateOrderContract } from './contracts';

@CommandHandler(CreateOrderContract)
class CreateOrderHandler {
  async handle(command: CreateOrderCommand) {
    // Correlation ID automatically available in context
    // No manual propagation needed

    const order = await this.orderRepository.create(command);

    // Publish event - correlation ID auto-included
    await this.eventBus.publish(
      OrderCreatedEvent,
      { orderId: order.id, userId: command.userId }
    );

    return { orderId: order.id };
  }
}
```

**Key Points:**
- No correlation ID management code
- Type-safe contracts prevent runtime errors
- Automatic retry and circuit breaking
- Complete distributed tracing
- Protocol-independent (same code works for HTTP, GraphQL, WebSocket clients)

## Benefits and Trade-offs

### Benefits

- **Complete Observability**: Every message includes correlation ID for distributed tracing
- **Type Safety**: Compile-time validation prevents API contract errors
- **Protocol Independence**: Services don't know about HTTP/REST/GraphQL
- **Automatic Reliability**: Retry logic, circuit breaking, dead letter queues built-in
- **Simplified Testing**: In-memory message bus for fast unit tests
- **Decoupling**: Services can scale, deploy, fail independently

### Trade-offs

- **Latency Overhead**: RabbitMQ adds ~5-10ms vs direct HTTP (negligible for most use cases)
- **Eventual Consistency**: Events processed asynchronously
- **Message Bus Dependency**: Single point of failure (mitigated with clustering)
- **Debugging Complexity**: Async message flow requires different debugging approach
- **Learning Curve**: Teams must understand message patterns

### When to Use Message Bus

Use message bus architecture when:
- Building distributed microservices
- Need complete observability across services
- Want type-safe service communication
- Require decoupling for independent scaling
- Event-driven architecture is appropriate

Avoid message bus-only when:
- Building simple monolith
- Real-time synchronous responses critical (<10ms latency required)
- Team unfamiliar with message-based patterns

## Comparison with Alternatives

### Message Bus vs Direct HTTP

| Aspect | Message Bus | Direct HTTP |
|--------|-------------|-------------|
| Type Safety | Compile-time via contracts | Manual or runtime only |
| Correlation | Automatic propagation | Manual header management |
| Service Discovery | Automatic via contracts | Manual or service mesh |
| Retry/Circuit Breaking | Built-in | Manual implementation |
| Protocol Independence | Complete | HTTP-coupled |
| Latency | +5-10ms | Baseline |
| Debugging | Requires tracing tools | Standard HTTP debugging |

### Message Bus vs Service Mesh (Istio/Linkerd)

| Aspect | Message Bus | Service Mesh |
|--------|-------------|--------------|
| Communication Model | Async message-based | Sync HTTP-based |
| Type Safety | TypeScript contracts | No compile-time safety |
| Protocol Support | All (HTTP, GraphQL, WS) | HTTP/gRPC |
| Observability | Built-in correlation | Injected sidecars |
| Complexity | Simple RabbitMQ | Complex Kubernetes setup |
| Operational Overhead | Low (one broker) | High (sidecar per pod) |

## Real-World Examples

### Example 1: Order Processing with Multiple Services

```typescript
// API Gateway receives HTTP request, generates correlation ID
// POST /orders { userId: "123", items: [...] }

// 1. Order Service creates order
@CommandHandler(CreateOrderContract)
class CreateOrderHandler {
  async handle(command: CreateOrderCommand) {
    // Correlation ID already in context

    // Check inventory - correlation ID auto-propagated
    const availability = await this.messageBus.send(
      CheckInventoryContract,
      { items: command.items }
    );

    if (!availability.available) {
      throw new InsufficientInventoryError();
    }

    // Create order
    const order = await this.orderRepository.create(command);

    // Publish event - correlation ID auto-propagated
    await this.messageBus.publish(
      OrderCreatedEvent,
      { orderId: order.id, userId: command.userId, items: command.items }
    );

    return { orderId: order.id };
  }
}

// 2. Inventory Service handles check
@QueryHandler(CheckInventoryContract)
class CheckInventoryHandler {
  async handle(query: CheckInventoryQuery) {
    // Same correlation ID from original request
    // Query logged with correlation for tracing

    const availability = await this.inventoryRepository.checkAvailability(
      query.items
    );

    return { available: availability.allAvailable };
  }
}

// 3. Payment Service reacts to event
@EventHandler(OrderCreatedEvent)
class ProcessPaymentHandler {
  async handle(event: OrderCreatedEvent) {
    // Same correlation ID from original request
    // Complete trace: HTTP → CreateOrder → CheckInventory → OrderCreated → ProcessPayment

    await this.paymentProcessor.charge({
      orderId: event.orderId,
      amount: event.total
    });
  }
}
```

**Outcome:** Complete distributed trace with single correlation ID across 4 service calls, zero manual correlation code.

### Example 2: Event-Driven Notifications

```typescript
// Multiple services react to UserRegisteredEvent

// Email Service
@EventHandler(UserRegisteredEvent)
class SendWelcomeEmailHandler {
  async handle(event: UserRegisteredEvent) {
    await this.emailService.send({
      to: event.email,
      template: 'welcome',
      data: { name: event.name }
    });
  }
}

// Analytics Service
@EventHandler(UserRegisteredEvent)
class TrackUserSignupHandler {
  async handle(event: UserRegisteredEvent) {
    await this.analytics.track('user_signup', {
      userId: event.userId,
      source: event.registrationSource
    });
  }
}

// CRM Service
@EventHandler(UserRegisteredEvent)
class CreateCRMContactHandler {
  async handle(event: UserRegisteredEvent) {
    await this.crmClient.createContact({
      email: event.email,
      name: event.name,
      signupDate: event.occurredAt
    });
  }
}
```

**Outcome:** Three independent services react to single event, each with same correlation ID, all failures isolated.

## Related Concepts

This message bus architecture connects to:

- [Platform Overview](platform-overview.md) - Overall platform architecture
- [Service Discovery](service-discovery.md) - How services find each other via contracts
- [API Gateway](api-gateway.md) - Protocol translation from HTTP to message bus
- [Event Sourcing Pattern](../patterns/event-sourcing-pattern.md) - Event-driven persistence
- [CQRS Pattern](../patterns/cqrs-pattern.md) - Command/Query separation

## Common Patterns

### Pattern 1: Request-Response (Commands/Queries)

```typescript
// Synchronous-style API using async message bus
const result = await messageBus.send(
  GetUserContract,
  { userId: '123' },
  { timeout: 5000 }  // Wait up to 5s for response
);
```

### Pattern 2: Fire-and-Forget (Events)

```typescript
// Publish event without waiting for processing
await messageBus.publish(
  UserRegisteredEvent,
  { userId: '123', email: 'user@example.com' },
  { waitForConfirmation: true }  // Wait for broker confirmation only
);
```

### Pattern 3: Event Subscription

```typescript
// Subscribe to events with automatic correlation context
const subscription = await messageBus.subscribe(
  OrderCreatedEvent,
  async (envelope) => {
    // Correlation ID from original request available
    console.log('Correlation ID:', envelope.correlationId);
    await processOrder(envelope.payload);
  }
);
```

## Common Misconceptions

### Misconception 1: "Message bus makes everything slower"

**Reality:** RabbitMQ adds ~5-10ms overhead, but eliminates service discovery, retry logic, and circuit breaking complexity. Total latency often lower than hand-rolled HTTP solutions.

**Why This Matters:** Teams prematurely optimize for direct HTTP when message bus latency is negligible compared to database queries (10-50ms) and business logic.

### Misconception 2: "I can't do synchronous request-response with a message bus"

**Reality:** Message bus supports request-response pattern with timeouts. Commands and queries work exactly like HTTP calls from developer perspective.

**Why This Matters:** Message bus architecture doesn't force async-only patterns. Synchronous workflows supported via RPC pattern.

### Misconception 3: "Correlation IDs require manual propagation code"

**Reality:** Platform uses AsyncLocalStorage to propagate correlation IDs automatically. Zero developer code required.

**Why This Matters:** Distributed tracing works out-of-the-box without instrumentation code in business logic.

## Best Practices

1. **Use Contracts for All Communication**
   - Define TypeScript contracts for every command/query/event
   - Leverage compile-time validation
   - Example: Create `CreateUserContract` instead of sending raw objects

2. **Design Idempotent Handlers**
   - Handlers may receive duplicate messages (at-least-once delivery)
   - Use unique IDs to detect duplicates
   - Example: Check if order already exists before creating

3. **Set Appropriate Timeouts**
   - Commands: 30 seconds default
   - Queries: 5 seconds default (should be fast)
   - Long-running operations: Use sagas with timeouts up to 5 minutes

4. **Monitor Message Bus Health**
   - Track pending responses
   - Monitor queue depths
   - Set up alerts for circuit breaker triggers

5. **Use Dead Letter Queues**
   - Automatic for failed messages after max retries
   - Monitor DLQ for systemic issues
   - Replay messages after fixing bugs

## Practical Applications

Now that you understand message bus architecture:

- [Creating Service Contracts](../../03-guides/contracts/creating-contracts.md)
- [Service-to-Service Communication](../../03-guides/communication/service-to-service.md)
- [Working with Events](../../03-guides/event-sourcing/working-with-events.md)
- [Message Bus Client Reference](../../04-reference/platform-packages/message-bus-client.md)

## Further Reading

### Internal Resources
- [Contract System Reference](../../04-reference/platform-packages/contract-system.md)
- [Correlation ID Management](../../03-guides/telemetry/correlation-ids.md)
- [Troubleshooting Message Bus](../../05-troubleshooting/message-bus-issues.md)

### External Resources
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Async Await in Node.js](https://nodejs.org/en/learn/asynchronous-work/asynchronous-flow-control)

## Glossary

**AsyncLocalStorage**: Node.js API for maintaining context across async operations (used for correlation ID propagation).

**Circuit Breaker**: Pattern that prevents cascading failures by stopping calls to failing services.

**Correlation ID**: Unique identifier tracking a request across multiple services.

**Dead Letter Queue (DLQ)**: Queue for messages that failed processing after max retries.

**Exchange**: RabbitMQ component that routes messages to queues based on routing rules.

**Message Envelope**: Wrapper containing message payload plus metadata (correlation ID, timestamp, etc.).

**Routing Key**: String used by exchanges to route messages to appropriate queues.

**RPC (Remote Procedure Call)**: Pattern enabling request-response over message bus.
