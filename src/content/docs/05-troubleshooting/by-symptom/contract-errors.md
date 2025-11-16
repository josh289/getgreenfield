---
title: Contract Errors
description: Troubleshooting contract validation failures and schema issues
category: troubleshooting
tags: [contracts, validation, schema, types]
related:
  - ../../02-core-concepts/contract-system.md
  - ../by-component/contract-system-issues.md
  - ../common-errors/error-catalog.md
difficulty: intermediate
---

# Contract Errors

Quick reference for diagnosing and fixing contract validation failures.

## Quick Diagnosis

```bash
# Check contract validation errors
docker logs my-service 2>&1 | grep -i "contract\|validation"

# View service contracts
curl http://localhost:3001/api/services/my-service/contracts | jq

# Test contract manually
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command":"CreateUser","data":{"email":"test@example.com"}}'
```

## Common Contract Errors

### 1. Missing @Field() Decorator

**Error:**
```
Contract validation failed: Field 'email' not found in schema
```

**Cause:** Field missing `@Field()` decorator

**Fix:**
```typescript
// ❌ WRONG
@Contract()
export class CreateUserCommand {
  email!: string;  // Missing @Field()
}

// ✓ CORRECT
@Contract()
export class CreateUserCommand {
  @Field()
  @IsEmail()
  email!: string;
}
```

### 2. Missing Validation Decorators

**Error:**
```
Validation failed for field 'email': No validators specified
```

**Fix:**
```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';

@Contract()
export class CreateUserCommand {
  @Field()
  @IsEmail()  // Add validation
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;
}
```

### 3. Handler Return Type Mismatch

**Error:**
```
CONTRACT_VIOLATION: Response missing required field 'userId'
```

**Fix:**
```typescript
// Contract defines output
@Contract()
export class CreateUserResult {
  @Field()
  @IsString()
  userId!: string;

  @Field()
  @IsEmail()
  email!: string;
}

// Handler MUST return matching type
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    // ✓ Return matches contract
    return {
      userId: user.userId,
      email: user.email
    };
  }
}
```

### 4. Permission Format Errors

**Error:**
```
Permission must follow 'resource:action' format, got: 'users-create'
```

**Fix:**
```typescript
// ❌ WRONG formats
@RequiresPermission('users-create')  // No colon
@RequiresPermission('Users:Create')  // Uppercase
@RequiresPermission('users:')        // Empty action

// ✓ CORRECT format
@RequiresPermission('users:create')
```

### 5. GraphQL Schema Errors

**Error:**
```
SCHEMA_GENERATION_ERROR: Duplicate type name 'User'
```

**Fix:**
```typescript
// ❌ WRONG: Duplicate names
@Contract() export class User { }
@Contract() export class User { }

// ✓ CORRECT: Unique names
@Contract() export class UserProfile { }
@Contract() export class UserDetails { }
```

### 6. Dots in Type Names

**Error:**
```
Invalid GraphQL type name: 'User.Profile'
```

**Fix:**
```typescript
// ❌ WRONG
@Contract()
export class User.Profile { }

// ✓ CORRECT
@Contract()
export class UserProfile { }
```

## Validation Checklist

- [ ] All fields have `@Field()` decorator
- [ ] All fields have validation decorators (`@IsString()`, `@IsEmail()`, etc.)
- [ ] Handler return type matches contract output schema
- [ ] Permission format is `resource:action` (lowercase, colon-separated)
- [ ] No dots in class or field names
- [ ] All contracts exported
- [ ] Type names are unique across services

## Related Documentation

- [Contract System](../../02-core-concepts/contract-system.md)
- [Contract System Issues](../by-component/contract-system-issues.md)
- [Error Catalog - Contract Errors](../common-errors/error-catalog.md#contract-validation-errors)
