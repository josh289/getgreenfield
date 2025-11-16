---
title: "CQRS Pattern"
description: "Command Query Responsibility Segregation separating write and read operations for performance and clarity"
category: "concepts"
tags: ["patterns", "cqrs", "architecture"]
difficulty: "intermediate"
related_concepts:
  - "../architecture/platform-overview.md"
  - "event-sourcing-pattern.md"
  - "read-model-pattern.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# CQRS Pattern

> **Core Idea:** Separate commands (state changes) from queries (reads) to enable independent optimization and clearer intent.

## Overview

CQRS (Command Query Responsibility Segregation) separates operations that modify state (commands) from operations that read state (queries). This separation enables different optimization strategies, clearer code organization, and better scalability.

In banyan-core, CQRS is enforced through folder conventions (`/commands/`, `/queries/`) and base classes (`CommandHandler`, `QueryHandler`).

## The Problem

Traditional CRUD intermixes reads and writes, leading to complexity:

```typescript
// Traditional approach - reads and writes mixed
class OrderService {
  // Write operation
  async createOrder(data) { ... }
  
  // Read operation
  async getOrder(id) { ... }
  
  // Mixed operation - unclear intent
  async updateOrderStatus(id, status) {
    const order = await this.getOrder(id);  // Read
    order.status = status;                   // Write
    return await this.save(order);          // Write and Read?
  }
}
```

**Why This Matters:**
- Unclear whether method modifies state
- Same database schema for reads and writes limits optimization
- Difficult to cache write operations
- Validation logic mixed with query logic

## The Solution

Separate commands (writes) from queries (reads) with distinct handlers:

### Core Principles

1. **Commands**: Modify state, return minimal data (success/failure)
2. **Queries**: Read state, never modify, highly cacheable
3. **Clear Intent**: Method name indicates command vs query
4. **Independent Optimization**: Optimize reads and writes separately
5. **Folder Convention**: Physical separation in codebase

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Commands (Write)                      │
│  • Modify state                                             │
│  • Validate input                                           │
│  • Enforce business rules                                   │
│  • Return minimal data (ID, success flag)                   │
│  • No caching                                               │
│                                                             │
│  /commands/CreateOrderHandler.ts                           │
│  /commands/UpdateOrderStatusHandler.ts                     │
│  /commands/CancelOrderHandler.ts                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         Queries (Read)                       │
│  • Read state                                               │
│  • Never modify                                             │
│  • Highly cacheable                                         │
│  • Optimized for specific views                            │
│  • Fast response (sub-50ms target)                         │
│                                                             │
│  /queries/GetOrderHandler.ts                               │
│  /queries/SearchOrdersHandler.ts                           │
│  /queries/GetOrderStatsHandler.ts                          │
└─────────────────────────────────────────────────────────────┘
```

## Implementation in the Platform

### Commands

```typescript
// commands/CreateOrderCommand.ts
import { Command } from '@banyanai/platform-cqrs';

@Command()
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItem[]
  ) {}
}

// commands/CreateOrderHandler.ts
import { CommandHandler } from '@banyanai/platform-cqrs';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryClient: InventoryServiceClient
  ) {}

  async handle(command: CreateOrderCommand) {
    // Validation
    if (command.items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }

    // Business logic
    const availability = await this.inventoryClient.checkAvailability({
      items: command.items
    });

    if (!availability.allAvailable) {
      throw new InsufficientInventoryError();
    }

    // State change
    const order = await this.orderRepository.create({
      userId: command.userId,
      items: command.items
    });

    // Return minimal data
    return { orderId: order.id };
  }
}
```

### Queries

```typescript
// queries/GetOrderQuery.ts
import { Query } from '@banyanai/platform-cqrs';

@Query()
export class GetOrderQuery {
  constructor(public readonly orderId: string) {}
}

// queries/GetOrderHandler.ts
import { QueryHandler } from '@banyanai/platform-cqrs';

@QueryHandler(GetOrderQuery, {
  cache: {
    ttl: 60,  // Cache for 60 seconds
    key: (query) => `order:${query.orderId}`
  }
})
export class GetOrderHandler {
  constructor(private orderReadModel: OrderReadModel) {}

  async handle(query: GetOrderQuery) {
    // Read from optimized read model (not event-sourced aggregate)
    const order = await this.orderReadModel.findById(query.orderId);

    if (!order) {
      throw new OrderNotFoundError(query.orderId);
    }

    // Return complete data for display
    return {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt
    };
  }
}
```

**Key Points:**
- Commands modify state, return minimal data
- Queries read state, never modify, cacheable
- Different data models (aggregate vs read model)
- Clear separation in codebase

## Benefits and Trade-offs

### Benefits

- **Clear Intent**: Method name indicates side effects
- **Independent Optimization**: Optimize reads and writes separately
- **Caching**: Queries highly cacheable, commands never cached
- **Scalability**: Scale read and write databases independently
- **Testing**: Commands and queries tested separately
- **Code Organization**: Physical separation in folders

### Trade-offs

- **More Files**: Separate files for commands and queries
- **Potential Duplication**: Some validation logic might duplicate
- **Learning Curve**: Team must understand pattern
- **Eventual Consistency**: Read models may lag behind commands

### When to Use CQRS

Use CQRS when:
- Performance important (need to optimize reads and writes separately)
- Complex domain with many read patterns
- High read-to-write ratio
- Need to scale reads and writes independently

Avoid CQRS when:
- Simple CRUD with identical read/write needs
- Low traffic application
- Team unfamiliar with pattern

## Real-World Examples

### Example 1: Order Management

```typescript
// Command - Create order
const result = await cqrsMediator.send(new CreateOrderCommand(
  'user-123',
  [{ productId: 'prod-1', quantity: 2 }]
));
console.log(result.orderId);  // Minimal return: just ID

// Query - Get order details (cached)
const order = await cqrsMediator.query(new GetOrderQuery(result.orderId));
console.log(order);  // Complete data for display
// {
//   orderId: 'ord-456',
//   userId: 'user-123',
//   items: [...],
//   status: 'pending',
//   total: 99.99,
//   createdAt: '2025-01-15T10:00:00Z'
// }
```

### Example 2: Search with Complex Filtering

```typescript
// Query - Complex search (uses optimized read model)
@QueryHandler(SearchOrdersQuery, { cache: { ttl: 30 } })
export class SearchOrdersHandler {
  async handle(query: SearchOrdersQuery) {
    // Use denormalized read model with indexes
    return await this.orderSearchModel.search({
      userId: query.userId,
      status: query.status,
      dateRange: query.dateRange,
      minTotal: query.minTotal
    });
    // Read model optimized for this specific query
  }
}
```

## Related Concepts

- [Event Sourcing Pattern](event-sourcing-pattern.md) - Often combined with CQRS
- [Read Model Pattern](read-model-pattern.md) - Query optimization
- [Platform Overview](../architecture/platform-overview.md)

## Best Practices

1. **Commands Return Minimal Data**
   - Return IDs and success flags only
   - Don't return created entity (client should query if needed)

2. **Queries Never Modify State**
   - No side effects in query handlers
   - Safe to call multiple times

3. **Use Descriptive Names**
   - Commands: `CreateOrder`, `UpdateOrderStatus`, `CancelOrder`
   - Queries: `GetOrder`, `SearchOrders`, `GetOrderStats`

4. **Cache Queries Aggressively**
   - Set appropriate TTL based on data volatility
   - Invalidate cache on related commands

## Further Reading

### Internal Resources
- [CQRS Package](../../04-reference/platform-packages/cqrs.md)
- [Creating Commands and Queries](../../03-guides/cqrs/creating-commands-queries.md)

### External Resources
- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [CQRS Journey - Microsoft](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))

## Glossary

**Command**: Operation that modifies state.

**Query**: Operation that reads state without modification.

**CQRS Mediator**: Central dispatcher routing commands and queries to handlers.

**Read Model**: Denormalized view optimized for specific query patterns.
