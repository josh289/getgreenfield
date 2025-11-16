# Scalability Guide

## Overview

The banyan-core platform is designed for horizontal scalability. Services scale independently, and the message bus automatically load-balances work across instances.

## Scaling Strategy

### Horizontal Scaling

Add more instances of services rather than increasing single-instance resources:

```bash
# Scale API Gateway to handle more external traffic
docker compose up -d --scale api-gateway=5

# Scale business services for processing capacity
docker compose up -d --scale user-service=10
docker compose up -d --scale order-service=10
```

### Why Horizontal Scaling Works

1. **Stateless Services**: Services don't maintain local state
2. **Message Bus**: Work distributed automatically via queues
3. **Event Store**: Shared PostgreSQL for persistence
4. **Cache**: Shared Redis for query results

## Message Bus Load Balancing

### Automatic Distribution

RabbitMQ distributes messages automatically:

**Commands/Queries** (Request-Response):
```
Client → Queue → [Handler 1, Handler 2, Handler 3, ...]
         Round-robin distribution
```

**Events** (Publish-Subscribe):
```
Publisher → Exchange → [Subscriber 1, Subscriber 2, Subscriber 3]
           Each gets a copy
```

### Competing Consumers

Multiple service instances share the same queue:

```
service.user-service.commands.CreateUser
    ↓
[Instance 1]  [Instance 2]  [Instance 3]
  Message 1    Message 2    Message 3
```

**Benefits**:
- Automatic load balancing
- Fault tolerance (if one fails, others continue)
- Linear scaling (double instances ≈ double throughput)

### Prefetch Tuning

Control concurrency per instance:

```typescript
await messageBus.registerHandler(ProcessVideoContract, handler, {
  prefetch: 1  // Process one at a time (CPU intensive)
});

await messageBus.registerHandler(GetUserContract, handler, {
  prefetch: 10  // Process 10 concurrent (I/O bound)
});
```

**Guidelines**:
- **CPU-intensive**: prefetch = 1-2
- **I/O-bound**: prefetch = 10-20
- **Memory-intensive**: prefetch = 1-5

## Database Scaling

### Read Replicas

Add PostgreSQL read replicas for queries:

```yaml
services:
  postgres-primary:
    image: postgres:16-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master

  postgres-replica-1:
    image: postgres:16-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_MASTER_HOST: postgres-primary
```

Route queries to replicas:

```typescript
// Write to primary
await primaryDb.execute('INSERT INTO users ...');

// Read from replica
const users = await replicaDb.query('SELECT * FROM users ...');
```

### Connection Pooling

Configure appropriate pool sizes:

```typescript
{
  database: {
    pool: {
      min: 2,           // Minimum connections
      max: 10,          // Maximum per instance
      idleTimeout: 30000
    }
  }
}
```

**Calculation**: `totalConnections = serviceInstances × poolMax`

Example:
- 5 service instances × 10 connections = 50 total connections
- Ensure PostgreSQL `max_connections > 50`

### Query Optimization

1. **Add Indexes**: Speed up frequently queried fields
2. **Use CQRS**: Separate read models for complex queries
3. **Cache Results**: Use Redis for repeated queries
4. **Pagination**: Limit result sets

## Cache Scaling

### Redis Cluster

For high cache load, use Redis cluster:

```yaml
services:
  redis-node-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes

  redis-node-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes

  redis-node-3:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes
```

### Cache Strategies

**Cache-Aside Pattern**:
```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }) {
    // Try cache first
    const cached = await this.cache.get(`user:${input.id}`);
    if (cached) return cached;

    // Query database
    const user = await this.userRepository.findById(input.id);

    // Store in cache
    await this.cache.set(`user:${input.id}`, user, 300); // 5 min TTL

    return user;
  }
}
```

**Cache Invalidation**:
```typescript
@CommandHandler(UpdateUserContract)
export class UpdateUserHandler {
  async handle(input: { id: string; ... }) {
    const user = await this.userRepository.update(input);

    // Invalidate cache
    await this.cache.delete(`user:${input.id}`);

    return user;
  }
}
```

## API Gateway Scaling

### Multiple Instances

Scale API Gateway for external traffic:

```bash
docker compose up -d --scale api-gateway=5
```

### Load Balancer

Add Nginx for load balancing:

```nginx
upstream api_gateway {
    least_conn;  # Route to least busy instance
    server api-gateway-1:3003;
    server api-gateway-2:3003;
    server api-gateway-3:3003;
    server api-gateway-4:3003;
    server api-gateway-5:3003;
}

server {
    listen 80;

    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Rate Limiting

Distribute rate limits across instances:

Use shared Redis for rate limiting:

```typescript
{
  rateLimit: {
    store: 'redis',  // Shared across instances
    max: 100,
    windowMs: 60000
  }
}
```

## RabbitMQ Scaling

### Cluster Setup

For high message volume, cluster RabbitMQ:

```yaml
services:
  rabbitmq-1:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_ERLANG_COOKIE: secret_cookie
    volumes:
      - ./cluster-config.conf:/etc/rabbitmq/rabbitmq.conf

  rabbitmq-2:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_ERLANG_COOKIE: secret_cookie
    depends_on:
      - rabbitmq-1

  rabbitmq-3:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_ERLANG_COOKIE: secret_cookie
    depends_on:
      - rabbitmq-1
```

### Quorum Queues

Use quorum queues for high availability:

```typescript
{
  queueOptions: {
    durable: true,
    arguments: {
      'x-queue-type': 'quorum'
    }
  }
}
```

### Message Persistence

Balance persistence vs performance:

```typescript
// Critical messages: persistent
await messageBus.send(ProcessPaymentContract, payload, {
  persistent: true
});

// Non-critical: transient (faster)
await messageBus.send(UpdateCacheContract, payload, {
  persistent: false
});
```

## Performance Metrics

### Target Metrics

| Metric | Target | Scaling Action |
|--------|--------|----------------|
| Request Latency (p95) | < 200ms | Scale API Gateway |
| Queue Depth | < 100 | Scale service handlers |
| Database Connections | < 80% max | Increase pool or add replicas |
| Cache Hit Rate | > 90% | Increase cache size or TTL |
| Error Rate | < 1% | Investigate and fix |

### Monitoring Thresholds

Set alerts for scaling needs:

```typescript
{
  alerts: {
    queueDepth: {
      threshold: 100,
      action: 'Scale service instances'
    },
    responseTime: {
      threshold: 200,  // ms
      action: 'Scale API Gateway'
    },
    cpuUsage: {
      threshold: 70,   // %
      action: 'Scale containers'
    }
  }
}
```

## Auto-Scaling

### Kubernetes (Future)

For cloud deployment, use Kubernetes HPA:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Docker Swarm

For Docker-based auto-scaling:

```yaml
services:
  api-gateway:
    deploy:
      replicas: 3
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Capacity Planning

### Estimating Capacity

1. **Measure Single Instance**: Benchmark one instance throughput
2. **Calculate Requirements**: Total load / single instance capacity
3. **Add Headroom**: Multiply by 1.5-2x for peaks and failures
4. **Monitor and Adjust**: Track metrics and scale as needed

### Example Calculation

```
Single API Gateway instance: 1000 req/s
Expected peak load: 5000 req/s
Required instances: 5000 / 1000 = 5
With headroom (2x): 5 × 2 = 10 instances
```

### Resource Planning

| Component | Small (< 1K req/s) | Medium (1K-10K) | Large (> 10K) |
|-----------|-------------------|-----------------|---------------|
| API Gateway | 2 instances | 5 instances | 10+ instances |
| Services | 3 instances | 10 instances | 20+ instances |
| PostgreSQL | 1 primary | 1 primary + 2 replicas | Cluster |
| RabbitMQ | 1 node | 3 node cluster | 5+ node cluster |
| Redis | 1 node | 3 node cluster | 6+ node cluster |

## Best Practices

### 1. Design for Horizontal Scaling

```typescript
// Good: Stateless handler
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any) {
    return await this.userRepository.create(input);
  }
}

// Avoid: Local state
let localCache = {};  // Don't do this!
```

### 2. Use Idempotent Operations

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: { email: string }) {
    // Idempotent: Safe to retry
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) return existing;

    return await this.userRepository.create(input);
  }
}
```

### 3. Implement Circuit Breakers

Prevent cascade failures:

```typescript
{
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 2,
    recoveryTimeout: 30000
  }
}
```

### 4. Monitor Performance

Track key metrics:
- Request latency (p50, p95, p99)
- Queue depth
- Error rate
- Resource usage (CPU, memory)

### 5. Test Under Load

```bash
# Load test with Apache Bench
ab -n 10000 -c 100 http://localhost:3003/api/users

# Load test with k6
k6 run --vus 100 --duration 30s load-test.js
```

## Troubleshooting

### High Queue Depth

**Cause**: Handlers can't keep up with message rate

**Solution**:
```bash
# Scale service instances
docker compose up -d --scale user-service=10

# Or increase prefetch for I/O-bound handlers
prefetch: 20
```

### Database Connection Exhaustion

**Cause**: Too many service instances × pool size

**Solution**:
```typescript
// Reduce pool size per instance
pool: { max: 5 }

// Or increase PostgreSQL max_connections
# postgresql.conf
max_connections = 200
```

### Memory Issues

**Cause**: Unbounded message processing or cache growth

**Solution**:
```yaml
# Set container memory limits
deploy:
  resources:
    limits:
      memory: 2G
```

## Next Steps

- [Monitoring Guide](./monitoring.md)
- [Deployment Guide](./deployment.md)
- [Message Bus Guide](./message-bus.md)
