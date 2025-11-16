---
title: RabbitMQ Management UI
description: Using RabbitMQ Management UI for debugging message bus issues
category: troubleshooting
tags: [rabbitmq, message-bus, queues, debugging]
related:
  - ../by-component/message-bus-issues.md
  - ../../02-core-concepts/message-bus.md
difficulty: beginner
---

# RabbitMQ Management UI

## Overview

The RabbitMQ Management UI provides a web interface to monitor and manage the message bus. Essential for debugging message routing, queue depths, and consumer issues.

## Accessing Management UI

```bash
# Open in browser
open http://localhost:15672

# Direct URL
http://localhost:15672
```

**Login Credentials (Default):**
- Username: `admin`
- Password: `admin123`

## Key Sections

### 1. Overview Tab

**What it shows:**
- Total message rates (publish/deliver)
- Queue totals
- Connection count
- Channel count
- Node health

**Use for:**
- Quick health check
- Spotting overall issues
- Monitoring message throughput

**Key Metrics:**

```
Message Rates:
  Publish: 100 msg/s  (messages being published)
  Deliver: 95 msg/s   (messages being consumed)

Queued Messages:
  Ready: 500       (waiting to be consumed)
  Unacked: 50      (being processed)
  Total: 550

Connections: 12    (active service connections)
Channels: 15       (communication channels)
```

---

### 2. Connections Tab

**What it shows:**
- Active connections from services
- Connection state
- Client properties
- Message rates per connection

**Use for:**
- Verifying service connections
- Finding connection issues
- Monitoring per-service throughput

**View:**

```
Name                   State       Channels
user-service-conn-1    running     2
api-gateway-conn-1     running     3
email-service-conn-1   running     1
```

**Click connection to see:**
- Client library version
- Connection details
- Channels on this connection
- Message rates

---

### 3. Channels Tab

**What it shows:**
- Active channels
- Prefetch settings
- Message rates
- Which connection owns channel

**Use for:**
- Debugging channel issues
- Checking prefetch configuration
- Monitoring channel activity

**View:**

```
Channel        Connection           State    Prefetch
user-service   user-service-conn    running  10
api-gateway    api-gateway-conn     running  1
```

---

### 4. Exchanges Tab

**What it shows:**
- All exchanges
- Exchange type
- Bindings
- Message rates

**Use for:**
- Verifying platform exchanges exist
- Testing message publishing
- Checking bindings

**Platform Exchanges:**

```
Name                   Type      Bindings
platform.commands      topic     15
platform.queries       topic     8
platform.events        topic     20
platform.contracts     fanout    1
```

**Click exchange to:**
- View all bindings
- Publish test message
- See exchange details

**Publishing Test Message:**

```
1. Click exchange (e.g., platform.commands)
2. Expand "Publish message"
3. Set routing key: CreateUserCommand
4. Set payload:
   {
     "messageType": "CreateUserCommand",
     "data": {"email": "test@example.com"},
     "correlationId": "test-123"
   }
5. Click "Publish message"
6. Check target queue for message
```

---

### 5. Queues Tab

**What it shows:**
- All queues
- Message counts
- Consumer counts
- Message rates

**Use for:**
- Finding queue buildup
- Checking consumers
- Viewing/purging messages

**Platform Queues:**

```
Name                         Ready  Unacked  Consumers  Rate
user-service.commands        0      1        1          10/s
user-service.queries         0      0        1          5/s
user-service.events          150    0        0          0/s  ← Problem!
email-service.commands       0      0        1          2/s
email-service.events.failed  25     0        0          0/s  ← DLQ
```

**Queue States:**

- **Ready**: Messages waiting to be consumed
- **Unacked**: Messages being processed
- **Consumers**: Active consumers (should be > 0)
- **Rate**: Messages/second

**Click queue to:**
- View messages
- Get/purge messages
- View consumers
- View bindings

---

### 6. Bindings

**What it shows:**
- Exchange-to-queue bindings
- Routing keys
- Binding arguments

**Use for:**
- Verifying message routing
- Debugging routing issues

**View Bindings:**

```
Source               Destination           Routing Key
platform.commands    user-service.commands CreateUserCommand
platform.commands    user-service.commands UpdateUserCommand
platform.events      user-service.events   User.Events.*
```

---

## Common Operations

### Check Queue Depth

**Steps:**

```
1. Click "Queues" tab
2. Find your service queue
3. Look at "Ready" column
```

**Interpretations:**

```
Ready: 0        ✓ Good - messages being consumed immediately
Ready: 10-100   ⚠ Warning - slight backlog
Ready: 1000+    ❌ Problem - consumer too slow or not running
```

---

### View Queue Messages

**Steps:**

```
1. Queues tab
2. Click queue name
3. Scroll to "Get messages"
4. Set:
   - Messages: 10
   - Ack mode: Nack message requeue true
5. Click "Get Message(s)"
```

**Message Details:**

```
Properties:
  correlation_id: abc-123
  content_type: application/json
  delivery_mode: persistent

Payload:
{
  "messageType": "CreateUserCommand",
  "data": {
    "email": "user@example.com"
  },
  "correlationId": "abc-123"
}
```

**Ack Modes:**

- **Nack message requeue true**: View without removing (recommended)
- **Ack message requeue false**: Remove from queue
- **Reject requeue true**: Return to queue
- **Reject requeue false**: Send to dead letter queue

---

### Purge Queue

**Use when:** Need to clear old test messages or reset queue

**Steps:**

```
1. Queues tab
2. Click queue name
3. Scroll to "Purge messages"
4. Click "Purge Messages"
5. Confirm
```

**Warning:** This deletes all messages permanently!

---

### Check Consumers

**Steps:**

```
1. Queues tab
2. Click queue name
3. Scroll to "Consumers"
```

**Consumer Details:**

```
Consumer tag: user-service-CreateUserCommand-123
Channel: user-service-channel-1
Prefetch count: 10
Ack required: true
```

**Interpretations:**

```
Consumers: 0    ❌ Problem - no service consuming messages
Consumers: 1-5  ✓ Good - consumers active
Consumers: 10+  ⚠ Warning - many instances (check if intentional)
```

---

### View Dead Letter Queue

**Steps:**

```
1. Queues tab
2. Find queue ending with ".failed"
   (e.g., user-service.commands.failed)
3. Click queue name
4. Get messages to see failures
```

**Failed Message Analysis:**

Check headers for failure reason:

```
Headers:
  x-death:
    - count: 3
      reason: rejected
      queue: user-service.commands
      time: 2024-01-15T12:00:00Z
      exchange: platform.commands
      routing-keys: CreateUserCommand
```

**Common Failure Reasons:**

- `rejected`: Handler threw error
- `expired`: Message TTL exceeded
- `maxlen`: Queue length limit exceeded

---

## Debugging Scenarios

### Scenario 1: Messages Not Being Consumed

**Symptoms:**

```
Queue: user-service.commands
Ready: 1500 (growing)
Unacked: 0
Consumers: 0  ← Problem!
```

**Diagnosis:**

1. No consumers = service not running or not registered

**Actions:**

```bash
# Check service status
docker ps | grep user-service

# If not running, start it
docker compose up -d user-service

# Check consumer registration
# Refresh RabbitMQ UI Queues tab
# Consumers should now show: 1
```

---

### Scenario 2: Queue Backlog Growing

**Symptoms:**

```
Queue: user-service.commands
Ready: 5000 (increasing)
Unacked: 50
Consumers: 1
Rate In: 100 msg/s
Rate Out: 10 msg/s  ← Bottleneck!
```

**Diagnosis:**

Consumer too slow (100 msg/s in, only 10 msg/s out)

**Actions:**

1. Optimize handler (check Jaeger for slow spans)
2. Scale service (add more instances)
3. Increase prefetch count

---

### Scenario 3: Messages in Dead Letter Queue

**Symptoms:**

```
Queue: user-service.commands.failed
Ready: 25
Consumers: 0
```

**Diagnosis:**

Handler errors causing message rejection

**Actions:**

```
1. Get messages from DLQ
2. Check x-death headers for error details
3. Fix handler error
4. Requeue messages:
   - Change ack mode to "Ack message requeue false"
   - Messages will be moved back to main queue
```

---

### Scenario 4: Wrong Routing

**Symptoms:**

Messages published but not reaching queue

**Diagnosis:**

```
1. Exchanges tab → platform.commands
2. Publish test message
3. Routing key: CreateUserCommand
4. Check if message appears in user-service.commands queue
```

**If message doesn't appear:**

```
1. Check bindings
   Exchanges → platform.commands → Bindings

2. Verify binding exists:
   To: user-service.commands
   Routing key: CreateUserCommand

3. If missing, service didn't register handler
   See: Handlers Not Discovered troubleshooting
```

---

## Performance Monitoring

### Message Rates

**Overview tab shows:**

```
Global Rates:
  Publish: 500 msg/s
  Deliver: 450 msg/s
  Get (no ack): 0 msg/s
  Ack: 450 msg/s
  Redeliver: 5 msg/s  ← Monitor this
```

**High redeliver rate indicates:**
- Handler errors
- Processing timeouts
- Consumer crashes

---

### Memory Usage

**Overview tab shows:**

```
Memory Used: 250 MB
Memory Limit: 2 GB
Alarm: none
```

**If memory alarm triggered:**

```
1. Purge dead letter queues
2. Reduce queue buildup
3. Increase memory limit
```

---

### Connection Count

**Overview tab shows:**

```
Connections: 25
```

**Expected connections:**

```
Per service: 1 connection
Total: Number of running services

If connections >> services:
  - Check for connection leaks
  - Verify connections being closed
```

---

## Admin Operations

### Create Queue Manually (Rare)

```
1. Queues tab
2. "Add a new queue"
3. Name: my-service.commands
4. Durability: Durable
5. Auto delete: No
6. Click "Add queue"
```

**Note:** Platform services auto-create queues. Manual creation rarely needed.

### Create Binding Manually (Rare)

```
1. Exchanges tab
2. Click exchange (e.g., platform.commands)
3. "Add binding from this exchange"
4. To queue: my-service.commands
5. Routing key: CreateUserCommand
6. Click "Bind"
```

**Note:** Platform services auto-create bindings. Manual creation only for testing.

### Delete Queue

**Use when:** Removing decommissioned service

```
1. Queues tab
2. Click queue name
3. "Delete" button
4. Confirm
```

**Warning:** Deletes all messages in queue!

---

## Best Practices

### 1. Monitor Dead Letter Queues

Check DLQs daily:

```
Queues tab → Filter: ".failed"
```

If messages accumulating:
- Fix handler errors
- Investigate and requeue or purge

### 2. Watch for Queue Buildup

Set up alerts for:

```
Ready messages > 1000
Rate out < Rate in (sustained)
Consumers = 0
```

### 3. Keep Connections Low

Each service should have exactly 1 connection.

If more:
- Connection leak
- Multiple instances (verify intentional)

### 4. Regular Cleanup

Purge DLQs after fixing issues:

```
1. Verify handler errors fixed
2. Test with one message
3. Purge remaining old failures
```

### 5. Test Message Routing

Before deploying new service:

```
1. Publish test message via exchange
2. Verify appears in queue
3. Check consumer processes it
4. Purge test messages
```

---

## Quick Reference

### Common Checks

```
✓ Service running?
  → Connections tab → Find service connection

✓ Consumers active?
  → Queues tab → Click queue → Consumers section

✓ Messages routing?
  → Exchanges tab → Publish test message

✓ Messages failing?
  → Queues tab → Find .failed queue → Get messages

✓ Queue backlog?
  → Queues tab → Check Ready column
```

---

## Related Documentation

- [Message Bus Issues](../by-component/message-bus-issues.md) - Message bus troubleshooting
- [Message Bus Architecture](../../02-core-concepts/message-bus.md) - How messaging works

---

## Summary

RabbitMQ Management UI is essential for:

1. **Queue Monitoring** - Check depths and consumer counts
2. **Message Inspection** - View message content and headers
3. **Routing Verification** - Test message routing
4. **Dead Letter Analysis** - Investigate failures
5. **Performance Monitoring** - Watch message rates

Access it frequently during development and troubleshooting. It provides immediate visibility into message flow.
