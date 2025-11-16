---
title: Message Bus Issues
description: Troubleshooting RabbitMQ connection and routing issues
category: troubleshooting
tags: [rabbitmq, message-bus, messaging, routing, queues]
related:
  - ../../02-core-concepts/message-bus.md
  - ../by-component/message-bus-issues.md
  - ../debugging-tools/rabbitmq-management.md
difficulty: intermediate
---

# Message Bus Issues

Quick reference for diagnosing and fixing RabbitMQ connection and routing problems.

## Quick Diagnosis

```bash
# Check RabbitMQ status
docker ps | grep rabbitmq

# Test RabbitMQ connection
docker exec my-service nc -zv rabbitmq 5672

# View RabbitMQ management UI
open http://localhost:15672
# Username: guest, Password: guest

# Check message bus logs
docker logs my-service 2>&1 | grep -E "RabbitMQ|MessageBus|connection"

# View RabbitMQ logs
docker logs rabbitmq 2>&1 | tail -100
```

## Common Message Bus Problems

### 1. Connection Failed

**Error:**
```
MessageBusConnectionError: Failed to connect to message bus
```

**Diagnostic:**
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Test connectivity from service
docker exec my-service nc -zv rabbitmq 5672

# Check RabbitMQ logs
docker logs rabbitmq 2>&1 | grep -i error
```

**Fix - Ensure RabbitMQ Running:**
```bash
# Start RabbitMQ
docker compose up -d rabbitmq

# Wait for ready
docker logs rabbitmq 2>&1 | grep "Server startup complete"

# Check health
docker exec rabbitmq rabbitmq-diagnostics ping
```

**Fix - Correct Connection URL:**
```yaml
# docker-compose.yml
services:
  my-service:
    environment:
      # ✓ CORRECT - Use service name
      - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672

      # ❌ WRONG - Don't use localhost
      # - RABBITMQ_URL=amqp://localhost:5672
```

### 2. Messages Not Being Received

**Symptom:** Handler not called, messages disappearing

**Diagnostic:**
```bash
# Check RabbitMQ queues
curl -u guest:guest http://localhost:15672/api/queues | jq '.[] | {name, messages}'

# View queue bindings
curl -u guest:guest http://localhost:15672/api/bindings | jq

# Check handler discovery
docker logs my-service 2>&1 | grep "Handler discovery"
```

**Fix - Verify Handler Discovery:**
```typescript
// Handler MUST be in correct folder
// src/commands/CreateUserHandler.ts
// src/queries/GetUserHandler.ts
// src/events/UserCreatedHandler.ts

@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // ...
  }
}
```

**Fix - Check Queue Binding:**
```bash
# View queue bindings in RabbitMQ UI
# http://localhost:15672/#/queues

# Queue name should match: service-name.command.CommandName
# Binding key should match event/command type
```

### 3. Circuit Breaker Open

**Error:**
```
CircuitBreakerOpenError: Circuit breaker is open for service 'user-service' after 5 failures
```

**Cause:** Target service failed repeatedly, circuit breaker protecting against cascade failures

**Fix - Wait for Reset:**
```bash
# Circuit breaker auto-resets after timeout
docker logs my-service 2>&1 | grep "Circuit breaker"

# Should see: State transition: open -> half-open -> closed
```

**Fix - Address Root Cause:**
```typescript
// Find why target service is failing
docker logs target-service 2>&1 | grep -i error

// Common causes:
// - Service not running
// - Database connection issues
// - Handler errors
// - Resource exhaustion
```

**Configure Circuit Breaker:**
```typescript
await BaseService.start({
  name: 'my-service',
  version: '1.0.0',
  circuitBreaker: {
    failureThreshold: 5,      // Open after 5 failures
    resetTimeout: 30000,      // Try reset after 30s
    halfOpenRequests: 3       // Test with 3 requests in half-open
  }
});
```

### 4. Request Timeout

**Error:**
```
REQUEST_TIMEOUT: Operation 'GetUser' timed out after 5000ms
```

**Diagnostic:**
```bash
# Check handler execution time
docker logs my-service 2>&1 | grep "Handler execution"

# Monitor RabbitMQ message rates
curl -u guest:guest http://localhost:15672/api/queues | \
  jq '.[] | {name, message_stats}'
```

**Fix - Increase Timeout:**
```typescript
// At call site
await queryBus.execute(new GetUserQuery(userId), {
  timeout: 10000  // Increase from 5s to 10s
});
```

**Fix - Optimize Handler:**
```typescript
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async handle(query: GetUserQuery) {
    // Use index for query
    // Add caching
    // Avoid N+1 queries
    // Optimize database query
  }
}
```

### 5. Connection Pool Exhausted

**Error:**
```
Connection pool exhausted - no healthy connections available
```

**Diagnostic:**
```bash
# Check connection pool status
docker logs my-service 2>&1 | grep "Connection pool"

# View active connections
curl -u guest:guest http://localhost:15672/api/connections | jq length
```

**Fix - Increase Pool Size:**
```typescript
await BaseService.start({
  name: 'my-service',
  version: '1.0.0',
  messageBus: {
    urls: [process.env.RABBITMQ_URL!],
    connectionPool: {
      minConnections: 2,
      maxConnections: 10,  // Increase from default 5
      maxChannelsPerConnection: 100
    }
  }
});
```

**Fix - Check for Connection Leaks:**
```typescript
// Ensure channels are closed after use
const channel = await messageBus.getChannel();
try {
  await channel.publish(...);
} finally {
  await channel.close(); // IMPORTANT: Always close
}
```

### 6. Message Delivery Failures

**Symptom:** Messages published but never received

**Diagnostic:**
```bash
# Check dead letter queue
curl -u guest:guest http://localhost:15672/api/queues/%2F/dead-letter | jq

# View failed messages
curl -u guest:guest http://localhost:15672/api/queues/%2F/dead-letter/get \
  -X POST -d'{"count":10,"ackmode":"ack_requeue_false","encoding":"auto"}' | jq
```

**Fix - Check Exchange and Routing:**
```bash
# View exchanges
curl -u guest:guest http://localhost:15672/api/exchanges | \
  jq '.[] | {name, type}'

# Check bindings
curl -u guest:guest http://localhost:15672/api/bindings | \
  jq '.[] | {source, destination, routing_key}'
```

**Fix - Verify Message Format:**
```typescript
// Ensure message matches contract
const command: CreateUserCommand = {
  email: 'user@example.com',
  password: 'password123'
};

// Publish with correct routing
await messageBus.publish('CreateUser', command, {
  correlationId: uuid(),
  timestamp: new Date()
});
```

### 7. ChannelManager Shutting Down

**Error:**
```
ChannelManager is shutting down
```

**Cause:** Service stopping but still trying to use message bus

**Fix - Check Service Lifecycle:**
```typescript
// Don't use message bus after shutdown initiated
let isShuttingDown = false;

process.on('SIGTERM', () => {
  isShuttingDown = true;
});

async function publishMessage(message: any) {
  if (isShuttingDown) {
    throw new Error('Service is shutting down');
  }
  await messageBus.publish(message);
}
```

## RabbitMQ Management Commands

```bash
# List all queues
curl -u guest:guest http://localhost:15672/api/queues | jq

# Get queue details
curl -u guest:guest http://localhost:15672/api/queues/%2F/my-service.command.CreateUser | jq

# List exchanges
curl -u guest:guest http://localhost:15672/api/exchanges | jq

# View bindings
curl -u guest:guest http://localhost:15672/api/bindings | jq

# Get messages from queue (without consuming)
curl -u guest:guest http://localhost:15672/api/queues/%2F/my-queue/get \
  -X POST \
  -d'{"count":5,"ackmode":"ack_requeue_true","encoding":"auto"}' | jq

# Purge queue
curl -u guest:guest -X DELETE \
  http://localhost:15672/api/queues/%2F/my-queue/contents

# Create binding
curl -u guest:guest -X POST \
  http://localhost:15672/api/bindings/%2F/e/my-exchange/q/my-queue \
  -d'{"routing_key":"my-routing-key"}'
```

## Message Bus Troubleshooting Checklist

- [ ] RabbitMQ container running and healthy
- [ ] Service can connect to RabbitMQ (port 5672)
- [ ] RABBITMQ_URL uses service name, not localhost
- [ ] Handlers in correct directories with decorators
- [ ] Queues created and bound to exchanges
- [ ] Message format matches contract
- [ ] No circuit breaker open errors
- [ ] Connection pool not exhausted
- [ ] Channels properly closed after use

## Best Practices

1. **Use Service Name in URLs:**
```yaml
# docker-compose.yml
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672  # Use 'rabbitmq', not 'localhost'
```

2. **Add Health Checks:**
```yaml
rabbitmq:
  healthcheck:
    test: rabbitmq-diagnostics -q ping
    interval: 10s
    timeout: 5s
    retries: 5
```

3. **Monitor Queue Lengths:**
```typescript
setInterval(async () => {
  const stats = await rabbitmq.getQueueStats();
  if (stats.messages > 1000) {
    console.warn('Queue backlog detected:', stats);
  }
}, 60000);
```

4. **Handle Connection Loss:**
```typescript
messageBus.on('connection_lost', () => {
  console.warn('Message bus connection lost, will retry');
});

messageBus.on('connection_restored', () => {
  console.log('Message bus connection restored');
});
```

5. **Use Dead Letter Exchange:**
```typescript
await channel.assertQueue('my-queue', {
  deadLetterExchange: 'dead-letter',
  deadLetterRoutingKey: 'failed'
});
```

## Related Documentation

- [Message Bus Concepts](../../02-core-concepts/message-bus.md)
- [Message Bus Component](../by-component/message-bus-issues.md)
- [RabbitMQ Management](../debugging-tools/rabbitmq-management.md)
- [Error Catalog - Message Bus](../common-errors/error-catalog.md#message-bus-errors)
