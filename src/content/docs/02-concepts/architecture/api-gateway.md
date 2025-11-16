---
title: "API Gateway"
description: "Protocol translation gateway supporting HTTP/REST, GraphQL, and WebSocket with dynamic route generation"
category: "concepts"
tags: ["architecture", "api-gateway", "graphql", "websocket"]
difficulty: "intermediate"
related_concepts:
  - "platform-overview.md"
  - "message-bus-architecture.md"
  - "service-discovery.md"
  - "two-layer-authorization.md"
prerequisites:
  - "platform-overview.md"
  - "message-bus-architecture.md"
last_updated: "2025-01-15"
status: "published"
---

# API Gateway

> **Core Idea:** Translate HTTP/REST, GraphQL, and WebSocket protocols to message bus communication, enabling services to remain protocol-independent while supporting multiple client types.

## Overview

The API Gateway is the entry point for all client requests, handling protocol translation, authentication, permission-based authorization, and dynamic route generation from service contracts. Services never see HTTP details - they only work with typed commands and queries.

## The Problem

Traditional microservices expose HTTP/REST endpoints, coupling business logic to protocol:

### Example Scenario

```typescript
// Traditional approach - HTTP coupled to business logic
import express from 'express';

const app = express();

// Problem 1: Business logic knows about HTTP
app.post('/orders', authenticate, async (req, res) => {
  try {
    // Problem 2: Manual parameter extraction
    const { userId, items } = req.body;
    
    // Problem 3: Manual validation
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Problem 4: Manual authorization
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const order = await orderService.createOrder(userId, items);

    // Problem 5: Manual status code mapping
    res.status(201).json(order);
  } catch (err) {
    // Problem 6: Manual error handling
    res.status(500).json({ error: err.message });
  }
});

// Problem 7: GraphQL requires separate implementation
// Problem 8: WebSocket requires different code
// Problem 9: Routes hardcoded, not generated from contracts
```

**Why This Matters:**
- Business logic coupled to HTTP protocol
- Different code for REST vs GraphQL vs WebSocket
- Manual routing configuration
- Authorization mixed with business logic

## The Solution

API Gateway translates all protocols to message bus, services remain protocol-independent.

### Core Principles

1. **Protocol Translation**: HTTP/GraphQL/WebSocket → Message Bus → Services
2. **Dynamic Route Generation**: Routes generated from service contracts
3. **Permission-Based Authorization**: Gateway enforces "who can call what"
4. **Correlation ID Management**: Generate and propagate correlation IDs
5. **Health-Aware Routing**: Only route to healthy services
6. **Zero Service Changes**: Same service code supports all protocols

### How It Works

```
┌────────────────────────────────────────────────────────────┐
│                      Client Requests                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │   HTTP   │  │ GraphQL  │  │WebSocket │                 │
│  │   /REST  │  │          │  │          │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
└───────┼─────────────┼─────────────┼────────────────────────┘
        │             │             │
        │             │             │
        ▼             ▼             ▼
┌────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Protocol Translation                             │  │
│  │     • HTTP → Command/Query                           │  │
│  │     • GraphQL → Command/Query                        │  │
│  │     • WebSocket → Event Subscription                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Authentication (JWT/Auth0)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Permission Check (Layer 1 Authorization)         │  │
│  │     • Does user have permission to call this?        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  4. Correlation ID Management                        │  │
│  │     • Generate new correlation ID                    │  │
│  │     • Set AsyncLocalStorage context                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  5. Health-Aware Routing                             │  │
│  │     • Check if service healthy                       │  │
│  │     • Return 503 if unhealthy                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Send via Message Bus
                         ▼
┌────────────────────────────────────────────────────────────┐
│                     RabbitMQ Message Bus                    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Route to Service
                         ▼
┌────────────────────────────────────────────────────────────┐
│                   Business Service                          │
│  • Protocol-independent handlers                           │
│  • No HTTP/GraphQL/WebSocket knowledge                     │
│  • Policy-based authorization (Layer 2)                    │
└────────────────────────────────────────────────────────────┘
```

## Implementation in the Platform

### Key Components

- **DynamicGatewayEngine**: Main orchestrator
  - Location: `platform/services/api-gateway/src/routing/`
  - Loads contracts from service discovery
  - Generates routes dynamically
  - Handles all three protocols

- **ProtocolTranslator**: HTTP → Message Bus
  - Translates REST requests to commands/queries
  - Maps HTTP methods to contract types
  - Handles response formatting

- **GraphQLExecutionEngine**: GraphQL → Message Bus
  - Generates schema from contracts
  - Executes queries/mutations via message bus
  - Supports subscriptions via WebSocket

- **AuthTranslator**: JWT validation and user extraction
  - Validates JWT tokens (Auth0 or internal)
  - Extracts user permissions
  - Enforces permission-based authorization

- **CorrelationManager**: Correlation ID lifecycle
  - Generates correlation IDs
  - Sets AsyncLocalStorage context
  - Propagates through request chain

### Dynamic Route Generation

```typescript
// Contracts from service discovery
const contracts = await serviceDiscovery.getAllServiceContracts();

// Generate routes automatically
contracts.forEach(contract => {
  if (contract.type === 'command') {
    // POST /service-name/contract-name
    router.post(`/${contract.serviceName}/${contract.name}`, async (req, res) => {
      // Translate HTTP → Message Bus
      const result = await messageBus.send(contract, req.body);
      res.json(result);
    });
  } else if (contract.type === 'query') {
    // GET /service-name/contract-name/:id
    router.get(`/${contract.serviceName}/${contract.name}/:id`, async (req, res) => {
      const result = await messageBus.send(contract, { id: req.params.id });
      res.json(result);
    });
  }
});

// GraphQL schema generated from same contracts
const schema = buildSchemaFromContracts(contracts);
```

### Code Example

```typescript
// Client makes HTTP request
// POST /orders
// { "userId": "123", "items": [...] }

// API Gateway translates to message bus
@Post('/orders')
async createOrder(req, res) {
  // 1. Authenticate
  const user = await this.authTranslator.extractUser(req);
  
  // 2. Check permission (Layer 1)
  if (!user.hasPermission('orders:create')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 3. Generate correlation ID
  const correlationId = generateCorrelationId();
  await this.correlationManager.setContext(correlationId, user);

  // 4. Translate to message bus
  const result = await this.messageBus.send(
    CreateOrderContract,
    req.body
  );

  // 5. Translate response
  res.status(201).json(result);
}

// GraphQL client makes same request
// mutation { createOrder(userId: "123", items: [...]) { orderId } }

// API Gateway translates to same message bus call
async executeGraphQL(query, variables) {
  // Same permission check
  // Same correlation ID
  // Same message bus call
  // Different response format (GraphQL vs REST)
}

// Service handler - SAME CODE for both protocols
@CommandHandler(CreateOrderContract)
class CreateOrderHandler {
  async handle(command: CreateOrderCommand) {
    // Protocol-independent business logic
    // No knowledge of HTTP or GraphQL
    const order = await this.orderRepository.create(command);
    return { orderId: order.id };
  }
}
```

**Key Points:**
- Same service code for REST and GraphQL
- Permission check at gateway (Layer 1)
- Correlation ID automatic
- Dynamic routes from contracts

## Benefits and Trade-offs

### Benefits

- **Protocol Independence**: Services don't know about HTTP/GraphQL/WebSocket
- **Multiple Protocols**: Support REST, GraphQL, WebSocket from same service
- **Dynamic Routes**: No manual route configuration
- **Consistent Authorization**: Permission checks enforced at single point
- **Complete Tracing**: Correlation IDs for all requests
- **Health-Aware**: Automatic 503 for unhealthy services

### Trade-offs

- **Single Point of Failure**: Gateway failure affects all clients
- **Latency**: Additional hop through gateway (~2-5ms)
- **Limited Customization**: Protocol translation opinionated
- **GraphQL Limitations**: Generated schema may not support all GraphQL features

## Related Concepts

- [Platform Overview](platform-overview.md)
- [Message Bus Architecture](message-bus-architecture.md)
- [Two-Layer Authorization](two-layer-authorization.md)
- [Service Discovery](service-discovery.md)

## Common Patterns

### Pattern 1: REST → Message Bus

```typescript
// REST: POST /users
// Body: { email, name }

// Gateway translates to:
await messageBus.send(CreateUserContract, { email, name });
```

### Pattern 2: GraphQL → Message Bus

```typescript
// GraphQL: mutation { createUser(email: "...", name: "...") { userId } }

// Gateway translates to same message bus call:
await messageBus.send(CreateUserContract, { email, name });
```

### Pattern 3: WebSocket Subscriptions

```typescript
// WebSocket: subscribe to order events

// Gateway creates subscription:
await messageBus.subscribe(OrderCreatedEvent, (event) => {
  websocket.send(JSON.stringify(event));
});
```

## Best Practices

1. **Design Contracts for Multiple Protocols**
   - Avoid HTTP-specific concepts in contracts
   - Use domain language, not protocol language

2. **Set Appropriate Timeouts**
   - Commands: 30 seconds
   - Queries: 5 seconds
   - Long operations: Use async patterns

3. **Monitor Gateway Performance**
   - Track translation latency
   - Monitor correlation ID propagation
   - Alert on high error rates

## Further Reading

### Internal Resources
- [API Gateway Service](../../04-reference/platform-services/api-gateway.md)
- [Contract Design](../../03-guides/contracts/designing-contracts.md)
- [GraphQL Support](../../03-guides/api-gateway/graphql.md)

## Glossary

**Protocol Translation**: Converting HTTP/GraphQL/WebSocket to message bus calls.

**Dynamic Route Generation**: Creating API routes from service contracts automatically.

**Correlation ID**: Unique identifier tracking requests across services.

**Permission-Based Authorization**: Authorization based on user permissions (who can call what).
