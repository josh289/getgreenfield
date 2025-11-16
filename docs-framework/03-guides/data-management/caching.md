# Caching Strategies

## Use this guide if...

- You need to improve query performance with caching
- You want to understand cache invalidation strategies
- You're implementing stale-while-revalidate patterns
- You need to cache expensive computations or external API calls

## Quick Example

```typescript
import { Cacheable, QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';

@Cacheable({
  ttl: 300,  // Cache for 5 minutes
  key: (query: GetUserQuery) => `user_${query.userId}`,
  tags: ['users'],
  staleWhileRevalidate: true
})
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    // Results automatically cached - no infrastructure code needed!
    
    const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);

    if (!userReadModel) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      user: this.mapReadModelToDto(userReadModel)
    };
  }
}
```

**First call:** Executes query, stores in cache
**Subsequent calls (within TTL):** Returns cached result instantly
**After TTL:** Re-executes query, updates cache

## @Cacheable Decorator

### Basic Configuration

```typescript
@Cacheable({
  ttl: 300,  // Time to live in seconds
  key: (query) => `cache_key_${query.id}`,  // Cache key generator
  tags: ['users'],  // Cache tags for invalidation
  staleWhileRevalidate: true  // Return stale while updating
})
```

### Cache Key Strategies

#### Pattern 1: Simple ID-Based

```typescript
@Cacheable({
  ttl: 300,
  key: (query: GetUserQuery) => `user_${query.userId}`
})
```

#### Pattern 2: Compound Keys

```typescript
@Cacheable({
  ttl: 300,
  key: (query: SearchUsersQuery) => 
    `users_search_${query.searchTerm}_${query.filter?.isActive}_page${query.page}`
})
```

#### Pattern 3: User-Specific Caching

```typescript
@Cacheable({
  ttl: 300,
  key: (query: GetUserOrdersQuery, user: AuthenticatedUser) =>
    `orders_user${user.userId}_customer${query.customerId}`
})
```

## Cache Invalidation

### Tag-Based Invalidation

```typescript
// Cache with tags
@Cacheable({
  ttl: 300,
  key: (query: GetUserQuery) => `user_${query.userId}`,
  tags: ['users', `user:${query.userId}`]
})

// Invalidate all user caches
await cacheManager.invalidateTags(['users']);

// Invalidate specific user
await cacheManager.invalidateTags([`user:${userId}`]);
```

### Event-Driven Invalidation

```typescript
// Automatically invalidate cache when events occur
@EventHandlerDecorator(UserUpdatedEvent)
export class InvalidateUserCacheHandler extends EventHandler<UserUpdatedEvent, void> {
  async handle(event: UserUpdatedEvent): Promise<void> {
    await cacheManager.invalidateTags([
      'users',
      `user:${event.userId}`
    ]);
  }
}
```

## Caching Patterns

### Pattern 1: Read-Through Cache

Cache automatically populated on miss.

```typescript
@Cacheable({ ttl: 300, key: (q) => `user_${q.userId}` })
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    // Cache miss → execute query → store result → return
    // Cache hit → return cached result
    
    const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);
    return { success: true, user: this.mapReadModelToDto(userReadModel) };
  }
}
```

### Pattern 2: Write-Through Cache

Update cache on writes.

```typescript
@CommandHandlerDecorator(UpdateUserCommand)
export class UpdateUserHandler extends CommandHandler<UpdateUserCommand, UpdateUserResult> {
  async handle(command: UpdateUserCommand, user: AuthenticatedUser | null): Promise<UpdateUserResult> {
    // Update aggregate
    const events = await eventStore.getEvents(command.userId);
    const userAggregate = User.fromEvents(events);
    userAggregate.updateProfile(command.profile);
    await eventStore.append(userAggregate.id, userAggregate.getUncommittedEvents());

    // Invalidate cache
    await cacheManager.invalidate(`user_${command.userId}`);

    return { success: true };
  }
}
```

### Pattern 3: Cache-Aside (Lazy Loading)

Check cache, load on miss.

```typescript
async getUser(userId: string): Promise<UserDto | null> {
  // Check cache
  const cached = await cacheManager.get<UserDto>(`user_${userId}`);
  if (cached) {
    return cached;
  }

  // Load from read model
  const userReadModel = await UserReadModel.findById<UserReadModel>(userId);
  if (!userReadModel) {
    return null;
  }

  const userDto = this.mapReadModelToDto(userReadModel);

  // Store in cache
  await cacheManager.set(`user_${userId}`, userDto, 300);

  return userDto;
}
```

### Pattern 4: Stale-While-Revalidate

Return stale data while updating in background.

```typescript
@Cacheable({
  ttl: 300,
  key: (q) => `user_${q.userId}`,
  staleWhileRevalidate: true  // Key setting
})
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    // If cache expired but has stale data:
    // 1. Return stale data immediately
    // 2. Refresh in background
    // 3. Update cache for next request
    
    const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);
    return { success: true, user: this.mapReadModelToDto(userReadModel) };
  }
}
```

## TTL Strategies

### Short TTL (30-60 seconds)

For frequently changing data:

```typescript
@Cacheable({
  ttl: 60,  // 1 minute
  key: (q) => `inventory_${q.productId}`
})
// Inventory levels change often
```

### Medium TTL (5-15 minutes)

For moderately stable data:

```typescript
@Cacheable({
  ttl: 300,  // 5 minutes
  key: (q) => `user_${q.userId}`
})
// User profiles change occasionally
```

### Long TTL (1+ hours)

For rarely changing data:

```typescript
@Cacheable({
  ttl: 3600,  // 1 hour
  key: (q) => `product_${q.productId}`
})
// Product catalog changes rarely
```

### Infinite TTL with Invalidation

For data that only changes on specific events:

```typescript
@Cacheable({
  ttl: 86400,  // 24 hours (effectively infinite)
  key: (q) => `config_${q.key}`,
  tags: ['config']
})
// Configuration - invalidate on ConfigUpdated event
```

## Cache Warming

Pre-populate cache for better performance.

```typescript
// Warm cache on service startup
export class CacheWarmupService {
  async warmCache(): Promise<void> {
    // Load common data into cache
    const popularProducts = await ProductReadModel.findPopular();
    
    for (const product of popularProducts) {
      await cacheManager.set(
        `product_${product.id}`,
        product,
        3600
      );
    }

    Logger.info('Cache warmed', { products: popularProducts.length });
  }
}
```

## Multi-Level Caching

### Level 1: In-Memory (fastest)

```typescript
// Process memory cache
const inMemoryCache = new Map<string, any>();
```

### Level 2: Redis (fast, shared)

```typescript
// Redis cache (shared across instances)
await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
```

### Level 3: Read Model (medium, persistent)

```typescript
// PostgreSQL read model (persistent)
const user = await UserReadModel.findById(userId);
```

## Testing with Caching

### Mock Cache for Tests

```typescript
describe('GetUserHandler with caching', () => {
  let handler: GetUserHandler;
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined)
    } as any;

    handler = new GetUserHandler();
  });

  it('should cache query results', async () => {
    const query = new GetUserQuery('user-123');
    
    // First call - cache miss
    await handler.handle(query, null);
    expect(mockCache.set).toHaveBeenCalledWith(
      'user_user-123',
      expect.any(Object),
      300
    );

    // Second call - cache hit
    mockCache.get.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
    const result = await handler.handle(query, null);
    
    expect(result.success).toBe(true);
    expect(mockCache.get).toHaveBeenCalledWith('user_user-123');
  });
});
```

## Anti-Patterns

❌ **Don't cache everything**
```typescript
// DON'T DO THIS
@Cacheable({ ttl: 300, key: () => 'all_users' })
// This caches ALL users - huge memory waste!
```

✅ **Cache specific queries**
```typescript
// DO THIS
@Cacheable({ ttl: 300, key: (q) => `user_${q.userId}` })
// Only cache specific user lookups
```

---

❌ **Don't use stale data for critical operations**
```typescript
// DON'T DO THIS
@Cacheable({ ttl: 3600, staleWhileRevalidate: true })
// For payment processing - always need fresh data!
```

✅ **No caching for critical operations**
```typescript
// DO THIS - No caching
async processPayment(command: ProcessPaymentCommand): Promise<PaymentResult> {
  // Always use fresh data for payments
}
```

---

❌ **Don't forget invalidation**
```typescript
// DON'T DO THIS
// Update user without invalidating cache
await userRepository.update(userId, { email: newEmail });
// Cache still has old email!
```

✅ **Invalidate on updates**
```typescript
// DO THIS
await userRepository.update(userId, { email: newEmail });
await cacheManager.invalidate(`user_${userId}`);
```

## Performance Metrics

### Cache Hit Rate

Monitor cache effectiveness:

```typescript
const hitRate = cacheHits / (cacheHits + cacheMisses) * 100;
// Target: 80%+ hit rate for effective caching
```

### Response Time

Compare cached vs uncached:

```typescript
// Uncached: 50-100ms
// Cached: 1-5ms
// Improvement: 10-100x faster
```

## Related Guides

- [Query Handlers](../service-development/query-handlers.md)
- [Read Models](./read-models.md)
- [Event Handlers](../service-development/event-handlers.md)
