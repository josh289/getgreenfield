---
title: "Observability Guide"
---

# Observability Guide

## Overview

The banyan-core platform provides **automatic observability** with zero configuration required from developers. All logging, tracing, and metrics are captured and correlated automatically.

## Core Principle

**Developers write zero observability code.** The platform automatically:

- Captures logs with correlation IDs
- Traces requests across service boundaries
- Collects performance metrics
- Correlates logs, traces, and metrics
- Exports to Jaeger, Elasticsearch, and Grafana

## Distributed Tracing

### Automatic Tracing

Every request automatically generates a distributed trace:

```
External Request → API Gateway → Service A → Service B
      │                │             │           │
      └────────────────┴─────────────┴───────────┘
            All correlated by trace ID
```

### Trace Propagation

Correlation IDs propagate automatically through:

1. **HTTP requests** (via `X-Correlation-ID` header)
2. **Message bus** (via MessageEnvelope.correlationId)
3. **Database queries** (via query comments)
4. **Logs** (included in every log entry)

### Viewing Traces

#### Jaeger UI

Access at: `http://localhost:16686`

**Features**:
- Search traces by service, operation, tags
- View trace timelines
- Analyze service dependencies
- Identify performance bottlenecks
- See error traces

**Example Search**:
```
Service: user-service
Operation: CreateUserHandler
Tags: http.status_code=200
Lookback: Last 1 hour
```

#### Trace Details

Each trace shows:
- **Total duration** across all services
- **Service spans** with individual timings
- **Tags**: HTTP method, status code, user ID, etc.
- **Logs**: Application logs tied to trace
- **Errors**: Stack traces for failures

### Trace Context

W3C Trace Context automatically included:

```typescript
interface TraceContextData {
  traceId: string;    // 32 hex characters
  spanId: string;     // 16 hex characters
  traceFlags: string; // 2 hex characters
  traceState?: string; // Optional vendor data
}
```

Example:
```
traceId: 0af7651916cd43dd8448eb211c80319c
spanId: b7ad6b7169203331
traceFlags: 01
```

## Logging

### Automatic Log Capture

All logs automatically include:

```json
{
  "timestamp": "2025-11-15T10:30:00.123Z",
  "level": "info",
  "message": "User created successfully",
  "serviceName": "user-service",
  "correlationId": "cor_abc123xyz",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "userId": "usr_1234567890",
  "context": {
    "email": "alice@example.com",
    "userId": "usr_1234567890"
  }
}
```

### Logger Usage

Use the platform logger in handlers:

```typescript
import { Logger } from '@banyanai/platform-telemetry';

@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  private readonly logger = Logger.getInstance();

  async handle(input: { email: string; name: string }) {
    this.logger.info('Creating user', {
      email: input.email,
      name: input.name
    });

    const user = await this.userRepository.create(input);

    this.logger.info('User created successfully', {
      userId: user.id,
      email: user.email
    });

    return user;
  }
}
```

### Log Levels

```typescript
// Error (automatically captures stack traces)
this.logger.error('Failed to create user', error, { email });

// Warning
this.logger.warn('User email already exists', { email });

// Info
this.logger.info('User created', { userId });

// Debug (development only)
this.logger.debug('Validating user input', { input });
```

### Sensitive Data Redaction

Sensitive data automatically redacted:

```typescript
// Input
this.logger.info('User logged in', {
  email: 'alice@example.com',
  password: 'Secret123',  // ← Redacted
  ssn: '123-45-6789'      // ← Redacted
});

// Output
{
  "message": "User logged in",
  "context": {
    "email": "alice@example.com",
    "password": "***REDACTED***",
    "ssn": "***REDACTED***"
  }
}
```

**Redacted Fields**:
- password, passwd, pwd
- token, apiKey, secret
- ssn, creditCard, cvv
- privateKey, accessToken

### Viewing Logs

#### Elasticsearch

Logs stored in Elasticsearch at: `http://localhost:9200`

Query logs:
```bash
curl http://localhost:9200/logs-*/_search?q=correlationId:cor_abc123xyz
```

#### Grafana Explore

Access at: `http://localhost:5005`

**Features**:
- Search logs by service, level, correlation ID
- Filter by time range
- Correlate with traces
- View log context around errors

## Metrics

### Automatic Metrics

Platform collects metrics automatically:

**Request Metrics**:
- Request count by service and operation
- Request duration (p50, p95, p99)
- Error rate by service
- Success rate by operation

**Message Bus Metrics**:
- Message throughput
- Queue depth
- Processing time
- Retry count
- Circuit breaker state

**Database Metrics**:
- Query count
- Query duration
- Connection pool usage
- Transaction count

**Cache Metrics**:
- Hit rate
- Miss rate
- Eviction count
- Memory usage

### Custom Metrics

Add business metrics:

```typescript
import { MetricsManager } from '@banyanai/platform-telemetry';

@CommandHandler(ProcessOrderContract)
export class ProcessOrderHandler {
  private readonly metrics = MetricsManager.getInstance();

  async handle(input: { orderId: string }) {
    // Counter
    this.metrics.incrementCounter('orders.processed', {
      service: 'order-service'
    });

    // Gauge
    this.metrics.recordGauge('orders.revenue', order.total, {
      currency: 'USD'
    });

    // Histogram
    const startTime = Date.now();
    await this.processOrder(input.orderId);
    this.metrics.recordHistogram(
      'orders.processing.duration',
      Date.now() - startTime
    );
  }
}
```

### Viewing Metrics

#### Grafana Dashboards

Access at: `http://localhost:5005`

**Pre-built Dashboards**:
- Service Performance
- Message Bus Health
- Database Performance
- Error Rates
- Business Metrics

**Custom Dashboards**:
Create dashboards for your metrics in Grafana UI.

## Health Monitoring

### Automatic Health Checks

Each service exposes health endpoint:

```bash
# Check service health
curl http://localhost:3001/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00Z",
  "components": {
    "database": "healthy",
    "messageBus": "healthy",
    "cache": "healthy"
  },
  "uptime": 3600
}
```

### Component Health

Individual component checks:

```typescript
import { HealthMonitoring } from '@banyanai/platform-telemetry';

const health = HealthMonitoring.getInstance();

// Check database
const dbHealth = await health.checkDatabase();
console.log(dbHealth.status); // 'healthy' | 'degraded' | 'unhealthy'

// Check message bus
const mbHealth = await health.checkMessageBus();
console.log(mbHealth.status);
```

### Health Alerts

Configure alerts for unhealthy components:

```typescript
{
  alerting: {
    channels: ['email', 'slack'],
    thresholds: {
      errorRate: 0.05,      // Alert at 5% error rate
      responseTime: 1000,   // Alert if p95 > 1s
      queueDepth: 1000      // Alert if queue > 1000
    }
  }
}
```

## Correlation

### Request Correlation

Every request has a unique correlation ID:

```
HTTP Request: X-Correlation-ID: cor_abc123xyz
    ↓
MessageEnvelope: correlationId: cor_abc123xyz
    ↓
Log Entry: correlationId: cor_abc123xyz
    ↓
Trace: traceId: cor_abc123xyz
```

### Finding Related Data

Search across all observability data:

```bash
# Logs in Elasticsearch
curl "http://localhost:9200/logs-*/_search?q=correlationId:cor_abc123xyz"

# Traces in Jaeger
curl "http://localhost:16686/api/traces?service=user-service&tag=correlationId:cor_abc123xyz"
```

### Cross-Service Tracing

Trace requests across multiple services:

```
Trace: cor_abc123xyz
├─ Span: API Gateway (50ms)
│  └─ HTTP POST /api/users
├─ Span: User Service (150ms)
│  ├─ CreateUserHandler (100ms)
│  └─ Database Insert (50ms)
└─ Span: Email Service (200ms)
   └─ SendWelcomeEmail (200ms)
```

Total duration: 400ms (spans overlap)

## OpenTelemetry Integration

### Automatic Instrumentation

Platform uses OpenTelemetry for:

- **HTTP instrumentation** (Express, fetch)
- **Database instrumentation** (PostgreSQL)
- **Message bus instrumentation** (RabbitMQ)
- **Cache instrumentation** (Redis)

### OTLP Export

Telemetry exported via OTLP:

```
Services → OTLP Exporter → Jaeger → Elasticsearch
```

Jaeger endpoint: `http://jaeger:4318/v1/traces`

### Custom Spans

Add custom spans for detailed tracing:

```typescript
import { TelemetrySDK } from '@banyanai/platform-telemetry';

@CommandHandler(ComplexOperationContract)
export class ComplexOperationHandler {
  private readonly telemetry = TelemetrySDK.getInstance();

  async handle(input: any) {
    return await this.telemetry.withSpan(
      'complex-operation',
      async (span) => {
        span.setAttribute('operation.type', 'complex');
        span.setAttribute('input.size', JSON.stringify(input).length);

        // Sub-operation 1
        await this.telemetry.withSpan('step-1', async () => {
          await this.processStep1(input);
        });

        // Sub-operation 2
        await this.telemetry.withSpan('step-2', async () => {
          await this.processStep2(input);
        });

        return result;
      }
    );
  }
}
```

## Performance Analysis

### Identifying Bottlenecks

Use Jaeger to find slow operations:

1. **Search** for traces with high duration
2. **Sort** by duration descending
3. **Analyze** span timeline
4. **Identify** slowest span
5. **Optimize** that operation

### Common Bottlenecks

| Bottleneck | Symptom | Solution |
|------------|---------|----------|
| Database Query | Span shows slow DB time | Add index, optimize query |
| External API | Long span for HTTP call | Add caching, async processing |
| Message Processing | High queue depth | Scale consumers, optimize handler |
| Serialization | Slow message marshalling | Use compression, reduce payload |

### Service Performance Metrics

Monitor in Grafana:

- **P50 Response Time**: Median response time
- **P95 Response Time**: 95th percentile (slow requests)
- **P99 Response Time**: 99th percentile (outliers)
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests per second

## Best Practices

### 1. Use Structured Logging

```typescript
// Good: Structured context
this.logger.info('User created', {
  userId: user.id,
  email: user.email,
  role: user.role
});

// Avoid: String concatenation
this.logger.info(`User ${user.id} created with email ${user.email}`);
```

### 2. Log at Appropriate Levels

```typescript
// Error: Requires immediate attention
this.logger.error('Database connection failed', error);

// Warning: Potential issue, not blocking
this.logger.warn('Cache miss, falling back to database');

// Info: Normal operation
this.logger.info('User logged in', { userId });

// Debug: Detailed debugging (dev only)
this.logger.debug('Query parameters', { params });
```

### 3. Add Context to Errors

```typescript
try {
  await this.userRepository.create(input);
} catch (error) {
  this.logger.error('Failed to create user', error, {
    email: input.email,
    attemptNumber: retryCount
  });
  throw error;
}
```

### 4. Use Meaningful Metric Names

```typescript
// Good: Clear, hierarchical
this.metrics.incrementCounter('orders.processed.success');
this.metrics.incrementCounter('orders.processed.failed');

// Avoid: Ambiguous
this.metrics.incrementCounter('count');
this.metrics.incrementCounter('processed');
```

### 5. Don't Over-Instrument

```typescript
// Good: Instrument critical paths
this.metrics.recordHistogram('payment.processing.duration', duration);

// Avoid: Too granular
this.metrics.recordHistogram('variable.x.assignment.duration', 0.001);
```

## Troubleshooting

### Traces Not Appearing

**Cause**: Jaeger not receiving traces

**Solution**:
```bash
# Check Jaeger is running
docker compose ps jaeger

# Check endpoint configuration
echo $JAEGER_ENDPOINT

# Verify telemetry provider initialized
curl http://localhost:3001/health | grep telemetry
```

### Logs Not in Elasticsearch

**Cause**: Elasticsearch not running or wrong configuration

**Solution**:
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check indices
curl http://localhost:9200/_cat/indices?v

# Verify logs index exists
curl http://localhost:9200/logs-*/_count
```

### Missing Correlation IDs

**Cause**: Request missing correlation ID header

**Solution**: API Gateway automatically generates correlation IDs, but ensure you're using the platform's HTTP client for external calls.

## Next Steps

- [Message Bus Guide](./message-bus.md)
- [Monitoring Guide](./monitoring.md)
- [Deployment Guide](./deployment.md)
