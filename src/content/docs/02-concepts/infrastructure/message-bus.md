---
title: "Message Bus Infrastructure"
description: "RabbitMQ infrastructure configuration, patterns, and operational guidelines"
category: "concepts"
tags: ["infrastructure", "rabbitmq", "messaging"]
difficulty: "intermediate"
related_concepts:
  - "../architecture/message-bus-architecture.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Message Bus Infrastructure

> **Core Idea:** RabbitMQ provides reliable, scalable message routing with three exchange patterns (command, query, event) and automatic reliability features.

## Overview

The platform uses RabbitMQ 3.13 as the message bus infrastructure, providing persistent message routing, automatic retries, dead letter queues, and high availability through clustering.

Configuration is handled by the platform - services use MessageBusClient abstraction without managing RabbitMQ directly.

## Infrastructure Components

### RabbitMQ Broker
- **Version**: 3.13-management-alpine
- **Port**: 5672 (AMQP), 15672 (Management UI)
- **Credentials**: admin/admin123 (development)
- **Virtual Host**: /
- **Clustering**: Supported for production HA

### Exchange Types

**1. Command Exchange (Direct)**
- Purpose: Request-response commands
- Routing: `{serviceName}.{contractName}`
- Pattern: One consumer per queue
- TTL: 30 seconds default

**2. Query Exchange (Direct)**
- Purpose: Request-response queries
- Routing: `{serviceName}.{contractName}`
- Pattern: One consumer per queue
- TTL: 5 seconds default
- Caching: Results cached in Redis

**3. Event Exchange (Topic)**
- Purpose: Pub-sub events
- Routing: `{eventType}.{aggregateType}`
- Pattern: Multiple consumers
- TTL: No timeout (fire-and-forget)

### Message Flow

```
Client → API Gateway → Command Exchange → Service Queue → Handler
                     ↓ Query Exchange → Service Queue → Handler
                     ↓ Event Exchange → Multiple Queues → Handlers
```

### Reliability Features

- **Persistent Messages**: Messages survive broker restart
- **Publisher Confirms**: Ensure message delivered to broker
- **Consumer Acknowledgments**: Ensure message processed
- **Automatic Retries**: Exponential backoff with max attempts
- **Dead Letter Queue**: Failed messages after max retries
- **Circuit Breaker**: Prevent cascading failures

## Configuration

### Development (Docker Compose)

```yaml
rabbitmq:
  image: rabbitmq:3.13-management-alpine
  ports:
    - "55671:5672"   # AMQP
    - "55672:15672"  # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
  volumes:
    - rabbitmq-data:/var/lib/rabbitmq
```

### Production (HA Cluster)

```typescript
const messageBus = MessageBusFactory.createForProduction(
  'my-service',
  [
    'amqp://rabbitmq-1:5672',
    'amqp://rabbitmq-2:5672',
    'amqp://rabbitmq-3:5672'
  ],
  {
    username: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD
  }
);
```

## Monitoring

### Key Metrics

- **Queue Depth**: Messages waiting for processing
- **Consumer Count**: Active consumers per queue
- **Message Rate**: Messages/second in/out
- **Connection Count**: Active connections
- **Channel Count**: Active channels

### Management UI

Access at `http://localhost:55672` (development)
- View queues and exchanges
- Monitor message rates
- Inspect message contents
- Purge queues for testing

### Alerts

Set up alerts for:
- Queue depth >1000 messages
- Consumer count = 0 (no service instances)
- Message rate drops to 0 (broker issue)
- Connection failures

## Best Practices

1. **Use Connection Pooling**
   - Platform provides automatic pooling
   - Max 10 connections per service default

2. **Monitor Queue Depths**
   - Increasing depth indicates processing bottleneck
   - Scale service instances if persistent

3. **Test Failure Scenarios**
   - Broker restart
   - Network partition
   - Consumer crash

4. **Use Publisher Confirms**
   - Ensure message delivered before returning
   - `waitForConfirmation: true` option

## Troubleshooting

### Issue: Messages Not Delivered

```bash
# Check queue bindings
docker exec rabbitmq rabbitmqctl list_bindings

# Check queue depth
docker exec rabbitmq rabbitmqctl list_queues

# Check consumers
docker exec rabbitmq rabbitmqctl list_consumers
```

### Issue: High Latency

- Check queue depth (backlog?)
- Check consumer count (need more instances?)
- Check network latency (broker far from services?)

### Issue: Messages in Dead Letter Queue

```bash
# View DLQ messages
# Access Management UI → Queues → {service}.dlq → Get messages
```

## Further Reading

- [Message Bus Architecture](../architecture/message-bus-architecture.md)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Message Bus Client Reference](../../04-reference/platform-packages/message-bus-client.md)
