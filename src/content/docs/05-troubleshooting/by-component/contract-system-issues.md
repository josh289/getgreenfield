---
title: Contract System Issues
description: Troubleshooting guide for contract validation, broadcasting, and schema generation issues
category: troubleshooting
tags: [contract-system, validation, schema, broadcasting, contracts]
related:
  - ../../02-core-concepts/contract-system.md
  - ../by-symptom/contract-errors.md
  - ../common-errors/error-catalog.md
difficulty: intermediate
---

# Contract System Issues

The contract system provides type-safe service contracts with compile-time validation. This guide helps diagnose and resolve contract validation, broadcasting, and schema generation issues.

## Quick Fix

```bash
# Check contract validation errors
docker logs my-service 2>&1 | grep -E "contract|validation|schema"

# Test contract validation
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command":"CreateUser","data":{"email":"test@example.com"}}'

# Check contract broadcasting
docker logs service-discovery 2>&1 | grep "Contract received"

# Verify service contracts registered
curl http://localhost:3001/api/services/my-service/contracts | jq
```

## Common Problems

### 1. Contract Validation Failed

**Symptoms:**
- Error: "CONTRACT_VALIDATION_ERROR"
- Input/output validation failures
- Missing required fields errors
- Type mismatch errors

**Diagnostic Steps:**

```bash
# Check validation errors in logs
docker logs my-service 2>&1 | grep "Validation failed"

# Test contract schema
curl http://localhost:3001/api/services/my-service/contracts | jq '.commands[]'

# Verify handler input/output types
grep -A10 "@CommandHandler" src/commands/CreateUserHandler.ts
```

**Common Errors:**

```typescript
// From contract-validator.ts
throw new Error(`Command "${command}" not found in contract`); // Line 46
throw new Error(`Query "${query}" not found in contract`); // Line 67
throw new Error(`Event "${event}" not found in contract`); // Line 88
throw new Error(`${operationType} "${operationName}" not found in contract`); // Line 122
throw new Error(`No schema found for ${context}`); // Line 142
throw new Error(`Validation failed for ${context}:\n${errorMessages.join('\n')}`); // Line 155
```

**Solution:**

**A. Define Complete Contract**

```typescript
import { Contract, Field } from '@banyanai/platform-contract-system';
import { IsString, IsEmail, MinLength } from 'class-validator';

// ✓ CORRECT: Complete contract with all required decorators
@Contract()
export class CreateUserCommand {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;

  @Field()
  @IsString()
  name!: string;
}

// ❌ WRONG: Missing decorators
export class CreateUserCommand {
  email!: string;        // Missing @Field() and validators
  password!: string;     // Missing @Field() and validators
  name!: string;         // Missing @Field() and validators
}
```

**B. Ensure All Fields Have Decorators**

```typescript
// Every field needs @Field() decorator
@Contract()
export class UpdateUserCommand {
  @Field()
  @IsString()
  userId!: string;

  @Field()  // Required even for optional fields
  @IsString()
  @IsOptional()
  name?: string;

  @Field()
  @IsString()
  @IsOptional()
  bio?: string;
}
```

**C. Match Handler Return Type to Contract**

```typescript
// Contract output schema
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
    const user = await this.createUser(command);

    // ✓ CORRECT: Return matches contract
    return {
      userId: user.userId,
      email: user.email
    };

    // ❌ WRONG: Missing required field
    // return {
    //   userId: user.userId
    //   // email missing!
    // };
  }
}
```

---

### 2. Contract Broadcasting Failed

**Symptoms:**
- Service contracts not appearing in service discovery
- Other services cannot find contracts
- Contract updates not propagated
- "Contract not found" errors

**Diagnostic Steps:**

```bash
# Check contract broadcasting logs
docker logs my-service 2>&1 | grep "Broadcasting contract"

# Verify contracts in service discovery
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service") | .contracts'

# Check message bus for contract events
docker logs rabbitmq 2>&1 | grep "contracts"

# Test message bus connectivity
docker exec my-service nc -zv rabbitmq 5672
```

**Common Causes:**

**A. Message Bus Not Connected**

```bash
# Service must connect to RabbitMQ before broadcasting
docker logs my-service 2>&1 | grep -E "RabbitMQ|MessageBus"

# Should see:
# [MessageBusClient] Connected to RabbitMQ
# [ContractBroadcaster] Broadcasting contracts for my-service
```

**Solution:**

Ensure service starts with message bus configuration:

```yaml
services:
  my-service:
    environment:
      - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
    depends_on:
      rabbitmq:
        condition: service_healthy
```

**B. Contract Export Issues**

```typescript
// ❌ WRONG: Contract not exported
@Contract()
class CreateUserCommand {
  // Won't be discovered!
}

// ✓ CORRECT: Exported contract
@Contract()
export class CreateUserCommand {
  // Will be discovered and broadcast
}
```

**C. Service Discovery Not Running**

```bash
# Check service discovery status
docker ps | grep service-discovery

# If not running, start it
docker compose up -d service-discovery

# Wait for ready
docker logs service-discovery 2>&1 | grep "started successfully"
```

---

### 3. Permission Validation Errors

**Symptoms:**
- Error: "PERMISSION_VALIDATION_ERROR"
- Invalid permission format errors
- Permission decorator rejected
- "must use 'resource:action' format" errors

**Diagnostic Steps:**

```bash
# Check permission format errors
docker logs my-service 2>&1 | grep "permission"

# View contract permissions
curl http://localhost:3001/api/services/my-service/contracts | jq '.commands[].requiredPermissions'
```

**Common Errors:**

```typescript
// From contract-scanner.ts
throw new Error('At least one permission must be specified'); // Line 164

// Permission format validation (from Permission.ts domain model)
throw new Error('Permission must be a non-empty string');
throw new Error(`Permission must follow 'service:action' format, got: ${permission}`);
throw new Error(`Permission service and action cannot be empty, got: ${permission}`);
throw new Error(
  `Permission service contains invalid characters (only lowercase letters, numbers, hyphens allowed), got: ${service}`
);
throw new Error(
  `Permission action contains invalid characters (only lowercase letters, numbers, hyphens allowed), got: ${action}`
);
```

**Solution:**

**A. Use Correct Permission Format**

```typescript
import { RequiresPermission } from '@banyanai/platform-base-service';

// ✓ CORRECT: Proper permission format
@CommandHandler(CreateUserCommand)
@RequiresPermission('users:create')
export class CreateUserHandler { }

@CommandHandler(UpdateUserCommand)
@RequiresPermission('users:update')
export class UpdateUserHandler { }

@CommandHandler(DeleteUserCommand)
@RequiresPermission('users:delete')
export class DeleteUserHandler { }

// ❌ WRONG: Various invalid formats
@RequiresPermission('users-create')     // No colon
@RequiresPermission('Users:Create')     // Uppercase
@RequiresPermission('users:')           // Empty action
@RequiresPermission(':create')          // Empty resource
@RequiresPermission('user service:create') // Space
@RequiresPermission('users:create!')    // Invalid character
```

**B. Multiple Permissions**

```typescript
// Handler requires multiple permissions
@CommandHandler(TransferFundsCommand)
@RequiresPermission(['accounts:read', 'accounts:transfer'])
export class TransferFundsHandler { }
```

**C. Validate Permission Strings**

```typescript
function validatePermission(permission: string): void {
  if (!permission || typeof permission !== 'string') {
    throw new Error('Permission must be a non-empty string');
  }

  if (!permission.includes(':')) {
    throw new Error(`Permission must follow 'service:action' format, got: ${permission}`);
  }

  const [resource, action] = permission.split(':');

  if (!resource || !action) {
    throw new Error(`Permission service and action cannot be empty, got: ${permission}`);
  }

  const validPattern = /^[a-z0-9-]+$/;
  if (!validPattern.test(resource)) {
    throw new Error(`Invalid permission resource: ${resource}`);
  }

  if (!validPattern.test(action)) {
    throw new Error(`Invalid permission action: ${action}`);
  }
}
```

---

### 4. Schema Generation Errors

**Symptoms:**
- Error: "SCHEMA_GENERATION_ERROR"
- GraphQL schema generation failures
- Duplicate type names
- Invalid type definitions

**Diagnostic Steps:**

```bash
# Check schema generation logs
docker logs api-gateway 2>&1 | grep -E "schema|GraphQL"

# View generated schema
curl http://localhost:3000/api/graphql | jq

# Check for type conflicts
grep -r "@Contract" src/ | grep -o "class [A-Za-z]*" | sort | uniq -d
```

**Common Errors:**

```typescript
// From platform-interfaces.ts
export class SchemaGenerationError extends PlatformError {
  code = 'SCHEMA_GENERATION_ERROR';
}

// Common causes:
// - Duplicate type names
// - Circular type references
// - Invalid GraphQL type definitions
// - Dots in type or field names
```

**Solution:**

**A. Remove Dots from Names**

```typescript
// ❌ WRONG: Dots in class names
@Contract()
export class User.CreateCommand { }

@Contract()
export class User.Profile { }

// ✓ CORRECT: Use PascalCase without dots
@Contract()
export class CreateUserCommand { }

@Contract()
export class UserProfile { }
```

**B. Fix Duplicate Type Names**

```typescript
// ❌ WRONG: Duplicate type name across services
// user-service/contracts.ts
@Contract()
export class Profile { }

// profile-service/contracts.ts
@Contract()
export class Profile { }  // Duplicate!

// ✓ CORRECT: Unique type names
// user-service/contracts.ts
@Contract()
export class UserProfile { }

// profile-service/contracts.ts
@Contract()
export class ProfileDetails { }
```

**C. Avoid Circular References**

```typescript
// ❌ WRONG: Circular reference
@Contract()
export class User {
  @Field()
  posts!: Post[];
}

@Contract()
export class Post {
  @Field()
  author!: User;  // Circular!
}

// ✓ CORRECT: Use IDs instead
@Contract()
export class User {
  @Field()
  @IsString()
  userId!: string;

  @Field({ type: () => [String] })
  postIds!: string[];
}

@Contract()
export class Post {
  @Field()
  @IsString()
  postId!: string;

  @Field()
  @IsString()
  authorId!: string;  // Reference by ID
}
```

---

### 5. Version Compatibility Issues

**Symptoms:**
- Contract version mismatches
- Breaking changes not detected
- Migration errors
- "Invalid semantic version" errors

**Diagnostic Steps:**

```bash
# Check contract versions
curl http://localhost:3001/api/services/my-service/contracts | jq '.version'

# View version history
curl http://localhost:3001/api/services/my-service/contracts/history | jq

# Check for breaking changes
docker logs my-service 2>&1 | grep "Breaking change"
```

**Common Errors:**

```typescript
// From contract-versioning.ts
throw new Error(`Invalid semantic version: ${version}`); // Line 77
throw new Error(`Evolutions array not found for contract type: ${contractType}`); // Line 167
throw new Error(
  `Cannot evolve contract from version ${fromVersion} to ${toVersion}: No migration path found`
); // Line 205
throw new Error(`Invalid version requirement: ${requirement}`); // Line 335
```

**Solution:**

**A. Use Semantic Versioning**

```typescript
// Contract version format: MAJOR.MINOR.PATCH
// - MAJOR: Breaking changes
// - MINOR: New features (backward compatible)
// - PATCH: Bug fixes (backward compatible)

@Contract({ version: '1.0.0' })
export class CreateUserCommand {
  @Field()
  email!: string;
}

// Adding optional field = MINOR version bump
@Contract({ version: '1.1.0' })
export class CreateUserCommand {
  @Field()
  email!: string;

  @Field()
  @IsOptional()
  name?: string;  // New optional field
}

// Removing field = MAJOR version bump
@Contract({ version: '2.0.0' })
export class CreateUserCommand {
  @Field()
  email!: string;
  // name removed - breaking change!
}
```

**B. Define Contract Evolutions**

```typescript
import { ContractEvolution } from '@banyanai/platform-contract-system';

// Define migration from v1 to v2
const createUserEvolution: ContractEvolution = {
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  migrate: (data: any) => {
    // Transform old format to new format
    return {
      email: data.email,
      // name removed in v2
    };
  }
};

// Register evolution
ContractVersionManager.registerEvolution('CreateUserCommand', createUserEvolution);
```

**C. Check Version Compatibility**

```typescript
import { ContractVersionManager } from '@banyanai/platform-contract-system';

// Check if version satisfies requirement
const compatible = ContractVersionManager.satisfies('1.5.0', '^1.0.0');
// true - minor/patch updates compatible

const breaking = ContractVersionManager.satisfies('2.0.0', '^1.0.0');
// false - major version change breaks compatibility
```

---

### 6. Runtime Validation Failures

**Symptoms:**
- Valid data rejected by validators
- Inconsistent validation results
- Cache inconsistency errors
- Validation performance issues

**Diagnostic Steps:**

```bash
# Check validation errors
docker logs my-service 2>&1 | grep "Validation failed"

# View validation details
docker logs my-service 2>&1 | grep -A5 "validation"

# Check cache status
docker exec redis redis-cli INFO keyspace
```

**Common Errors:**

```typescript
// From runtime-validator.ts
throw new Error(`Cache inconsistency: key exists but value is undefined for ${cacheKey}`); // Lines 205, 278, 339
```

**Solution:**

**A. Use Proper Validation Decorators**

```typescript
import { Field } from '@banyanai/platform-contract-system';
import {
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsOptional
} from 'class-validator';

@Contract()
export class CreateUserCommand {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @Field()
  @IsInt()
  @Min(18)
  @Max(120)
  @IsOptional()
  age?: number;
}
```

**B. Custom Validators**

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom validator for phone numbers
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          return typeof value === 'string' && phoneRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Phone number must be in E.164 format';
        }
      }
    });
  };
}

// Use custom validator
@Contract()
export class UpdateProfileCommand {
  @Field()
  @IsPhoneNumber()
  phoneNumber!: string;
}
```

**C. Clear Validation Cache**

```bash
# If validation cache becomes corrupted
docker exec redis redis-cli FLUSHDB

# Or clear specific pattern
docker exec redis redis-cli --scan --pattern "validation:*" | xargs redis-cli DEL
```

---

## Advanced Diagnostics

### Contract Scanner Inspection

```bash
# Check contract discovery
docker logs my-service 2>&1 | grep "Contract scanner"

# View discovered contracts
docker logs my-service 2>&1 | grep "Discovered contract"

# Should show:
# [ContractScanner] Discovered contract: CreateUserCommand
# [ContractScanner] Discovered contract: UpdateUserCommand
```

### Schema Generation Debug

```typescript
// Enable schema generation logging
process.env.DEBUG = 'schema:*';

// View generated schema
import { SchemaGenerator } from '@banyanai/platform-contract-system';

const schema = SchemaGenerator.generate({
  contracts: [CreateUserCommand, UpdateUserCommand],
  serviceName: 'user-service'
});

console.log('Generated schema:', schema);
```

### Contract Registry Inspection

```bash
# Query contract registry
curl http://localhost:3001/api/services/my-service/contracts | jq '.'

# Get specific contract
curl http://localhost:3001/api/services/my-service/contracts/CreateUser | jq '.'

# View contract versions
curl http://localhost:3001/api/services/my-service/contracts/CreateUser/versions | jq '.'
```

---

## Best Practices

### 1. Always Use @Field() Decorator

```typescript
// Every contract field needs @Field()
@Contract()
export class MyCommand {
  @Field()  // REQUIRED
  @IsString()
  field1!: string;

  @Field()  // REQUIRED
  @IsInt()
  field2!: number;
}
```

### 2. Export All Contracts

```typescript
// contracts.ts
export { CreateUserCommand } from './CreateUserCommand.js';
export { UpdateUserCommand } from './UpdateUserCommand.js';
export { DeleteUserCommand } from './DeleteUserCommand.js';
```

### 3. Use Semantic Versioning

```typescript
// Track breaking changes with major version
@Contract({ version: '1.0.0' })  // Initial
@Contract({ version: '1.1.0' })  // Added optional field
@Contract({ version: '2.0.0' })  // Breaking change
```

### 4. Validate Permissions

```typescript
// Validate permission format at compile time
type Permission = `${string}:${string}`;

@RequiresPermission('users:create' as Permission)
export class CreateUserHandler { }
```

### 5. Document Contracts

```typescript
@Contract({
  description: 'Creates a new user account',
  version: '1.0.0'
})
export class CreateUserCommand {
  @Field({
    description: 'User email address (must be unique)',
    example: 'user@example.com'
  })
  @IsEmail()
  email!: string;

  @Field({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePass123!'
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
```

---

## Related Documentation

- [Contract System Concepts](../../02-core-concepts/contract-system.md)
- [Contract Errors](../by-symptom/contract-errors.md)
- [Error Catalog](../common-errors/error-catalog.md)
- [Type Safety Guide](../../03-guides/contracts/type-safety.md)

---

## Summary

Most contract system issues are caused by:

1. **Missing @Field() decorators** - Every field needs @Field()
2. **Invalid permission format** - Use `resource:action` (lowercase, colon-separated)
3. **Dots in names** - Remove dots from class and field names
4. **Missing validators** - Add class-validator decorators
5. **Export issues** - Export all contract classes

Use contract validation tools and schema inspection to diagnose issues quickly.
