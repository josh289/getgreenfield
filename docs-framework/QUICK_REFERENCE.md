# Quick Reference Card

> 🎯 **Goal**: Fast lookup for common patterns, imports, decorators, and commands

This is your cheat sheet for Banyan Platform development. Bookmark this page for quick reference while coding.

## Table of Contents

- [Common Imports](#common-imports)
- [Essential Decorators](#essential-decorators)
- [Handler Patterns](#handler-patterns)
- [Service Clients](#service-clients)
- [Event Sourcing](#event-sourcing)
- [Testing Patterns](#testing-patterns)
- [Common Commands](#common-commands)
- [API Calls](#api-calls)
- [Error Handling](#error-handling)
- [Validation](#validation)

---

## Common Imports

### Handler Imports
```typescript
// Command handler
import { CommandHandler } from '@banyanai/platform-cqrs';
import type { ICommandHandler, CommandResult } from '@banyanai/platform-cqrs';

// Query handler
import { QueryHandler } from '@banyanai/platform-cqrs';
import type { IQueryHandler, QueryResult } from '@banyanai/platform-cqrs';

// Event handler
import { EventHandler } from '@banyanai/platform-cqrs';
import type { IEventHandler } from '@banyanai/platform-cqrs';
```

### Contract Imports
```typescript
import { Contract, Field } from '@banyanai/platform-contract-system';
import { IsString, IsEmail, IsOptional, Min, Max } from 'class-validator';
```

### Authorization Imports
```typescript
import { RequiresPermission, RequiresPolicy } from '@banyanai/platform-cqrs';
```

### Event Sourcing Imports
```typescript
import {
  Aggregate,
  ApplyEvent,
  AggregateRoot
} from '@banyanai/platform-event-sourcing';
import { DomainEvent } from '@banyanai/platform-domain-modeling';
```

### Base Service Import
```typescript
import { BaseService } from '@banyanai/platform-base-service';
```

---

## Essential Decorators

### Handler Decorators

```typescript
// Command handler (state changes)
@CommandHandler()
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand): Promise<CommandResult<CreateUserResult>> {
    // Implementation
  }
}

// Query handler (data retrieval)
@QueryHandler()
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserResult> {
  async handle(query: GetUserQuery): Promise<QueryResult<UserResult>> {
    // Implementation
  }
}

// Event handler (react to events)
@EventHandler()
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // Implementation
  }
}
```

### Authorization Decorators

```typescript
// Require permission (Layer 1 - API Gateway)
@CommandHandler()
@RequiresPermission('users.create')
export class CreateUserHandler { }

// Require policy (Layer 2 - Business rules)
@CommandHandler()
@RequiresPolicy('CanCreateUser')
export class CreateUserHandler { }

// Multiple permissions
@CommandHandler()
@RequiresPermission(['users.create', 'admin.access'])
export class CreateAdminHandler { }
```

### Contract Decorators

```typescript
// Define contract
@Contract()
export class CreateUserCommand {
  @Field()
  @IsString()
  @MinLength(3)
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsOptional()
  age?: number;
}
```

### Event Sourcing Decorators

```typescript
// Define aggregate
@Aggregate()
export class User extends AggregateRoot {
  private name: string;
  private email: string;

  // Apply event
  @ApplyEvent(UserCreatedEvent)
  onUserCreated(event: UserCreatedEvent) {
    this.name = event.name;
    this.email = event.email;
  }

  @ApplyEvent(UserUpdatedEvent)
  onUserUpdated(event: UserUpdatedEvent) {
    this.name = event.name;
  }
}
```

---

## Handler Patterns

### Command Handler Pattern

```typescript
import { CommandHandler } from '@banyanai/platform-cqrs';
import type { ICommandHandler, CommandResult } from '@banyanai/platform-cqrs';

@CommandHandler()
export class CreateItemHandler implements ICommandHandler<CreateItemCommand, CreateItemResult> {
  async handle(command: CreateItemCommand): Promise<CommandResult<CreateItemResult>> {
    try {
      // 1. Validate business rules
      // 2. Perform state change
      // 3. Publish domain events
      // 4. Return result

      return CommandResult.success({
        id: 'generated-id',
        name: command.name
      });
    } catch (error) {
      return CommandResult.failure(error.message);
    }
  }
}
```

### Query Handler Pattern

```typescript
import { QueryHandler } from '@banyanai/platform-cqrs';
import type { IQueryHandler, QueryResult } from '@banyanai/platform-cqrs';

@QueryHandler()
export class GetItemHandler implements IQueryHandler<GetItemQuery, ItemResult> {
  async handle(query: GetItemQuery): Promise<QueryResult<ItemResult>> {
    try {
      // 1. Fetch from read model
      // 2. Apply filters
      // 3. Return cached result (automatic)

      return QueryResult.success({
        id: query.id,
        name: 'Item Name'
      });
    } catch (error) {
      return QueryResult.failure(error.message);
    }
  }
}
```

### Event Handler Pattern

```typescript
import { EventHandler } from '@banyanai/platform-cqrs';
import type { IEventHandler } from '@banyanai/platform-cqrs';

@EventHandler()
export class ItemCreatedHandler implements IEventHandler<ItemCreatedEvent> {
  async handle(event: ItemCreatedEvent): Promise<void> {
    // 1. Update read models
    // 2. Trigger side effects
    // 3. Publish new events if needed
    // 4. No return value
  }
}
```

---

## Service Clients

### Calling Another Service

```typescript
// Generated client is automatically available
import { ServiceNameClient } from '@banyanai/platform-client-system';

export class MyHandler {
  constructor(private readonly serviceNameClient: ServiceNameClient) {}

  async handle(command: MyCommand) {
    // Call command
    const result = await this.serviceNameClient.commands.createItem({
      name: 'New Item'
    });

    // Call query
    const item = await this.serviceNameClient.queries.getItem({
      id: result.id
    });

    return result;
  }
}
```

---

## Event Sourcing

### Event Sourced Aggregate Pattern

```typescript
import { Aggregate, ApplyEvent, AggregateRoot } from '@banyanai/platform-event-sourcing';
import { DomainEvent } from '@banyanai/platform-domain-modeling';

// Define events
export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItem[]
  ) {
    super();
  }
}

export class OrderItemAddedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly item: OrderItem
  ) {
    super();
  }
}

// Define aggregate
@Aggregate()
export class Order extends AggregateRoot {
  private orderId: string;
  private customerId: string;
  private items: OrderItem[] = [];
  private status: OrderStatus;

  // Create aggregate
  static create(customerId: string, items: OrderItem[]): Order {
    const order = new Order();
    const orderId = generateId();

    order.applyChange(new OrderCreatedEvent(orderId, customerId, items));
    return order;
  }

  // Business method
  addItem(item: OrderItem): void {
    if (this.status !== 'open') {
      throw new Error('Cannot add items to closed order');
    }
    this.applyChange(new OrderItemAddedEvent(this.orderId, item));
  }

  // Event handlers (apply state changes)
  @ApplyEvent(OrderCreatedEvent)
  onOrderCreated(event: OrderCreatedEvent): void {
    this.orderId = event.orderId;
    this.customerId = event.customerId;
    this.items = event.items;
    this.status = 'open';
  }

  @ApplyEvent(OrderItemAddedEvent)
  onItemAdded(event: OrderItemAddedEvent): void {
    this.items.push(event.item);
  }
}
```

### Saving Aggregates

```typescript
import { EventStore } from '@banyanai/platform-event-sourcing';

export class CreateOrderHandler {
  constructor(private readonly eventStore: EventStore) {}

  async handle(command: CreateOrderCommand) {
    // Create aggregate
    const order = Order.create(command.customerId, command.items);

    // Save to event store
    await this.eventStore.save(order);

    return { orderId: order.id };
  }
}
```

### Loading Aggregates

```typescript
export class AddOrderItemHandler {
  constructor(private readonly eventStore: EventStore) {}

  async handle(command: AddOrderItemCommand) {
    // Load from event store (replays all events)
    const order = await this.eventStore.load<Order>(command.orderId);

    // Execute business logic
    order.addItem(command.item);

    // Save (stores new events only)
    await this.eventStore.save(order);

    return { success: true };
  }
}
```

---

## Testing Patterns

### Unit Test Pattern

```typescript
import { describe, it, expect } from '@jest/globals';
import { CreateItemHandler } from './CreateItemHandler';

describe('CreateItemHandler', () => {
  it('should create an item', async () => {
    // Arrange
    const handler = new CreateItemHandler();
    const command = { name: 'Test Item' };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('Test Item');
  });
});
```

### Message Bus Test Pattern

```typescript
import { MessageBusClient } from '@banyanai/platform-message-bus-client';

describe('Integration Test', () => {
  let messageBus: MessageBusClient;

  beforeAll(async () => {
    messageBus = await MessageBusClient.connect();
  });

  afterAll(async () => {
    await messageBus.disconnect();
  });

  it('should process command via message bus', async () => {
    // Send command
    const result = await messageBus.sendCommand('CreateItem', {
      name: 'Test Item'
    });

    expect(result.isSuccess).toBe(true);

    // Query result
    const item = await messageBus.sendQuery('GetItem', {
      id: result.value.id
    });

    expect(item.value.name).toBe('Test Item');
  });
});
```

---

## Common Commands

### Development Commands

```bash
# Create new service
npx @banyanai/platform-cli create my-service

# Start platform infrastructure
docker compose up

# Start development mode (hot reload)
cd my-service && pnpm run dev

# Build service
pnpm run build

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test -- --coverage

# Lint code
pnpm run lint

# Fix lint issues
pnpm run lint:fix

# Type check
pnpm run type-check
```

### Docker Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f service-name

# Restart service
docker compose restart service-name

# Rebuild service
docker compose up --build service-name
```

### Quality Check Commands

```bash
# Run comprehensive quality check
./platform/scripts/quality-check-all.sh

# Quick quality check
./platform/scripts/quick-quality-check.sh
```

---

## API Calls

### REST API

```bash
# POST command
curl -X POST http://localhost:3000/api/my-service/create-item \
  -H "Content-Type: application/json" \
  -d '{"name": "My Item"}'

# GET query
curl http://localhost:3000/api/my-service/get-item?id=123

# With authentication
curl -X POST http://localhost:3000/api/my-service/create-item \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "My Item"}'
```

### GraphQL API

```bash
# Query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { myService_getItem(id: \"123\") { id name } }"
  }'

# Mutation
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { myService_createItem(name: \"My Item\") { id name } }"
  }'
```

### WebSocket Subscription

```javascript
// Browser JavaScript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    event: 'ItemCreated'
  }));
};

ws.onmessage = (message) => {
  const event = JSON.parse(message.data);
  console.log('Received event:', event);
};
```

---

## Error Handling

### Command/Query Error Handling

```typescript
@CommandHandler()
export class CreateItemHandler {
  async handle(command: CreateItemCommand): Promise<CommandResult<CreateItemResult>> {
    try {
      // Business logic
      return CommandResult.success(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        return CommandResult.failure('Validation failed', { errors: error.errors });
      }
      if (error instanceof NotFoundError) {
        return CommandResult.notFound(error.message);
      }
      if (error instanceof UnauthorizedError) {
        return CommandResult.unauthorized(error.message);
      }
      return CommandResult.failure('Unknown error occurred');
    }
  }
}
```

### Event Handler Error Handling

```typescript
@EventHandler()
export class ItemCreatedHandler {
  async handle(event: ItemCreatedEvent): Promise<void> {
    try {
      // Event handling logic
    } catch (error) {
      // Log error - event will be retried
      logger.error('Failed to handle ItemCreated event', error);
      throw error; // Triggers retry
    }
  }
}
```

---

## Validation

### Contract Validation

```typescript
import { Contract, Field } from '@banyanai/platform-contract-system';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
  Type
} from 'class-validator';

@Contract()
export class CreateUserCommand {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNumber()
  @Min(18)
  @Max(120)
  @IsOptional()
  age?: number;

  @Field()
  @IsEnum(UserRole)
  role: UserRole;

  @Field()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @Field()
  @ValidateNested()
  @Type(() => AddressContract)
  address: AddressContract;
}
```

### Custom Validation

```typescript
import { registerDecorator, ValidationOptions } from 'class-validator';

// Custom validator
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' &&
                 value.length >= 8 &&
                 /[A-Z]/.test(value) &&
                 /[0-9]/.test(value);
        },
        defaultMessage() {
          return 'Password must be at least 8 characters and contain uppercase letter and number';
        }
      }
    });
  };
}

// Usage
@Contract()
export class CreateUserCommand {
  @Field()
  @IsStrongPassword()
  password: string;
}
```

---

## Diagnostic Tools

### View Logs
```bash
docker compose logs -f service-name
```

### View Distributed Traces
Open browser to: http://localhost:16686 (Jaeger UI)

### View Metrics
Open browser to: http://localhost:3000 (Grafana)

### View Message Bus
Open browser to: http://localhost:15672 (RabbitMQ Management)
- Username: `guest`
- Password: `guest`

### Health Check
```bash
curl http://localhost:3000/health
```

### Service Discovery
```bash
curl http://localhost:3001/api/services
```

---

## Service Startup

### Minimal Service Startup

```typescript
// main.ts
import { BaseService } from '@banyanai/platform-base-service';

async function bootstrap() {
  await BaseService.start({
    name: 'my-service',
    version: '1.0.0'
  });
}

bootstrap();
```

### Service with Configuration

```typescript
import { BaseService } from '@banyanai/platform-base-service';

async function bootstrap() {
  await BaseService.start({
    name: 'my-service',
    version: '1.0.0',
    port: 3100,
    messageBus: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
    },
    eventStore: {
      connectionString: process.env.DATABASE_URL
    },
    cache: {
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
  });
}

bootstrap();
```

---

## File Structure

### Typical Service Structure

```
my-service/
├── commands/               # Command handlers (state changes)
│   ├── CreateItemHandler.ts
│   └── UpdateItemHandler.ts
├── queries/                # Query handlers (data retrieval)
│   ├── GetItemHandler.ts
│   └── ListItemsHandler.ts
├── events/                 # Event handlers (reactions)
│   ├── ItemCreatedHandler.ts
│   └── ItemUpdatedHandler.ts
├── contracts/              # Input/output contracts
│   ├── CreateItemCommand.ts
│   ├── GetItemQuery.ts
│   └── ItemCreatedEvent.ts
├── aggregates/             # Event sourced aggregates (if using)
│   └── Item.ts
├── policies/               # Authorization policies (if using)
│   └── CanCreateItemPolicy.ts
├── main.ts                 # Service entry point
├── package.json
├── tsconfig.json
└── docker-compose.yml      # Auto-generated
```

---

**Need more details?** → [Full Documentation](./README.md) | [Navigation Guide](./NAVIGATION_GUIDE.md)
