---
title: Jaeger Tracing
description: Using Jaeger for distributed tracing and performance analysis
category: troubleshooting
tags: [jaeger, tracing, observability, performance, debugging]
related:
  - ./correlation-id-tracking.md
  - ./log-analysis.md
  - ../../02-core-concepts/telemetry.md
difficulty: beginner
aliases:
  - Jaeger UI
  - distributed tracing visualization
  - trace analysis
  - performance profiling
  - trace search
relatedConcepts:
  - distributed tracing
  - OpenTelemetry
  - correlation IDs
  - span analysis
  - trace timeline
  - performance bottlenecks
commonQuestions:
  - How do I access Jaeger?
  - How do I find a trace by correlation ID?
  - How do I identify slow requests?
  - What is a span in Jaeger?
  - How do I compare trace performance?
  - How do I find errors in Jaeger?
  - What tags are available in traces?
---

# Jaeger Tracing

## Overview

Jaeger is the platform's distributed tracing system. It tracks requests as they flow through multiple services, helping you:

- **Find Performance Bottlenecks**: Identify slow operations
- **Debug Errors**: See exactly where failures occur
- **Understand Request Flow**: Visualize service interactions
- **Analyze Dependencies**: See which services call which

## Accessing Jaeger UI

```bash
# Open Jaeger UI in browser
open http://localhost:16686

# Or direct URL
http://localhost:16686
```

No authentication required for local development.

## Key Concepts

### Trace

A complete request journey from start to finish:

```
Client Request → API Gateway → User Service → Database
                                            → Email Service
```

One trace = one complete request flow

### Span

A single operation within a trace:

```
Trace: Create User Request
├─ Span: API Gateway Request
├─ Span: Message Bus Publish
├─ Span: Handle CreateUserCommand
│  ├─ Span: Validate Input
│  ├─ Span: Database Save
│  └─ Span: Publish UserCreatedEvent
└─ Span: Send Response
```

### Tags

Metadata attached to spans:

```
service.name: user-service
http.method: POST
http.status_code: 200
correlation.id: abc-123-def-456
error: true
```

## Finding Traces

### Search by Service

```
1. Select Service: user-service
2. Click "Find Traces"
```

Shows all traces involving that service.

### Search by Operation

```
1. Select Service: user-service
2. Select Operation: CreateUserHandler
3. Click "Find Traces"
```

Shows only CreateUser operations.

### Search by Tags

```
1. Select Service: user-service
2. Tags: correlation.id="abc-123-def-456"
3. Click "Find Traces"
```

Finds specific request by correlation ID.

### Search by Duration

```
1. Select Service: user-service
2. Min Duration: 1s
3. Click "Find Traces"
```

Finds slow requests (> 1 second).

### Search by Error Status

```
1. Select Service: user-service
2. Tags: error=true
3. Click "Find Traces"
```

Shows only failed requests.

### Search by Time Range

```
1. Lookback: Last 15m
   OR
2. Custom: 2024-01-15 12:00 to 13:00
3. Click "Find Traces"
```

---

## Analyzing Traces

### Trace View

Click on a trace to see details:

```
Timeline View:
─────────────────────────────────────────────────
API Gateway          [════════════════] 500ms
  Auth Check         [══]               50ms
  Route Request      [══]               50ms
  Message Publish    [════]             100ms

User Service                   [════════════] 400ms
  Handle Command               [═══]         150ms
  Database Save                        [═══] 200ms
  Event Publish                [═]           50ms
─────────────────────────────────────────────────
Total Duration: 500ms
```

### Span Details

Click on a span to see:

- **Duration**: How long it took
- **Start Time**: When it started
- **Tags**: Metadata (service, operation, correlation ID)
- **Logs**: Events within the span
- **Process**: Which service executed it

### Identifying Bottlenecks

Look for:

1. **Long Spans**: Operations taking most time
2. **Sequential Delays**: Operations not parallelized
3. **External Calls**: Network/API latency
4. **Database Queries**: Slow queries

Example bottleneck:

```
Handle CreateUserCommand [═══════════════] 5000ms
  ├─ Validate Input      [═]               100ms
  ├─ Check Email Unique  [════]            2000ms  ← SLOW!
  ├─ Create User         [═]               200ms
  └─ Send Welcome Email  [══════]          2500ms  ← SLOW!
```

Optimization targets:
- Add database index for email lookup
- Send welcome email asynchronously

---

## Common Use Cases

### 1. Find Slow Requests

**Goal:** Identify requests taking > 1 second

**Steps:**

```
1. Service: (All)
2. Min Duration: 1s
3. Limit Results: 20
4. Click "Find Traces"
```

**Analysis:**

- Sort by duration (longest first)
- Click trace to see timeline
- Identify slowest span
- Optimize that operation

### 2. Debug Failed Request

**Goal:** Understand why a request failed

**Get correlation ID from error response:**

```bash
curl http://localhost:3000/api/endpoint | jq '.correlationId'
# Returns: "abc-123-def-456"
```

**Search in Jaeger:**

```
1. Service: (All)
2. Tags: correlation.id="abc-123-def-456"
3. Click "Find Traces"
```

**Analysis:**

- Find span with error tag
- Check span logs for error message
- View parent spans to see request flow
- Identify failure point

### 3. Trace Request Flow

**Goal:** See how request flows through services

**Steps:**

```
1. Service: api-gateway
2. Operation: POST /api/create-user
3. Limit: 1
4. Click "Find Traces"
```

**Analysis:**

View trace to see:

```
API Gateway
  └─> User Service
      ├─> Database
      └─> Event Bus
          └─> Email Service
          └─> Notification Service
```

### 4. Compare Request Performance

**Goal:** See if performance degraded over time

**Steps:**

```
# Get recent requests
1. Service: user-service
2. Operation: CreateUserHandler
3. Lookback: 1h
4. Click "Find Traces"

# Compare durations
5. Sort by Duration
6. Check average duration
7. Identify outliers
```

### 5. Find Errors in Time Range

**Goal:** See all errors during deployment window

**Steps:**

```
1. Service: (All)
2. Tags: error=true
3. Lookback: Custom (deployment time range)
4. Click "Find Traces"
```

**Analysis:**

- Group errors by service
- Identify common error patterns
- Check if error rate increased after deployment

---

## Span Tags Reference

### Standard Tags

All spans include:

- `service.name`: Service that created span
- `service.version`: Service version
- `correlation.id`: Request correlation ID
- `component`: Platform component (e.g., "message-bus", "cqrs")

### HTTP Tags

API Gateway spans:

- `http.method`: GET, POST, etc.
- `http.url`: Request URL
- `http.status_code`: Response status
- `http.user_agent`: Client user agent

### CQRS Tags

Command/Query handler spans:

- `message.type`: Command or query name
- `handler.name`: Handler class name
- `user.id`: Authenticated user ID
- `permissions`: User permissions

### Message Bus Tags

Message publishing/consuming:

- `message.exchange`: RabbitMQ exchange
- `message.routing_key`: Routing key
- `message.correlation_id`: Message correlation ID

### Database Tags

Database operation spans:

- `db.type`: Database type (PostgreSQL, Redis)
- `db.statement`: SQL query
- `db.instance`: Database name

### Error Tags

Failed operations:

- `error`: true
- `error.kind`: Error type
- `error.message`: Error message
- `error.stack`: Stack trace (in logs)

---

## Performance Analysis

### Identifying Slow Operations

**Workflow:**

1. Search for traces with min duration > threshold
2. Sort by duration
3. Open slowest trace
4. Look at timeline view
5. Find longest span
6. Check span tags and logs
7. Identify optimization opportunity

**Example:**

```
Trace: Create User (Total: 3000ms)

Spans:
├─ API Gateway           [═══]            100ms
├─ Message Bus Publish   [═]               50ms
└─ User Service          [════════════] 2850ms
   ├─ Handle Command     [═]              100ms
   ├─ Validate Input     [═]               50ms
   ├─ Database Query     [═════════]     2500ms  ← 83% of total time!
   └─ Event Publish      [══]             200ms
```

**Finding:** Database query taking 2.5s (83% of total)

**Action:** Add database index

### Comparing Service Performance

**Goal:** See which service is slowest in request chain

**View:**

```
Service Performance (Average Duration):
- API Gateway:       50ms
- User Service:      2000ms  ← Bottleneck
- Email Service:     200ms
- Notification:      100ms
```

**Analysis:** Focus optimization on User Service

### Detecting N+1 Problems

**Symptom:** Many sequential database queries

**Trace View:**

```
Handle ListUsers     [════════════════════] 5000ms
  ├─ Get Users       [═]                     100ms
  ├─ Get Org (1)     [═]                     50ms
  ├─ Get Org (2)     [═]                     50ms
  ├─ Get Org (3)     [═]                     50ms
  ... (100 more)
  └─ Get Org (100)   [═]                     50ms
```

**Solution:** Batch load organizations or use JOIN

---

## Correlation ID Tracking

Every request has a unique correlation ID that links:
- Client request
- All service hops
- Database operations
- Event publications
- Logs

**Finding Request by Correlation ID:**

```
Tags: correlation.id="abc-123-def-456"
```

**Correlation ID Sources:**

1. HTTP Response Header: `X-Correlation-Id`
2. Error Response Body: `correlationId` field
3. Service Logs: `correlationId` field
4. Jaeger Trace Tags

**See also:** [Correlation ID Tracking](./correlation-id-tracking.md)

---

## Advanced Features

### Trace Comparison

Compare two traces side-by-side:

```
1. Find two traces (e.g., before/after optimization)
2. Click first trace
3. Click "Compare" button
4. Select second trace
5. View differences
```

Shows:
- Duration changes
- New/removed spans
- Tag differences

### Trace Graph View

Visualize service dependencies:

```
1. Open trace
2. Click "Trace Graph" tab
3. View service interaction diagram
```

Shows which services call which in this trace.

### Span Logs

View events within a span:

```
1. Click span
2. View "Logs" section
```

Example logs:

```
timestamp: 2024-01-15 12:00:00.100
event: command_received
message: "CreateUserCommand received"

timestamp: 2024-01-15 12:00:00.150
event: validation_started
message: "Validating input"

timestamp: 2024-01-15 12:00:00.200
event: validation_complete
message: "Input valid"
```

---

## Best Practices

### 1. Always Use Correlation IDs

When reporting bugs:

```
Issue: User creation fails
Correlation ID: abc-123-def-456
```

Makes debugging much faster.

### 2. Search with Specific Tags

Instead of browsing all traces, use tags:

```
# ✓ GOOD: Specific search
correlation.id="abc-123"
error=true
http.status_code=500

# ❌ BAD: Too broad
service.name="user-service"  # Returns thousands
```

### 3. Use Time Ranges

Narrow down search with time ranges:

```
# ✓ GOOD: Specific time
Lookback: Last 15m
Custom: 12:00 to 12:15

# ❌ BAD: Too broad
Lookback: Last 7d  # Too many results
```

### 4. Focus on Outliers

When optimizing, focus on:

- Slowest 5% of requests
- Operations with high variance
- Errors

Don't optimize already-fast operations.

### 5. Monitor Trends

Check Jaeger regularly:

- Daily: Are there new slow operations?
- After deployments: Did performance change?
- During incidents: What's failing?

---

## Troubleshooting Jaeger

### No Traces Appearing

**Causes:**

1. **Jaeger not running:**

```bash
docker ps | grep jaeger

# If not running:
docker compose up -d jaeger
```

2. **Service not sending traces:**

```bash
# Check telemetry initialization
docker logs my-service | grep -i "telemetry\|jaeger"

# Should see: "Telemetry initialized"
```

3. **Wrong time range:**

```
# Ensure looking at recent time
Lookback: Last 15m
```

### Incomplete Traces

**Symptom:** Trace shows only some spans, missing others

**Causes:**

1. **Service crashed** before sending span
2. **Network issues** between service and Jaeger
3. **Sampling** - some spans randomly dropped (shouldn't happen in dev)

**Solution:**

Check service logs for errors during that correlation ID.

### High Jaeger Memory Usage

**Solution:**

Reduce trace retention:

```yaml
jaeger:
  environment:
    - SPAN_STORAGE_TYPE=memory
    - MEMORY_MAX_TRACES=10000  # Default: 10000, reduce if needed
```

---

## Integration with Other Tools

### Jaeger + Logs

1. Find slow request in Jaeger
2. Get correlation ID from trace
3. Search logs for correlation ID:

```bash
docker logs my-service | grep "abc-123-def-456"
```

### Jaeger + Metrics (Grafana)

1. Identify slow operation in Jaeger
2. Find operation name
3. Search Grafana for that operation's metrics
4. See trends over time

---

## Quick Reference

### Search Patterns

```
# Find by correlation ID
Tags: correlation.id="abc-123"

# Find errors
Tags: error=true

# Find slow requests
Min Duration: 1s

# Find specific operation
Service: user-service
Operation: CreateUserHandler

# Find HTTP errors
Tags: http.status_code=500

# Find by user
Tags: user.id="user-123"

# Time range
Lookback: Last 15m
Custom: 2024-01-15 12:00 to 13:00
```

### Keyboard Shortcuts

- `g` - Go to search
- `/` - Focus search box
- `Escape` - Close trace detail
- `j` / `k` - Next/previous trace

---

## Related Documentation

- [Correlation ID Tracking](./correlation-id-tracking.md) - Using correlation IDs
- [Log Analysis](./log-analysis.md) - Analyzing service logs
- [Telemetry Architecture](../../02-core-concepts/telemetry.md) - How tracing works
- [Performance Optimization](../../04-operations/performance.md) - Optimization strategies

---

## Summary

Jaeger is essential for:

1. **Performance Analysis** - Find slow operations (Min Duration filter)
2. **Error Debugging** - Trace failures (error=true tag)
3. **Request Flow** - Understand service interactions (Trace timeline)
4. **Correlation ID Tracking** - Link requests across services

Always start troubleshooting by finding the trace for a specific correlation ID or searching for errors/slow requests.
