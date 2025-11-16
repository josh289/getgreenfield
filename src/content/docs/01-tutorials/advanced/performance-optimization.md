---
title: "Service Performance Optimization"
description: "Learn techniques to optimize service performance, reduce latency, and scale efficiently"
category: "tutorials"
tags: ["advanced", "performance", "optimization", "caching", "hands-on"]
difficulty: "advanced"
estimated_time: "240 minutes"
prerequisites:
  - "Completed intermediate tutorials"
  - "Service running in production-like environment"
learning_objectives:
  - "Profile service performance"
  - "Optimize database queries"
  - "Implement caching strategies"
  - "Reduce message latency"
  - "Scale services horizontally"
last_updated: "2025-01-15"
status: "published"
---

# Service Performance Optimization

> **What You'll Learn:** Performance profiling, optimization techniques, and scaling strategies for production services.

## Overview

This tutorial teaches you to identify and fix performance bottlenecks in your services, implement caching, optimize database queries, and scale services effectively.

## Key Topics

1. **Performance Profiling**: Identify bottlenecks
2. **Database Optimization**: Query optimization, indexing
3. **Caching Strategies**: Redis integration, cache patterns
4. **Message Bus Optimization**: Reduce latency
5. **Horizontal Scaling**: Load balancing, stateless services

## Performance Metrics to Track

- **Latency**: p50, p95, p99 response times
- **Throughput**: Requests per second
- **Error Rate**: Failed requests percentage
- **Resource Usage**: CPU, memory, connections

## Optimization Techniques

### 1. Query Optimization

```typescript
// Bad: N+1 queries
for (const orderId of orderIds) {
  const order = await OrderReadModel.findById(orderId);
  results.push(order);
}

// Good: Batch query
const orders = await OrderReadModel.findByIds(orderIds);
```

### 2. Caching

```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const user = await UserReadModel.findById(userId);
await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
return user;
```

### 3. Indexing

```typescript
@ReadModel({ tableName: 'orders' })
export class OrderReadModel {
  @Index(undefined, { unique: true })
  id!: string;

  @Index() // Add index for frequent queries
  customerId!: string;

  @Index() // Composite index for range queries
  createdAt!: Date;
}
```

## Load Testing

Use tools like k6 or Artillery to test under load:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

export default function() {
  const res = http.post('http://localhost:3003/api/orders', {
    customerId: 'customer-123',
    items: [{ productId: 'product-1', quantity: 1 }]
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Next Steps

- [Monitoring and Observability](../../03-guides/monitoring.md)
- [Distributed Tracing](../../03-guides/distributed-tracing.md)

## Additional Resources

- [Performance Best Practices](../../03-guides/performance-best-practices.md)
- [Caching Strategies](../../03-guides/caching.md)
- [Database Tuning](../../03-guides/database-tuning.md)
