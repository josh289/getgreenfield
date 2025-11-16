---
title: "Advanced Read Model Patterns"
description: "Master complex read model projections, denormalization strategies, and query optimization"
category: "tutorials"
tags: ["advanced", "read-models", "projections", "optimization", "hands-on"]
difficulty: "advanced"
estimated_time: "240 minutes"
prerequisites:
  - "Completed event sourcing tutorial"
  - "Understanding of database optimization"
learning_objectives:
  - "Create complex read model projections"
  - "Implement denormalization strategies"
  - "Optimize queries with indexing"
  - "Handle projection catchup"
  - "Build multi-aggregate read models"
last_updated: "2025-01-15"
status: "published"
---

# Advanced Read Model Patterns

> **What You'll Build:** Advanced read models with denormalization, custom projections, and query optimization.

## Overview

This tutorial covers advanced read model patterns including multi-aggregate projections, denormalization strategies, custom projection logic, and performance optimization techniques.

For detailed implementation guidance, refer to the platform examples and documentation:

- [Event-Sourced Service Example](../../06-examples/event-sourced-service/)
- [Read Models Concept](../../02-concepts/read-models.md)
- [Performance Guide](../../03-guides/performance-optimization.md)

## Key Topics Covered

1. **Multi-Aggregate Projections**: Combine events from multiple aggregates
2. **Denormalization**: Pre-compute joins for fast queries
3. **Custom Projection Logic**: Complex transformations
4. **Indexing Strategies**: Optimize query performance
5. **Catchup Processes**: Rebuild projections from events
6. **Versioning**: Handle schema changes

## Advanced Patterns

### Pattern 1: Customer Order History

Project orders and related data into customer read model:

```typescript
@ReadModel({ tableName: 'customer_summary' })
export class CustomerSummaryReadModel {
  @MapFromEvent('CustomerCreated')
  customerId!: string;

  // Denormalized from Order events
  totalOrders: number = 0;
  totalSpent: number = 0;
  lastOrderDate?: Date;
  favoriteProducts: string[] = [];
}
```

### Pattern 2: Product Analytics

Aggregate product data across orders:

```typescript
@ReadModel({ tableName: 'product_analytics' })
export class ProductAnalyticsReadModel {
  productId!: string;
  totalSold: number = 0;
  revenue: number = 0;
  averageRating: number = 0;
  topBuyingCustomers: string[] = [];
}
```

## Next Steps

- [Performance Optimization](./performance-optimization.md)
- [Saga Orchestration](./saga-orchestration.md)

## Additional Resources

- [Database Optimization](../../03-guides/database-optimization.md)
- [Query Patterns](../../03-guides/query-patterns.md)
