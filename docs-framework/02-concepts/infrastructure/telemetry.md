---
title: "Telemetry Infrastructure"
description: "OpenTelemetry, Jaeger, Prometheus, and Grafana for observability"
category: "concepts"
tags: ["infrastructure", "observability", "tracing"]
difficulty: "intermediate"
related_concepts:
  - "../architecture/message-bus-architecture.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Telemetry Infrastructure

> **Core Idea:** OpenTelemetry provides unified tracing, metrics, and logging with Jaeger for distributed tracing and Prometheus + Grafana for metrics visualization.

## Overview

The platform provides complete observability through:
- **Distributed Tracing**: Jaeger 2.9 with Service Performance Monitoring
- **Metrics**: Prometheus + Grafana dashboards
- **Logging**: Structured logs with correlation IDs
- **Automatic Instrumentation**: Zero telemetry code in business logic

## Components

### Jaeger (Distributed Tracing)

```yaml
jaeger:
  image: cr.jaegertracing.io/jaegertracing/jaeger:2.9.0
  ports:
    - "16686:16686"  # Jaeger UI
    - "4318:4318"    # OTLP HTTP
  environment:
    - SPAN_STORAGE_TYPE=elasticsearch
```

Access: `http://localhost:16686`

### Grafana (Dashboards)

```yaml
grafana:
  image: grafana/grafana:11.5.0
  ports:
    - "5005:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

Access: `http://localhost:5005` (admin/admin)

### Elasticsearch (Jaeger Backend)

```yaml
elasticsearch:
  image: elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
```

## Automatic Correlation

```typescript
// Automatic correlation ID propagation
// API Gateway generates correlation ID
const correlationId = generateCorrelationId();

// Set AsyncLocalStorage context
await correlationContext.run(correlationId, async () => {
  // All message bus calls include correlation ID automatically
  await messageBus.send(CreateOrderContract, data);
  
  // No manual correlation ID management needed
  // Jaeger automatically links all spans
});
```

## Key Features

### Distributed Tracing
- **Complete Request Flow**: See entire request path across services
- **Performance Breakdown**: Time spent in each service
- **Error Tracking**: Failed requests highlighted
- **Dependency Graph**: Service communication map

### Service Performance Monitoring
- **RED Metrics**: Rate, Errors, Duration
- **Service Latency**: P50, P95, P99 percentiles
- **Error Rates**: Per service and operation
- **Call Graphs**: Service dependency visualization

### Custom Metrics
```typescript
import { Metrics } from '@banyanai/platform-telemetry';

// Counter
Metrics.counter('orders.created').inc();

// Histogram
Metrics.histogram('order.processing.time').observe(duration);

// Gauge
Metrics.gauge('active.orders').set(count);
```

## Monitoring Dashboards

### Pre-configured Grafana Dashboards
- Service overview (latency, throughput, errors)
- Message bus metrics (queue depth, message rate)
- Database metrics (query time, connection pool)
- Cache metrics (hit rate, memory usage)

## Best Practices

1. **Use Correlation IDs**
   - Automatically propagated by platform
   - Include in all logs
   - Track requests across services

2. **Monitor Key Metrics**
   - Command latency (target: <100ms)
   - Query latency (target: <50ms)
   - Error rate (target: <0.1%)

3. **Set Up Alerts**
   - Latency spikes
   - Error rate increases
   - Service unavailability

## Troubleshooting with Jaeger

### Find Slow Requests

1. Open Jaeger UI: `http://localhost:16686`
2. Select service
3. Set min duration: 1000ms
4. View slow traces
5. Identify bottleneck spans

### Track Errors

1. Select service
2. Filter by tag: `error=true`
3. View failed traces
4. Check error messages in span logs

## Further Reading

- [Message Bus Architecture](../architecture/message-bus-architecture.md)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
