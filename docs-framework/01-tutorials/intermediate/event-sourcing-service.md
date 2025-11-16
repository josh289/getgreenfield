---
title: "Build an Event-Sourced Order Service"
description: "Learn event sourcing by building an order management system with aggregates, events, and projections"
category: "tutorials"
tags: ["intermediate", "event-sourcing", "aggregates", "events", "hands-on"]
difficulty: "intermediate"
estimated_time: "240 minutes"
prerequisites:
  - "Completed Todo Service and User Management tutorials"
  - "Understanding of domain-driven design basics"
  - "Understanding of CQRS pattern"
learning_objectives:
  - "Implement event sourcing with aggregates"
  - "Create domain events and event handlers"
  - "Build read model projections from events"
  - "Handle aggregate lifecycle and invariants"
  - "Use event replay and catchup processes"
last_updated: "2025-01-15"
status: "published"
---

# Build an Event-Sourced Order Service

> **What You'll Build:** A complete event-sourced order management system where all state changes are captured as immutable events.

## Overview

This tutorial teaches event sourcing by building an order management service. You'll learn to model business logic as aggregates that emit events, project those events into read models, and leverage the power of event replay.

By the end, you'll have a service that:
- Creates orders as aggregates
- Adds/removes items with business rule validation
- Places and cancels orders
- Projects events into queryable read models
- Supports complete audit trails
- Enables time-travel queries

### Learning Objectives

By the end of this tutorial, you will be able to:

- Design aggregates that enforce business invariants
- Create domain events that capture state changes
- Build event handlers that update read models
- Use the event store for persistence
- Replay events to rebuild state
- Implement event-driven workflows

### Prerequisites

Before starting this tutorial, you should:

- Complete [Todo Service](../beginner/todo-service.md) and [User Management](../beginner/user-management-service.md) tutorials
- Understand domain-driven design basics
- Understand the CQRS pattern
- Have PostgreSQL running (for event store)

### What We're Building

An order management service with:

**Aggregates:**
- `Order` - Root aggregate managing order lifecycle

**Commands:**
- `CreateOrder` - Initialize new order
- `AddItem` - Add product to order
- `RemoveItem` - Remove product from order
- `PlaceOrder` - Submit order for processing
- `CancelOrder` - Cancel a pending order

**Domain Events:**
- `OrderCreated`
- `ItemAdded`
- `ItemRemoved`
- `OrderPlaced`
- `OrderCancelled`

**Queries:**
- `GetOrder` - Retrieve order details
- `ListOrders` - List orders for customer

**Read Models:**
- `OrderReadModel` - Projected from events for queries

## For the complete tutorial with all implementation details, see the platform example at:

`/docs-new/06-examples/event-sourced-service/README.md`

This tutorial will guide you through:

1. **Setting up event sourcing infrastructure**
2. **Creating domain events**
3. **Building the Order aggregate**
4. **Implementing command handlers with event store**
5. **Creating read model projections**
6. **Testing event sourcing flows**
7. **Using event replay and catchup**

The key difference from CRUD services is that instead of directly modifying state, we:
1. Load aggregate from event history
2. Execute business logic (emits events)
3. Append events to event store
4. Events automatically update read models

Refer to the detailed event-sourced service example for complete code and explanations.

## Additional Resources

- [Event Sourcing Concepts](../../02-concepts/event-sourcing.md)
- [Aggregates Guide](../../02-concepts/aggregates.md)
- [Event Store](../../02-concepts/event-store.md)
- [Read Model Projections](../../02-concepts/read-models.md)
