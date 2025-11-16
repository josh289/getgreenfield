---
title: Message Bus Issues
description: Troubleshooting RabbitMQ connection, queue, and message delivery problems
category: troubleshooting
tags: [rabbitmq, message-bus, queues, exchanges, messaging]
related:
  - ../by-symptom/service-wont-start.md
  - ../debugging-tools/rabbitmq-management.md
  - ../../02-core-concepts/message-bus.md
difficulty: intermediate
---

# Message Bus Issues

## Component Overview

The message bus (RabbitMQ) is the backbone of all inter-service communication. It handles:

- **Command Routing**: Commands from gateway to services
- **Query Routing**: Queries from gateway to services
- **Event Distribution**: Events from publishers to subscribers
- **Contract Broadcasting**: Service contracts to service discovery
- **Persistent Messaging**: Ensures messages not lost
- **Dead Letter Handling**: Failed messages quarantined for review

## Common Issues

### 1. Connection Failures

**Symptoms:**
- Service can't start
- Error: "Failed to connect to RabbitMQ"
- "ECONNREFUSED" errors
- Service retries connection repeatedly

**Diagnostic Steps:**

```bash
# Check RabbitMQ status
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker logs rabbitmq 2>&1 | tail -50

# Test connectivity from service
docker compose exec my-service nc -zv rabbitmq 5672

# Check RabbitMQ ready
docker logs rabbitmq 2>&1 | grep "Server startup complete"
```

**Common Causes:**

**A. RabbitMQ Not Started:**

```bash
# Start RabbitMQ
docker compose up -d rabbitmq

# Wait for ready
docker logs rabbitmq 2>&1 | grep "Server startup complete"
```

**B. Wrong Connection URL:**

```yaml
# ❌ WRONG: localhost won't work in Docker
environment:
  - RABBITMQ_URL=amqp://localhost:5672

# ✓ CORRECT: Use service name
environment:
  - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
```

**C. Service Starts Before RabbitMQ Ready:**

```yaml
# Add health check dependency
services:
  my-service:
    depends_on:
      rabbitmq:
        condition: service_healthy

  rabbitmq:
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 5
```

**D. Wrong Credentials:**

```bash
# Check RabbitMQ user/password
docker logs rabbitmq | grep "user\|credentials"

# Default in docker-compose:
# user: admin
# password: admin123
```

**Solution:**

1. Ensure RabbitMQ running and healthy
2. Use correct connection URL with service name
3. Add dependency with health check
4. Verify credentials match

**Prevention:**
- Use health check dependencies in docker-compose
- Monitor RabbitMQ availability
- Implement connection retry logic

---

### 2. Queue Buildup (Messages Not Consumed)

**Symptoms:**
- RabbitMQ Management UI shows large queue depths
- Messages accumulating but not processed
- Service slow to respond
- Memory usage high in RabbitMQ

**Diagnostic Steps:**

```bash
# Open RabbitMQ Management UI
open http://localhost:15672
# Login: admin / admin123

# Check queue depths via CLI
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# Should show:
# queue-name  messages  consumers
# user-service.commands  1500  0  ← Problem: 0 consumers!
```

**Common Causes:**

**A. Service Not Running / No Consumers:**

```bash
# Check service status
docker ps | grep my-service

# If not running, start it
docker compose up -d my-service

# Verify consumers registered
# In RabbitMQ UI: Queues → Click queue → Consumers tab
# Should show active consumer
```

**B. Handler Processing Too Slow:**

```bash
# Check message rate vs consume rate
# In RabbitMQ UI: Queues → Click queue → Message rates

# Publish rate: 100 msg/s
# Consume rate: 10 msg/s  ← Bottleneck!
```

**Solution:**

1. Optimize handler performance (see Jaeger traces)
2. Scale service horizontally (multiple instances)
3. Increase batch size or concurrency

**C. Handler Errors Preventing Consumption:**

```bash
# Check service logs for errors
docker logs my-service 2>&1 | grep -i "error\|fail"

# Check dead letter queue
# In RabbitMQ UI: Queues → {service}.commands.failed
# Shows failed messages
```

**Solution:**

Fix handler errors, then:

```bash
# Requeue messages from DLQ (if handler fixed)
# In RabbitMQ UI: Dead letter queue → Get Messages → Requeue
```

**Prevention:**
- Monitor queue depths
- Alert on high queue depth
- Scale services based on queue size
- Implement circuit breakers for failing handlers

---

### 3. Messages Going to Dead Letter Queue

**Symptoms:**
- Messages appear in `{service}.commands.failed` queue
- Handler errors in logs
- Operations fail but no error returned to client

**Diagnostic Steps:**

```bash
# Check dead letter queues
docker exec rabbitmq rabbitmqctl list_queues name messages | grep failed

# View messages in DLQ
# RabbitMQ UI: Queues → {service}.commands.failed → Get Messages

# Check failure reasons in headers
# x-death header shows why message failed
```

**Common Causes:**

**A. Handler Throwing Uncaught Exception:**

```typescript
// Handler with error
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // Throws error
    const user = await this.database.findByEmail(command.email);
    return user.toDTO();  // ← user is null, throws TypeError!
  }
}
```

**Solution:**

Add error handling:

```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    const user = await this.database.findByEmail(command.email);

    if (!user) {
      throw new ValidationError('User not found', correlationId, [
        { field: 'email', message: 'Email not found' }
      ]);
    }

    return user.toDTO();
  }
}
```

**B. Message Validation Failure:**

```bash
# Message doesn't match contract schema
# Check error details in DLQ message headers
```

**C. Timeout:**

Handler takes too long, message times out:

```typescript
// Increase timeout for long operations
const result = await commandBus.execute(command, {
  timeout: 60000  // 60 seconds
});
```

**D. Database Connection Lost:**

```bash
# Check database connectivity
docker ps | grep postgres
docker logs my-service | grep -i "database\|postgres"
```

**Prevention:**
- Add proper error handling in handlers
- Validate input before processing
- Set appropriate timeouts
- Monitor dead letter queues

---

### 4. Exchange/Queue Not Created

**Symptoms:**
- Messages not routed
- Service can't publish/subscribe
- Error: "NOT_FOUND - no exchange"

**Diagnostic Steps:**

```bash
# List exchanges
docker exec rabbitmq rabbitmqctl list_exchanges

# Should see:
# platform.commands
# platform.queries
# platform.events
# platform.contracts

# List queues
docker exec rabbitmq rabbitmqctl list_queues

# Should see service-specific queues:
# my-service.commands
# my-service.queries
```

**Common Causes:**

**A. Service Not Started (Queues Auto-Created):**

Queues created when service starts and registers handlers.

```bash
# Start service to create queues
docker compose up -d my-service

# Verify queues created
docker exec rabbitmq rabbitmqctl list_queues | grep my-service
```

**B. Platform Exchanges Not Created:**

Exchanges created by first service to start.

```bash
# Restart service discovery or any service
docker compose restart service-discovery

# Check exchanges
docker exec rabbitmq rabbitmqctl list_exchanges | grep platform
```

**Solution:**

Ensure at least one service running to bootstrap exchanges. BaseService creates them automatically.

**Prevention:**
- Start infrastructure services first (service-discovery, api-gateway)
- Monitor exchange/queue creation in logs

---

### 5. Message Routing Issues

**Symptoms:**
- Messages published but not received
- Command sent but handler never called
- Event published but subscribers don't receive

**Diagnostic Steps:**

```bash
# Check bindings
docker exec rabbitmq rabbitmqctl list_bindings

# Should show:
# platform.commands → my-service.commands (routing key: CreateUserCommand)
# platform.events → my-service.events (routing key: User.Events.UserCreated)

# Trace message flow
# RabbitMQ UI: Exchanges → platform.commands → Publish message (test)
```

**Common Causes:**

**A. Wrong Routing Key:**

```typescript
// ❌ WRONG: Routing key doesn't match contract
await messageBus.publish('platform.commands', {
  messageType: 'CreateUser',  // Should match contract exactly
  data: command
});

// ✓ CORRECT: Exact match
await messageBus.publish('platform.commands', {
  messageType: 'CreateUserCommand',  // Matches @CommandHandler decorator
  data: command
});
```

**B. Queue Not Bound to Exchange:**

```bash
# Check bindings for specific queue
docker exec rabbitmq rabbitmqctl list_bindings | grep my-service.commands

# Should show binding from platform.commands to my-service.commands
```

If missing, service didn't register handler correctly. See [Handlers Not Discovered](../by-symptom/handlers-not-discovered.md).

**C. Wrong Exchange:**

```typescript
// ❌ WRONG: Wrong exchange name
await messageBus.publish('my-custom-exchange', message);

// ✓ CORRECT: Use platform exchanges
await messageBus.publish('platform.commands', message);
await messageBus.publish('platform.events', message);
```

**Prevention:**
- Use consistent message types matching contracts
- Verify bindings in RabbitMQ UI
- Use platform exchanges (platform.commands, platform.events, etc.)

---

## RabbitMQ Management UI

### Accessing Management UI

```bash
# Open in browser
open http://localhost:15672

# Login
# Username: admin
# Password: admin123
```

### Key Sections

**1. Queues Tab:**
- View all queues
- Monitor queue depths
- Get/purge messages
- View consumer details

**2. Exchanges Tab:**
- View all exchanges
- Test message publishing
- View bindings

**3. Connections Tab:**
- Active connections
- Which services connected
- Connection details

**4. Channels Tab:**
- Active channels (one per connection)
- Message rates
- Prefetch settings

### Useful Operations

**View Queue Messages:**
```
Queues → Click queue name → Get messages
```

**Purge Queue:**
```
Queues → Click queue name → Purge messages
```

**Test Message Publishing:**
```
Exchanges → Click exchange → Publish message
```

**View Dead Letter Messages:**
```
Queues → {service}.commands.failed → Get messages
```

---

## Performance Issues

### High Memory Usage

**Symptoms:**
- RabbitMQ using excessive memory
- Container restarts
- Slow message processing

**Diagnostic Steps:**

```bash
# Check memory usage
docker stats rabbitmq

# Check queue memory
docker exec rabbitmq rabbitmqctl list_queues name memory messages

# Large queues consume memory
```

**Solutions:**

1. Purge old messages from DLQ:

```bash
docker exec rabbitmq rabbitmqctl purge_queue "my-service.commands.failed"
```

2. Increase memory limit:

```yaml
rabbitmq:
  deploy:
    resources:
      limits:
        memory: 2G
```

3. Enable lazy queues for large backlogs

**Prevention:**
- Monitor queue depths
- Purge DLQ regularly
- Process messages faster (scale services)

---

### Message Delivery Delays

**Symptoms:**
- Messages take long time to process
- High latency between publish and consume

**Diagnostic Steps:**

```bash
# Check message rates in RabbitMQ UI
# Queues → Click queue → Message rates

# Check for network issues
docker exec my-service ping -c 3 rabbitmq

# Check Jaeger traces for message handling duration
```

**Common Causes:**

1. **Network latency** - Check Docker networking
2. **Handler slow** - Optimize handler code
3. **Queue congestion** - Scale consumers
4. **Message size** - Reduce payload size

---

## Connection Pool Exhaustion

**Symptoms:**
- Error: "Too many connections"
- Services can't connect to RabbitMQ
- Connection timeouts

**Diagnostic Steps:**

```bash
# Check connection count
docker exec rabbitmq rabbitmqctl list_connections | wc -l

# Default limit: 1000
# If near limit, investigate

# View connections
docker exec rabbitmq rabbitmqctl list_connections
```

**Solution:**

1. Check for connection leaks in services
2. Increase connection limit in RabbitMQ config
3. Use connection pooling

**Prevention:**
- Reuse connections (platform does this automatically)
- Close unused connections
- Monitor connection count

---

## Debugging Techniques

### Enable Debug Logging

```yaml
# In service
my-service:
  environment:
    - LOG_LEVEL=debug

# In RabbitMQ
rabbitmq:
  environment:
    - RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS=-rabbit log_levels [{connection,debug}]
```

### Trace Message Flow

```typescript
// Add logging in message handlers
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: ExecutionContext) {
    console.log('Received command:', {
      messageType: 'CreateUserCommand',
      correlationId: context.correlationId,
      userId: context.user?.userId
    });

    // Handler logic
  }
}
```

### Monitor Message Rates

```bash
# Watch queue statistics
watch -n 1 'docker exec rabbitmq rabbitmqctl list_queues name messages messages_ready messages_unacknowledged consumers'
```

---

## Common Error Messages

### "Connection refused (ECONNREFUSED)"

**Solution:** Ensure RabbitMQ running and use correct hostname (service name)

### "NOT_FOUND - no exchange 'X'"

**Solution:** Ensure at least one service started to create platform exchanges

### "ACCESS_REFUSED - Login was refused"

**Solution:** Check credentials in RABBITMQ_URL match RabbitMQ configuration

### "Timeout waiting for response"

**Solution:** Check handler processing, increase timeout, or verify consumer active

---

## Verification Steps

After fixing message bus issues:

### 1. Connection Established

```bash
# Check service logs
docker logs my-service | grep -i "rabbitmq\|connected"

# Should see: "Connected to RabbitMQ"
```

### 2. Queues Created

```bash
# List queues
docker exec rabbitmq rabbitmqctl list_queues | grep my-service

# Should show:
# my-service.commands
# my-service.queries
# my-service.events (if has event handlers)
```

### 3. Consumers Active

```bash
# Check consumers
docker exec rabbitmq rabbitmqctl list_consumers

# Should show active consumers for service queues
```

### 4. Messages Processing

```bash
# Publish test message via API
curl -X POST http://localhost:3000/api/test-command

# Check queue depth decreases
docker exec rabbitmq rabbitmqctl list_queues name messages | grep my-service
```

---

## Related Documentation

- [Service Won't Start](../by-symptom/service-wont-start.md) - Startup failures
- [RabbitMQ Management](../debugging-tools/rabbitmq-management.md) - Using management UI
- [Message Bus Architecture](../../02-core-concepts/message-bus.md) - How messaging works
- [Error Catalog](../common-errors/error-catalog.md#message-bus-errors) - Message bus errors

---

## Summary

Common message bus issues:

1. **Connection failures** - Ensure RabbitMQ running, use correct URL
2. **Queue buildup** - Scale services, optimize handlers
3. **Dead letter messages** - Fix handler errors, add error handling
4. **Routing issues** - Verify bindings, use correct message types
5. **Performance** - Monitor queues, purge DLQ, scale consumers

Always check RabbitMQ Management UI for queue depths, bindings, and message rates.
