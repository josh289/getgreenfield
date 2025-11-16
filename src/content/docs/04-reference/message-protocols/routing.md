---
title: "Message Routing Reference"
---

# Message Routing Reference

## Overview

This reference documents how messages are routed through RabbitMQ in the banyan-core platform, including queue naming, exchange configuration, and routing patterns.

## Routing Patterns

### 1. Direct Routing (Commands & Queries)

Messages routed directly to specific service queues:

```
Sender → Queue → Handler (1:1)
```

**Example**:
```
api-gateway → service.user-service.commands.CreateUser → CreateUserHandler
```

### 2. Topic Routing (Events)

Messages broadcast to all subscriber queues via exchange:

```
Publisher → Exchange → [Subscriber Queue 1, Subscriber Queue 2, ...]
```

**Example**:
```
user-service → exchange.platform.events → [
  exchange.platform.events.email-service.usercreated,
  exchange.platform.events.analytics-service.usercreated,
  exchange.platform.events.notification-service.usercreated
]
```

## Queue Naming Conventions

### Command Queues

**Format**: `service.{serviceName}.commands.{CommandName}`

**Examples**:
```
service.user-service.commands.CreateUser
service.order-service.commands.ProcessOrder
service.payment-service.commands.CapturePayment
```

**Properties**:
- Durable: Yes
- Exclusive: No
- Auto-delete: No
- Prefetch: 10 (default)

### Query Queues

**Format**: `service.{serviceName}.queries.{QueryName}`

**Examples**:
```
service.user-service.queries.GetUser
service.order-service.queries.ListOrders
service.product-service.queries.SearchProducts
```

**Properties**:
- Durable: Yes
- Exclusive: No
- Auto-delete: No
- Prefetch: 10 (default)

### Event Subscriber Queues

**Format**: `exchange.platform.events.{subscriberService}.{eventName}`

**Examples**:
```
exchange.platform.events.email-service.usercreated
exchange.platform.events.analytics-service.usercreated
exchange.platform.events.notification-service.orderplaced
```

**Note**: Event name is lowercase with no dashes.

**Properties**:
- Durable: Yes
- Exclusive: No
- Auto-delete: No
- Prefetch: 5 (default)

### Response Queues

**Format**: `response.{serviceName}.{correlationId}`

**Examples**:
```
response.api-gateway.cor_abc123xyz
response.user-service.cor_def456uvw
```

**Properties**:
- Durable: No (transient)
- Exclusive: Yes (single consumer)
- Auto-delete: Yes (deleted when consumer disconnects)
- TTL: 30 seconds

### Dead Letter Queues

**Format**: `dlq.{originalQueueName}`

**Examples**:
```
dlq.service.user-service.commands.CreateUser
dlq.exchange.platform.events.email-service.usercreated
```

**Properties**:
- Durable: Yes
- Exclusive: No
- Auto-delete: No

## Exchange Configuration

### Platform Events Exchange

**Name**: `exchange.platform.events`

**Properties**:
```yaml
Type: topic
Durable: true
Auto-delete: false
Internal: false
```

**Routing Keys**: `{serviceName}.{eventName}`

**Examples**:
```
user-service.usercreated
order-service.orderplaced
payment-service.paymentprocessed
```

### Service Command Exchanges (Optional)

**Name**: `service.{serviceName}.commands`

**Properties**:
```yaml
Type: direct
Durable: true
Auto-delete: false
```

**Usage**: Advanced routing scenarios

## Routing Keys

### Event Routing Keys

**Format**: `{serviceName}.{eventName}`

**Examples**:
```
user-service.usercreated
user-service.userupdated
user-service.userdeleted
order-service.orderplaced
order-service.ordershippped
payment-service.paymentprocessed
```

**Pattern Matching**:
```
# Subscribe to all user events
user-service.*

# Subscribe to all events from any service
*.*

# Subscribe to specific event from any service
*.usercreated
```

### Binding Patterns

```typescript
// Subscribe to all user events
await channel.bindQueue(
  'my-service-queue',
  'exchange.platform.events',
  'user-service.*'
);

// Subscribe to UserCreated from any service
await channel.bindQueue(
  'my-service-queue',
  'exchange.platform.events',
  '*.usercreated'
);

// Subscribe to all events
await channel.bindQueue(
  'my-service-queue',
  'exchange.platform.events',
  '#'
);
```

## Message Priority

### Priority Levels

| Priority | Value | Use Case |
|----------|-------|----------|
| Low | 0 | Background tasks, analytics |
| Normal | 1 | Standard operations (default) |
| High | 2 | Critical operations, payments |

### Setting Priority

```typescript
// Send with high priority
await messageBus.send(
  ProcessPaymentContract,
  payload,
  { priority: 'high' }
);

// Publish with low priority
await messageBus.publish(
  AnalyticsEvent,
  data,
  { priority: 'low' }
);
```

### Queue Priority Configuration

```typescript
// Enable queue with priority support
await channel.assertQueue('service.payment-service.commands.CapturePayment', {
  durable: true,
  arguments: {
    'x-max-priority': 2  // Support priorities 0-2
  }
});
```

## Routing Metadata

### Routing Options

```typescript
interface RoutingMetadata {
  /** Message priority */
  priority?: 'low' | 'normal' | 'high';

  /** Response timeout in milliseconds */
  timeout?: number;

  /** Custom routing key override */
  routingKey?: string;

  /** Custom exchange override */
  exchange?: string;

  /** Custom queue override (direct routing) */
  queue?: string;
}
```

### Custom Routing

```typescript
// Override routing key
await messageBus.publish(
  CustomEvent,
  data,
  {
    metadata: {
      routing: {
        routingKey: 'custom.event.key'
      }
    }
  }
);

// Direct to specific queue
await messageBus.send(
  CustomCommand,
  data,
  {
    metadata: {
      routing: {
        queue: 'service.custom-service.commands.Custom'
      }
    }
  }
);
```

## Request-Response Flow

### Flow Diagram

```
1. Client generates correlation ID
   ↓
2. Client creates response queue: response.client.{correlationId}
   ↓
3. Client sends message with replyTo = response queue
   ↓
4. Handler processes message
   ↓
5. Handler sends response to replyTo queue
   ↓
6. Client receives response via correlation ID
```

### Implementation

```typescript
// Sender side (automatic)
const correlationId = generateCorrelationId();
const replyQueue = `response.api-gateway.${correlationId}`;

await channel.assertQueue(replyQueue, {
  exclusive: true,
  autoDelete: true,
  expires: 30000  // 30 seconds
});

await channel.sendToQueue(
  'service.user-service.commands.CreateUser',
  Buffer.from(JSON.stringify(payload)),
  {
    correlationId,
    replyTo: replyQueue
  }
);

// Handler side (automatic)
channel.consume('service.user-service.commands.CreateUser', async (msg) => {
  const result = await handler(msg.content);

  // Send response back
  await channel.sendToQueue(
    msg.properties.replyTo,
    Buffer.from(JSON.stringify(result)),
    {
      correlationId: msg.properties.correlationId
    }
  );

  channel.ack(msg);
});
```

## Load Balancing

### Competing Consumers

Multiple instances share the same queue:

```
Queue: service.user-service.commands.CreateUser
  ↓
[Instance 1]  [Instance 2]  [Instance 3]
  Message 1    Message 2    Message 3
```

**Distribution**: Round-robin by default

### Prefetch Configuration

```typescript
// Low concurrency for CPU-intensive tasks
await channel.prefetch(1);

// High concurrency for I/O-bound tasks
await channel.prefetch(10);

// Per-consumer prefetch
await channel.consume(queue, handler, {
  prefetch: 5
});
```

## Message TTL

### Queue-Level TTL

```typescript
// All messages expire after 1 hour
await channel.assertQueue('service.temp-service.commands.Process', {
  durable: true,
  arguments: {
    'x-message-ttl': 3600000  // 1 hour in milliseconds
  }
});
```

### Message-Level TTL

```typescript
// Individual message TTL
await channel.sendToQueue(queue, message, {
  expiration: '60000'  // 60 seconds (string!)
});
```

### Response Queue TTL

```typescript
// Response queues auto-delete after 30 seconds
await channel.assertQueue(responseQueue, {
  exclusive: true,
  autoDelete: true,
  arguments: {
    'x-expires': 30000  // Queue expires if unused for 30s
  }
});
```

## Dead Letter Exchanges

### Configuration

```typescript
// Configure queue with DLX
await channel.assertQueue('service.user-service.commands.CreateUser', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx.platform',
    'x-dead-letter-routing-key': 'dlq.service.user-service.commands.CreateUser'
  }
});

// Create DLQ
await channel.assertQueue('dlq.service.user-service.commands.CreateUser', {
  durable: true
});

// Bind DLQ to DLX
await channel.bindQueue(
  'dlq.service.user-service.commands.CreateUser',
  'dlx.platform',
  'dlq.service.user-service.commands.CreateUser'
);
```

### Message Rejection

```typescript
// Reject with requeue (retry)
channel.nack(msg, false, true);

// Reject without requeue (send to DLQ)
channel.nack(msg, false, false);
```

## Routing Scenarios

### Scenario 1: Command to Single Service

```
Client: api-gateway
Target: user-service
Message: CreateUserCommand

Routing:
  api-gateway
    → service.user-service.commands.CreateUser
    → user-service (instance 1, 2, or 3)
    → response.api-gateway.{correlationId}
    → api-gateway
```

### Scenario 2: Event to Multiple Services

```
Publisher: user-service
Event: UserCreated

Routing:
  user-service
    → exchange.platform.events (routing key: user-service.usercreated)
    → exchange.platform.events.email-service.usercreated
    → email-service

  AND
    → exchange.platform.events.analytics-service.usercreated
    → analytics-service

  AND
    → exchange.platform.events.notification-service.usercreated
    → notification-service
```

### Scenario 3: Query with Caching

```
Client: api-gateway
Target: user-service
Message: GetUserQuery

Routing (cache miss):
  api-gateway
    → service.user-service.queries.GetUser
    → user-service
    → response.api-gateway.{correlationId}
    → api-gateway
    → (cache result)

Routing (cache hit):
  api-gateway
    → (return cached result, no message sent)
```

## Performance Optimization

### Connection Pooling

```typescript
// Maintain pool of connections
const pool = new ConnectionPool({
  min: 2,
  max: 10,
  idleTimeout: 30000
});

// Acquire connection for operation
const conn = await pool.acquire();
try {
  await sendMessage(conn, message);
} finally {
  pool.release(conn);
}
```

### Channel Pooling

```typescript
// Reuse channels for operations
const channel = await channelPool.acquire('rpc');
try {
  await channel.sendToQueue(queue, message);
} finally {
  channelPool.release(channel);
}
```

### Batch Publishing

```typescript
// Publish multiple events in batch
await channel.publish(exchange, '', Buffer.from(message1));
await channel.publish(exchange, '', Buffer.from(message2));
await channel.publish(exchange, '', Buffer.from(message3));
await channel.waitForConfirms();  // Wait once for all
```

## Monitoring Routing

### Queue Metrics

```bash
# Check queue depth
curl -u admin:admin123 http://localhost:55672/api/queues/%2F/service.user-service.commands.CreateUser | \
  jq '.messages_ready'

# Check consumers
curl -u admin:admin123 http://localhost:55672/api/queues/%2F/service.user-service.commands.CreateUser | \
  jq '.consumers'

# Check message rates
curl -u admin:admin123 http://localhost:55672/api/queues/%2F/service.user-service.commands.CreateUser | \
  jq '.message_stats'
```

### Exchange Metrics

```bash
# Check exchange publish rate
curl -u admin:admin123 http://localhost:55672/api/exchanges/%2F/exchange.platform.events | \
  jq '.message_stats.publish_in'

# Check bindings
curl -u admin:admin123 http://localhost:55672/api/exchanges/%2F/exchange.platform.events/bindings/source | \
  jq '.[].routing_key'
```

## Troubleshooting

### Message Not Reaching Handler

**Check**:
1. Queue exists: `curl -u admin:admin123 http://localhost:55672/api/queues`
2. Handler registered: Check service logs
3. Consumer active: Check queue consumers count
4. Message in queue: Check `messages_ready`

### Messages Going to DLQ

**Check**:
1. Handler errors in logs
2. DLQ depth: Check `dlq.*` queues
3. Retry count exceeded: Check message headers `x-death`

### Slow Message Processing

**Check**:
1. Prefetch count: May be too low
2. Handler performance: Check handler duration in logs
3. Queue depth: May need more consumers

## Best Practices

### 1. Use Consistent Naming

Follow the naming conventions strictly for easy debugging.

### 2. Set Appropriate Prefetch

```typescript
// CPU-intensive
prefetch: 1

// I/O-bound
prefetch: 10

// Memory-intensive
prefetch: 3
```

### 3. Configure Dead Letter Queues

Always configure DLQ for automatic error handling.

### 4. Monitor Queue Depth

Alert when depth > 100 for normal operations.

### 5. Use Priority Sparingly

Too many priority levels can complicate routing.

## Related References

- [Commands Reference](./commands.md)
- [Queries Reference](./queries.md)
- [Events Reference](./events.md)
- [Message Protocols Overview](./overview.md)
