---
title: Error Catalog
description: Comprehensive catalog of all platform error codes with causes and solutions
category: troubleshooting
tags: [errors, error-codes, debugging, troubleshooting]
related:
  - ../by-component/read-model-issues.md
  - ../by-component/message-bus-issues.md
  - ../../02-core-concepts/error-handling.md
difficulty: reference
---

# Error Catalog

Comprehensive catalog of all platform error codes with causes, examples, and resolution steps.

## Table of Contents

- [Handler Discovery Errors](#handler-discovery-errors)
- [Authentication & Authorization Errors](#authentication--authorization-errors)
- [Contract Validation Errors](#contract-validation-errors)
- [Message Bus Errors](#message-bus-errors)
- [Event Store Errors](#event-store-errors)
- [Read Model Errors](#read-model-errors)
- [CQRS Errors](#cqrs-errors)
- [Domain Modeling Errors](#domain-modeling-errors)
- [Client System Errors](#client-system-errors)
- [Service Discovery Errors](#service-discovery-errors)
- [SSE Errors](#sse-errors)

---

## Handler Discovery Errors

### HANDLER_NOT_FOUND

**Error Code:** `HANDLER_NOT_FOUND`

**Error Message:**
```
No handler registered for message type: CreateUserCommand
```

**Cause:**
- Handler class not discovered during service startup
- Handler not in correct folder (`/commands/`, `/queries/`, `/events/`)
- Missing `@CommandHandler`, `@QueryHandler`, or `@EventHandler` decorator
- Handler class not exported from module

**Example:**
```typescript
// ❌ WRONG: Missing decorator
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // ...
  }
}

// ✓ CORRECT: With decorator
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // ...
  }
}
```

**Solution:**
1. Ensure handler has correct decorator
2. Place handler file in correct folder:
   - Commands: `/src/commands/SomethingHandler.ts`
   - Queries: `/src/queries/SomethingHandler.ts`
   - Events: `/src/events/SomethingHandler.ts`
3. Verify handler is exported: `export class CreateUserHandler`
4. Check service logs for handler discovery messages

**Quick Fix:**
```bash
# Check handler discovery logs
grep "Discovered.*Handler" service.log

# Verify folder structure
ls -R src/commands src/queries src/events
```

**Related:**
- [Handler Discovery Pattern](../../02-core-concepts/handler-discovery.md)

---

## Authentication & Authorization Errors

### AUTHORIZATION_ERROR (Layer 1)

**Error Code:** `AUTHORIZATION_ERROR`

**Error Message:**
```
Access denied to operation 'CreateUser'. Required permissions: [users:create],
User permissions: [users:read]
```

**Cause:**
- User lacks required permissions at API Gateway level
- JWT token missing required permission claims
- Permission decorator requires permissions user doesn't have

**Example:**
```typescript
@CommandHandler(CreateUserCommand)
@RequiresPermissions(['users:create'])
export class CreateUserHandler {
  // User needs 'users:create' permission
}
```

**Solution:**
1. Verify user has required permissions in JWT token
2. Check permission requirements in handler decorator
3. Grant required permissions to user/role in auth service
4. Verify permission format matches exactly (case-sensitive)

**Quick Fix:**
```bash
# Decode JWT token to check permissions
echo "YOUR_JWT_TOKEN" | base64 -d | jq '.permissions'

# Check handler permission requirements
grep "@RequiresPermissions" src/commands/CreateUserHandler.ts
```

---

### POLICY_VIOLATION (Layer 2)

**Error Code:** `POLICY_VIOLATION`

**Error Message:**
```
Policy 'OwnershipPolicy' violation for user 'user-123' on operation 'UpdateUser':
User can only update their own profile
```

**Cause:**
- User failed policy-based authorization check
- Business rule violation (e.g., editing someone else's resource)
- Policy logic returned false for current user

**Example:**
```typescript
@CommandHandler(UpdateUserCommand)
@RequiresPermissions(['users:update'])
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: ExecutionContext) {
    // Layer 2: Policy check
    if (command.userId !== context.user.userId && !context.user.isAdmin) {
      throw new PolicyViolationError(
        'OwnershipPolicy',
        context.user.userId,
        'UpdateUser',
        'User can only update their own profile'
      );
    }
  }
}
```

**Solution:**
1. Review policy violation reason in error message
2. Verify user meets business rule requirements
3. Check if user needs admin/special role for operation
4. Validate command parameters match user context

**Quick Fix:**
```typescript
// Add policy check logging
console.log('Policy check:', {
  userId: context.user.userId,
  targetUserId: command.userId,
  isAdmin: context.user.isAdmin
});
```

---

### POLICY_AUTH_REQUIRED

**Error Code:** `POLICY_AUTH_REQUIRED`

**Error Message:**
```
Authentication required: Operation requires authenticated user
```

**Cause:**
- Handler requires authentication but user is not authenticated
- JWT token missing or invalid
- Anonymous access attempted on protected operation

**Solution:**
1. Include JWT token in request
2. Verify token is valid and not expired
3. Check if operation allows anonymous access
4. Refresh expired token

---

### POLICY_PERMISSION_DENIED

**Error Code:** `POLICY_PERMISSION_DENIED`

**Error Message:**
```
Insufficient permissions for UpdateUser.
Required: users:update OR users:admin, Actual: users:read
```

**Cause:**
- User lacks any of the required permissions for policy check
- Policy requires at least one permission from list

**Solution:**
1. Grant one of the required permissions to user
2. Review policy permission requirements
3. Verify permission names match exactly

---

## Contract Validation Errors

### CONTRACT_VALIDATION_ERROR

**Error Code:** `CONTRACT_VALIDATION_ERROR`

**Error Message:**
```
Contract validation failed for service 'user-service': Invalid input schema
```

**Cause:**
- Contract input/output schema invalid
- Missing required contract fields
- Type definition errors in contract

**Example:**
```typescript
// ❌ WRONG: Missing input schema
export const CreateUserCommand = {
  messageType: 'CreateUserCommand',
  // Missing: inputSchema
};

// ✓ CORRECT: Complete contract
export const CreateUserCommand = {
  messageType: 'CreateUserCommand',
  inputSchema: {
    email: 'string',
    password: 'string'
  },
  outputSchema: {
    userId: 'string'
  }
};
```

**Solution:**
1. Ensure contract has valid `inputSchema` and `outputSchema`
2. Use TypeScript types for compile-time validation
3. Verify all required fields present in schema
4. Check contract syntax matches platform requirements

**Quick Fix:**
```typescript
// Validate contract structure
const contract = {
  messageType: 'CreateUserCommand',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  requiredPermissions: ['users:create']
};
```

---

### PERMISSION_VALIDATION_ERROR

**Error Code:** `PERMISSION_VALIDATION_ERROR`

**Error Message:**
```
Invalid permission format: 'users-create' (must use 'resource:action' format)
```

**Cause:**
- Permission string doesn't match required format
- Missing colon separator in permission
- Invalid characters in permission string

**Solution:**
1. Use format: `resource:action` (e.g., `users:create`)
2. Lowercase resource and action names
3. Verify permission names in contract declarations

**Quick Fix:**
```typescript
// ❌ WRONG
@RequiresPermissions(['users-create', 'USERS:DELETE'])

// ✓ CORRECT
@RequiresPermissions(['users:create', 'users:delete'])
```

---

### SCHEMA_GENERATION_ERROR

**Error Code:** `SCHEMA_GENERATION_ERROR`

**Error Message:**
```
Failed to generate GraphQL schema: Duplicate type name 'User'
```

**Cause:**
- Type name conflicts in schema generation
- Invalid GraphQL type definitions
- Circular type references

**Solution:**
1. Ensure unique type names across contracts
2. Check for naming conflicts in domain types
3. Review GraphQL schema generation logs
4. Use type aliases to resolve conflicts

---

## Message Bus Errors

### MESSAGE_BUS_ERROR

**Error Code:** `MESSAGE_BUS_ERROR`

**Error Message:**
```
Message bus operation 'publish' failed: Connection closed
```

**Cause:**
- RabbitMQ connection lost
- Network issues between service and message bus
- Message bus server unavailable
- Connection timeout

**Solution:**
1. Check RabbitMQ server status
2. Verify network connectivity
3. Review connection configuration
4. Check for firewall/proxy issues
5. Verify credentials and vhost access

**Quick Fix:**
```bash
# Check RabbitMQ status
docker ps | grep rabbitmq

# Test connection
curl http://localhost:15672/api/overview

# Check logs
docker logs rabbitmq
```

---

### CIRCUIT_BREAKER_OPEN

**Error Code:** `CIRCUIT_BREAKER_OPEN`

**Error Message:**
```
Circuit breaker is open for service 'user-service' after 5 failures
```

**Cause:**
- Service has failed repeatedly
- Circuit breaker protecting against cascade failures
- Target service unhealthy or unavailable

**Solution:**
1. Wait for circuit breaker to reset (half-open state)
2. Fix underlying service issues causing failures
3. Check target service health
4. Review circuit breaker configuration

**Quick Fix:**
```typescript
// Circuit breaker will auto-reset after timeout
// Check circuit breaker status in logs
[CircuitBreaker] State transition: open -> half-open
```

**Related:**
- [Circuit Breaker Pattern](../../02-core-concepts/resilience.md#circuit-breaker)

---

### RETRY_EXHAUSTED

**Error Code:** `RETRY_EXHAUSTED`

**Error Message:**
```
Operation 'SendEmail' failed after 3 retry attempts: SMTP connection refused
```

**Cause:**
- All retry attempts failed
- Persistent error condition
- Target service consistently unavailable

**Solution:**
1. Fix underlying error causing failures
2. Check target service availability
3. Review retry policy configuration
4. Investigate root cause of repeated failures

**Quick Fix:**
```typescript
// Adjust retry policy
const retryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
};
```

---

### REQUEST_TIMEOUT

**Error Code:** `REQUEST_TIMEOUT`

**Error Message:**
```
Operation 'GetUser' timed out after 5000ms
```

**Cause:**
- Target service too slow to respond
- Network latency issues
- Service overloaded
- Timeout configured too low

**Solution:**
1. Increase timeout if operation legitimately slow
2. Optimize slow handler logic
3. Check service performance metrics
4. Review database query performance

**Quick Fix:**
```typescript
// Adjust timeout
await queryBus.execute(new GetUserQuery(userId), {
  timeout: 10000 // 10 seconds
});
```

---

### OPERATION_TIMEOUT

**Error Code:** `OPERATION_TIMEOUT`

**Error Message:**
```
query 'GetUserQuery' timed out after 5000ms
```

**Cause:**
- Query handler execution too slow
- Database query performance issues
- Network latency to dependencies
- Timeout value too low for operation complexity

**Solution:**
1. Optimize query handler performance
2. Add database indexes for query
3. Increase timeout for complex operations
4. Review query execution plan

---

## Event Store Errors

### EVENT_STORE_ERROR

**Error Code:** `EVENT_STORE_ERROR`

**Error Message:**
```
Failed to save aggregate user-123: Database connection lost
```

**Cause:**
- Database connection issues
- Event serialization failures
- Concurrency conflicts
- Database constraints violated

**Solution:**
1. Check PostgreSQL database status
2. Verify database connectivity
3. Review event data for serialization issues
4. Check for concurrent updates to same aggregate

**Quick Fix:**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Check connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Review recent errors
tail -f postgresql.log
```

---

### AGGREGATE_CONCURRENCY_ERROR

**Error Code:** `AggregateConcurrencyError`

**Error Message:**
```
Concurrency conflict for aggregate user-123.
Expected version 5, but actual version is 6
```

**Cause:**
- Multiple commands modifying same aggregate concurrently
- Optimistic locking conflict
- Command executed against stale aggregate version

**Example:**
```typescript
// Two concurrent updates to same user
// First update succeeds, second fails with concurrency error
await commandBus.execute(new UpdateUserEmailCommand(userId, 'new1@example.com'));
await commandBus.execute(new UpdateUserEmailCommand(userId, 'new2@example.com'));
```

**Solution:**
1. Retry the command to load latest version
2. Implement retry logic for concurrency conflicts
3. Review command ordering and execution patterns
4. Consider using saga for coordinated updates

**Quick Fix:**
```typescript
// Auto-retry on concurrency error
try {
  await commandBus.execute(command);
} catch (error) {
  if (error instanceof AggregateConcurrencyError) {
    // Reload aggregate and retry
    await commandBus.execute(command);
  }
}
```

---

### AGGREGATE_NOT_FOUND

**Error Code:** `AggregateNotFoundError`

**Error Message:**
```
User with ID user-123 not found
```

**Cause:**
- Aggregate ID doesn't exist in event store
- Attempting to load non-existent aggregate
- Typo in aggregate ID
- Aggregate deleted or never created

**Solution:**
1. Verify aggregate ID is correct
2. Check if aggregate was created successfully
3. Use exists check before loading
4. Handle not found case in application logic

**Quick Fix:**
```typescript
// Check if aggregate exists first
const exists = await aggregateAccess.exists(userId);
if (!exists) {
  throw new NotFoundError('User', userId);
}

const user = await aggregateAccess.getById(userId);
```

---

### AGGREGATE_OPERATION_ERROR

**Error Code:** `AggregateOperationError`

**Error Message:**
```
Failed to apply event UserCreated to aggregate user-123
```

**Cause:**
- Error in event application logic
- Invalid event data
- Event handler throwing exception
- State transition validation failure

**Solution:**
1. Review event handler implementation
2. Validate event data structure
3. Check business rule violations
4. Add error handling in event handlers

---

## Read Model Errors

### ReadModelBase not initialized

**Error Message:**
```
ReadModelBase not initialized. Call ReadModelBase.initialize() first.
```

**Cause:**
- Read model base class not initialized with database config
- Missing initialization call during service startup

**Solution:**
```typescript
import { ReadModelBase } from '@banyanai/platform-event-sourcing';

// Initialize before using read models
ReadModelBase.initialize(dbConfig, 'my-service');
```

**Quick Fix:**
Add initialization to service startup:
```typescript
await BaseService.start({ /* ... */ });
ReadModelBase.initialize(config.database, config.serviceName);
```

**Related:**
- [Read Model Issues](../by-component/read-model-issues.md)

---

### Projections table not found

**Error Message:**
```
Projections table not found in public schema.
Ensure PostgresEventStore.initializeSchema() has been called first.
```

**Cause:**
- Event store schema not initialized
- Database migrations not run
- Wrong database selected

**Solution:**
```typescript
// Initialize event store schema BEFORE read models
const eventStore = new PostgresEventStore(dbConfig);
await eventStore.initializeSchema();

// Then initialize read models
await readModelManager.initialize([UserReadModel]);
```

**Quick Fix:**
```sql
-- Manually create projections table
CREATE TABLE IF NOT EXISTS projections (
  id TEXT NOT NULL,
  projection_name TEXT NOT NULL,
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, projection_name)
);

CREATE INDEX IF NOT EXISTS idx_projections_name ON projections(projection_name);
CREATE INDEX IF NOT EXISTS idx_projections_data ON projections USING GIN (data);
```

---

### Failed to persist projection

**Error Message:**
```
Failed to persist projection user_read_model.email for aggregate user-123:
duplicate key value violates unique constraint "idx_user_email"
```

**Cause:**
- Unique constraint violation
- Duplicate data in projection
- Event replay creating duplicates

**Solution:**
1. Check for duplicate records in projections table
2. Review unique indexes on read model
3. Ensure projection handlers are idempotent
4. Clean up duplicate data before replay

**Quick Fix:**
```sql
-- Find duplicates
SELECT data->>'email', COUNT(*)
FROM projections
WHERE projection_name = 'user_read_model'
GROUP BY data->>'email'
HAVING COUNT(*) > 1;

-- Remove duplicates (keep newest)
DELETE FROM projections p1
WHERE projection_name = 'user_read_model'
  AND EXISTS (
    SELECT 1 FROM projections p2
    WHERE p2.projection_name = p1.projection_name
      AND p2.data->>'email' = p1.data->>'email'
      AND p2.updated_at > p1.updated_at
  );
```

**Related:**
- [Read Model Issues - Projection Failures](../by-component/read-model-issues.md#4-projection-failures)

---

## CQRS Errors

### VALIDATION_ERROR

**Error Code:** `VALIDATION_ERROR` (CQRS)

**Error Message:**
```
Validation failed for fields: email, password
```

**Cause:**
- Command or query input validation failed
- Required fields missing
- Field values don't meet constraints

**Example:**
```typescript
// Validation error with field details
throw new CQRSValidationError(
  'Validation failed',
  correlationId,
  [
    { field: 'email', message: 'Invalid email format', value: 'not-an-email' },
    { field: 'password', message: 'Password too short', value: '123' }
  ]
);
```

**Solution:**
1. Verify all required fields provided
2. Check field value constraints
3. Review validation rules in handler
4. Ensure input data types match schema

**Quick Fix:**
```typescript
// Client-side validation before sending
function validateCreateUser(input: CreateUserInput) {
  const errors = [];

  if (!input.email || !input.email.includes('@')) {
    errors.push({ field: 'email', message: 'Valid email required' });
  }

  if (!input.password || input.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  return errors;
}
```

---

### UNKNOWN_ERROR

**Error Code:** `UNKNOWN_ERROR`

**Error Message:**
```
An unknown error occurred
```

**Cause:**
- Unexpected exception in handler
- Unhandled error type
- Error not properly wrapped

**Solution:**
1. Check service logs for full error details
2. Add proper error handling in handler
3. Wrap errors in domain-specific error types
4. Review stack trace for root cause

---

## Domain Modeling Errors

### DOMAIN_ERROR

**Error Message:**
```
Cannot send invoice with no line items
```

**Cause:**
- Business rule violation in domain logic
- Invalid state transition
- Precondition not met

**Example:**
```typescript
@AggregateRoot()
class Invoice {
  send() {
    if (this.lineItems.length === 0) {
      throw new DomainError('Cannot send invoice with no line items');
    }

    if (this.status !== 'draft') {
      throw new DomainError('Can only send draft invoices');
    }

    // Apply business logic
  }
}
```

**Solution:**
1. Review business rule that was violated
2. Ensure aggregate in correct state before operation
3. Validate preconditions met
4. Check domain invariants

---

### DOMAIN_ASSERTION_FAILED

**Error Code:** `DOMAIN_ASSERTION_FAILED`

**Error Message:**
```
Assertion failed: Amount must be positive
```

**Cause:**
- Domain assertion check failed
- Invariant violation
- Invalid argument to domain method

**Solution:**
1. Review assertion requirements
2. Validate input parameters
3. Check domain constraints
4. Ensure valid state before operation

---

## Client System Errors

### SERVICE_UNAVAILABLE

**Error Code:** `SERVICE_UNAVAILABLE`

**Error Message:**
```
user-service: Service is currently unavailable
```

**Cause:**
- Target service not running
- Service not registered in service discovery
- Network connectivity issues
- Service in unhealthy state

**Solution:**
1. Check if target service is running
2. Verify service discovery registration
3. Check service health endpoint
4. Review service logs for errors

**Quick Fix:**
```bash
# Check service status
docker ps | grep user-service

# Check service discovery
curl http://localhost:3001/health

# Restart service
docker restart user-service
```

---

### SERVICE_DEGRADED

**Error Code:** `SERVICE_DEGRADED`

**Error Message:**
```
user-service: Service is operating in degraded mode
```

**Cause:**
- Service partially functional
- Some dependencies unavailable
- Performance degradation
- Resource constraints

**Solution:**
1. Check service health metrics
2. Review dependency status
3. Monitor resource usage
4. Consider graceful degradation in calling code

---

### CLIENT_GENERATION_FAILED

**Error Code:** `CLIENT_GENERATION_FAILED`

**Error Message:**
```
Client generation failed for service 'user-service' at step 'type-generation':
Invalid type definition
```

**Cause:**
- Contract type definitions invalid
- Code generation errors
- TypeScript compilation failures

**Solution:**
1. Review contract definitions
2. Check type generation logs
3. Validate TypeScript syntax
4. Ensure all types properly exported

---

### CONTRACT_VIOLATION

**Error Code:** `CONTRACT_VIOLATION`

**Error Message:**
```
Contract violation in operation 'CreateUser':
Response missing required field 'userId'
```

**Cause:**
- Handler returned data not matching output schema
- Missing required fields in response
- Type mismatch between handler and contract

**Solution:**
1. Verify handler return type matches output schema
2. Ensure all required fields included in response
3. Check contract definition accuracy
4. Add runtime validation in handler

**Quick Fix:**
```typescript
// Ensure response matches contract
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    const userId = await this.createUser(command);

    // ✓ Return matches output schema
    return {
      userId, // Required field
      email: command.email
    };
  }
}
```

---

### CORRELATION_CONTEXT_MISSING

**Error Code:** `CORRELATION_CONTEXT_MISSING`

**Error Message:**
```
Correlation context not available for operation 'CreateUser'
```

**Cause:**
- AsyncLocalStorage context not set
- Context lost during async operation
- Missing context propagation

**Solution:**
1. Ensure operation called within async context
2. Check context propagation through async boundaries
3. Verify BaseService initialized correctly
4. Review async middleware setup

---

## Service Discovery Errors

### SERVICE_NOT_REGISTERED

**Error Message:**
```
Service 'user-service' not found in service discovery
```

**Cause:**
- Service not started
- Service discovery registration failed
- Service name mismatch
- Service crashed before registration

**Solution:**
1. Start the service
2. Check service discovery logs
3. Verify service name configuration
4. Review service health checks

**Quick Fix:**
```bash
# Check registered services
curl http://localhost:3001/api/services | jq '.services[].name'

# Restart service to re-register
docker restart user-service
```

---

### CONTRACT_NOT_FOUND

**Error Message:**
```
No contracts found for service 'user-service'
```

**Cause:**
- Service started but contracts not broadcast
- Contract registration failed
- Service discovery not receiving contracts

**Solution:**
1. Check service logs for contract broadcasting
2. Verify message bus connectivity
3. Ensure contracts properly exported
4. Review service discovery subscription

---

## SSE Errors

### SSE_CONNECTION_UNAUTHORIZED

**HTTP Status:** 401 Unauthorized

**Error Message:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required for SSE connection"
}
```

**Cause:**
- No JWT token provided
- Invalid JWT token
- Token expired

**Solution:**
1. Include JWT token in request:
   - Query param: `?token=YOUR_JWT_TOKEN`
   - Header: `Authorization: Bearer YOUR_JWT_TOKEN`
2. Refresh expired token
3. Verify token format and signature

**Quick Fix:**
```javascript
// Include token in connection
const token = localStorage.getItem('jwt');
const eventSource = new EventSource(`/api/events?token=${token}`);
```

---

### SSE_CONNECTION_FORBIDDEN

**HTTP Status:** 403 Forbidden

**Error Message:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for requested event types",
  "deniedEvents": ["AdminEvent", "SystemEvent"]
}
```

**Cause:**
- User lacks permissions for requested event types
- Subscription to protected events without authorization

**Solution:**
1. Subscribe to events user has permissions for
2. Grant required permissions to user
3. Filter event types based on user permissions

**Quick Fix:**
```javascript
// Subscribe only to allowed events
const eventSource = new EventSource(
  `/api/events?token=${token}&events=UserCreated,OrderPlaced`
);
```

---

### SSE_CONNECTION_LIMIT

**HTTP Status:** 503 Service Unavailable

**Error Message:**
```json
{
  "error": "Service Unavailable",
  "message": "Connection limit exceeded. Please close existing connections."
}
```

**Cause:**
- User exceeded maximum concurrent connections (default: 5)
- Browser tabs with open SSE connections
- Connections not properly closed

**Solution:**
1. Close unused SSE connections
2. Implement proper cleanup on page unload
3. Limit connections per user session
4. Configure higher connection limit if needed

**Quick Fix:**
```javascript
// Close connection on page unload
window.addEventListener('beforeunload', () => {
  eventSource.close();
});

// Track and limit connections
const connections = new Set();
function createSSE() {
  if (connections.size >= 3) {
    console.warn('Maximum connections reached');
    return;
  }

  const es = new EventSource('/api/events');
  connections.add(es);

  es.addEventListener('close', () => {
    connections.delete(es);
  });
}
```

---

## Error Handling Best Practices

### 1. Always Include Correlation ID

```typescript
import { getCorrelationId } from '@banyanai/platform-core';

try {
  await commandBus.execute(command);
} catch (error) {
  const correlationId = getCorrelationId(error) || 'unknown';
  console.error(`Error processing command [${correlationId}]:`, error);
}
```

### 2. Wrap External Errors

```typescript
try {
  await externalApi.call();
} catch (error) {
  throw new RemoteOperationError(
    'Failed to call external API',
    correlationId,
    'external-service',
    error
  );
}
```

### 3. Log Context with Errors

```typescript
catch (error) {
  Logger.error('Command execution failed', error, {
    commandType: command.constructor.name,
    userId: context.user.userId,
    correlationId: context.correlationId,
    timestamp: new Date().toISOString()
  });
}
```

### 4. Return Appropriate HTTP Status

```typescript
// In API Gateway error handler
if (error instanceof CQRSValidationError) {
  return { status: 400, body: { error: 'Validation failed', details: error.validationErrors } };
}

if (error instanceof CQRSAuthorizationError) {
  return { status: 403, body: { error: 'Access denied' } };
}

if (error instanceof NotFoundError) {
  return { status: 404, body: { error: 'Resource not found' } };
}

// Default to 500 for unexpected errors
return { status: 500, body: { error: 'Internal server error' } };
```

### 5. Implement Retry Logic for Transient Errors

```typescript
import { RetryManager } from '@banyanai/platform-message-bus-client';

const retryManager = new RetryManager({
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
});

await retryManager.executeWithRetry(
  async () => await messageBus.publish(event),
  {
    operation: 'publishEvent',
    serviceName: 'user-service',
    correlationId
  }
);
```

## Error Code Quick Reference

| Code | Category | Severity | Action |
|------|----------|----------|--------|
| `HANDLER_NOT_FOUND` | Discovery | Error | Check handler registration |
| `AUTHORIZATION_ERROR` | Auth | Error | Grant permissions |
| `POLICY_VIOLATION` | Auth | Error | Review business rules |
| `VALIDATION_ERROR` | Input | Error | Fix input data |
| `CONTRACT_VALIDATION_ERROR` | Contract | Error | Fix contract definition |
| `MESSAGE_BUS_ERROR` | Infrastructure | Error | Check RabbitMQ |
| `CIRCUIT_BREAKER_OPEN` | Resilience | Warning | Wait or fix service |
| `RETRY_EXHAUSTED` | Resilience | Error | Fix underlying issue |
| `REQUEST_TIMEOUT` | Performance | Error | Optimize or increase timeout |
| `EVENT_STORE_ERROR` | Storage | Error | Check PostgreSQL |
| `AGGREGATE_CONCURRENCY_ERROR` | Concurrency | Warning | Retry operation |
| `AGGREGATE_NOT_FOUND` | Data | Error | Verify ID exists |
| `SERVICE_UNAVAILABLE` | Discovery | Error | Start service |
| `SERVICE_DEGRADED` | Health | Warning | Monitor service |
| `DOMAIN_ERROR` | Business Logic | Error | Check business rules |

## Related Documentation

- [Read Model Issues](../by-component/read-model-issues.md)
- [Message Bus Issues](../by-component/message-bus-issues.md)
- [Error Handling Patterns](../../02-core-concepts/error-handling.md)
- [Monitoring & Debugging](../../04-operations/monitoring.md)

## Getting Help

If you encounter an error not listed here:

1. Check service logs for detailed error messages and stack traces
2. Search codebase for error message
3. Review related component documentation
4. Check issue tracker for similar errors
5. File a detailed bug report with:
   - Error message and code
   - Steps to reproduce
   - Service logs
   - Configuration details
   - Expected vs actual behavior
