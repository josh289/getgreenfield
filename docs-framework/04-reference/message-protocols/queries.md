# Queries Reference

## Overview

Queries represent **read operations** that retrieve data without modifying system state. They follow request-response pattern and may use caching for performance.

## Query Characteristics

- **Intent**: Retrieve data (no state changes)
- **Pattern**: Request-response (synchronous)
- **Handlers**: Exactly one handler per query
- **Response**: Returns data or error
- **Routing**: Direct to service queue
- **Caching**: Often cached with TTL
- **Side Effects**: None (read-only)

## Query Message Structure

### Complete Example

```json
{
  "id": "msg_query_abc123",
  "correlationId": "cor_xyz789def",
  "traceContext": {
    "traceId": "0af7651916cd43dd8448eb211c80319c",
    "spanId": "b7ad6b7169203331",
    "traceFlags": "01"
  },
  "timestamp": "2025-11-15T10:30:00.123Z",
  "serviceName": "api-gateway",
  "messageType": "GetUserQuery",
  "payload": {
    "id": "usr_abc123"
  },
  "metadata": {
    "auth": {
      "userId": "usr_admin_123",
      "permissions": ["users:read"],
      "email": "admin@example.com",
      "name": "Admin User",
      "correlationId": "cor_xyz789def"
    },
    "routing": {
      "timeout": 5000,
      "priority": "normal"
    }
  }
}
```

## Query Naming Convention

### Pattern

```
{Verb}{Noun}Query

Examples:
- GetUserQuery
- ListOrdersQuery
- SearchProductsQuery
- FindCustomerQuery
```

### Best Practices

```typescript
// Good: Clear intent
GetUserQuery
ListOrdersQuery
SearchProductsQuery
CountActiveUsersQuery

// Avoid: Command-like names
FetchUserQuery       // "Fetch" implies action
RetrieveOrdersQuery  // "Retrieve" is redundant
FindUsersQuery       // Use Get/List/Search
```

## Queue Naming

### Format

```
service.{serviceName}.queries.{QueryName}
```

### Examples

```
service.user-service.queries.GetUser
service.order-service.queries.ListOrders
service.product-service.queries.SearchProducts
```

## Sending Queries

### Basic Query

```typescript
import { messageBus } from '@banyanai/platform-message-bus-client';
import { GetUserContract } from './contracts/UserContracts.js';

// Send query
const user = await messageBus.send(GetUserContract, {
  id: 'usr_abc123'
});

console.log('User:', user);
```

### List Query

```typescript
import { ListOrdersContract } from './contracts/OrderContracts.js';

// Query with pagination
const result = await messageBus.send(ListOrdersContract, {
  limit: 10,
  offset: 0,
  status: 'pending'
});

console.log('Orders:', result.orders);
console.log('Total:', result.total);
console.log('Has more:', result.hasMore);
```

### Search Query

```typescript
import { SearchProductsContract } from './contracts/ProductContracts.js';

// Search query
const products = await messageBus.send(SearchProductsContract, {
  query: 'laptop',
  category: 'electronics',
  minPrice: 500,
  maxPrice: 2000,
  limit: 20
});

console.log('Found:', products.length);
```

### With Caching

```typescript
// Query with cache hint
const user = await messageBus.send(
  GetUserContract,
  { id: 'usr_abc123' },
  {
    metadata: {
      cacheHint: {
        enabled: true,
        ttl: 300  // Cache for 5 minutes
      }
    }
  }
);
```

## Handling Queries

### Simple Get Handler

```typescript
import { QueryHandler } from '@banyanai/platform-cqrs';
import { GetUserContract } from '../contracts/UserContracts.js';

@QueryHandler(GetUserContract)
export class GetUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  async handle(input: { id: string }) {
    this.logger.debug('Getting user', { userId: input.id });

    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new NotFoundError(`User not found: ${input.id}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}
```

### List Handler with Pagination

```typescript
@QueryHandler(ListOrdersContract)
export class ListOrdersHandler {
  async handle(input: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const limit = input.limit || 10;
    const offset = input.offset || 0;

    // Query with pagination
    const [orders, total] = await Promise.all([
      this.orderRepository.findMany({
        where: input.status ? { status: input.status } : {},
        limit,
        offset,
        orderBy: { createdAt: 'desc' }
      }),
      this.orderRepository.count({
        where: input.status ? { status: input.status } : {}
      })
    ]);

    return {
      orders,
      total,
      hasMore: offset + orders.length < total
    };
  }
}
```

### Search Handler

```typescript
@QueryHandler(SearchProductsContract)
export class SearchProductsHandler {
  async handle(input: {
    query: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  }) {
    const products = await this.productRepository.search({
      query: input.query,
      filters: {
        category: input.category,
        price: {
          gte: input.minPrice,
          lte: input.maxPrice
        }
      },
      limit: input.limit || 20
    });

    return products;
  }
}
```

### With Caching

```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cache: CacheService
  ) {}

  async handle(input: { id: string }) {
    const cacheKey = `user:${input.id}`;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', { userId: input.id });
      return cached;
    }

    // Query database
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new NotFoundError(`User not found: ${input.id}`);
    }

    // Cache result
    await this.cache.set(cacheKey, user, 300); // 5 min TTL

    return user;
  }
}
```

## Query Response

### Single Item Response

```typescript
// GetUserQuery response
{
  "id": "usr_abc123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "role": "user",
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-15T10:30:00Z"
}
```

### List Response

```typescript
// ListOrdersQuery response
{
  "orders": [
    {
      "id": "ord_123",
      "userId": "usr_abc123",
      "total": 99.99,
      "status": "pending",
      "createdAt": "2025-11-15T09:00:00Z"
    },
    // ... more orders
  ],
  "total": 42,
  "hasMore": true
}
```

### Search Response

```typescript
// SearchProductsQuery response
{
  "products": [
    {
      "id": "prd_456",
      "name": "Gaming Laptop",
      "price": 1299.99,
      "category": "electronics",
      "inStock": true
    },
    // ... more products
  ],
  "count": 15
}
```

### Not Found Response

```typescript
// Query for non-existent resource
{
  "error": {
    "code": "NotFoundError",
    "message": "User not found: usr_nonexistent",
    "correlationId": "cor_xyz789def",
    "timestamp": "2025-11-15T10:30:00Z"
  }
}
```

## Common Query Patterns

### Get by ID

```typescript
// GetUserQuery
{
  "messageType": "GetUserQuery",
  "payload": {
    "id": "usr_abc123"
  }
}

// Response
{
  "id": "usr_abc123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "role": "user"
}
```

### List with Pagination

```typescript
// ListOrdersQuery
{
  "messageType": "ListOrdersQuery",
  "payload": {
    "limit": 10,
    "offset": 0,
    "status": "pending"
  }
}

// Response
{
  "orders": [...],
  "total": 42,
  "hasMore": true
}
```

### Search with Filters

```typescript
// SearchProductsQuery
{
  "messageType": "SearchProductsQuery",
  "payload": {
    "query": "laptop",
    "category": "electronics",
    "minPrice": 500,
    "maxPrice": 2000
  }
}

// Response
{
  "products": [...],
  "count": 15
}
```

### Count Query

```typescript
// CountActiveUsersQuery
{
  "messageType": "CountActiveUsersQuery",
  "payload": {
    "activeWithinDays": 30
  }
}

// Response
{
  "count": 1234
}
```

## Authorization

### Permission-Based

```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }, context: MessageContext) {
    const requestingUserId = context.userId;

    // Users can only view their own data (unless admin)
    if (input.id !== requestingUserId &&
        !context.permissions.includes('users:admin')) {
      throw new ForbiddenError('You can only view your own user data');
    }

    return await this.userRepository.findById(input.id);
  }
}
```

### Data Filtering

```typescript
@QueryHandler(ListOrdersContract)
export class ListOrdersHandler {
  async handle(input: any, context: MessageContext) {
    const where: any = {};

    // Non-admins can only see their own orders
    if (!context.permissions.includes('orders:admin')) {
      where.userId = context.userId;
    }

    // Apply additional filters
    if (input.status) {
      where.status = input.status;
    }

    const orders = await this.orderRepository.findMany({ where });
    return orders;
  }
}
```

## Caching Strategies

### Cache-Aside (Lazy Loading)

```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }) {
    const cacheKey = `user:${input.id}`;

    // 1. Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // 2. Query database
    const user = await this.userRepository.findById(input.id);
    if (!user) throw new NotFoundError('User not found');

    // 3. Store in cache
    await this.cache.set(cacheKey, user, 300);

    return user;
  }
}
```

### Read-Through

```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }) {
    return await this.cache.getOrLoad(
      `user:${input.id}`,
      async () => {
        const user = await this.userRepository.findById(input.id);
        if (!user) throw new NotFoundError('User not found');
        return user;
      },
      { ttl: 300 }
    );
  }
}
```

### Cache Invalidation

```typescript
// Invalidate on user update
@CommandHandler(UpdateUserContract)
export class UpdateUserHandler {
  async handle(input: { id: string; ... }) {
    const user = await this.userRepository.update(input);

    // Invalidate cache
    await this.cache.delete(`user:${input.id}`);

    return user;
  }
}
```

## Performance Optimization

### Database Indexing

```sql
-- Index frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Query Optimization

```typescript
@QueryHandler(ListOrdersContract)
export class ListOrdersHandler {
  async handle(input: any) {
    // Select only needed fields
    const orders = await this.orderRepository.findMany({
      select: {
        id: true,
        userId: true,
        total: true,
        status: true,
        createdAt: true
        // Don't select large fields like 'items' in list view
      },
      where: { status: input.status },
      limit: input.limit
    });

    return orders;
  }
}
```

### Pagination

```typescript
@QueryHandler(ListOrdersContract)
export class ListOrdersHandler {
  async handle(input: { limit?: number; offset?: number }) {
    // Limit max page size
    const limit = Math.min(input.limit || 10, 100);
    const offset = input.offset || 0;

    const orders = await this.orderRepository.findMany({
      limit,
      offset,
      orderBy: { createdAt: 'desc' }
    });

    return { orders, limit, offset };
  }
}
```

## Best Practices

### 1. Use Descriptive Names

```typescript
// Good
GetUserQuery
ListOrdersQuery
SearchProductsQuery

// Avoid
UserQuery
OrdersQuery
ProductQuery
```

### 2. Return Complete Data

```typescript
// Good: Return all useful fields
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt
};

// Avoid: Minimal data
return { id: user.id, name: user.name };
```

### 3. Implement Pagination

```typescript
// Good: Always paginate lists
{
  limit: 10,
  offset: 0
}

// Avoid: Returning all records
SELECT * FROM orders  // Could return millions!
```

### 4. Use Caching Appropriately

```typescript
// Cache frequently accessed, rarely changing data
await this.cache.set(`user:${id}`, user, 300);  // 5 min

// Don't cache rapidly changing data
// Don't cache: real-time stock prices, current user count
```

### 5. Handle Not Found

```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }) {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new NotFoundError(`User not found: ${input.id}`);
    }

    return user;
  }
}
```

## Related References

- [Commands Reference](./commands.md)
- [Events Reference](./events.md)
- [Routing Reference](./routing.md)
- [Message Protocols Overview](./overview.md)
