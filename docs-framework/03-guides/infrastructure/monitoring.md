# Monitoring Guide

## Overview

The banyan-core platform provides comprehensive monitoring through Grafana, Jaeger, and Elasticsearch. This guide covers monitoring setup, key metrics, and alerting strategies.

## Monitoring Stack

| Component | Purpose | URL |
|-----------|---------|-----|
| **Grafana** | Dashboards and visualization | http://localhost:5005 |
| **Jaeger** | Distributed tracing | http://localhost:16686 |
| **Elasticsearch** | Metrics and logs storage | http://localhost:9200 |
| **RabbitMQ Management** | Message bus monitoring | http://localhost:55672 |

## Grafana Setup

### Accessing Grafana

```bash
# URL
http://localhost:5005

# Default credentials (development)
Username: admin
Password: admin
```

### Pre-configured Datasources

Grafana automatically connects to:

- **Elasticsearch**: Logs and metrics
- **Jaeger**: Distributed traces

### Creating Dashboards

#### Service Performance Dashboard

```json
{
  "dashboard": {
    "title": "Service Performance",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(requests_total[5m])",
            "datasource": "Elasticsearch"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, response_time_seconds)",
            "datasource": "Elasticsearch"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(errors_total[5m])",
            "datasource": "Elasticsearch"
          }
        ]
      }
    ]
  }
}
```

### Recommended Dashboards

1. **Service Overview**
   - Request rate
   - Response time (p50, p95, p99)
   - Error rate
   - Active instances

2. **Message Bus Health**
   - Queue depth by service
   - Message rate (in/out)
   - Consumer count
   - Dead letter queue depth

3. **Database Performance**
   - Query count
   - Query duration
   - Connection pool usage
   - Slow queries

4. **Infrastructure Health**
   - CPU usage by service
   - Memory usage by service
   - Disk I/O
   - Network throughput

## Key Metrics

### Service Metrics

#### Request Metrics

```typescript
// Automatically collected
requests_total{service, operation, status}
request_duration_seconds{service, operation}
request_errors_total{service, operation}
```

**Monitor**:
- High error rate (> 1%)
- Slow requests (p95 > 200ms)
- Request rate spikes

#### Handler Metrics

```typescript
// Automatically collected
handler_executions_total{service, handler, status}
handler_duration_seconds{service, handler}
handler_errors_total{service, handler}
```

**Monitor**:
- Handler failures
- Slow handlers
- Handler throughput

### Message Bus Metrics

#### Queue Metrics

```bash
# Via RabbitMQ Management API
curl -u admin:admin123 http://localhost:55672/api/queues | jq '.[].messages_ready'
```

**Monitor**:
- **Queue depth** > 100: Scale consumers
- **Message rate** dropping: Check service health
- **Unacked messages** > 50: Check handler performance

#### Exchange Metrics

```bash
# Event publish rate
curl -u admin:admin123 http://localhost:55672/api/exchanges/%2F/exchange.platform.events | jq '.message_stats.publish_in'
```

**Monitor**:
- Event publish rate
- Routing failures
- Exchange errors

### Database Metrics

#### Connection Pool

```typescript
// Automatically collected
db_connections_active{service}
db_connections_idle{service}
db_connections_total{service}
```

**Monitor**:
- Connection pool exhaustion
- High idle connections
- Connection errors

#### Query Performance

```typescript
// Automatically collected
db_query_duration_seconds{service, operation}
db_queries_total{service, operation}
db_slow_queries_total{service}
```

**Monitor**:
- Slow queries (> 1s)
- Query rate spikes
- Query errors

### Cache Metrics

```typescript
// Automatically collected
cache_hits_total{service}
cache_misses_total{service}
cache_evictions_total{service}
cache_memory_bytes{service}
```

**Monitor**:
- **Hit rate** < 90%: Increase TTL or cache size
- High eviction rate: Increase memory
- Memory usage trending up

## Distributed Tracing

### Jaeger UI

Access at: `http://localhost:16686`

### Finding Traces

#### By Service

```
Service: user-service
Lookback: Last 1 hour
Limit Results: 20
```

#### By Operation

```
Service: user-service
Operation: CreateUserHandler
Tags: http.status_code=200
Min Duration: 100ms
```

#### By Error

```
Service: *
Tags: error=true
Lookback: Last 24 hours
```

### Analyzing Traces

#### Slow Requests

1. **Sort by duration** (descending)
2. **Identify slowest span** in timeline
3. **Check span tags** for context
4. **Optimize** identified bottleneck

#### Error Traces

1. **Filter** by error tag
2. **View error details** in span logs
3. **Check correlation ID** for related logs
4. **Fix root cause**

### Trace Metrics

Monitor trace statistics:

- **Trace count** by service
- **Average trace duration**
- **Error trace percentage**
- **Service dependencies**

## Alerting

### Alert Configuration

#### Grafana Alerts

Create alert rules in Grafana:

```json
{
  "name": "High Error Rate",
  "condition": "WHEN avg() OF query(A, 5m) IS ABOVE 0.05",
  "frequency": "1m",
  "for": "5m",
  "notifications": [
    {
      "type": "email",
      "addresses": ["alerts@your-domain.com"]
    },
    {
      "type": "slack",
      "channel": "#alerts"
    }
  ]
}
```

#### Alert Channels

Configure notification channels:

**Email**:
```json
{
  "type": "email",
  "addresses": ["ops@your-domain.com"],
  "settings": {
    "singleEmail": true
  }
}
```

**Slack**:
```json
{
  "type": "slack",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "settings": {
    "channel": "#alerts",
    "username": "Grafana Alert"
  }
}
```

### Critical Alerts

#### High Error Rate

```
ALERT: Error rate > 5% for 5 minutes
Service: user-service
Current Rate: 8.5%
Action: Check service logs and recent deployments
```

#### Queue Buildup

```
ALERT: Queue depth > 1000 for 5 minutes
Queue: service.order-service.commands.ProcessOrder
Depth: 1,543
Action: Scale order-service instances
```

#### Database Issues

```
ALERT: Database connection pool > 90% for 2 minutes
Service: user-service
Active: 18/20 connections
Action: Scale service instances or increase pool size
```

#### Slow Responses

```
ALERT: p95 response time > 1s for 10 minutes
Service: api-gateway
p95: 1.2s
Action: Check downstream services for bottlenecks
```

## Health Checks

### Service Health Endpoints

All services expose `/health`:

```bash
# Check API Gateway
curl http://localhost:3003/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00Z",
  "components": {
    "database": "healthy",
    "messageBus": "healthy",
    "cache": "healthy"
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

### Component Health

Monitor individual components:

```bash
# PostgreSQL
docker exec flow-platform-postgres pg_isready

# RabbitMQ
curl -u admin:admin123 http://localhost:55672/api/healthchecks/node

# Redis
docker exec flow-platform-redis redis-cli ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

### Automated Health Monitoring

Configure health check intervals:

```yaml
services:
  api-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Performance Monitoring

### Response Time Tracking

Track percentiles for all operations:

- **p50** (median): Typical user experience
- **p95**: Most users' experience
- **p99**: Worst-case (but not outliers)
- **max**: Absolute worst case

### Throughput Monitoring

Monitor requests per second:

```typescript
// Service-level throughput
service_requests_per_second{service="user-service"} = 150

// Handler-level throughput
handler_executions_per_second{handler="CreateUserHandler"} = 50
```

### Resource Utilization

Track container resources:

```bash
# View real-time stats
docker stats

# Specific service
docker stats flow-platform-api-gateway --no-stream
```

## Log Monitoring

### Elasticsearch Queries

#### Error Logs

```bash
curl "http://localhost:9200/logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "size": 100,
  "sort": [{ "timestamp": { "order": "desc" } }]
}
'
```

#### Service-Specific Logs

```bash
curl "http://localhost:9200/logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "match": { "serviceName": "user-service" } },
        { "range": { "timestamp": { "gte": "now-24h" } } }
      ]
    }
  }
}
'
```

### Log Aggregation

#### Error Trends

```bash
curl "http://localhost:9200/logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-7d" } } }
      ]
    }
  },
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "1h"
      }
    }
  }
}
'
```

## RabbitMQ Monitoring

### Management UI

Access at: `http://localhost:55672`

**Key Metrics**:
- Queue depths
- Message rates (publish/deliver)
- Consumer counts
- Connection/channel counts

### API Monitoring

```bash
# Queue statistics
curl -u admin:admin123 http://localhost:55672/api/queues | \
  jq '.[] | {name: .name, messages: .messages, consumers: .consumers}'

# Node health
curl -u admin:admin123 http://localhost:55672/api/nodes | \
  jq '.[] | {name: .name, mem_used: .mem_used, disk_free: .disk_free}'

# Exchange statistics
curl -u admin:admin123 http://localhost:55672/api/exchanges | \
  jq '.[] | {name: .name, type: .type}'
```

## Best Practices

### 1. Set Baseline Metrics

Establish normal operating ranges:

```
Normal Response Time (p95): 100-150ms
Normal Error Rate: < 0.1%
Normal Queue Depth: < 50
Normal CPU Usage: 30-50%
```

### 2. Alert on Trends

```
# Alert if metric trending in wrong direction
ALERT: Error rate increased 50% in last hour
Previous: 0.2%
Current: 0.3%
Trend: Increasing
```

### 3. Use Runbooks

Document response procedures:

```markdown
## High Queue Depth Alert

### Diagnosis
1. Check service instance count
2. Check handler errors in logs
3. Check downstream dependencies

### Resolution
1. Scale service instances: `docker compose up -d --scale service=10`
2. If errors, fix and redeploy
3. Monitor queue depth decrease
```

### 4. Monitor Business Metrics

Track business-relevant metrics:

```typescript
// Custom metrics
this.metrics.incrementCounter('orders.completed');
this.metrics.recordGauge('revenue.total', totalRevenue);
this.metrics.recordHistogram('order.value', orderValue);
```

### 5. Regular Reviews

- **Daily**: Check error rates and queue depths
- **Weekly**: Review performance trends
- **Monthly**: Capacity planning review

## Troubleshooting

### Missing Metrics

**Cause**: Service not reporting or Elasticsearch connection issue

**Solution**:
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Verify service telemetry configuration
echo $JAEGER_ENDPOINT
```

### Gaps in Traces

**Cause**: Service not instrumented or telemetry provider not initialized

**Solution**: Ensure `TelemetryProvider` initialized in service startup

### Alert Fatigue

**Cause**: Too many non-actionable alerts

**Solution**:
- Increase alert thresholds
- Reduce notification frequency
- Create separate channels for critical vs warning

## Next Steps

- [Observability Guide](./observability.md)
- [Scalability Guide](./scalability.md)
- [Deployment Guide](./deployment.md)
