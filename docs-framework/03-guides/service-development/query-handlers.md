# Writing Query Handlers

## Use this guide if...

- You need to implement read operations (retrieve, search, list)
- You're building queries that don't change system state
- You want to understand query optimization and caching
- You need to return data from read models

## Quick Example

```typescript
// src/queries/GetUserHandler.ts
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { GetUserQuery, type GetUserResult, type UserDto } from '../contracts/queries/GetUserQuery.js';
import { UserReadModel } from '../read-models/UserReadModel.js';

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  private readonly logger = Logger;

  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    try {
      this.logger.info('Retrieving user information', {
        requestedUserId: query.userId,
        requestingUser: user?.userId
      });

      // Validate input
      if (!query.userId || typeof query.userId !== 'string') {
        return {
          success: false,
          error: 'User ID is required and must be a valid string'
        };
      }

      // Query read model
      const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);

      if (!userReadModel || !userReadModel.isActive) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Map to DTO
      const userDto = this.mapReadModelToDto(userReadModel);

      return {
        success: true,
        user: userDto
      };
    } catch (error) {
      this.logger.error('Failed to retrieve user information:', error as Error);
      return {
        success: false,
        error: 'Failed to retrieve user information due to server error'
      };
    }
  }

  private mapReadModelToDto(readModel: UserReadModel): UserDto {
    return {
      id: readModel.id,
      email: readModel.email,
      profile: readModel.profile,
      isActive: readModel.isActive,
      emailVerified: readModel.emailVerified,
      lastLogin: readModel.lastLogin,
      createdAt: readModel.createdAt,
      updatedAt: readModel.updatedAt,
      createdBy: readModel.createdBy
    };
  }
}
```

## Step-by-Step Guide

### Step 1: Define the Query Contract

Queries represent read operations with clear parameters and results.

```typescript
// src/contracts/queries/GetUserQuery.ts
import { Query } from '@banyanai/platform-contract-system';

export interface UserDto {
  id: string;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    timezone?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
  };
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

@Query({
  description: 'Retrieves a user by ID with their profile information',
  permissions: ['auth:view-users']
})
export class GetUserQuery {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}

export interface GetUserResult {
  success: boolean;
  user?: UserDto;
  error?: string;
}
```

**Key points:**
- Use `@Query()` decorator with permissions
- Define clear DTO (Data Transfer Object)
- Keep queries simple and focused
- Don't expose internal state

### Step 2: Create the Read Model

Read models are optimized projections of your event-sourced data.

```typescript
// src/read-models/UserReadModel.ts
import { Index, MapFromEvent, ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'rm_users', aggregateType: 'User' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  id!: string;

  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  email!: string;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  @MapFromEvent('UserProfileUpdated')
  profile!: Record<string, unknown>;

  @Index()
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  isActive!: boolean;

  @Index()
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  emailVerified!: boolean;

  lastLogin?: Date;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  createdAt!: Date;

  updatedAt!: Date;

  createdBy?: string;

  getId(): string {
    return this.id;
  }

  // Static query methods
  static async findByEmail(email: string): Promise<UserReadModel | null> {
    const results = await UserReadModel.findBy<UserReadModel>({ email });
    return results.length > 0 ? results[0] : null;
  }
}
```

**See:** [Data Management - Read Models](../data-management/read-models.md) for complete guide

### Step 3: Implement the Query Handler

```typescript
// src/queries/GetUserHandler.ts
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  private readonly logger = Logger;

  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    try {
      // Log query execution
      this.logger.info('Retrieving user information', {
        requestedUserId: query.userId,
        requestingUser: user?.userId
      });

      // Validate input
      if (!query.userId || typeof query.userId !== 'string') {
        return {
          success: false,
          error: 'User ID is required and must be a valid string'
        };
      }

      // Query read model using static method
      const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);

      if (!userReadModel || !userReadModel.isActive) {
        this.logger.warn('User not found or inactive', {
          requestedUserId: query.userId
        });

        return {
          success: false,
          error: 'User not found'
        };
      }

      // Map read model to DTO (hide internal details)
      const userDto = this.mapReadModelToDto(userReadModel);

      this.logger.info('User information retrieved successfully', {
        requestedUserId: query.userId
      });

      return {
        success: true,
        user: userDto
      };
    } catch (error) {
      this.logger.error('Failed to retrieve user information:', error as Error, {
        requestedUserId: query.userId
      });

      return {
        success: false,
        error: 'Failed to retrieve user information due to server error'
      };
    }
  }

  private mapReadModelToDto(readModel: UserReadModel): UserDto {
    return {
      id: readModel.id,
      email: readModel.email,
      profile: readModel.profile,
      isActive: readModel.isActive,
      emailVerified: readModel.emailVerified,
      lastLogin: readModel.lastLogin,
      createdAt: readModel.createdAt,
      updatedAt: readModel.updatedAt,
      createdBy: readModel.createdBy
    };
  }
}
```

### Step 4: Place in Queries Folder

The platform auto-discovers handlers by folder:

```
src/
└── queries/
    └── GetUserHandler.ts  ← Platform finds this automatically
```

## Common Patterns

### Pattern 1: List/Search Queries

```typescript
// Contract
@Query({
  description: 'Lists users with filtering and pagination',
  permissions: ['auth:view-users']
})
export class ListUsersQuery {
  filter?: {
    isActive?: boolean;
    emailVerified?: boolean;
    search?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface ListUsersResult {
  success: boolean;
  users?: UserDto[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}

// Handler
@QueryHandlerDecorator(ListUsersQuery)
export class ListUsersHandler extends QueryHandler<ListUsersQuery, ListUsersResult> {
  async handle(query: ListUsersQuery, user: AuthenticatedUser | null): Promise<ListUsersResult> {
    try {
      const page = query.pagination?.page || 1;
      const pageSize = query.pagination?.pageSize || 20;

      // Build filter
      const filter: any = {};
      if (query.filter?.isActive !== undefined) {
        filter.isActive = query.filter.isActive;
      }
      if (query.filter?.emailVerified !== undefined) {
        filter.emailVerified = query.filter.emailVerified;
      }

      // Query read model with pagination
      const result = await UserReadModel.list<UserReadModel>({
        filter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: query.sort ? {
          field: query.sort.field,
          direction: query.sort.direction
        } : undefined
      });

      // Map to DTOs
      const users = result.items.map(rm => this.mapReadModelToDto(rm));

      return {
        success: true,
        users,
        totalCount: result.total,
        page,
        pageSize
      };
    } catch (error) {
      Logger.error('Failed to list users:', error as Error);
      return {
        success: false,
        error: 'Failed to retrieve users'
      };
    }
  }
}
```

### Pattern 2: Cached Queries

```typescript
import { Cacheable } from '@banyanai/platform-base-service';

@Cacheable({
  ttl: 300,  // Cache for 5 minutes
  key: (query: GetUserQuery) => `user_${query.userId}`,
  tags: ['users']
})
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    // Results automatically cached - no infrastructure code needed!

    const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);
    // ...
  }
}
```

### Pattern 3: Authorization-Aware Queries

```typescript
async handle(query: ListUsersQuery, user: AuthenticatedUser | null): Promise<ListUsersResult> {
  try {
    // Layer 2 authorization: Apply data filters based on user
    const filter: any = { isActive: true };

    // Non-admins can only see their own data
    if (!user?.permissions.includes('auth:view-all-users')) {
      filter.id = user?.userId;
    }

    // Managers can see their team
    if (user?.permissions.includes('auth:view-team-users')) {
      filter.teamId = user?.teamId;
    }

    const result = await UserReadModel.list<UserReadModel>({ filter });

    return {
      success: true,
      users: result.items.map(rm => this.mapReadModelToDto(rm))
    };
  } catch (error) {
    Logger.error('Failed to list users:', error as Error);
    return { success: false, error: 'Failed to retrieve users' };
  }
}
```

### Pattern 4: Custom Read Model Queries

```typescript
// Add static methods to read model
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // ... field definitions ...

  static async findByEmail(email: string): Promise<UserReadModel | null> {
    const results = await UserReadModel.findBy<UserReadModel>({ email });
    return results.length > 0 ? results[0] : null;
  }

  static async findActiveUsers(): Promise<UserReadModel[]> {
    return UserReadModel.findBy<UserReadModel>({ isActive: true });
  }

  static async searchByName(searchTerm: string): Promise<UserReadModel[]> {
    // Custom query implementation
    const allUsers = await UserReadModel.list<UserReadModel>();
    return allUsers.items.filter(user =>
      user.profile.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}

// Use in handler
@QueryHandlerDecorator(SearchUsersQuery)
export class SearchUsersHandler extends QueryHandler<SearchUsersQuery, SearchUsersResult> {
  async handle(query: SearchUsersQuery, user: AuthenticatedUser | null): Promise<SearchUsersResult> {
    const users = await UserReadModel.searchByName(query.searchTerm);
    return {
      success: true,
      users: users.map(rm => this.mapReadModelToDto(rm))
    };
  }
}
```

### Pattern 5: Aggregated Queries

```typescript
@Query({
  description: 'Gets user statistics',
  permissions: ['auth:view-stats']
})
export class GetUserStatsQuery {
  startDate?: Date;
  endDate?: Date;
}

export interface UserStatsResult {
  success: boolean;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    newUsersThisMonth: number;
  };
  error?: string;
}

@QueryHandlerDecorator(GetUserStatsQuery)
export class GetUserStatsHandler extends QueryHandler<GetUserStatsQuery, UserStatsResult> {
  async handle(query: GetUserStatsQuery, user: AuthenticatedUser | null): Promise<UserStatsResult> {
    try {
      const allUsers = await UserReadModel.list<UserReadModel>();

      const stats = {
        totalUsers: allUsers.total,
        activeUsers: allUsers.items.filter(u => u.isActive).length,
        verifiedUsers: allUsers.items.filter(u => u.emailVerified).length,
        newUsersThisMonth: allUsers.items.filter(u =>
          u.createdAt >= new Date(new Date().setDate(1))
        ).length
      };

      return { success: true, stats };
    } catch (error) {
      Logger.error('Failed to get user stats:', error as Error);
      return { success: false, error: 'Failed to retrieve statistics' };
    }
  }
}
```

## Read Model Query Patterns

### Basic Queries

```typescript
// Find by ID
const user = await UserReadModel.findById<UserReadModel>('user-123');

// Find by field
const results = await UserReadModel.findBy<UserReadModel>({ email: 'test@example.com' });

// List all
const allUsers = await UserReadModel.list<UserReadModel>();
```

### Filtered Queries

```typescript
// Multiple filters
const activeVerifiedUsers = await UserReadModel.findBy<UserReadModel>({
  isActive: true,
  emailVerified: true
});

// With pagination
const pagedResults = await UserReadModel.list<UserReadModel>({
  filter: { isActive: true },
  limit: 20,
  offset: 0
});
```

### Custom Static Methods

```typescript
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Check existence
  static async existsById(userId: string): Promise<boolean> {
    const results = await UserReadModel.findBy<UserReadModel>({ id: userId });
    return results.length > 0 && results[0].isActive;
  }

  // Check with conditions
  static async existsByEmail(email: string): Promise<boolean> {
    const user = await UserReadModel.findByEmail(email);
    return user?.isActive ?? false;
  }

  // Complex queries
  static async findByAnyExternalIdentity(
    provider: string,
    userId: string
  ): Promise<UserReadModel | null> {
    const byPrimary = await UserReadModel.findBy<UserReadModel>({
      externalProvider: provider,
      externalUserId: userId
    });

    if (byPrimary.length > 0) {
      return byPrimary[0];
    }

    // Fallback to array search
    const allUsers = await UserReadModel.list<UserReadModel>();
    for (const user of allUsers.items) {
      if (user.externalIdentities?.some(
        id => id.provider === provider && id.userId === userId
      )) {
        return user;
      }
    }

    return null;
  }
}
```

## Validation Best Practices

### Input Validation

```typescript
async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
  // Validate required fields
  if (!query.userId || typeof query.userId !== 'string') {
    return {
      success: false,
      error: 'User ID is required and must be a valid string'
    };
  }

  // Validate format
  if (query.userId.length !== 36) {  // UUID length
    return {
      success: false,
      error: 'User ID must be a valid UUID'
    };
  }

  // Continue with query...
}
```

### Pagination Validation

```typescript
async handle(query: ListUsersQuery, user: AuthenticatedUser | null): Promise<ListUsersResult> {
  // Validate and sanitize pagination
  const page = Math.max(1, query.pagination?.page || 1);
  const pageSize = Math.min(100, Math.max(1, query.pagination?.pageSize || 20));

  // Validate sort field
  const allowedSortFields = ['createdAt', 'email', 'updatedAt'];
  const sortField = allowedSortFields.includes(query.sort?.field || '')
    ? query.sort!.field
    : 'createdAt';

  const result = await UserReadModel.list<UserReadModel>({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: { field: sortField, direction: query.sort?.direction || 'desc' }
  });

  // ...
}
```

## Error Handling

### Standard Error Pattern

```typescript
async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
  try {
    // Query logic here

    return { success: true, user: userDto };
  } catch (error) {
    Logger.error('Failed to retrieve user:', error as Error, {
      requestedUserId: query.userId,
      requestingUser: user?.userId
    });

    return {
      success: false,
      error: 'Failed to retrieve user information due to server error'
    };
  }
}
```

### Not Found Handling

```typescript
const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);

if (!userReadModel) {
  return {
    success: false,
    error: 'User not found'
  };
}

// Check additional conditions
if (!userReadModel.isActive) {
  return {
    success: false,
    error: 'User not found'  // Don't reveal user exists but is inactive
  };
}
```

## Testing

```typescript
// src/queries/__tests__/GetUserHandler.test.ts
import { GetUserHandler } from '../GetUserHandler';
import { GetUserQuery } from '../../contracts/queries/GetUserQuery';
import { mockReadModelManager } from '../../test-setup';
import { UserReadModel } from '../../read-models/UserReadModel';

describe('GetUserHandler', () => {
  let handler: GetUserHandler;

  beforeEach(() => {
    handler = new GetUserHandler();
    mockReadModelManager.reset();
  });

  it('should retrieve user by ID', async () => {
    // Seed read model
    mockReadModelManager.seed(
      UserReadModel,
      'user-123',
      {
        id: 'user-123',
        email: 'test@example.com',
        profile: { firstName: 'Test', lastName: 'User' },
        isActive: true,
        emailVerified: true,
        failedLoginAttempts: 0,
        roles: [],
        directPermissions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    const query = new GetUserQuery('user-123');
    const result = await handler.handle(query, null);

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe('user-123');
    expect(result.user?.email).toBe('test@example.com');
  });

  it('should return error for non-existent user', async () => {
    const query = new GetUserQuery('non-existent');
    const result = await handler.handle(query, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(result.user).toBeUndefined();
  });

  it('should validate user ID format', async () => {
    const query = new GetUserQuery('');
    const result = await handler.handle(query, null);

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID is required');
  });

  it('should hide inactive users', async () => {
    mockReadModelManager.seed(
      UserReadModel,
      'inactive-user',
      {
        id: 'inactive-user',
        email: 'inactive@example.com',
        isActive: false,  // Inactive
        // ... other fields
      }
    );

    const query = new GetUserQuery('inactive-user');
    const result = await handler.handle(query, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });
});
```

**See:** [testing-handlers.md](./testing-handlers.md) for complete guide

## Anti-Patterns to Avoid

❌ **Don't modify state in queries**
```typescript
// DON'T DO THIS
async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
  const userModel = await UserReadModel.findById(query.userId);
  userModel.lastViewed = new Date();  // WRONG! Queries are read-only
  await userModel.save();
}
```

✅ **Keep queries read-only**
```typescript
// DO THIS
async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
  const userModel = await UserReadModel.findById<UserReadModel>(query.userId);
  return { success: true, user: this.mapReadModelToDto(userModel) };
}
```

---

❌ **Don't use old decorator names**
```typescript
// DON'T DO THIS
@QueryHandler(GetUserQuery)  // Wrong!
```

✅ **Use correct decorator**
```typescript
// DO THIS
@QueryHandlerDecorator(GetUserQuery)
```

---

❌ **Don't expose internal read model structure**
```typescript
// DON'T DO THIS
return { success: true, user: userReadModel };  // Exposes internal structure
```

✅ **Map to DTOs**
```typescript
// DO THIS
return { success: true, user: this.mapReadModelToDto(userReadModel) };
```

---

❌ **Don't query event store directly**
```typescript
// DON'T DO THIS - Slow!
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);
```

✅ **Use read models**
```typescript
// DO THIS - Fast!
const user = await UserReadModel.findById<UserReadModel>(userId);
```

## Related Guides

- [Command Handlers](./command-handlers.md) - Write operations
- [Event Handlers](./event-handlers.md) - Reacting to events
- [Data Management - Read Models](../data-management/read-models.md) - Read model patterns
- [Data Management - Projections](../data-management/projections.md) - Event projections
- [Data Management - Caching](../data-management/caching.md) - Caching strategies
- [Testing Handlers](./testing-handlers.md) - Testing strategies
