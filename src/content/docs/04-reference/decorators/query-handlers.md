---
title: Query Handler Decorators
description: Complete reference for query handler decorators and patterns
category: decorators
tags: [decorators, queries, handlers, cqrs, caching, typescript]
related:
  - ./command-handlers.md
  - ./event-handlers.md
  - ./contracts.md
  - ../platform-packages/cqrs.md
difficulty: intermediate
aliases:
  - "@QueryHandler"
  - query handler decorator
  - query handler syntax
  - query handler reference
relatedConcepts:
  - CQRS pattern
  - query processing
  - handler registration
  - read operations
  - caching strategies
commonQuestions:
  - What parameters does @QueryHandler take?
  - How do I create a query handler?
  - How do I cache query results?
  - Do query handlers need to be exported?
  - Can query handlers modify state?
---

# Query Handler Decorators

Complete reference for decorators used in query handlers. Queries represent read-only operations that don't modify system state.

## @QueryHandler

Registers a class as a handler for a specific query type.

### Signature

```typescript
function QueryHandler(queryType: any): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queryType` | `class \| string` | Yes | The query class or type name this handler processes |

### Usage

```typescript
import { QueryHandler } from '@banyanai/platform-base-service';
import { GetUserQuery } from './queries/GetUserQuery';

@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // Query handling logic
    return { userId: query.userId, email: 'user@example.com' };
  }
}
```

### With String Type Name

```typescript
@QueryHandler('GetUserQuery')
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // Handler implementation
  }
}
```

### Handler Discovery

The platform automatically discovers query handlers by:

1. **Folder Convention**: Handlers in `/queries/` directory
2. **Decorator Metadata**: Classes with `@QueryHandler` decorator
3. **Naming Pattern**: Classes ending with `Handler` (optional)

### Handler Interface

Query handlers must implement the following interface:

```typescript
interface IQueryHandler<TQuery, TResult> {
  handle(query: TQuery, context: QueryContext): Promise<TResult>;
}
```

### Query Context

The context parameter provides access to:

```typescript
interface QueryContext {
  userId: string;
  permissions: string[];
  correlationId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
```

## @RequiresPermissions

Declares permissions required to execute the query handler (Layer 1 authorization).

### Signature

```typescript
function RequiresPermissions(permissions: string | string[]): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissions` | `string \| string[]` | Yes | Permission(s) required to execute handler |

### Usage

#### Single Permission

```typescript
import { QueryHandler, RequiresPermissions } from '@banyanai/platform-base-service';

@QueryHandler(GetUserQuery)
@RequiresPermissions('users:read')
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // User has 'users:read' permission
  }
}
```

#### Multiple Permissions (OR Logic)

```typescript
@QueryHandler(GetSensitiveDataQuery)
@RequiresPermissions(['admin:all', 'security:read'])
export class GetSensitiveDataHandler {
  async handle(query: GetSensitiveDataQuery, context: QueryContext): Promise<SensitiveDto> {
    // User has EITHER 'admin:all' OR 'security:read' permission
  }
}
```

## @RequirePolicy

Declares business policy that must be satisfied (Layer 2 authorization).

### Signature

```typescript
function RequirePolicy(policyName: string): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `policyName` | `string` | Yes | Name of the policy class or method |

### Usage

#### With Policy Class

```typescript
// Policy class (co-located with handler)
export class ViewOwnProfilePolicy {
  static canExecute(user: AuthenticatedUser, query: GetUserQuery): boolean {
    // Users can only view their own profile (unless admin)
    return user.permissions.includes('admin:all') || user.userId === query.userId;
  }
}

// Handler with policy
@QueryHandler(GetUserQuery)
@RequiresPermissions('users:read')
@RequirePolicy('ViewOwnProfilePolicy')
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // Policy already validated - safe to proceed
  }
}
```

## @Cacheable

Enables caching for query results (queries are read-only, perfect for caching).

### Signature

```typescript
function Cacheable(options?: CacheOptions): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `CacheOptions` | No | Cache configuration options |

### CacheOptions

```typescript
interface CacheOptions {
  ttl?: number;              // Time-to-live in seconds (default: 300)
  keyGenerator?: (query: any) => string;  // Custom cache key generator
  invalidateOn?: string[];   // Event names that invalidate this cache
}
```

### Usage

#### Basic Caching

```typescript
import { QueryHandler, Cacheable } from '@banyanai/platform-base-service';

@QueryHandler(GetUserQuery)
@Cacheable()  // Default 5-minute TTL
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // Expensive database query - will be cached
  }
}
```

#### Custom TTL

```typescript
@QueryHandler(GetProductCatalogQuery)
@Cacheable({ ttl: 3600 })  // Cache for 1 hour
export class GetProductCatalogHandler {
  async handle(query: GetProductCatalogQuery, context: QueryContext): Promise<ProductDto[]> {
    // Results cached for 1 hour
  }
}
```

#### Custom Cache Key

```typescript
@QueryHandler(SearchProductsQuery)
@Cacheable({
  ttl: 600,  // 10 minutes
  keyGenerator: (query: SearchProductsQuery) => {
    return `products:${query.category}:${query.page}:${query.pageSize}`;
  }
})
export class SearchProductsHandler {
  async handle(query: SearchProductsQuery, context: QueryContext): Promise<ProductDto[]> {
    // Custom cache key for better organization
  }
}
```

#### Cache Invalidation

```typescript
@QueryHandler(GetUserQuery)
@Cacheable({
  ttl: 300,
  invalidateOn: ['UserUpdated', 'UserDeleted']  // Clear cache when these events occur
})
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // Cache automatically invalidated when user is updated or deleted
  }
}
```

## Complete Example

### Query Definition

```typescript
import { Query } from '@banyanai/platform-contract-system';

@Query({
  description: 'Get user by ID',
  permissions: ['users:read']
})
export class GetUserQuery {
  userId!: string;
}
```

### Handler Implementation

```typescript
import {
  QueryHandler,
  RequiresPermissions,
  RequirePolicy,
  Cacheable,
} from '@banyanai/platform-base-service';

// Policy: Users can only view their own profile
export class ViewOwnProfilePolicy {
  static canExecute(user: AuthenticatedUser, query: GetUserQuery): boolean {
    if (user.permissions.includes('admin:all')) {
      return true;  // Admins can view any profile
    }
    return user.userId === query.userId;  // Users can view own profile
  }
}

@QueryHandler(GetUserQuery)
@RequiresPermissions('users:read')
@RequirePolicy('ViewOwnProfilePolicy')
@Cacheable({
  ttl: 300,
  invalidateOn: ['UserUpdated', 'UserDeleted']
})
export class GetUserHandler {
  constructor(
    private userRepository: UserRepository
  ) {}

  async handle(
    query: GetUserQuery,
    context: QueryContext
  ): Promise<UserDto> {
    // Fetch user from repository
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new NotFoundError(`User ${query.userId} not found`);
    }

    // Return DTO (not domain entity)
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

## Common Patterns

### List/Search Query

```typescript
@QueryHandler(SearchUsersQuery)
@RequiresPermissions('users:read')
@Cacheable({
  ttl: 60,  // Short TTL for search results
  keyGenerator: (query: SearchUsersQuery) => {
    return `users:search:${query.email}:${query.role}:${query.page}`;
  }
})
export class SearchUsersHandler {
  constructor(private userRepository: UserRepository) {}

  async handle(query: SearchUsersQuery, context: QueryContext): Promise<PaginatedDto<UserDto>> {
    const { results, total } = await this.userRepository.search({
      email: query.email,
      role: query.role,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    });

    return {
      items: results.map(user => this.toDto(user)),
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      totalPages: Math.ceil(total / (query.pageSize || 20)),
    };
  }

  private toDto(user: User): UserDto {
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
```

### Aggregation Query

```typescript
@QueryHandler(GetUserStatisticsQuery)
@RequiresPermissions('reports:read')
@Cacheable({ ttl: 3600 })  // Cache for 1 hour
export class GetUserStatisticsHandler {
  constructor(private userRepository: UserRepository) {}

  async handle(
    query: GetUserStatisticsQuery,
    context: QueryContext
  ): Promise<UserStatisticsDto> {
    // Expensive aggregation query
    const stats = await this.userRepository.getStatistics();

    return {
      totalUsers: stats.total,
      activeUsers: stats.active,
      inactiveUsers: stats.inactive,
      usersByRole: stats.byRole,
      registrationsThisMonth: stats.recentRegistrations,
    };
  }
}
```

### No Authorization Required

```typescript
@QueryHandler(GetPublicProductsQuery)
export class GetPublicProductsHandler {
  // No @RequiresPermissions - public endpoint
  async handle(
    query: GetPublicProductsQuery,
    context: QueryContext
  ): Promise<ProductDto[]> {
    // Public catalog query
  }
}
```

### Admin-Only Query

```typescript
@QueryHandler(GetSystemLogsQuery)
@RequiresPermissions('admin:all')
export class GetSystemLogsHandler {
  async handle(query: GetSystemLogsQuery, context: QueryContext): Promise<LogDto[]> {
    // Only admins can access system logs
  }
}
```

### Query with Dependencies

```typescript
@QueryHandler(GetUserDashboardQuery)
@RequiresPermissions('dashboard:read')
@Cacheable({ ttl: 60 })
export class GetUserDashboardHandler {
  constructor(
    private userRepository: UserRepository,
    private orderRepository: OrderRepository,
    private analyticsService: AnalyticsService
  ) {}

  async handle(
    query: GetUserDashboardQuery,
    context: QueryContext
  ): Promise<DashboardDto> {
    // Dependencies auto-injected by platform
    const user = await this.userRepository.findById(query.userId);
    const orders = await this.orderRepository.findByUserId(query.userId);
    const analytics = await this.analyticsService.getUserAnalytics(query.userId);

    return {
      user: this.mapUserToDto(user),
      recentOrders: orders.slice(0, 5).map(this.mapOrderToDto),
      analytics,
    };
  }
}
```

## Testing

### Unit Testing Handlers

```typescript
describe('GetUserHandler', () => {
  let handler: GetUserHandler;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
    } as any;

    handler = new GetUserHandler(userRepository);
  });

  it('should return user DTO successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepository.findById.mockResolvedValue(mockUser);

    const query: GetUserQuery = {
      userId: 'user-123',
    };

    const context: QueryContext = {
      userId: 'user-123',
      permissions: ['users:read'],
      correlationId: 'test-correlation-id',
      timestamp: new Date(),
      metadata: {},
    };

    const result = await handler.handle(query, context);

    expect(result.userId).toBe('user-123');
    expect(result.email).toBe('test@example.com');
    expect(userRepository.findById).toHaveBeenCalledWith('user-123');
  });

  it('should throw NotFoundError when user not found', async () => {
    userRepository.findById.mockResolvedValue(null);

    const query: GetUserQuery = {
      userId: 'non-existent',
    };

    await expect(handler.handle(query, context)).rejects.toThrow(NotFoundError);
  });
});
```

### Testing Policies

```typescript
describe('ViewOwnProfilePolicy', () => {
  it('should allow admin to view any profile', () => {
    const user: AuthenticatedUser = {
      userId: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      permissions: ['admin:all'],
    };

    const query: GetUserQuery = {
      userId: 'other-user-456',
    };

    expect(ViewOwnProfilePolicy.canExecute(user, query)).toBe(true);
  });

  it('should allow user to view own profile', () => {
    const user: AuthenticatedUser = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      permissions: ['users:read'],
    };

    const query: GetUserQuery = {
      userId: 'user-123',
    };

    expect(ViewOwnProfilePolicy.canExecute(user, query)).toBe(true);
  });

  it('should reject user viewing other profiles', () => {
    const user: AuthenticatedUser = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      permissions: ['users:read'],
    };

    const query: GetUserQuery = {
      userId: 'other-user-456',
    };

    expect(ViewOwnProfilePolicy.canExecute(user, query)).toBe(false);
  });
});
```

### Testing Caching

```typescript
describe('GetUserHandler caching', () => {
  it('should cache query results', async () => {
    // Implementation depends on caching mechanism
    // This is an integration test
  });

  it('should invalidate cache on UserUpdated event', async () => {
    // Test cache invalidation
  });
});
```

## Best Practices

### DO:

- ✅ Use descriptive handler names (`GetUserHandler`, not `UserQueryHandler`)
- ✅ Place handlers in `/queries/` directory for auto-discovery
- ✅ Declare required permissions with `@RequiresPermissions`
- ✅ Use policies for business rule authorization
- ✅ Return DTOs, not domain entities
- ✅ Cache query results when appropriate
- ✅ Use pagination for list queries
- ✅ Validate query parameters
- ✅ Handle not-found cases gracefully

### DON'T:

- ❌ Don't modify state in query handlers (queries are read-only)
- ❌ Don't put HTTP-specific code in handlers
- ❌ Don't handle multiple query types in one handler
- ❌ Don't return domain aggregates directly
- ❌ Don't skip permission/policy decorators for protected queries
- ❌ Don't cache user-specific data with long TTL
- ❌ Don't perform commands in query handlers
- ❌ Don't forget to handle pagination for large result sets

## Caching Strategies

### Short TTL for Dynamic Data

```typescript
@Cacheable({ ttl: 60 })  // 1 minute
```

Use for frequently changing data like user status, active sessions, etc.

### Medium TTL for Semi-Static Data

```typescript
@Cacheable({ ttl: 300 })  // 5 minutes
```

Use for data that changes occasionally like user profiles, settings, etc.

### Long TTL for Static Data

```typescript
@Cacheable({ ttl: 3600 })  // 1 hour
```

Use for rarely changing data like product catalogs, reference data, etc.

### No Caching

```typescript
// No @Cacheable decorator
```

Use for:
- Real-time data
- User-specific sensitive data
- Data with complex invalidation logic

## Next Steps

- **[Command Handler Decorators](./command-handlers.md)** - State-changing operations
- **[Event Handler Decorators](./event-handlers.md)** - Event subscription handlers
- **[Contract Decorators](./contracts.md)** - Query contract definitions
- **[CQRS Package](../platform-packages/cqrs.md)** - CQRS infrastructure
