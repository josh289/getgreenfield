---
layout: home

hero:
  name: "Banyan Platform"
  text: "Microservices Made Simple"
  tagline: "Event-driven microservices platform with zero infrastructure code. Focus on business logic, we handle the rest."
  actions:
    - theme: brand
      text: Get Started
      link: /00-getting-started/01-installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/banyanai/banyan-core
  image:
    src: /logo.svg
    alt: Banyan Platform

features:
  - icon: 🚀
    title: Zero Infrastructure Code
    details: Write pure business logic. No HTTP servers, no message queues, no databases. Just handlers.
  - icon: 🔌
    title: One-Line Service Startup
    details: Start your entire microservice with BaseService.start(). All infrastructure configured automatically.
  - icon: 📝
    title: Type-Safe Contracts
    details: Compile-time validation prevents runtime communication errors. Full TypeScript support.
  - icon: 🔍
    title: Built-in Observability
    details: Distributed tracing, metrics, and logging out of the box. Jaeger, Prometheus, and Grafana included.
  - icon: 🔒
    title: Two-Layer Authorization
    details: Permission-based (API Gateway) + Policy-based (Service) security. Enterprise-grade access control.
  - icon: ⚡
    title: Auto-Generated APIs
    details: REST, GraphQL, and WebSocket endpoints generated automatically from your handlers.
  - icon: 🔄
    title: Event Sourcing
    details: Built-in event store with PostgreSQL. Complete audit trail and time travel capabilities.
  - icon: 🎯
    title: CQRS Pattern
    details: Command/Query separation with automatic caching and read model projections.
  - icon: 🌐
    title: Service Discovery
    details: Event-driven service registration and health monitoring. No manual configuration needed.
---

## Quick Example

Create a command handler and the platform does the rest:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import { CreateUserCommand, type CreateUserResult } from './contracts';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    // Your business logic here
    return {
      userId: 'user-123',
      email: command.email,
      createdAt: new Date().toISOString(),
    };
  }
}
```

**The platform automatically:**
- ✅ Discovers your handler
- ✅ Generates REST endpoint: `POST /api/users`
- ✅ Generates GraphQL mutation: `createUser`
- ✅ Validates permissions
- ✅ Publishes to message bus
- ✅ Adds distributed tracing
- ✅ Enables WebSocket subscriptions

## Why Banyan?

Traditional microservices require writing **tons of infrastructure code**:

- HTTP server setup and routing
- Message bus connection and queue management
- Database connections and migrations
- Authentication and authorization middleware
- Distributed tracing instrumentation
- Metrics collection and health checks
- Service discovery registration
- API documentation generation

**Banyan eliminates all of this.** You write handlers, we provide the infrastructure.

## Architecture

```mermaid
graph TB
    Client[Client Apps]
    Gateway[API Gateway]
    Bus[RabbitMQ Message Bus]
    Service1[User Service]
    Service2[Order Service]
    Service3[Payment Service]
    Discovery[Service Discovery]
    EventStore[(Event Store)]
    Cache[(Redis Cache)]

    Client -->|REST/GraphQL/WS| Gateway
    Gateway -->|Messages| Bus
    Bus -->|Commands/Queries| Service1
    Bus -->|Commands/Queries| Service2
    Bus -->|Commands/Queries| Service3
    Service1 -->|Events| Bus
    Service2 -->|Events| Bus
    Service3 -->|Events| Bus
    Service1 -->|Register| Discovery
    Service2 -->|Register| Discovery
    Service3 -->|Register| Discovery
    Service1 -->|Store Events| EventStore
    Service2 -->|Store Events| EventStore
    Service3 -->|Store Events| EventStore
    Service1 -->|Cache Queries| Cache
    Service2 -->|Cache Queries| Cache
    Service3 -->|Cache Queries| Cache
```

## Key Features

### Message Bus Only
Services communicate **exclusively** through RabbitMQ. No direct HTTP calls between services. This ensures loose coupling and enables powerful patterns like event sourcing and CQRS.

### Handler Discovery
Place handlers in `/commands/`, `/queries/`, or `/events/` directories. The platform automatically discovers and registers them. No manual configuration required.

### Auto-Generated Service Clients
Services publish their contracts to service discovery. The platform generates TypeScript client packages for inter-service communication with full type safety.

### Enterprise-Grade Security
Two-layer authorization: permission-based at the API Gateway (who can call what) and policy-based at service handlers (business rules). Both layers declarative via decorators.

### Event Sourcing Built-In
Every command that modifies state is stored as an event. Complete audit trail, time travel, and event replay capabilities included.

## Developer Experience

### Before (Traditional Microservices)

```typescript
// Express setup
const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use(corsMiddleware);
app.use(tracingMiddleware);
app.use(metricsMiddleware);

// Manual routing
app.post('/api/users', async (req, res) => {
  try {
    // Manual validation
    const errors = validateCreateUser(req.body);
    if (errors) return res.status(400).json({ errors });

    // Manual auth check
    if (!req.user?.permissions.includes('users:create')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Business logic buried in HTTP code
    const user = await createUser(req.body);

    // Manual event publishing
    await eventBus.publish('UserCreated', user);

    // Manual tracing
    span.setAttributes({ userId: user.id });
    span.end();

    res.status(201).json(user);
  } catch (error) {
    // Manual error handling
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(3000);
```

**~100 lines of infrastructure code for one endpoint**

### After (Banyan Platform)

```typescript
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    return {
      userId: 'user-123',
      email: command.email,
      createdAt: new Date().toISOString(),
    };
  }
}
```

**~10 lines of pure business logic**

All validation, auth, tracing, events, and API generation happen automatically.

## Get Started

<div style="display: flex; gap: 1rem; margin-top: 1rem;">
  <a href="/00-getting-started/01-installation" style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--vp-c-brand-1); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
    Installation Guide
  </a>
  <a href="/01-tutorials/beginner/todo-service" style="display: inline-block; padding: 0.75rem 1.5rem; border: 2px solid var(--vp-c-brand-1); color: var(--vp-c-brand-1); border-radius: 8px; text-decoration: none; font-weight: 600;">
    Try the Tutorial
  </a>
</div>

## Community

- **GitHub**: [banyanai/banyan-core](https://github.com/banyanai/banyan-core)
- **Issues**: [Report bugs or request features](https://github.com/banyanai/banyan-core/issues)
- **License**: MIT
