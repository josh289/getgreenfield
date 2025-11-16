# Troubleshooting

> 🎯 **Goal**: Diagnose and resolve issues quickly to get back to building

This section helps you diagnose and resolve issues when working with the Banyan platform. Problem-oriented documentation designed to get you unstuck fast.

## Top 10 Most Common Issues

Solve 80% of problems with these frequently encountered issues:

| Issue | Quick Fix | Time | Details |
|-------|-----------|------|---------|
| 1. Service won't start | Check Docker containers running | 2 min | [Details →](#1-service-wont-start) |
| 2. Handler not called | Verify handler in correct folder | 5 min | [Details →](#2-handler-not-called) |
| 3. Message not received | Check RabbitMQ connection | 5 min | [Details →](#3-messages-not-received) |
| 4. "Permission denied" error | Check `@RequiresPermission` | 2 min | [Details →](#4-permission-denied) |
| 5. Contract validation fails | Review field decorators | 5 min | [Details →](#5-contract-validation-fails) |
| 6. Cannot connect to database | Verify DATABASE_URL env var | 2 min | [Details →](#6-database-connection-failed) |
| 7. Service not in discovery | Wait 30s after startup | 1 min | [Details →](#7-service-not-found-in-discovery) |
| 8. GraphQL schema error | Check for dots in names | 5 min | [Details →](#8-graphql-schema-errors) |
| 9. High memory usage | Check for event replay loop | 10 min | [Details →](#9-high-memory-usage) |
| 10. Slow query performance | Enable query caching | 5 min | [Details →](#10-slow-query-performance) |

### Quick Solutions

#### 1. Service Won't Start
```bash
# Check if infrastructure is running
docker compose ps

# If not running, start infrastructure
docker compose up

# Check service logs for errors
docker compose logs -f your-service-name
```

#### 2. Handler Not Called
```bash
# Verify handler is in correct folder
ls commands/  # For command handlers
ls queries/   # For query handlers
ls events/    # For event handlers

# Check handler exports the class
# ✅ Correct: export class CreateItemHandler
# ❌ Wrong: class CreateItemHandler (missing export)
```

#### 3. Messages Not Received
```bash
# Check RabbitMQ is running
docker compose ps rabbitmq

# View RabbitMQ management UI
open http://localhost:15672
# Username: guest, Password: guest

# Check for queues and bindings
# Verify message exchange exists
```

#### 4. Permission Denied
```typescript
// Check decorator matches permission being sent
@RequiresPermission('users.create') // Must match exactly
export class CreateUserHandler { }

// In development, bypass auth:
// Set BYPASS_AUTH=true in .env
```

#### 5. Contract Validation Fails
```typescript
// Ensure all fields have decorators
@Contract()
export class CreateItemCommand {
  @Field()        // ✅ Has @Field()
  @IsString()     // ✅ Has validation
  name: string;

  description: string; // ❌ Missing decorators!
}
```

#### 6. Database Connection Failed
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Should be: postgresql://user:pass@localhost:5432/dbname

# Check PostgreSQL is running
docker compose ps postgres
```

#### 7. Service Not Found in Discovery
```bash
# Wait 30 seconds after service startup
# Service discovery has delayed registration

# Check service discovery API
curl http://localhost:3001/api/services

# Verify your service appears in the list
```

#### 8. GraphQL Schema Errors
```typescript
// Remove dots from handler/contract names
// ❌ Wrong: CreateUser.Handler
// ✅ Correct: CreateUserHandler

// Remove dots from field names
// ❌ Wrong: user.name
// ✅ Correct: userName
```

#### 9. High Memory Usage
```typescript
// Check for infinite event replay
// Ensure events don't trigger themselves

@EventHandler()
export class ItemCreatedHandler {
  async handle(event: ItemCreatedEvent) {
    // ❌ Wrong: Publishing same event type
    await this.messageBus.publish(new ItemCreatedEvent());

    // ✅ Correct: Publish different event type
    await this.messageBus.publish(new ItemIndexedEvent());
  }
}
```

#### 10. Slow Query Performance
```typescript
// Queries are automatically cached
// But cache TTL may be too short

@QueryHandler({ cacheTTL: 3600 }) // Cache for 1 hour
export class GetItemsHandler { }
```

## Diagnostic Decision Tree

Use this flowchart to diagnose your issue:

```
Something's Not Working - Start Here
────────────────────────────────────────────────────────────────────

Is it a startup issue?
│
├─ YES → Service won't start
│         │
│         ├─ Docker not running? → Start Docker
│         ├─ Port already in use? → Change port or kill process
│         ├─ Missing env vars? → Check .env file
│         └─ Dependencies missing? → Run `pnpm install`
│
└─ NO → Service is running
         │
         ├─ Is it a message issue?
         │  │
         │  ├─ Handler not called?
         │  │  └─ Check: Handler in correct folder?
         │  │     Check: Handler exported?
         │  │     Check: RabbitMQ running?
         │  │
         │  ├─ Message not received?
         │  │  └─ Check: Queue exists in RabbitMQ?
         │  │     Check: Service registered in discovery?
         │  │     Check: Message format correct?
         │  │
         │  └─ Message errors?
         │     └─ Check: Contract validation?
         │        Check: Required fields present?
         │
         ├─ Is it an auth issue?
         │  │
         │  ├─ "Permission denied"?
         │  │  └─ Check: @RequiresPermission matches?
         │  │     Check: User has permission?
         │  │     Check: Token valid?
         │  │
         │  └─ "Unauthorized"?
         │     └─ Check: Authorization header present?
         │        Check: Token not expired?
         │
         ├─ Is it a database issue?
         │  │
         │  ├─ Connection failed?
         │  │  └─ Check: DATABASE_URL set?
         │  │     Check: PostgreSQL running?
         │  │     Check: Credentials correct?
         │  │
         │  └─ Query failed?
         │     └─ Check: Event store initialized?
         │        Check: Aggregate exists?
         │
         ├─ Is it a performance issue?
         │  │
         │  ├─ Slow queries?
         │  │  └─ Check: Caching enabled?
         │  │     Check: Database indexes?
         │  │     Check: Query complexity?
         │  │
         │  └─ High memory?
         │     └─ Check: Event replay loop?
         │        Check: Large aggregates?
         │        Check: Memory leaks in handlers?
         │
         └─ Is it an API issue?
            │
            ├─ GraphQL error?
            │  └─ Check: Schema valid?
            │     Check: No dots in names?
            │     Check: Types match?
            │
            └─ REST API error?
               └─ Check: Route registered?
                  Check: Request format?
                  Check: API Gateway running?
```

## Content Organization

### [By Symptom](./by-symptom/)
Find solutions by describing what you're experiencing:
- **Service Won't Start**: Service initialization failures
- **Messages Not Being Received**: Handler not processing messages
- **Messages Not Being Sent**: Unable to publish commands/queries/events
- **Authentication Failures**: Login and token issues
- **Authorization Denied**: Permission and policy check failures
- **Database Connection Issues**: PostgreSQL connection problems
- **Cache Misses**: Redis caching not working
- **Slow Performance**: Response time and throughput issues
- **Memory Leaks**: Increasing memory usage over time

### [By Component](./by-component/)
Find solutions organized by platform component:
- **API Gateway**: HTTP/GraphQL endpoint issues
- **Auth Service**: Authentication and authorization problems
- **Service Discovery**: Service registration and lookup failures
- **Message Bus**: RabbitMQ connectivity and delivery issues
- **Event Store**: Event persistence and retrieval problems
- **Contract System**: Contract validation and broadcasting issues
- **Telemetry**: Tracing and metrics collection problems
- **BaseService**: Service startup and lifecycle issues

### [Common Errors](./common-errors/)
Specific error codes and stack traces with solutions:
- **Error Code Reference**: All platform error codes explained
- **Stack Trace Analysis**: Understanding common stack traces
- **Validation Errors**: Contract and input validation failures
- **Message Bus Errors**: RabbitMQ error codes and meanings
- **Database Errors**: PostgreSQL error codes
- **Network Errors**: Connection and timeout issues

## Troubleshooting Approach

### 1. Identify the Symptom
Start by clearly identifying what's not working:
- What are you trying to do?
- What's happening instead?
- When did it start happening?
- Can you reproduce it consistently?

### 2. Find Relevant Documentation
- **Known symptom?** → Check [By Symptom](./by-symptom/)
- **Specific component?** → Check [By Component](./by-component/)
- **Error message?** → Check [Common Errors](./common-errors/)

### 3. Gather Diagnostic Information
Before troubleshooting, collect:
- Error messages and stack traces
- Log output from affected services
- Jaeger traces for failed requests
- Platform and service versions
- Recent changes to code or configuration

### 4. Apply Solutions
- Follow step-by-step diagnostic procedures
- Apply suggested fixes in order
- Verify each fix before moving to the next
- Document what worked for future reference

### 5. Seek Additional Help
If troubleshooting docs don't resolve your issue:
- Check related [Concepts](../02-concepts/README.md) for understanding
- Review relevant [Reference](../04-reference/README.md) documentation
- Look at working [Examples](../06-examples/README.md)
- Search for similar issues in the repository

## Diagnostic Tools

The platform provides several tools for troubleshooting:

### Logs
```bash
# View service logs
docker compose logs -f service-name

# View all platform logs
docker compose logs -f
```

### Distributed Tracing
- Access Jaeger UI at http://localhost:16686
- Search for traces by service, operation, or tags
- View span details for timing and errors

### Metrics
- Access Grafana at http://localhost:3000
- View platform dashboards
- Query Prometheus directly at http://localhost:9090

### RabbitMQ Management
- Access RabbitMQ UI at http://localhost:15672
- Check queues, exchanges, and bindings
- View message rates and consumers

### Health Checks
```bash
# Check service health
curl http://localhost:3000/health

# Check service discovery
curl http://localhost:3001/api/services
```

## Prevention Best Practices

Avoid common issues by:
- Running quality checks before committing: `./platform/scripts/quality-check-all.sh`
- Maintaining 90%+ test coverage
- Using TypeScript strict mode
- Following platform conventions for handler discovery
- Keeping dependencies up to date
- Monitoring distributed traces in development

## Documentation Contents

*Troubleshooting documentation files will be added here*
