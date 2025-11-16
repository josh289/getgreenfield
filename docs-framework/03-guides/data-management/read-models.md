# Read Model Implementation

## Use this guide if...

- You need to create optimized query views
- You're implementing list/search functionality
- You want to understand read model patterns
- You need to query event-sourced data efficiently

## Quick Example

```typescript
import { Index, MapFromEvent, ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'rm_users', aggregateType: 'User' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Primary key (required)
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  id!: string;

  // Indexed fields for queries
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserEmailChanged')
  email!: string;

  @Index()
  @MapFromEvent('UserCreated')
  isActive!: boolean;

  // Non-indexed fields
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserProfileUpdated')
  profile!: Record<string, unknown>;

  @MapFromEvent('UserCreated')
  createdAt!: Date;

  updatedAt!: Date;

  // Required method
  getId(): string {
    return this.id;
  }

  // Static query methods
  static async findByEmail(email: string): Promise<UserReadModel | null> {
    const results = await UserReadModel.findBy<UserReadModel>({ email });
    return results.length > 0 ? results[0] : null;
  }

  static async findActiveUsers(): Promise<UserReadModel[]> {
    return UserReadModel.findBy<UserReadModel>({ isActive: true });
  }
}
```

**IMPORTANT: How Read Models are Stored**

The `tableName` parameter (`'rm_users'` above) is NOT a separate database table. Instead:

- All read models are stored in a **single shared `projections` table**
- The `tableName` becomes the **`projection_name`** discriminator column value
- Read model data is stored as **JSONB** in the `data` column
- This follows event sourcing best practices for projection storage

```sql
-- Actual database storage (single shared table for ALL read models)
SELECT * FROM projections WHERE projection_name = 'rm_users';

-- Example row:
id          | projection_name | data                                      | version
----------- | --------------- | ----------------------------------------- | -------
'user-123'  | 'rm_users'      | '{"id":"user-123","email":"user@ex.com"}' | 1
```

## Step-by-Step Guide

### Step 1: Define Read Model Class

```typescript
import { ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

@ReadModel({
  tableName: 'rm_users',  // Projection name (NOT a separate table - becomes projection_name value)
  aggregateType: 'User',  // Source aggregate
  schemaName: 'public'    // Optional: database schema
})
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Fields defined here
}
```

**Understanding `tableName`:**
- Despite the parameter name, this does NOT create a separate database table
- It becomes the `projection_name` discriminator value in the shared `projections` table
- Convention: Use a descriptive name like `'rm_users'` (read model users)
- All read models with this name share the same `projection_name` value

### Step 2: Add Fields with Mappings

```typescript
// Primary key (always required)
@Index(undefined, { unique: true, type: 'btree' })
@MapFromEvent('UserCreated')
id!: string;

// Indexed field updated by multiple events
@Index()
@MapFromEvent('UserCreated')
@MapFromEvent('UserActivated')
@MapFromEvent('UserDeactivated')
isActive!: boolean;

// Non-indexed field
@MapFromEvent('UserCreated')
@MapFromEvent('UserProfileUpdated')
profile!: Record<string, unknown>;
```

### Step 3: Implement getId()

```typescript
getId(): string {
  return this.id;
}
```

### Step 4: Add Static Query Methods

```typescript
static async findByEmail(email: string): Promise<UserReadModel | null> {
  const results = await UserReadModel.findBy<UserReadModel>({ email });
  return results.length > 0 ? results[0] : null;
}

static async existsById(userId: string): Promise<boolean> {
  const results = await UserReadModel.findBy<UserReadModel>({ id: userId });
  return results.length > 0 && results[0].isActive;
}
```

## Built-in Query Methods

### findById

```typescript
const user = await UserReadModel.findById<UserReadModel>('user-123');
```

### findBy

```typescript
// Single field
const users = await UserReadModel.findBy<UserReadModel>({ isActive: true });

// Multiple fields
const users = await UserReadModel.findBy<UserReadModel>({
  isActive: true,
  emailVerified: true
});
```

### list

```typescript
// All records
const all = await UserReadModel.list<UserReadModel>();

// With pagination
const paged = await UserReadModel.list<UserReadModel>({
  limit: 20,
  offset: 0
});

// With filter and sort
const filtered = await UserReadModel.list<UserReadModel>({
  filter: { isActive: true },
  limit: 20,
  offset: 0,
  orderBy: { field: 'createdAt', direction: 'desc' }
});
```

## Index Strategy

### When to Index

✅ **Index fields used for:**
- Primary keys
- Foreign keys
- Frequent filters
- Sorting
- Unique constraints

❌ **Don't index:**
- Large text fields
- Rarely queried fields
- High-cardinality data

### Index Types

```typescript
// B-tree (default) - Good for equality and range queries
@Index(undefined, { type: 'btree' })
createdAt!: Date;

// Unique index
@Index(undefined, { unique: true, type: 'btree' })
email!: string;

// GIN index - Good for JSONB and array fields
@Index(undefined, { type: 'gin' })
tags!: string[];
```

## Custom Query Methods

### Pattern 1: Simple Lookup

```typescript
static async findByEmail(email: string): Promise<UserReadModel | null> {
  const results = await UserReadModel.findBy<UserReadModel>({ email });
  return results.length > 0 ? results[0] : null;
}
```

### Pattern 2: Existence Check

```typescript
static async existsByEmail(email: string): Promise<boolean> {
  const user = await UserReadModel.findByEmail(email);
  return user?.isActive ?? false;
}
```

### Pattern 3: Complex Search

```typescript
static async searchByName(searchTerm: string): Promise<UserReadModel[]> {
  const allUsers = await UserReadModel.list<UserReadModel>();
  
  return allUsers.items.filter(user =>
    user.profile.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
```

### Pattern 4: Conditional Query

```typescript
static async findByAnyExternalIdentity(
  provider: string,
  userId: string
): Promise<UserReadModel | null> {
  // Try primary identity
  const byPrimary = await UserReadModel.findBy<UserReadModel>({
    externalProvider: provider,
    externalUserId: userId
  });

  if (byPrimary.length > 0) {
    return byPrimary[0];
  }

  // Fallback to linked identities
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
```

## Read Model Design Patterns

### Pattern 1: Denormalization

Duplicate data for query performance.

```typescript
@ReadModel({ tableName: 'rm_orders' })
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  customerId!: string;

  // Denormalized customer data (for display)
  @MapFromEvent('OrderCreated')
  customerEmail!: string;

  @MapFromEvent('OrderCreated')
  customerName!: string;
}
```

### Pattern 2: Multiple Read Models

Different views of same data.

```typescript
// Detailed read model for single order
@ReadModel({ tableName: 'rm_order_details' })
export class OrderDetailsReadModel extends ReadModelBase<OrderDetailsReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  items!: OrderItem[];  // Full item details

  @MapFromEvent('OrderCreated')
  shipping!: ShippingAddress;

  @MapFromEvent('OrderCreated')
  payment!: PaymentInfo;
}

// Summary read model for order lists
@ReadModel({ tableName: 'rm_order_summaries' })
export class OrderSummaryReadModel extends ReadModelBase<OrderSummaryReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  customerId!: string;

  @MapFromEvent('OrderCreated')
  totalAmount!: number;

  @MapFromEvent('OrderCreated')
  status!: string;

  @MapFromEvent('OrderCreated')
  createdAt!: Date;
}
```

### Pattern 3: Aggregated Read Models

Pre-calculated aggregations.

```typescript
@ReadModel({ tableName: 'rm_customer_stats' })
export class CustomerStatsReadModel extends ReadModelBase<CustomerStatsReadModel> {
  @MapFromEvent('OrderCreated')
  customerId!: string;

  @MapFromEvent('OrderCreated')
  totalOrders!: number;

  @MapFromEvent('OrderCreated')
  totalSpent!: number;

  @MapFromEvent('OrderCreated')
  lastOrderDate!: Date;
}
```

## Testing Read Models

```typescript
describe('UserReadModel', () => {
  it('should find user by email', async () => {
    const user = await UserReadModel.findByEmail('test@example.com');
    
    expect(user).toBeDefined();
    expect(user?.email).toBe('test@example.com');
  });

  it('should return null for non-existent email', async () => {
    const user = await UserReadModel.findByEmail('nonexistent@example.com');
    
    expect(user).toBeNull();
  });

  it('should find active users', async () => {
    const users = await UserReadModel.findActiveUsers();
    
    expect(users.every(u => u.isActive)).toBe(true);
  });
});
```

## Anti-Patterns

❌ **Don't query event store**
```typescript
// DON'T DO THIS - Slow!
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);
return user.email;
```

✅ **Use read models**
```typescript
// DO THIS - Fast!
const user = await UserReadModel.findById<UserReadModel>(userId);
return user?.email;
```

## Database Storage Architecture

### Shared Projections Table

All read models across all services use a single shared `projections` table:

```sql
CREATE TABLE projections (
  id VARCHAR(255) NOT NULL,
  projection_name VARCHAR(255) NOT NULL,  -- Discriminator (from tableName)
  data JSONB NOT NULL,                    -- Read model stored as JSON
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, projection_name)
);

-- GIN index for efficient JSON queries
CREATE INDEX idx_projections_data ON projections USING GIN (data);
```

### Query Patterns

```sql
-- Query specific read model type
SELECT * FROM projections
WHERE projection_name = 'rm_users';

-- Query by ID for specific projection
SELECT * FROM projections
WHERE id = 'user-123'
  AND projection_name = 'rm_users';

-- JSON field queries (using GIN index)
SELECT * FROM projections
WHERE projection_name = 'rm_users'
  AND data->>'email' = 'user@example.com';

-- JSON field with operators
SELECT * FROM projections
WHERE projection_name = 'rm_users'
  AND (data->>'isActive')::boolean = true;
```

### Why Single-Table Design?

**Benefits:**
- No schema migrations when adding/changing read models
- Cross-service read model queries possible
- Simplified backup/restore operations
- Follows event sourcing best practices
- Better for multi-tenancy scenarios
- Efficient storage with PostgreSQL JSONB compression

**Trade-offs:**
- Cannot use traditional SQL indexes on read model fields (use GIN indexes on JSONB)
- Must query via JSONB operators for field-specific queries
- Type safety handled at application layer, not database layer

### Example Storage

```typescript
// Read model definition
@ReadModel({ tableName: 'rm_users' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  @MapFromEvent('UserCreated')
  id!: string;

  @MapFromEvent('UserCreated')
  email!: string;

  @MapFromEvent('UserCreated')
  isActive!: boolean;
}
```

**Stored in database as:**
```sql
INSERT INTO projections (id, projection_name, data, version)
VALUES (
  'user-123',
  'rm_users',  -- From tableName parameter
  '{"id":"user-123","email":"user@example.com","isActive":true}'::jsonb,
  1
);
```

## Related Guides

- [Projections](./projections.md)
- [Query Handlers](../service-development/query-handlers.md)
- [Caching](./caching.md)
