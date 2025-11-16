---
title: "Creating Aggregates and Enforcing Invariants"
---

# Creating Aggregates and Enforcing Invariants

## Use this guide if...

- You need to create domain aggregates that enforce business rules
- You want to understand how to design aggregate boundaries
- You're implementing complex business logic with invariants
- You need to coordinate multiple entities within a consistency boundary

## Quick Example

```typescript
import { Aggregate, AggregateRoot, DomainEvent } from '@banyanai/platform-domain-modeling';
import { v4 as uuidv4 } from 'uuid';

@Aggregate('User')
export class User extends AggregateRoot {
  private constructor(private props: UserProps) {
    super(props.id || '', 'User');
    this.validateInvariants();  // Enforce rules
  }

  // Factory method
  static create(props: Omit<UserProps, 'id' | 'createdAt'>): User {
    const id = uuidv4();
    const user = new User({
      ...props,
      id,
      createdAt: new Date(),
      isActive: true,
      failedLoginAttempts: 0
    });

    user.raiseEvent('UserCreated', {
      email: props.email,
      createdAt: user.props.createdAt
    });

    return user;
  }

  // Business methods enforce rules
  changePassword(currentPassword: string, newPassword: string): void {
    // Rule 1: Current password must be correct
    if (!this.verifyPassword(currentPassword)) {
      throw new Error('Current password is incorrect');
    }

    // Rule 2: New password must be strong
    this.validatePasswordStrength(newPassword);

    // Rule 3: New password must be different
    if (this.verifyPassword(newPassword)) {
      throw new Error('New password must be different from current');
    }

    this.props.passwordHash = this.hashPassword(newPassword);
    this.raiseEvent('UserPasswordChanged', { changedAt: new Date() });
  }

  // Invariants must always hold
  private validateInvariants(): void {
    if (!this.props.email || !this.isValidEmail(this.props.email)) {
      throw new Error('Valid email is required');
    }

    if (!this.props.passwordHash) {
      throw new Error('Password hash is required');
    }

    if (this.props.failedLoginAttempts < 0) {
      throw new Error('Failed login attempts cannot be negative');
    }
  }
}
```

## Aggregate Design Principles

### 1. Consistency Boundary

Aggregates define what must be consistent together.

```typescript
// Good: Order is the consistency boundary
@Aggregate('Order')
export class Order extends AggregateRoot {
  private items: OrderItem[] = [];  // Part of Order aggregate
  
  addItem(item: OrderItem): void {
    // Invariant: Total cannot exceed limit
    if (this.calculateTotal() + item.price > 10000) {
      throw new Error('Order total cannot exceed $10,000');
    }
    
    this.items.push(item);
    this.raiseEvent('OrderItemAdded', { item });
  }
}
```

### 2. Enforce Invariants

Business rules that must always be true.

```typescript
recordFailedLoginAttempt(maxAttempts: number, lockoutDuration: number): void {
  this.props.failedLoginAttempts += 1;
  
  // Invariant: Lock account after max attempts
  if (this.props.failedLoginAttempts >= maxAttempts) {
    this.props.lockedUntil = new Date(Date.now() + lockoutDuration);
    this.raiseEvent('UserAccountLocked', {
      lockedUntil: this.props.lockedUntil,
      failedAttempts: this.props.failedLoginAttempts
    });
  } else {
    this.raiseEvent('UserLoginFailed', {
      attemptCount: this.props.failedLoginAttempts
    });
  }
}
```

### 3. Tell, Don't Ask

Methods should execute behavior, not expose state.

❌ **Don't expose state for external logic**
```typescript
// DON'T DO THIS
if (user.getFailedLoginAttempts() >= 5) {
  user.setLockedUntil(new Date(...));
}
```

✅ **Encapsulate business logic**
```typescript
// DO THIS
user.recordFailedLoginAttempt(5, 3600000);
```

## Common Aggregate Patterns

### Pattern 1: Creation Factory

```typescript
static create(email: string, password: string): User {
  // Validate inputs
  if (!email || !this.isValidEmail(email)) {
    throw new Error('Valid email required');
  }

  const id = uuidv4();
  const user = new User({
    id,
    email: email.toLowerCase(),
    passwordHash: this.hashPassword(password),
    isActive: true,
    createdAt: new Date()
  });

  user.raiseEvent('UserCreated', {
    email: user.props.email,
    createdAt: user.props.createdAt
  });

  return user;
}
```

### Pattern 2: State Transitions

```typescript
activate(activatedBy: string): void {
  // Validate state transition
  if (this.props.isActive) {
    return;  // Already active - idempotent
  }

  this.props.isActive = true;
  this.props.updatedAt = new Date();
  
  this.raiseEvent('UserActivated', {
    activatedAt: new Date(),
    activatedBy
  });
}

deactivate(deactivatedBy: string, reason?: string): void {
  if (!this.props.isActive) {
    return;  // Already inactive - idempotent
  }

  this.props.isActive = false;
  this.props.updatedAt = new Date();
  
  this.raiseEvent('UserDeactivated', {
    deactivatedAt: new Date(),
    deactivatedBy,
    reason
  });
}
```

### Pattern 3: Guarding Invariants

```typescript
addItem(item: OrderItem): void {
  // Guard 1: Order must not be completed
  if (this.props.status === 'completed') {
    throw new Error('Cannot add items to completed order');
  }

  // Guard 2: Item must be valid
  if (!item.productId || item.quantity <= 0) {
    throw new Error('Invalid item');
  }

  // Guard 3: Total must not exceed limit
  const newTotal = this.calculateTotal() + (item.price * item.quantity);
  if (newTotal > 50000) {
    throw new Error('Order total cannot exceed $50,000');
  }

  this.props.items.push(item);
  this.raiseEvent('OrderItemAdded', { item });
}
```

### Pattern 4: Coordinating Entities

```typescript
@Aggregate('Order')
export class Order extends AggregateRoot {
  private items: OrderItem[] = [];  // Entities within aggregate
  
  removeItem(itemId: string): void {
    const index = this.items.findIndex(i => i.id === itemId);
    
    if (index === -1) {
      throw new Error('Item not found in order');
    }

    // Invariant: Order must have at least one item
    if (this.items.length === 1) {
      throw new Error('Order must have at least one item');
    }

    const removedItem = this.items.splice(index, 1)[0];
    this.raiseEvent('OrderItemRemoved', { itemId, item: removedItem });
  }
}
```

## Aggregate Boundaries

### What Belongs in an Aggregate?

✅ **Include:**
- Entities that must be consistent together
- Value objects owned by the aggregate
- Invariants that must be enforced atomically

❌ **Don't include:**
- Entities from other consistency boundaries
- Read-only reference data
- Entities that can be eventually consistent

### Example: Order Aggregate

```typescript
@Aggregate('Order')
export class Order extends AggregateRoot {
  // ✅ Part of aggregate
  private items: OrderItem[];  // Must be consistent with order
  private shipping: ShippingAddress;  // Owned by order
  private payment: PaymentInfo;  // Must be consistent
  
  // ❌ Not part of aggregate
  // private customer: Customer;  // Separate aggregate - use ID instead
  private customerId: string;  // Reference by ID
  
  // ❌ Not part of aggregate
  // private inventory: Inventory[];  // Separate aggregate
}
```

## Testing Aggregates

```typescript
describe('User aggregate', () => {
  describe('creation', () => {
    it('should create user with valid email', () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'hashed',
        isActive: true
      });

      expect(user.email).toBe('test@example.com');
      
      const events = user.getUncommittedEvents();
      expect(events[0].eventType).toBe('UserCreated');
    });

    it('should reject invalid email', () => {
      expect(() => User.create({
        email: 'invalid-email',
        passwordHash: 'hashed',
        isActive: true
      })).toThrow('Valid email is required');
    });
  });

  describe('invariants', () => {
    it('should enforce account locking after max attempts', () => {
      const user = User.create({...});
      
      user.recordFailedLoginAttempt(3, 3600000);
      user.recordFailedLoginAttempt(3, 3600000);
      user.recordFailedLoginAttempt(3, 3600000);

      expect(user.isAccountLocked()).toBe(true);
    });
  });
});
```

## Anti-Patterns

❌ **Don't make aggregates too large**
```typescript
// DON'T DO THIS
@Aggregate('CustomerAccount')
export class CustomerAccount {
  private orders: Order[] = [];  // Can have 1000s - too large!
  private payments: Payment[] = [];
  private addresses: Address[] = [];
}
```

✅ **Keep aggregates focused**
```typescript
// DO THIS
@Aggregate('Customer')
export class Customer {
  private customerId: string;
  private primaryAddress: Address;  // Just primary
  // Orders are separate aggregates referenced by ID
}
```

## Related Guides

- [Event Sourcing](./event-sourcing.md)
- [Read Models](./read-models.md)
- [Command Handlers](../service-development/command-handlers.md)
