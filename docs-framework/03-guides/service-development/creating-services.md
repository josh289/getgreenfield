---
title: Creating Services
description: Learn how to create a new microservice from scratch using the platform CLI and templates
category: Service Development
tags: [services, cli, templates, setup, getting-started]
difficulty: beginner
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - writing-handlers.md
  - defining-contracts.md
  - using-service-clients.md
  - testing-services.md
---

# Creating Services

Learn how to create a new microservice using the Banyan Platform CLI and templates.

## Use This Guide If...

- You're creating your first microservice on the platform
- You want to understand the service structure and conventions
- You need to set up a new business domain service
- You're learning the platform architecture and patterns

## Quick Start

```bash
# Create a new service using the CLI
npx @banyanai/platform-cli create my-service-name

# The CLI creates:
# - Complete service structure
# - Docker Compose configuration
# - Sample handlers and contracts
# - Testing setup
# - All necessary configuration files
```

## Service Structure

A newly created service has this structure:

```
my-service/
├── docker-compose.yml           # Service infrastructure
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Testing configuration
├── packages/
│   └── contracts/              # Service contracts (API definitions)
│       ├── src/
│       │   ├── commands.ts     # Command contracts
│       │   ├── queries.ts      # Query contracts
│       │   ├── events.ts       # Event contracts
│       │   └── index.ts        # Export all contracts
│       └── package.json
└── service/
    ├── src/
    │   ├── main.ts             # Service entry point
    │   ├── commands/           # Command handlers
    │   │   └── CreateItemHandler.ts
    │   ├── queries/            # Query handlers
    │   │   └── GetItemHandler.ts
    │   ├── subscriptions/      # Event subscription handlers
    │   │   └── ItemCreatedHandler.ts
    │   ├── domain/             # Aggregates and domain logic
    │   │   └── ItemAggregate.ts
    │   ├── read-models/        # Read models for queries
    │   │   └── ItemReadModel.ts
    │   └── clients/            # Service clients
    │       └── NotificationServiceClient.ts
    └── package.json
```

## Service Entry Point

The `main.ts` file is the entry point for your service:

```typescript
// service/src/main.ts
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function startService() {
  try {
    Logger.info('Starting My Service...');

    // One-line service startup
    await BaseService.start({
      serviceName: 'my-service',
      version: '1.0.0',
    });

    Logger.info('My Service started successfully');
  } catch (error) {
    Logger.error('Failed to start My Service:', error as Error);
    process.exit(1);
  }
}

// Start the service
startService();
```

**That's it!** The platform handles:
- Handler discovery
- Contract broadcasting
- Message bus connection
- Service registration
- Health monitoring
- Graceful shutdown

## Defining Your First Contract

Create contracts in `packages/contracts/src/`:

```typescript
// packages/contracts/src/commands.ts
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new item',
  permissions: ['items:create']
})
export class CreateItemCommand {
  name!: string;
  description!: string;
  price!: number;
}

export interface CreateItemResult {
  itemId: string;
  name: string;
  createdAt: string;
}
```

```typescript
// packages/contracts/src/queries.ts
import { Query } from '@banyanai/platform-contract-system';

@Query({
  description: 'Retrieve item by ID',
  permissions: ['items:read']
})
export class GetItemQuery {
  itemId!: string;
}

export interface ItemResult {
  itemId: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}
```

```typescript
// packages/contracts/src/events.ts
import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent('MyService.Events.ItemCreated', {
  broadcast: true,
  description: 'Item was created'
})
export class ItemCreatedEvent {
  itemId!: string;
  name!: string;
  price!: number;
  createdAt!: string;
}
```

```typescript
// packages/contracts/src/index.ts
export * from './commands.js';
export * from './queries.js';
export * from './events.js';
```

## Implementing Your First Handler

### Command Handler

```typescript
// service/src/commands/CreateItemHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { CreateItemCommand, type CreateItemResult } from '../../packages/contracts';

@CommandHandlerDecorator(CreateItemCommand)
export class CreateItemHandler extends CommandHandler<CreateItemCommand, CreateItemResult> {
  constructor() {
    super();
  }

  async handle(command: CreateItemCommand, user: AuthenticatedUser | null): Promise<CreateItemResult> {
    Logger.info('Creating item', { name: command.name });

    // Generate ID
    const itemId = `item-${Date.now()}`;

    // Business logic here...

    return {
      itemId,
      name: command.name,
      createdAt: new Date().toISOString(),
    };
  }
}
```

### Query Handler

```typescript
// service/src/queries/GetItemHandler.ts
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { GetItemQuery, type ItemResult } from '../../packages/contracts';
import { ItemReadModel } from '../read-models/ItemReadModel';

@QueryHandlerDecorator(GetItemQuery)
export class GetItemHandler extends QueryHandler<GetItemQuery, ItemResult> {
  constructor() {
    super();
  }

  async handle(query: GetItemQuery, user: AuthenticatedUser | null): Promise<ItemResult> {
    Logger.info('Getting item', { itemId: query.itemId });

    // Query read model
    const item = await ItemReadModel.findById<ItemReadModel>(query.itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    return {
      itemId: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      createdAt: item.createdAt,
    };
  }
}
```

### Event Subscription Handler

```typescript
// service/src/subscriptions/ItemCreatedHandler.ts
import { EventSubscriptionHandler, EventHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { ItemCreatedEvent } from '../../packages/contracts';

@EventHandlerDecorator(ItemCreatedEvent)
export class ItemCreatedHandler extends EventSubscriptionHandler<ItemCreatedEvent> {
  constructor() {
    super();
  }

  async handle(event: ItemCreatedEvent, user: AuthenticatedUser | null): Promise<void> {
    Logger.info('Item created event received', {
      itemId: event.itemId,
      name: event.name,
    });

    // React to event - update read models, trigger workflows, etc.
  }
}
```

## Running Your Service

### Development Mode

```bash
# Start infrastructure (from service directory)
docker compose up -d

# Install dependencies
pnpm install

# Build the service
pnpm run build

# Start in development mode
pnpm run dev
```

### Running Tests

```bash
# Run all tests
pnpm run test

# Run with coverage
pnpm run test:coverage

# Run in watch mode
pnpm run test:watch
```

### Production Mode

```bash
# Build for production
pnpm run build

# Start the service
pnpm start
```

## Docker Compose Configuration

The generated `docker-compose.yml` includes all required infrastructure:

```yaml
version: '3.8'

services:
  my-service:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - MESSAGE_BUS_URL=amqp://rabbitmq:5672
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/myservice
      - SERVICE_DISCOVERY_URL=http://service-discovery:3000
    depends_on:
      - rabbitmq
      - postgres
      - service-discovery

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=myservice
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  service-discovery:
    image: banyanai/service-discovery:latest
    ports:
      - "3000:3000"

volumes:
  postgres-data:
```

## Configuration

### Environment Variables

```bash
# Message Bus
MESSAGE_BUS_URL=amqp://localhost:5672

# Database
DATABASE_URL=postgresql://localhost:5432/myservice

# Service Discovery
SERVICE_DISCOVERY_URL=http://localhost:3000

# Service Configuration
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0

# Logging
LOG_LEVEL=info

# Node Environment
NODE_ENV=development
```

### Package Configuration

**service/package.json:**

```json
{
  "name": "@myorg/my-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/main.ts",
    "start": "node dist/main.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "biome check src",
    "lint:fix": "biome check --apply src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@banyanai/platform-base-service": "^1.0.0",
    "@banyanai/platform-core": "^1.0.0",
    "@banyanai/platform-telemetry": "^1.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.4.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0"
  }
}
```

## Best Practices

### Service Naming

**DO:**
```
user-service
order-management-service
inventory-service
notification-service
```

**DON'T:**
```
my-service
api-service
backend
service1
```

### Directory Organization

**DO:**
- Keep handlers in appropriate directories (`commands/`, `queries/`, `subscriptions/`)
- Group related domain logic in `domain/`
- Put read models in `read-models/`
- Keep service clients in `clients/`

**DON'T:**
- Mix handler types in one directory
- Put business logic in handlers
- Create deep nested structures

### Handler Naming

**DO:**
```typescript
CreateUserHandler.ts
GetUserHandler.ts
UserCreatedHandler.ts
```

**DON'T:**
```typescript
CreateUser.ts
User.ts
UserHandler.ts
```

## Next Steps

Now that you've created your service, continue with:

1. **[Defining Contracts](./defining-contracts.md)** - Create your API contracts
2. **[Writing Handlers](./writing-handlers.md)** - Implement business logic
3. **[Using Service Clients](./using-service-clients.md)** - Call other services
4. **[Data Access Patterns](./data-access-patterns.md)** - Work with aggregates and read models
5. **[Testing Services](./testing-services.md)** - Write comprehensive tests

## Troubleshooting

### Service Won't Start

1. Check all environment variables are set
2. Verify RabbitMQ is running (`docker ps`)
3. Check PostgreSQL is accessible
4. Review logs for specific errors

### Handlers Not Discovered

1. Check files are in correct directories
2. Verify filenames end with `Handler.ts`
3. Check decorators are present
4. Ensure handlers extend correct base class

### Contract Not Found

1. Check contract is exported from `packages/contracts/src/index.ts`
2. Verify decorator is present
3. Check service started successfully
4. Verify service discovery is running

## Related Resources

- [Writing Handlers](./writing-handlers.md) - Implement handler logic
- [Defining Contracts](./defining-contracts.md) - Create service contracts
- [Using Service Clients](./using-service-clients.md) - Cross-service communication
- [Testing Services](./testing-services.md) - Testing strategies

---

**Congratulations!** You've created your first Banyan Platform microservice. The platform handles all infrastructure concerns, so you can focus on building business value.
