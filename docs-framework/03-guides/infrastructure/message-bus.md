# Message Bus Guide

## Overview

RabbitMQ is the **exclusive communication method** between all services in the banyan-core platform. Services never make direct HTTP calls to each other - all communication flows through the message bus.

## Architecture

```
Service A                  RabbitMQ                  Service B
   │                          │                         │
   │  1. Send Command         │                         │
   ├─────────────────────────>│                         │
   │                          │  2. Route to Queue      │
   │                          ├────────────────────────>│
   │                          │                         │
   │                          │  3. Process & Respond   │
   │                          │<────────────────────────┤
   │  4. Receive Response     │                         │
   │<─────────────────────────┤                         │
```

## Connection Configuration

### Environment Variables

```bash
# Message bus connection
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672

# Connection pool settings (optional)
RABBITMQ_POOL_MIN=2
RABBITMQ_POOL_MAX=10
RABBITMQ_POOL_IDLE_TIMEOUT=30000
```

### Programmatic Configuration

```typescript
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  name: 'my-service',
  version: '1.0.0',
  messageBus: {
    connection: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      heartbeat: 60,
      connectionTimeout: 10000
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeout: 30000
    }
  }
});
```

## Queue Naming Convention

### Service Queues

Format: `service.{serviceName}.{queueType}.{messageType}`

Examples:
```
service.user-service.commands.CreateUser
service.user-service.queries.GetUser
service.order-service.commands.ProcessOrder
```

### Event Queues

Format: `exchange.platform.events.{serviceName}.{eventName}`

Examples:
```
exchange.platform.events.user-service.usercreated
exchange.platform.events.order-service.orderplaced
```

### Response Queues

Format: `response.{serviceName}.{correlationId}`

Examples:
```
response.api-gateway.cor_abc123xyz
response.user-service.cor_def456uvw
```

## Message Patterns

### 1. Request-Response (Commands & Queries)

**Used for**: Commands (Create, Update, Delete) and Queries (Get, List)

```typescript
// Sender (any service)
const result = await messageBus.send(CreateUserContract, {
  email: 'alice@example.com',
  name: 'Alice Smith'
});

// Handler (target service)
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: { email: string; name: string }) {
    const user = await this.userRepository.create(input);
    return user; // Automatically sent back to sender
  }
}
```

**Flow**:
1. Sender publishes message to `service.user-service.commands.CreateUser`
2. Handler receives message, processes it
3. Handler returns result
4. Result sent to sender's response queue
5. Sender receives response via correlation ID

### 2. Publish-Subscribe (Events)

**Used for**: Domain events (UserCreated, OrderPlaced, etc.)

```typescript
// Publisher (any service)
await messageBus.publish(UserCreatedEvent, {
  userId: 'usr_123',
  email: 'alice@example.com',
  name: 'Alice Smith'
});

// Subscriber (any service)
await messageBus.subscribe(
  UserCreatedEvent,
  async (event) => {
    console.log('User created:', event.userId);
    // Handle event (send welcome email, update analytics, etc.)
  }
);
```

**Flow**:
1. Publisher sends event to `exchange.platform.events` exchange
2. RabbitMQ routes event to all subscriber queues
3. Each subscriber processes event independently
4. No response expected (fire-and-forget)

## Exchange Configuration

### Platform Events Exchange

```
Name: exchange.platform.events
Type: topic
Durable: true
Auto-delete: false
```

**Routing Keys**: `{serviceName}.{eventName}`

Examples:
```
user-service.usercreated
order-service.orderplaced
payment-service.paymentprocessed
```

### Service Exchanges

Created automatically per service:

```
Name: service.{serviceName}.commands
Type: direct
Durable: true
Auto-delete: false
```

## Queue Configuration

### Command/Query Queues

```yaml
Queue: service.user-service.commands.CreateUser
Durable: true
Exclusive: false
Auto-delete: false
Prefetch: 10
```

### Event Subscriber Queues

```yaml
Queue: exchange.platform.events.notification-service.usercreated
Durable: true
Exclusive: false
Auto-delete: false
Prefetch: 5
```

### Response Queues

```yaml
Queue: response.api-gateway.{correlationId}
Durable: false
Exclusive: true
Auto-delete: true
TTL: 30000  # 30 seconds
```

## Message Properties

### Standard Properties

Every message includes:

```typescript
{
  messageId: 'msg_abc123xyz',
  correlationId: 'cor_def456uvw',
  timestamp: Date,
  replyTo: 'response.api-gateway.cor_def456uvw',
  contentType: 'application/json',
  contentEncoding: 'utf-8',
  deliveryMode: 2, // Persistent
  priority: 1, // 0=low, 1=normal, 2=high
  headers: {
    'x-service-name': 'api-gateway',
    'x-message-type': 'CreateUserCommand',
    'x-trace-id': 'cor_def456uvw'
  }
}
```

### Message Envelope

All payloads wrapped in envelope:

```typescript
interface MessageEnvelope<T> {
  id: string;
  correlationId: string;
  traceContext?: TraceContextData;
  timestamp: Date;
  serviceName: string;
  messageType: string;
  payload: T;
  metadata: {
    auth?: MessageAuthContext;
    retry?: RetryMetadata;
    routing?: RoutingMetadata;
  };
}
```

## Connection Pooling

### Pool Management

The platform maintains connection pools:

```typescript
{
  min: 2,          // Minimum connections
  max: 10,         // Maximum connections
  idleTimeout: 30000  // Close idle after 30s
}
```

### Channel Management

Channels are acquired/released per operation:

```typescript
// Acquire channel from pool
const channel = await channelManager.acquireChannel(connection, 'rpc');

try {
  // Use channel for operation
  await channel.sendToQueue(queue, message);
} finally {
  // Always release channel
  channelManager.releaseChannel(channel);
}
```

## Reliability Features

### 1. Message Persistence

All commands and events are durable:

```typescript
// Message persisted to disk
await messageBus.send(CreateUserContract, payload);
await messageBus.publish(UserCreatedEvent, event);
```

### 2. Acknowledgments

Messages acknowledged after successful processing:

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any) {
    const result = await this.userRepository.create(input);
    return result;
    // Auto-acknowledged on success
  }
}
```

### 3. Dead Letter Queue

Failed messages routed to DLQ:

```
Queue: dlq.service.user-service.commands.CreateUser
```

After max retries (default 3), messages moved to DLQ for inspection.

### 4. Circuit Breaker

Automatic circuit breaking on repeated failures:

```typescript
{
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  recoveryTimeout: 30000,   // Try recovery after 30s
  monitoringWindow: 60000   // Track failures over 60s
}
```

### 5. Retry Policy

Exponential backoff for transient failures:

```typescript
{
  maxAttempts: 3,
  initialDelay: 1000,       // 1 second
  maxDelay: 30000,          // 30 seconds
  backoffMultiplier: 2.0,
  jitter: true
}
```

## Performance Optimization

### Prefetch Count

Control concurrent message processing:

```typescript
// Low prefetch for heavy processing
await messageBus.registerHandler(ProcessVideoContract, handler, {
  prefetch: 1
});

// Higher prefetch for light processing
await messageBus.registerHandler(GetUserContract, handler, {
  prefetch: 10
});
```

### Message Batching

Batch multiple messages:

```typescript
await messageBus.publishBatch([
  { contract: UserCreatedEvent, payload: user1 },
  { contract: UserCreatedEvent, payload: user2 },
  { contract: UserCreatedEvent, payload: user3 }
]);
```

### Message Compression

Large messages auto-compressed:

```typescript
// Messages > 1KB automatically compressed with gzip
await messageBus.send(BulkImportContract, largePayload);
```

## Monitoring

### RabbitMQ Management UI

Access at: `http://localhost:55672`

**Credentials**: admin / admin123

**Features**:
- Queue metrics (depth, rate, consumers)
- Connection monitoring
- Channel statistics
- Message rates and details
- Exchange configuration

### Key Metrics

Monitor these in RabbitMQ UI or Grafana:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Queue Depth | > 1000 | Scale consumers |
| Message Rate | Dropping | Check service health |
| Connection Count | > 50 | Check connection leaks |
| Channel Count | > 200 | Check channel leaks |
| Unacked Messages | > 100 | Check handler performance |

### Health Checks

```bash
# RabbitMQ alarms
curl http://localhost:55672/api/health/checks/alarms

# Queue stats
curl -u admin:admin123 http://localhost:55672/api/queues
```

## Best Practices

### 1. Always Use Contracts

```typescript
// Good: Type-safe contract
await messageBus.send(CreateUserContract, payload);

// Avoid: Raw queue names (not supported)
// await messageBus.sendToQueue('some-queue', payload);
```

### 2. Handle Errors Gracefully

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any) {
    try {
      return await this.userRepository.create(input);
    } catch (error) {
      // Log error for observability
      this.logger.error('Failed to create user', error);
      // Rethrow for retry logic
      throw error;
    }
  }
}
```

### 3. Set Appropriate Timeouts

```typescript
// Short timeout for queries
await messageBus.send(GetUserContract, { id: 'usr_123' }, {
  timeout: 5000 // 5 seconds
});

// Longer timeout for long-running commands
await messageBus.send(ProcessVideoContract, video, {
  timeout: 300000 // 5 minutes
});
```

### 4. Use Event Subscriptions Wisely

```typescript
// Good: Specific event subscription
await messageBus.subscribe(UserCreatedEvent, handler, {
  subscriptionGroup: 'email-service' // Load balancing
});

// Avoid: Subscribing to all events
// Creates too many queues and overhead
```

### 5. Clean Up Resources

```typescript
// Always disconnect on shutdown
process.on('SIGTERM', async () => {
  await messageBus.disconnect();
  process.exit(0);
});
```

## Troubleshooting

### Connection Refused

**Cause**: RabbitMQ not running or wrong URL

**Solution**:
```bash
# Check RabbitMQ is running
docker compose ps rabbitmq

# Check connection string
echo $RABBITMQ_URL
```

### Queue Not Found

**Cause**: Service not running or contract not registered

**Solution**:
```bash
# Check service registered contracts
curl http://localhost:3002/api/contracts

# Verify queue exists
curl -u admin:admin123 http://localhost:55672/api/queues
```

### Messages Stuck in Queue

**Cause**: No consumers or handler errors

**Solution**:
```bash
# Check consumers
curl -u admin:admin123 http://localhost:55672/api/queues/%2F/service.user-service.commands.CreateUser

# Check service logs
docker compose logs user-service
```

### High Memory Usage

**Cause**: Queue buildup or message size

**Solution**:
```bash
# Check queue depth
curl -u admin:admin123 http://localhost:55672/api/queues | grep messages_ready

# Purge queue (development only)
curl -u admin:admin123 -X DELETE \
  http://localhost:55672/api/queues/%2F/service.user-service.commands.CreateUser/contents
```

## Next Steps

- [Message Protocols Reference](../../04-reference/message-protocols/overview.md)
- [Observability Guide](./observability.md)
- [Deployment Guide](./deployment.md)
