---
title: Log Analysis
description: Techniques for searching and analyzing service logs effectively
category: troubleshooting
tags: [logs, debugging, docker, grep, analysis]
related:
  - ./correlation-id-tracking.md
  - ./jaeger-tracing.md
  - ../../02-core-concepts/telemetry.md
difficulty: beginner
---

# Log Analysis

## Overview

Platform services emit structured JSON logs with consistent fields. This guide covers techniques for finding and analyzing log entries to debug issues.

## Log Format

### Structured JSON Logs

All platform services use structured logging:

```json
{
  "level": "info",
  "timestamp": "2024-01-15T12:00:00.123Z",
  "service": "user-service",
  "correlationId": "abc-123-def-456",
  "message": "Command received",
  "context": {
    "commandType": "CreateUserCommand",
    "userId": "user-123"
  }
}
```

**Standard Fields:**

- `level`: Log level (debug, info, warn, error, fatal)
- `timestamp`: ISO 8601 timestamp
- `service`: Service name
- `correlationId`: Request correlation ID
- `message`: Human-readable message
- `context`: Additional metadata

## Viewing Logs

### Docker Logs

**View all logs:**

```bash
docker logs user-service
```

**Follow logs (real-time):**

```bash
docker logs -f user-service
```

**Last N lines:**

```bash
docker logs --tail 100 user-service
```

**With timestamps:**

```bash
docker logs --timestamps user-service
```

**Since timestamp:**

```bash
docker logs --since 2024-01-15T12:00:00 user-service
```

**All containers:**

```bash
docker compose logs -f
```

**Multiple services:**

```bash
docker compose logs -f user-service api-gateway
```

---

## Searching Logs

### Basic Grep

**Find errors:**

```bash
docker logs user-service | grep -i error
```

**Find specific message:**

```bash
docker logs user-service | grep "Command received"
```

**Case-insensitive search:**

```bash
docker logs user-service | grep -i "database"
```

**Multiple patterns (OR):**

```bash
docker logs user-service | grep -E "error|fail|timeout"
```

**Exclude pattern:**

```bash
docker logs user-service | grep -v "health check"
```

---

### Search by Correlation ID

**Most important search pattern:**

```bash
CORR_ID="abc-123-def-456"
docker logs user-service | grep "$CORR_ID"
```

**With context (lines before/after):**

```bash
docker logs user-service | grep -C 5 "$CORR_ID"
```

**All services:**

```bash
docker ps --format "{{.Names}}" | xargs -I {} sh -c "echo '=== {} ===' && docker logs {} 2>&1 | grep '$CORR_ID'"
```

---

### Search by Log Level

**Errors only:**

```bash
docker logs user-service | grep '"level":"error"'
```

**Warnings and errors:**

```bash
docker logs user-service | grep -E '"level":"(error|warn)"'
```

**Debug logs:**

```bash
docker logs user-service | grep '"level":"debug"'
```

---

### Search by Time Range

**Last hour:**

```bash
docker logs --since 1h user-service
```

**Specific time range:**

```bash
# Since specific time
docker logs --since 2024-01-15T12:00:00 user-service

# Between two times
docker logs --since 2024-01-15T12:00:00 --until 2024-01-15T13:00:00 user-service
```

**During deployment:**

```bash
# Get deployment time
DEPLOY_TIME="2024-01-15T14:30:00"

# Logs after deployment
docker logs --since $DEPLOY_TIME user-service | grep -i error
```

---

### Search by Context Fields

**Find specific user:**

```bash
docker logs user-service | grep '"userId":"user-123"'
```

**Find specific command:**

```bash
docker logs user-service | grep '"commandType":"CreateUserCommand"'
```

**Find handler execution:**

```bash
docker logs user-service | grep '"handlerName":"CreateUserHandler"'
```

---

## Advanced Techniques

### Count Occurrences

**Count errors:**

```bash
docker logs user-service | grep -c "error"
```

**Count by error type:**

```bash
docker logs user-service | grep error | sort | uniq -c | sort -rn
```

Example output:

```
  42 DatabaseConnectionError
  15 ValidationError
   8 TimeoutError
   3 UnknownError
```

---

### Extract Correlation IDs

**Get all correlation IDs from errors:**

```bash
docker logs user-service | grep error | grep -o '"correlationId":"[^"]*"' | cut -d'"' -f4
```

**Unique correlation IDs:**

```bash
docker logs user-service | grep error | grep -o '"correlationId":"[^"]*"' | cut -d'"' -f4 | sort -u
```

---

### Timeline Analysis

**Show timestamps for errors:**

```bash
docker logs --timestamps user-service | grep error | cut -d' ' -f1-2
```

**Group errors by minute:**

```bash
docker logs --timestamps user-service | grep error | cut -d':' -f1-2 | uniq -c
```

Example output:

```
   5 2024-01-15 12:00
  12 2024-01-15 12:01  ← Spike!
   3 2024-01-15 12:02
   2 2024-01-15 12:03
```

---

### Parse JSON Logs

**Using jq (if logs are valid JSON):**

```bash
# Pretty print logs
docker logs user-service | jq

# Extract specific field
docker logs user-service | jq -r '.message'

# Filter by level
docker logs user-service | jq 'select(.level == "error")'

# Extract errors with context
docker logs user-service | jq 'select(.level == "error") | {timestamp, message, correlationId}'

# Count errors by type
docker logs user-service | jq -r 'select(.level == "error") | .context.errorType' | sort | uniq -c
```

**Note:** Some logs may not be pure JSON due to Docker formatting. Use grep for reliable searching.

---

### Export Logs

**Save to file:**

```bash
docker logs user-service > user-service.log
```

**Save with timestamps:**

```bash
docker logs --timestamps user-service > user-service.log
```

**Save errors only:**

```bash
docker logs user-service | grep error > errors.log
```

**Save specific correlation ID:**

```bash
CORR_ID="abc-123"
docker logs user-service | grep "$CORR_ID" > request-$CORR_ID.log
```

---

## Common Search Patterns

### Find Handler Errors

```bash
# Find which handler failed
docker logs user-service | grep error | grep handler

# Extract handler names from errors
docker logs user-service | grep error | grep -o '"handlerName":"[^"]*"' | sort | uniq -c
```

---

### Find Database Errors

```bash
# Find database-related errors
docker logs user-service | grep -i "database\|postgres\|query\|connection"

# Connection errors specifically
docker logs user-service | grep -i "connection refused\|connection timeout\|connection lost"
```

---

### Find Authentication Issues

```bash
# Find auth errors
docker logs api-gateway | grep -i "auth\|unauthorized\|forbidden\|jwt"

# Find specific auth failures
docker logs api-gateway | grep '"status":401'
docker logs api-gateway | grep '"status":403'
```

---

### Find Message Bus Issues

```bash
# Find RabbitMQ errors
docker logs user-service | grep -i "rabbitmq\|amqp\|message bus"

# Find message routing errors
docker logs user-service | grep -i "handler not found\|routing"
```

---

### Find Performance Issues

```bash
# Find slow operations
docker logs user-service | grep -i "slow\|timeout\|duration"

# Find operations > threshold
docker logs user-service | grep duration | awk '$8 > 1000' # duration in ms
```

---

## Debugging Workflows

### Workflow 1: Investigate Error Report

**User reports:** "Error creating user"

**Steps:**

```bash
# 1. Get correlation ID from user
CORR_ID="abc-123"

# 2. Search all logs for correlation ID
docker ps --format "{{.Names}}" | xargs -I {} sh -c "docker logs {} | grep -q '$CORR_ID' && echo '=== {} ===' && docker logs {} | grep '$CORR_ID'"

# 3. Find error in results
# Example output:
# === user-service ===
# {"level":"error","correlationId":"abc-123","message":"Email already exists"}

# 4. Get more context
docker logs user-service | grep -C 10 "$CORR_ID"

# 5. Resolution: Tell user email already registered
```

---

### Workflow 2: Investigate Service Failure

**Symptom:** Service crashed

**Steps:**

```bash
# 1. Check recent errors before crash
docker logs user-service --tail 200 | grep error

# 2. Look for fatal errors
docker logs user-service | grep fatal

# 3. Check for uncaught exceptions
docker logs user-service | grep -i "uncaught\|unhandled"

# 4. Check startup logs
docker logs user-service --tail 500 | head -50

# 5. Look for resource issues
docker logs user-service | grep -i "memory\|out of memory\|heap"
```

---

### Workflow 3: Investigate Performance Degradation

**Symptom:** Service slow

**Steps:**

```bash
# 1. Check for errors causing retries
docker logs user-service --since 1h | grep -c error

# 2. Find slow operations
docker logs user-service --since 1h | grep -i "slow\|duration" | tail -20

# 3. Check database query times
docker logs user-service --since 1h | grep -i "query.*duration"

# 4. Check for queue buildup
docker logs user-service | grep -i "queue\|backlog"

# 5. Correlate with Jaeger traces for detailed analysis
```

---

### Workflow 4: Deployment Validation

**After deployment:**

```bash
# 1. Check service started
docker logs user-service --tail 50 | grep -i "started\|listening"

# 2. Check for startup errors
docker logs user-service --since 5m | grep error

# 3. Check handler discovery
docker logs user-service | grep "Handler discovery"

# 4. Check service registration
docker logs user-service | grep -i "registered"

# 5. Monitor for errors
docker logs -f user-service | grep error
```

---

## Log Level Management

### Set Log Level

**Environment variable:**

```yaml
# docker-compose.yml
services:
  user-service:
    environment:
      - LOG_LEVEL=debug  # debug, info, warn, error
```

**Runtime (if supported):**

```bash
# Some services support runtime log level changes
curl -X POST http://localhost:3000/admin/log-level \
  -H "Content-Type: application/json" \
  -d '{"level":"debug"}'
```

---

### Log Levels

**DEBUG:**
- Most verbose
- All operations logged
- Use for development/troubleshooting
- Not recommended for production (performance impact)

**INFO:**
- Key operations
- Handler execution
- Service lifecycle
- Default for production

**WARN:**
- Potential issues
- Degraded performance
- Retries

**ERROR:**
- Operation failures
- Exceptions
- Require attention

**FATAL:**
- Service-level failures
- Unrecoverable errors
- Service will likely crash

---

## Best Practices

### 1. Always Search by Correlation ID First

Most efficient way to find related logs:

```bash
docker logs user-service | grep "$CORR_ID"
```

### 2. Use Context Lines for Full Picture

```bash
# See surrounding context
docker logs user-service | grep -C 5 "$SEARCH_TERM"
```

### 3. Save Logs for Analysis

```bash
# Don't lose logs when container restarts
docker logs user-service > analysis.log
```

### 4. Search Multiple Services

Requests span multiple services:

```bash
# Search all services for correlation ID
for service in api-gateway user-service email-service; do
  echo "=== $service ==="
  docker logs $service | grep "$CORR_ID"
done
```

### 5. Combine with Jaeger

1. Find error in logs
2. Get correlation ID
3. Search Jaeger for visual timeline
4. Use both for complete picture

---

## Common Patterns

### Startup Logs

```bash
# Check service started correctly
docker logs user-service | grep -E "started|listening|ready"
```

### Handler Discovery

```bash
# Verify handlers found
docker logs user-service | grep "Handler discovery"
```

### Message Processing

```bash
# Track message flow
docker logs user-service | grep -E "received|processing|completed"
```

### Database Operations

```bash
# Monitor database queries
docker logs user-service | grep -i "query\|database"
```

---

## Quick Reference

### Essential Commands

```bash
# View logs
docker logs user-service

# Follow logs
docker logs -f user-service

# Search by correlation ID
docker logs user-service | grep "$CORR_ID"

# Find errors
docker logs user-service | grep error

# Count errors
docker logs user-service | grep -c error

# Export logs
docker logs user-service > service.log

# All services
docker compose logs -f

# Time range
docker logs --since 1h user-service
```

---

## Related Documentation

- [Correlation ID Tracking](./correlation-id-tracking.md) - Using correlation IDs
- [Jaeger Tracing](./jaeger-tracing.md) - Visual trace analysis
- [Telemetry Architecture](../../02-core-concepts/telemetry.md) - Logging architecture

---

## Summary

Effective log analysis:

1. **Start with correlation ID** - Most efficient search
2. **Use grep patterns** - Find specific issues quickly
3. **Add context** - Use `-C` flag for surrounding lines
4. **Export for analysis** - Save logs to files
5. **Combine with Jaeger** - Logs + traces = complete picture

Master these techniques and you can debug any issue by following the log trail from client request to backend error.
