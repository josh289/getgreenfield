---
title: Correlation ID Tracking
description: Using correlation IDs to track requests across services
category: troubleshooting
tags: [correlation-id, tracing, debugging, observability]
related:
  - ./jaeger-tracing.md
  - ./log-analysis.md
  - ../../02-core-concepts/telemetry.md
difficulty: beginner
---

# Correlation ID Tracking

## Overview

A correlation ID is a unique identifier that follows a request through its entire lifecycle across multiple services. It's the single most important tool for debugging distributed systems.

**One Correlation ID = One Complete Request Journey**

```
Client Request (abc-123)
  → API Gateway (abc-123)
    → User Service (abc-123)
      → Database Query (abc-123)
      → Event Published (abc-123)
        → Email Service (abc-123)
        → Notification Service (abc-123)
```

All logs, traces, and events for this request share the same correlation ID: `abc-123`

## Why Correlation IDs Matter

### Without Correlation IDs

```
[ERROR] Failed to create user
[ERROR] Database connection lost
[ERROR] Email send failed
[ERROR] Notification queue full
```

Which errors are related? Which request caused them? Unknown.

### With Correlation IDs

```
[ERROR] correlationId=abc-123 Failed to create user
[ERROR] correlationId=abc-123 Database connection lost
[ERROR] correlationId=def-456 Email send failed
[ERROR] correlationId=def-456 Notification queue full
```

Clear: `abc-123` had database issues, `def-456` had notification issues.

## Getting Correlation IDs

### 1. From HTTP Response Headers

```bash
curl -i http://localhost:3000/api/create-user

# Response headers:
HTTP/1.1 500 Internal Server Error
X-Correlation-Id: abc-123-def-456-ghi-789
Content-Type: application/json
```

Every response includes `X-Correlation-Id` header.

### 2. From Error Response Body

```bash
curl http://localhost:3000/api/create-user | jq

# Response:
{
  "error": "Internal Server Error",
  "correlationId": "abc-123-def-456-ghi-789",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 3. From Browser Dev Tools

**Network Tab:**

```
1. Open browser dev tools (F12)
2. Network tab
3. Click failed request
4. Headers tab
5. Look for X-Correlation-Id
```

**Console:**

```javascript
fetch('/api/endpoint')
  .then(res => {
    const correlationId = res.headers.get('X-Correlation-Id');
    console.log('Correlation ID:', correlationId);
  })
  .catch(err => {
    console.error('Error with correlation ID:', err.correlationId);
  });
```

### 4. From GraphQL Response

```graphql
mutation {
  createUser(input: {...}) {
    userId
    email
  }
}
```

GraphQL errors include correlation ID:

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "extensions": {
        "correlationId": "abc-123-def-456-ghi-789"
      }
    }
  ]
}
```

## Using Correlation IDs

### 1. Search Service Logs

```bash
# Get correlation ID from error
CORRELATION_ID="abc-123-def-456-ghi-789"

# Search all services
docker logs api-gateway | grep "$CORRELATION_ID"
docker logs user-service | grep "$CORRELATION_ID"
docker logs email-service | grep "$CORRELATION_ID"

# Or search all containers
docker ps --format "{{.Names}}" | xargs -I {} sh -c "echo '=== {} ===' && docker logs {} 2>&1 | grep '$CORRELATION_ID'"
```

**Results show complete request flow:**

```
=== api-gateway ===
[INFO] correlationId=abc-123 Request received: POST /api/create-user
[INFO] correlationId=abc-123 User authenticated: user-456
[INFO] correlationId=abc-123 Publishing command: CreateUserCommand

=== user-service ===
[INFO] correlationId=abc-123 Command received: CreateUserCommand
[INFO] correlationId=abc-123 Handler: CreateUserHandler
[ERROR] correlationId=abc-123 Database error: Connection timeout

=== email-service ===
[INFO] correlationId=abc-123 Event received: UserCreatedEvent
[WARN] correlationId=abc-123 Skipping email: user creation failed
```

### 2. Find Trace in Jaeger

```
1. Open Jaeger: http://localhost:16686
2. Service: Select "All Services" or specific service
3. Tags: correlation.id="abc-123-def-456-ghi-789"
4. Click "Find Traces"
5. Click on the trace to view details
```

**Trace shows:**

- Complete request timeline
- All service hops
- Duration of each operation
- Where error occurred

See [Jaeger Tracing](./jaeger-tracing.md) for details.

### 3. Filter Logs by Correlation ID

```bash
# Real-time filtering
docker logs -f user-service | grep "$CORRELATION_ID"

# With context (5 lines before/after)
docker logs user-service | grep -C 5 "$CORRELATION_ID"

# With timestamps
docker logs user-service --timestamps | grep "$CORRELATION_ID"

# Export to file
docker logs user-service | grep "$CORRELATION_ID" > request.log
```

### 4. Aggregate Logs (Production)

If using log aggregation (Elasticsearch, Splunk, etc.):

```
correlationId:"abc-123-def-456-ghi-789"
```

Shows all logs from all services for this request.

## Correlation ID Flow

### Request Initiation

**Client to API Gateway:**

```
Client Request (no correlation ID)
  ↓
API Gateway generates: abc-123-def-456
  ↓
All subsequent operations use: abc-123-def-456
```

### Service to Service

**API Gateway to Service:**

```
API Gateway
  ├─ Creates message with correlationId: abc-123
  └─ Publishes to RabbitMQ

User Service
  ├─ Receives message
  ├─ Extracts correlationId: abc-123
  └─ Uses for all operations
```

### Event Publishing

**Service to Event:**

```
User Service
  ├─ Creates event
  ├─ Includes correlationId: abc-123
  └─ Publishes event

Email Service
  ├─ Receives event
  ├─ Extracts correlationId: abc-123
  └─ Sends email (logs with same correlation ID)
```

### Database Operations

**Service to Database:**

```
User Service
  ├─ Runs query
  └─ Logs: correlationId=abc-123 "SELECT * FROM users..."

Database (if logged)
  └─ Query executed (correlation ID in connection metadata)
```

## Debugging with Correlation IDs

### Scenario 1: User Reports Error

**User:** "I got an error when creating an account"

**You:** "What was the correlation ID?"

**User:** "abc-123-def-456-ghi-789" (from error message)

**Your workflow:**

```bash
# 1. Search logs
CORR_ID="abc-123-def-456-ghi-789"
docker ps --format "{{.Names}}" | xargs -I {} sh -c "docker logs {} 2>&1 | grep -q '$CORR_ID' && echo '=== {} ===' && docker logs {} 2>&1 | grep '$CORR_ID'"

# 2. Find error
# Results show: Database validation failed: Email already exists

# 3. Verify in Jaeger
# Open http://localhost:16686
# Search: correlation.id="abc-123-def-456-ghi-789"
# See: CreateUserHandler failed at email validation

# 4. Resolution
# Tell user: Email already registered
```

**Time to resolution: 2 minutes** (vs. hours without correlation ID)

### Scenario 2: Intermittent Timeout

**Symptom:** Some requests timeout, others succeed

**Workflow:**

```bash
# 1. Get correlation IDs from failed requests
# From error responses or logs

TIMEOUT_IDS=(
  "abc-123"
  "def-456"
  "ghi-789"
)

# 2. Search Jaeger for slow traces
for id in "${TIMEOUT_IDS[@]}"; do
  echo "Checking $id"
  # Search Jaeger: correlation.id="$id"
done

# 3. Compare durations
# Fast requests: ~100ms
# Slow requests: >30s

# 4. Find common pattern
# All slow requests have same database query
# Query waiting for lock

# 5. Resolution
# Add database index
# Problem solved
```

### Scenario 3: Event Not Received

**Symptom:** UserCreated event not triggering email

**Workflow:**

```bash
# 1. Get correlation ID from create user request
CORR_ID="abc-123"

# 2. Search publisher logs
docker logs user-service | grep "$CORR_ID" | grep "Event published"
# Results: Event published successfully

# 3. Check RabbitMQ
# Open http://localhost:15672
# Queues -> email-service.events
# Search messages for correlation ID
# Result: Message in queue but not consumed

# 4. Check email service
docker logs email-service | grep "$CORR_ID"
# No results = service not consuming

docker ps | grep email-service
# Status: Restarting

# 5. Resolution
# Email service crashed
# Restart: docker compose restart email-service
```

## Correlation ID Best Practices

### 1. Always Include in Error Reports

**User bug report template:**

```
Issue: [Description]
Correlation ID: [From error message or response headers]
Timestamp: [When it occurred]
```

### 2. Log Correlation ID in Custom Code

```typescript
// ✓ GOOD: Include correlation ID in logs
import { getCorrelationId } from '@banyanai/platform-core';

try {
  await doSomething();
} catch (error) {
  const correlationId = getCorrelationId();
  console.error('Operation failed', {
    correlationId,
    error: error.message,
    details: error.stack
  });
}

// ❌ BAD: No correlation ID
console.error('Operation failed', error);
```

### 3. Include in Frontend Error Tracking

```typescript
// Frontend error tracking (Sentry, etc.)
fetch('/api/endpoint')
  .catch(async (error) => {
    const response = await error.response;
    const correlationId = response.headers.get('X-Correlation-Id');

    Sentry.captureException(error, {
      tags: {
        correlationId
      }
    });
  });
```

### 4. Provide to Users

```typescript
// Show correlation ID to users in error UI
<ErrorMessage>
  Something went wrong. Please contact support with this ID:
  <Code>{correlationId}</Code>
</ErrorMessage>
```

### 5. Use for Load Testing

```typescript
// Generate known correlation IDs for load tests
const correlationId = `load-test-${testId}-${requestId}`;

// Easy to find in logs
docker logs api-gateway | grep "load-test-123"
```

## Correlation ID Format

Platform-generated correlation IDs use UUID v4:

```
abc-123-def-456-ghi-789
```

Format: 8-4-4-4-12 hexadecimal

**Properties:**
- Globally unique (collision probability ~0)
- URL-safe
- Case-insensitive
- Easy to copy/paste

## Advanced Techniques

### Correlation ID Propagation

Platform automatically propagates correlation IDs:

```
HTTP Request
  → API Gateway (extracts or generates)
    → RabbitMQ Message (includes correlation ID)
      → Service Handler (extracts from message)
        → Database Query (logs with correlation ID)
        → Event Publish (includes correlation ID)
          → Event Handler (extracts correlation ID)
```

**Manual propagation (if needed):**

```typescript
import { setCorrelationId, getCorrelationId } from '@banyanai/platform-core';

// Get current correlation ID
const correlationId = getCorrelationId();

// Set for async operation
await someAsyncOperation((err, result) => {
  setCorrelationId(correlationId);  // Restore context
  // Now all logs will include correlation ID
});
```

### Correlation ID Chaining

For related but separate operations:

```typescript
// Original request
const originalId = getCorrelationId();  // abc-123

// Create child correlation ID for background task
const childId = `${originalId}-bg-task`;  // abc-123-bg-task

// Link child back to parent in logs
console.log('Background task started', {
  correlationId: childId,
  parentCorrelationId: originalId
});
```

### Correlation ID in Database

Store correlation ID with data for audit trail:

```typescript
await database.users.create({
  userId: generateId(),
  email: command.email,
  createdBy: userId,
  correlationId: getCorrelationId()  // Store for audit
});

// Later, when investigating:
// SELECT * FROM users WHERE correlation_id = 'abc-123';
```

## Troubleshooting Correlation IDs

### Correlation ID Missing

**Symptom:** Response has no X-Correlation-Id header

**Causes:**

1. **Old API Gateway version** - Update to 1.0.100+
2. **Proxy stripping headers** - Configure proxy to preserve headers
3. **Direct service call** - Bypass API Gateway (use gateway instead)

### Correlation ID Changes Mid-Request

**Symptom:** Different correlation IDs in same request flow

**Cause:** Service not extracting correlation ID from message

**Solution:**

Ensure using BaseService (automatically handles this):

```typescript
await BaseService.start({
  name: 'my-service',
  version: '1.0.0'
});
```

### Can't Find Correlation ID in Logs

**Symptom:** Have correlation ID but no logs found

**Causes:**

1. **Wrong service** - Try other services
2. **Wrong time range** - Expand time range
3. **Log level** - Increase to DEBUG
4. **Logs rotated** - Check log retention

**Solution:**

```bash
# Search all services
docker ps --format "{{.Names}}" | xargs -I {} sh -c "docker logs {} 2>&1 | grep -q '$CORR_ID' && echo {}"

# Increase time range
docker logs my-service --since 24h | grep "$CORR_ID"

# Check if logs rotated
docker logs my-service --tail 10000 | grep "$CORR_ID"
```

## Related Documentation

- [Jaeger Tracing](./jaeger-tracing.md) - Visual trace analysis
- [Log Analysis](./log-analysis.md) - Log searching techniques
- [Telemetry Architecture](../../02-core-concepts/telemetry.md) - How tracing works

---

## Summary

**Correlation IDs are the key to debugging distributed systems.**

Always:
1. **Get correlation ID** from error response or headers
2. **Search logs** across all services
3. **Find trace** in Jaeger
4. **Identify failure point** in request flow

Never try to debug without a correlation ID - you'll be searching blind.

When reporting issues, always include the correlation ID. It turns a difficult debugging session into a simple log search.
