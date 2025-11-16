---
title: "Caching Infrastructure"
description: "Redis-based caching for query results, contracts, and session data"
category: "concepts"
tags: ["infrastructure", "redis", "caching"]
difficulty: "beginner"
related_concepts:
  - "../patterns/cqrs-pattern.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Caching Infrastructure

> **Core Idea:** Redis provides fast in-memory caching for query results, service contracts, and session data with automatic TTL management.

## Overview

The platform uses Redis 7 for caching:
- Query results (CQRS queries)
- Service contracts (service discovery)
- Session data (API Gateway)
- Read model materialization

## Configuration

### Development

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --requirepass redis123
  ports:
    - "56379:6379"
  volumes:
    - redis-data:/data
```

### Connection

```bash
REDIS_URL=redis://:redis123@redis:6379
```

## Usage Patterns

### Query Caching

```typescript
@QueryHandler(GetUserQuery, {
  cache: {
    ttl: 60,  // Cache for 60 seconds
    key: (query) => `user:${query.userId}`
  }
})
export class GetUserHandler {
  async handle(query: GetUserQuery) {
    // Result automatically cached
    return await this.userRepo.findById(query.userId);
  }
}
```

### Contract Caching

```typescript
// Service discovery caches contracts
await redis.set(
  `contracts:${serviceName}:${version}`,
  JSON.stringify(contracts),
  'EX',
  3600  // 1 hour TTL
);
```

## Best Practices

1. **Set Appropriate TTLs**
   - Frequently changing data: 10-60 seconds
   - Stable data: 5-60 minutes
   - Configuration: Hours to days

2. **Use Cache Keys Wisely**
   - Include relevant query parameters
   - Use namespacing: `user:123`, not just `123`

3. **Monitor Hit Rate**
   - Target >80% hit rate for cached queries
   - Low hit rate indicates wrong TTL or cache keys

## Monitoring

```bash
# Redis stats
redis-cli -a redis123 INFO stats

# Key space
redis-cli -a redis123 DBSIZE

# Memory usage
redis-cli -a redis123 INFO memory
```

## Further Reading

- [CQRS Pattern](../patterns/cqrs-pattern.md)
- [Redis Documentation](https://redis.io/documentation)
