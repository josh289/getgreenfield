# Message Protocols Reference

## Overview

This reference documents the message protocols used for inter-service communication in the banyan-core platform. All services communicate exclusively through RabbitMQ using these standardized message formats.

## Message Types

### 1. Commands

Commands represent **state-changing operations**:

- Create a user
- Process an order
- Delete a resource

**Characteristics**:
- **Request-response** pattern
- **Single handler** processes command
- **Synchronous** from caller's perspective
- **Returns result** to sender

**Example**: `CreateUserCommand`

### 2. Queries

Queries represent **read operations**:

- Get user by ID
- List all orders
- Search products

**Characteristics**:
- **Request-response** pattern
- **Single handler** processes query
- **Synchronous** from caller's perspective
- **Returns data** to sender
- **May use caching**

**Example**: `GetUserQuery`

### 3. Events

Events represent **things that happened**:

- User was created
- Order was placed
- Payment was processed

**Characteristics**:
- **Publish-subscribe** pattern
- **Multiple subscribers** can handle event
- **Asynchronous** (fire-and-forget)
- **No response** expected
- **Eventually consistent**

**Example**: `UserCreatedEvent`

## Message Envelope

All messages wrapped in standard envelope:

```typescript
interface MessageEnvelope<T> {
  /** Unique message identifier */
  id: string;

  /** Correlation ID for distributed tracing */
  correlationId: string;

  /** W3C Trace Context for telemetry integration */
  traceContext?: TraceContextData;

  /** Message creation timestamp */
  timestamp: Date;

  /** Source service name */
  serviceName: string;

  /** Message type identifier */
  messageType: string;

  /** Actual message payload */
  payload: T;

  /** Additional metadata */
  metadata: MessageMetadata;
}
```

## Message Metadata

### Structure

```typescript
interface MessageMetadata {
  /** Authentication context (if authenticated) */
  auth?: MessageAuthContext;

  /** Retry tracking information */
  retry?: RetryMetadata;

  /** Routing hints */
  routing?: RoutingMetadata;
}
```

### Authentication Context

```typescript
interface MessageAuthContext {
  userId: string;
  permissions: readonly string[];
  email: string;
  name: string;
  correlationId: string;
}
```

**Populated by**: API Gateway on external requests

**Used for**: Authorization checks in handlers

### Retry Metadata

```typescript
interface RetryMetadata {
  attemptCount: number;
  maxAttempts: number;
  firstAttempt: Date;
  currentAttempt: Date;
  lastError: string;
  backoffDelay: number;
}
```

**Populated by**: Message bus client on retries

**Used for**: Exponential backoff and dead letter queue routing

### Routing Metadata

```typescript
interface RoutingMetadata {
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  routingKey?: string;
  exchange?: string;
  queue?: string;
}
```

**Populated by**: Sender with SendOptions or PublishOptions

**Used for**: Message prioritization and routing

## Trace Context

### W3C Trace Context

```typescript
interface TraceContextData {
  /** 32 hexadecimal characters (16 bytes) */
  traceId: string;

  /** 16 hexadecimal characters (8 bytes) */
  spanId: string;

  /** 2 hexadecimal characters (1 byte) */
  traceFlags: string;

  /** Optional vendor-specific state */
  traceState?: string;
}
```

**Example**:
```typescript
{
  traceId: "0af7651916cd43dd8448eb211c80319c",
  spanId: "b7ad6b7169203331",
  traceFlags: "01",
  traceState: "congo=t61rcWkgMzE"
}
```

**Specification**: [W3C Trace Context](https://www.w3.org/TR/trace-context/)

## Correlation ID

### Purpose

Unique identifier that follows a request through all services:

```
External Request → API Gateway → Service A → Service B
      cor_abc123xyz
```

### Format

```
cor_{random_alphanumeric}

Example: cor_abc123xyz789
```

### Propagation

1. **Generated** by API Gateway on external requests
2. **Included** in MessageEnvelope.correlationId
3. **Propagated** through all service calls
4. **Logged** with every log entry
5. **Used** as trace ID in Jaeger

### Usage

```typescript
// Automatically available in handlers
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any, context: MessageContext) {
    const correlationId = context.correlationId;
    this.logger.info('Creating user', { correlationId });
    // correlationId automatically included in logs
  }
}
```

## Message Properties

### AMQP Properties

Every RabbitMQ message includes standard properties:

```typescript
{
  /** Unique message ID */
  messageId: string;

  /** Correlation ID for request-response */
  correlationId: string;

  /** Message timestamp */
  timestamp: number;

  /** Reply queue for responses */
  replyTo?: string;

  /** Content type (always application/json) */
  contentType: 'application/json';

  /** Content encoding (always utf-8) */
  contentEncoding: 'utf-8';

  /** Delivery mode (2 = persistent) */
  deliveryMode: 2;

  /** Message priority (0=low, 1=normal, 2=high) */
  priority: 0 | 1 | 2;

  /** Custom headers */
  headers: {
    'x-service-name': string;
    'x-message-type': string;
    'x-trace-id': string;
    'x-retry-count'?: number;
  };
}
```

## Serialization

### JSON Format

All messages serialized as JSON:

```json
{
  "id": "msg_abc123xyz",
  "correlationId": "cor_def456uvw",
  "traceContext": {
    "traceId": "0af7651916cd43dd8448eb211c80319c",
    "spanId": "b7ad6b7169203331",
    "traceFlags": "01"
  },
  "timestamp": "2025-11-15T10:30:00.000Z",
  "serviceName": "api-gateway",
  "messageType": "CreateUserCommand",
  "payload": {
    "email": "alice@example.com",
    "name": "Alice Smith"
  },
  "metadata": {
    "auth": {
      "userId": "usr_123",
      "permissions": ["users:create"],
      "email": "admin@example.com",
      "name": "Admin User",
      "correlationId": "cor_def456uvw"
    }
  }
}
```

### Date Handling

Dates serialized as ISO 8601 strings:

```json
{
  "timestamp": "2025-11-15T10:30:00.123Z",
  "createdAt": "2025-11-15T10:30:00.000Z"
}
```

Automatically converted to Date objects when deserialized.

### Compression

Messages > 1KB automatically compressed with gzip:

```typescript
// Large messages auto-compressed
await messageBus.send(BulkImportContract, largePayload);
// Compressed: 100KB → 10KB
```

Header indicates compression:
```typescript
headers: {
  'x-compression': 'gzip'
}
```

## Error Handling

### Error Messages

Errors propagated back to sender:

```json
{
  "error": {
    "code": "ValidationError",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "correlationId": "cor_abc123xyz",
    "timestamp": "2025-11-15T10:30:00.000Z",
    "stack": "Error: Invalid email format\n  at ..."
  }
}
```

### Error Codes

Standard error codes:

| Code | Description |
|------|-------------|
| `ValidationError` | Input validation failed |
| `NotFoundError` | Resource not found |
| `UnauthorizedError` | Authentication required |
| `ForbiddenError` | Insufficient permissions |
| `BusinessRuleError` | Business rule violation |
| `TimeoutError` | Operation timed out |
| `InternalError` | Unexpected server error |

## Message Size Limits

### Recommended Limits

| Message Type | Recommended Max | Hard Limit |
|--------------|----------------|------------|
| Commands | 10 KB | 1 MB |
| Queries | 5 KB | 100 KB |
| Events | 100 KB | 10 MB |
| Responses | 100 KB | 10 MB |

### Large Payloads

For large data, use reference pattern:

```typescript
// Bad: Large payload in message
await messageBus.send(ProcessFileContract, {
  fileContent: largeFileBuffer  // 50 MB
});

// Good: Store in S3, send reference
const fileUrl = await s3.upload(file);
await messageBus.send(ProcessFileContract, {
  fileUrl  // Just a URL
});
```

## Related References

- [Commands Reference](./commands.md)
- [Queries Reference](./queries.md)
- [Events Reference](./events.md)
- [Routing Reference](./routing.md)
