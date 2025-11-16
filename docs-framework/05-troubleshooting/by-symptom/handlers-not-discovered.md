---
title: Handlers Not Discovered
description: Troubleshooting guide when command, query, or event handlers are not found during service startup
category: troubleshooting
tags: [handlers, discovery, decorators, service-startup]
related:
  - ../../03-service-development/handlers.md
  - ../../03-service-development/contracts.md
  - ../debugging-tools/log-analysis.md
difficulty: beginner
aliases:
  - handler discovery issues
  - handlers not found
  - handler not registered
  - command handler not working
  - query handler not working
  - event handler not working
  - zero handlers discovered
relatedConcepts:
  - handler discovery mechanism
  - BaseService initialization
  - decorator registration
  - file naming conventions
  - handler exports
  - directory structure
commonQuestions:
  - Why isn't my handler being discovered?
  - How does handler discovery work?
  - What are the handler naming requirements?
  - Where should I put my handler files?
  - Do I need to manually register handlers?
  - Why is my command handler not being called?
  - Handler file exists but not discovered, why?
  - Why does service show 0 handlers discovered?
---

# Handlers Not Discovered

## Observable Symptoms

- Service starts successfully but reports 0 handlers discovered
- Log message shows: `Handler discovery completed { commandHandlers: 0, queryHandlers: 0, eventHandlers: 0 }`
- API calls return 404 or "Handler not found" errors
- Contract operations fail with "No handler found for message type"

## Quick Fix

```bash
# Check handler discovery logs
docker logs my-service 2>&1 | grep "Handler discovery"

# Verify handler files exist in correct locations
ls -la src/commands/
ls -la src/queries/
ls -la src/subscriptions/

# Check for decorator and export
grep -r "@CommandHandlerDecorator\|@QueryHandlerDecorator\|@EventSubscriptionHandlerDecorator" src/
```

## Common Causes (Ordered by Frequency)

### 1. Wrong Directory Location

**Frequency:** Very Common (40% of cases)

**Symptoms:**
- Handlers exist but not in conventional directories
- Using `events/` instead of `subscriptions/`
- Using custom directory names

**Diagnostic Steps:**

```bash
# Check where handler files are located
find src/ -name "*Handler.ts" -type f

# Should be in:
# src/commands/
# src/queries/
# src/subscriptions/

# NOT in:
# src/handlers/
# src/events/
# src/lib/
```

**Solution:**

Move handlers to correct directories:

```bash
# Wrong locations
src/handlers/CreateUserHandler.ts ❌
src/events/UserCreatedHandler.ts ❌

# Correct locations
src/commands/CreateUserHandler.ts ✓
src/queries/GetUserHandler.ts ✓
src/subscriptions/UserCreatedHandler.ts ✓
```

**Prevention:**
- Use CLI to generate handlers: `npx @banyanai/platform-cli generate handler CreateUser`
- Follow project template structure
- Review [Handler Discovery Pattern](../../02-core-concepts/handler-discovery.md)

---

### 2. Missing Decorator

**Frequency:** Very Common (35% of cases)

**Symptoms:**
- Handler in correct directory but not discovered
- No TypeScript compilation errors
- Class exists and is exported

**Diagnostic Steps:**

```typescript
// Check handler file for decorator
// ❌ WRONG: No decorator
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null) {
    // ...
  }
}

// ✓ CORRECT: Has decorator
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null) {
    // ...
  }
}
```

**Solution:**

Add appropriate decorator:

```typescript
// Command handlers
import { CommandHandlerDecorator } from '@banyanai/platform-cqrs';
import { CreateUserCommand } from '../contracts/commands.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<...> { }

// Query handlers
import { QueryHandlerDecorator } from '@banyanai/platform-cqrs';
import { GetUserQuery } from '../contracts/queries.js';

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<...> { }

// Event handlers
import { EventSubscriptionHandlerDecorator } from '@banyanai/platform-message-bus-client';
import { UserCreatedEvent } from '../contracts/events.js';

@EventSubscriptionHandlerDecorator(UserCreatedEvent)
export class UserCreatedHandler extends EventSubscriptionHandler<...> { }
```

**Prevention:**
- Use code snippets/templates with decorators
- Enable TypeScript strict mode to catch missing metadata
- Use handler generator CLI commands

---

### 3. Wrong Decorator Argument (String Instead of Class)

**Frequency:** Common (15% of cases)

**Symptoms:**
- Handler has decorator but still not discovered
- No TypeScript errors
- Decorator appears correct visually

**Diagnostic Steps:**

```typescript
// Check decorator argument type

// ❌ WRONG: String literal
@CommandHandlerDecorator('CreateUserCommand')
export class CreateUserHandler { }

// ❌ WRONG: Using .name property
@CommandHandlerDecorator(CreateUserCommand.name)
export class CreateUserHandler { }

// ✓ CORRECT: Class constructor reference
import { CreateUserCommand } from '../contracts/commands.js'; // VALUE import
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler { }
```

**Solution:**

Use class constructor reference:

```typescript
// Import contract as VALUE (not type-only)
import { CreateUserCommand } from '../contracts/commands.js';

// Decorator needs runtime value
@CommandHandlerDecorator(CreateUserCommand)  // Pass the class itself
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null) {
    // ...
  }
}
```

**Check imports:**

```typescript
// ❌ WRONG: Type-only import (no runtime value)
import type { CreateUserCommand } from '../contracts/commands.js';

// ✓ CORRECT: Value import
import { CreateUserCommand } from '../contracts/commands.js';
```

**Prevention:**
- Never use string literals in decorators
- Import contracts as values, not types
- Use const types for compile-time safety

---

### 4. Incorrect Filename

**Frequency:** Common (10% of cases)

**Symptoms:**
- Handler in correct directory with decorator
- Filename doesn't match convention

**Diagnostic Steps:**

```bash
# Check filenames
ls src/commands/

# ❌ WRONG filenames:
CreateUser.ts           # Missing "Handler"
CreateUserCommand.ts    # Wrong suffix
create-user-handler.ts  # Wrong case (lowercase)
createUserHandler.ts    # Wrong case (camelCase)

# ✓ CORRECT filenames:
CreateUserHandler.ts    # PascalCase with "Handler" suffix
```

**Solution:**

Rename files to match convention:

```bash
# Must end with "Handler.ts"
# Must be PascalCase

mv CreateUser.ts CreateUserHandler.ts
mv create-user-handler.ts CreateUserHandler.ts
```

**Convention:**
- Format: `{ActionName}Handler.ts`
- Case: PascalCase
- Suffix: Must end with `Handler.ts`

**Prevention:**
- Use handler generator CLI
- Configure linter to enforce naming convention
- Document naming patterns in team guidelines

---

### 5. Missing Export

**Frequency:** Occasional (5% of cases)

**Symptoms:**
- Handler file exists with decorator
- TypeScript compiles without errors
- Class not accessible to discovery scanner

**Diagnostic Steps:**

```typescript
// Check if class is exported

// ❌ WRONG: Not exported
@CommandHandlerDecorator(CreateUserCommand)
class CreateUserHandler extends CommandHandler<...> { }

// ✓ CORRECT: Exported
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<...> { }
```

**Solution:**

Add `export` keyword:

```typescript
// Ensure class is exported
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null) {
    // ...
  }
}
```

**Prevention:**
- Always export handler classes
- Use ESLint rule to require exports
- Review build output to verify exports

---

### 6. TypeScript Configuration Issues

**Frequency:** Occasional (3% of cases)

**Symptoms:**
- Decorators stripped during compilation
- Build succeeds but decorators not present in JavaScript output
- Runtime reflection metadata missing

**Diagnostic Steps:**

Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,     // REQUIRED
    "emitDecoratorMetadata": true,      // REQUIRED
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
```

Verify compiled output:

```bash
# Build service
pnpm run build

# Check compiled JavaScript has decorator metadata
cat dist/commands/CreateUserHandler.js

# Should see __decorate or similar decorator metadata
```

**Solution:**

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

Rebuild service:

```bash
# Clean build artifacts
rm -rf dist/

# Rebuild
pnpm run build

# Restart service
docker compose restart my-service
```

**Prevention:**
- Use provided `tsconfig.json` template
- Don't override critical compiler options
- Run type checking in CI/CD

---

### 7. Decorator and Handler Type Mismatch

**Frequency:** Rare (2% of cases)

**Symptoms:**
- Handler discovered but fails at runtime
- Type errors in logs
- Contract/handler mismatch errors

**Diagnostic Steps:**

```typescript
// Check decorator matches base class

// ❌ WRONG: Query decorator with Command handler
@QueryHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<...> { }

// ❌ WRONG: Command decorator with Query handler
@CommandHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<...> { }

// ✓ CORRECT: Matching types
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<...> { }

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<...> { }

@EventSubscriptionHandlerDecorator(UserCreatedEvent)
export class UserCreatedHandler extends EventSubscriptionHandler<...> { }
```

**Solution:**

Match decorator to handler type:

| Handler Type | Decorator | Base Class |
|--------------|-----------|------------|
| Command | `@CommandHandlerDecorator(...)` | `extends CommandHandler<...>` |
| Query | `@QueryHandlerDecorator(...)` | `extends QueryHandler<...>` |
| Event | `@EventSubscriptionHandlerDecorator(...)` | `extends EventSubscriptionHandler<...>` |

**Prevention:**
- Use consistent naming (CommandHandler for commands, etc.)
- Code review for type consistency
- Unit tests to verify handler registration

---

## Verification Steps

After fixing the issue, verify handlers are discovered:

### 1. Check Service Logs

```bash
# View startup logs
docker logs my-service 2>&1 | grep -A 5 "Handler discovery"

# Should show:
# Handler discovery completed {
#   commandHandlers: 3,
#   queryHandlers: 2,
#   eventHandlers: 1,
#   totalHandlers: 6
# }
```

### 2. Test Handler Execution

```bash
# Test command handler
curl -X POST http://localhost:3000/api/create-user \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: test-user" \
  -H "X-Dev-Permissions: users:create" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should return 200 OK with result (not 404)
```

### 3. Check Contract Broadcasting

```bash
# Verify contracts are broadcast to service discovery
curl http://localhost:3001/api/services/my-service/contracts | jq

# Should show handlers in contract list
```

### 4. Enable Debug Logging

```bash
# Set environment variable
LOG_LEVEL=debug docker compose up my-service

# Look for detailed discovery logs:
# [DEBUG] Scanning directory: /app/service/dist/commands
# [DEBUG] Found file: CreateUserHandler.js
# [DEBUG] Loading handler: CreateUserHandler
# [DEBUG] Handler registered: CreateUserHandler for CreateUserCommand
```

---

## Advanced Debugging

### Manual Discovery Test

Create a test script to verify handler metadata:

```typescript
// test-discovery.ts
import 'reflect-metadata';
import { CreateUserHandler } from './commands/CreateUserHandler.js';

// Check decorator metadata
const metadata = Reflect.getMetadata('banyan:command-handler', CreateUserHandler);
console.log('Handler metadata:', metadata);

// Should output: { contractClass: [Function: CreateUserCommand] }
```

### Check Build Output

```bash
# Verify handlers are in build output
find dist/ -name "*Handler.js" -type f

# Check JavaScript has decorator metadata
cat dist/commands/CreateUserHandler.js | grep -A 10 "__decorate"
```

### Verify Handler Registration

```typescript
// In service code, log handler registry
import { HandlerRegistry } from '@banyanai/platform-cqrs';

const registry = HandlerRegistry.getInstance();
const handlers = registry.getAllHandlers();

console.log('Registered handlers:', {
  commands: handlers.commands.size,
  queries: handlers.queries.size,
  events: handlers.events.size
});
```

---

## Directory Structure Reference

### Correct Structure

```
service/src/
├── commands/
│   ├── CreateUserHandler.ts
│   ├── UpdateUserHandler.ts
│   └── DeleteUserHandler.ts
├── queries/
│   ├── GetUserHandler.ts
│   └── ListUsersHandler.ts
├── subscriptions/
│   ├── UserCreatedHandler.ts
│   └── UserUpdatedHandler.ts
├── contracts/
│   ├── commands.ts
│   ├── queries.ts
│   └── events.ts
└── index.ts
```

### Subdirectories Supported

Handlers can be organized in subdirectories:

```
service/src/
├── commands/
│   ├── users/
│   │   ├── CreateUserHandler.ts
│   │   └── UpdateUserHandler.ts
│   └── organizations/
│       ├── CreateOrganizationHandler.ts
│       └── UpdateOrganizationHandler.ts
└── queries/
    └── users/
        └── GetUserHandler.ts
```

All handlers are discovered recursively.

---

## Complete Handler Checklist

Before deploying, verify each handler meets ALL requirements:

- [ ] Handler file in correct directory (`commands/`, `queries/`, or `subscriptions/`)
- [ ] Filename ends with `Handler.ts` in PascalCase
- [ ] Class has appropriate decorator (`@CommandHandlerDecorator`, `@QueryHandlerDecorator`, or `@EventSubscriptionHandlerDecorator`)
- [ ] Decorator argument is class constructor (not string)
- [ ] Contract imported as value (not type-only import)
- [ ] Handler extends appropriate base class
- [ ] Class is exported with `export` keyword
- [ ] TypeScript compiles without errors
- [ ] `experimentalDecorators: true` in `tsconfig.json`
- [ ] `emitDecoratorMetadata: true` in `tsconfig.json`
- [ ] Build output contains decorator metadata

---

## Related Documentation

- [Handler Development](../../03-service-development/handlers.md) - How to write handlers
- [Contracts](../../03-service-development/contracts.md) - Contract definition
- [Service Startup](../../02-core-concepts/base-service.md) - BaseService.start() behavior
- [Log Analysis](../debugging-tools/log-analysis.md) - Reading service logs
- [Error Catalog](../common-errors/error-catalog.md#handler_not_found) - HANDLER_NOT_FOUND error

---

## Summary

Handler discovery is automatic but requires strict adherence to conventions:

1. **Location**: `commands/`, `queries/`, or `subscriptions/` directories
2. **Naming**: `{ActionName}Handler.ts` in PascalCase
3. **Decorator**: Appropriate decorator with class reference (not string)
4. **Export**: Class must be exported
5. **TypeScript**: Decorators enabled in tsconfig

Follow these conventions and handlers will be discovered without any manual registration.
