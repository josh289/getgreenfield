---
title: '@banyanai/platform-base-service'
description: Core service abstraction providing one-line startup with zero infrastructure code
category: platform-packages
tags: [base-service, microservices, infrastructure, handlers, discovery]
related:
  - ./contract-system.md
  - ./cqrs.md
  - ../decorators/command-handlers.md
  - ../../03-guides/service-development/creating-a-service.md
difficulty: intermediate
---

# @banyanai/platform-base-service

Core service abstraction providing one-line startup with zero infrastructure code for the banyan-core microservices platform.

## Overview

`@banyanai/platform-base-service` is the cornerstone of the platform, enabling developers to write pure business logic while the platform handles all infrastructure concerns.

### Key Features

- **ONE-LINE STARTUP**: Services start with `BaseService.start(config)`
- **ZERO BOILERPLATE**: No infrastructure code needed in business logic
- **AUTOMATIC DISCOVERY**: Handlers discovered via decorators and folder conventions
- **TRANSPARENT AUTHENTICATION**: Two-layer authorization handled automatically
- **WORLD-CLASS TELEMETRY**: Complete observability with zero telemetry code
- **REAL-TIME PROJECTIONS**: Read models updated automatically from events
- **SERVICE CLIENT INJECTION**: Dependencies injected automatically via constructors
- **GRACEFUL LIFECYCLE**: Complete startup/shutdown orchestration with Docker support

## Installation

```bash
pnpm add @banyanai/platform-base-service
```

## Quick Start

### Ultra-Simple Service

```typescript
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  serviceName: 'user-service'
  // Everything else from environment variables or defaults
});
```

That's it! The platform handles:
- ✅ Message bus connection
- ✅ Handler discovery and registration
- ✅ Database connection pooling
- ✅ Distributed tracing setup
- ✅ Health checks and monitoring
- ✅ Graceful shutdown
- ✅ Error handling and circuit breakers

## Main Exports

### BaseService Class

The primary API for service initialization:

```typescript
class BaseService {
  static async start(config: ServiceConfig): Promise<void>
  static async stop(): Promise<void>
}
```

**Usage:**

```typescript
await BaseService.start({
  serviceName: 'user-service',
  version: '1.0.0',
  messageBusUrl: process.env.RABBITMQ_URL,
  databaseUrl: process.env.DATABASE_URL,
});
```

### Handler Decorators

Zero-infrastructure decorators for handler registration:

```typescript
import {
  CommandHandler,
  QueryHandler,
  EventHandler,
  RequiresPermissions,
  RequirePolicy,
  Cacheable,
} from '@banyanai/platform-base-service';
```

**Example:**

```typescript
@CommandHandler(CreateUserCommand)
@RequiresPermissions('users:create')
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: CommandContext) {
    // Pure business logic - no infrastructure code
    return { userId: 'user-123', email: command.email };
  }
}
```

### Context Types

Access to authenticated user and request metadata:

```typescript
import {
  type CommandContext,
  type QueryContext,
  type EventContext,
} from '@banyanai/platform-base-service';
```

**CommandContext:**

```typescript
interface CommandContext {
  userId: string;
  permissions: string[];
  correlationId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
```

### Database Integration

Built-in PostgreSQL integration:

```typescript
import {
  DatabaseManager,
  ConnectionPool,
  SchemaManager,
} from '@banyanai/platform-base-service';
```

### Error Handling

Comprehensive error handling system:

```typescript
import {
  BaseServiceError,
  ValidationError,
  AuthorizationError,
  DatabaseConnectionError,
  CircuitBreakerOpenError,
} from '@banyanai/platform-base-service';
```

## Service Configuration

### ServiceConfig Interface

```typescript
interface ServiceConfig {
  serviceName: string;
  version?: string;
  messageBusUrl?: string;
  databaseUrl?: string;
  redisUrl?: string;
  port?: number;
  environment?: 'development' | 'staging' | 'production';
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceName` | `string` | **required** | Unique service identifier |
| `version` | `string` | `'1.0.0'` | Service version |
| `messageBusUrl` | `string` | `RABBITMQ_URL` env | RabbitMQ connection URL |
| `databaseUrl` | `string` | `DATABASE_URL` env | PostgreSQL connection URL |
| `redisUrl` | `string` | `REDIS_URL` env | Redis connection URL |
| `port` | `number` | `3000` | HTTP health check port |
| `environment` | `string` | `NODE_ENV` env | Runtime environment |

### Environment Variables

The platform reads configuration from environment variables:

```bash
# Required
RABBITMQ_URL=amqp://localhost:5672
DATABASE_URL=postgresql://localhost:5432/mydb

# Optional
REDIS_URL=redis://localhost:6379
NODE_ENV=production
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

## Handler Discovery

### Folder Convention

Handlers are automatically discovered by folder location:

```
/src
  /commands/          # Command handlers
    CreateUserHandler.ts
    UpdateUserHandler.ts
  /queries/           # Query handlers
    GetUserHandler.ts
    ListUsersHandler.ts
  /events/            # Event handlers
    UserCreatedHandler.ts
    OrderCompletedHandler.ts
```

### Decorator-Based Discovery

Handlers must use decorators for registration:

```typescript
// Command Handler
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: CommandContext) {
    // Handler logic
  }
}

// Query Handler
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async handle(query: GetUserQuery, context: QueryContext) {
    // Handler logic
  }
}

// Event Handler
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: UserCreatedEvent, context: EventContext) {
    // Handler logic
  }
}
```

### Manual Discovery

For custom scenarios:

```typescript
import { HandlerDiscovery } from '@banyanai/platform-base-service';

const discovery = new HandlerDiscovery();
const handlers = await discovery.discoverHandlers('./src');

console.log('Discovered handlers:', handlers.length);
```

## Lifecycle Management

### Startup Sequence

1. **Load Configuration** - From environment and parameters
2. **Connect Infrastructure** - Message bus, database, cache
3. **Discover Handlers** - Scan folders and decorators
4. **Register Handlers** - Subscribe to message types
5. **Start Health Checks** - HTTP endpoint for monitoring
6. **Signal Ready** - Service operational

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await BaseService.stop();
  process.exit(0);
});
```

**Shutdown sequence:**
1. Stop accepting new requests
2. Complete in-flight requests
3. Close message bus connections
4. Close database connections
5. Cleanup resources
6. Exit process

## Dependency Injection

### Constructor Injection

Services and repositories are automatically injected:

```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  async handle(command: CreateUserCommand, context: CommandContext) {
    const user = await this.userRepository.create(command);
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
```

### Service Client Injection

Cross-service clients auto-generated and injected:

```typescript
@CommandHandler(ProcessOrderCommand)
export class ProcessOrderHandler {
  constructor(
    private inventoryClient: InventoryServiceClient,
    private paymentClient: PaymentServiceClient
  ) {}

  async handle(command: ProcessOrderCommand, context: CommandContext) {
    // Reserve inventory
    await this.inventoryClient.reserveItems(command.items);

    // Process payment
    await this.paymentClient.processPayment(command.payment);

    return { orderId: 'order-123', status: 'processing' };
  }
}
```

## Complete Example

### Service Structure

```
user-service/
├── src/
│   ├── commands/
│   │   ├── CreateUserCommand.ts
│   │   └── CreateUserHandler.ts
│   ├── queries/
│   │   ├── GetUserQuery.ts
│   │   └── GetUserHandler.ts
│   ├── events/
│   │   ├── UserCreatedEvent.ts
│   │   └── UserCreatedHandler.ts
│   ├── repositories/
│   │   └── UserRepository.ts
│   ├── policies/
│   │   └── UserCreationPolicy.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

### main.ts

```typescript
import { BaseService } from '@banyanai/platform-base-service';

async function bootstrap() {
  await BaseService.start({
    serviceName: 'user-service',
    version: '1.0.0',
  });

  console.log('User service started successfully');
}

bootstrap().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
```

### CreateUserCommand.ts

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName?: string;
}
```

### CreateUserHandler.ts

```typescript
import {
  CommandHandler,
  RequiresPermissions,
  type CommandContext,
} from '@banyanai/platform-base-service';
import { CreateUserCommand } from './CreateUserCommand';
import { UserRepository } from '../repositories/UserRepository';

@CommandHandler(CreateUserCommand)
@RequiresPermissions('users:create')
export class CreateUserHandler {
  constructor(private userRepository: UserRepository) {}

  async handle(
    command: CreateUserCommand,
    context: CommandContext
  ): Promise<{ userId: string; email: string }> {
    // Validate
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new Error('Email already exists');
    }

    // Create
    const user = await this.userRepository.create({
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
    });

    // Return
    return {
      userId: user.id,
      email: user.email,
    };
  }
}
```

## Best Practices

### DO:

- ✅ Use `BaseService.start()` for service initialization
- ✅ Place handlers in conventional folders (`/commands/`, `/queries/`, `/events/`)
- ✅ Use decorators for handler registration
- ✅ Inject dependencies via constructor
- ✅ Return DTOs from handlers, not domain entities
- ✅ Handle graceful shutdown signals

### DON'T:

- ❌ Don't manually manage message bus connections
- ❌ Don't put infrastructure code in handlers
- ❌ Don't skip error handling
- ❌ Don't ignore health check endpoints
- ❌ Don't hardcode configuration values

## Next Steps

- **[Contract System](./contract-system.md)** - Define service contracts
- **[CQRS Package](./cqrs.md)** - Command/Query pattern implementation
- **[Event Sourcing](./event-sourcing.md)** - Event store integration
- **[Creating a Service Guide](../../03-guides/service-development/creating-a-service.md)** - Step-by-step tutorial
