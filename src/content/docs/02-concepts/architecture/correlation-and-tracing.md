---
title: "Correlation ID and Distributed Tracing Architecture"
description: "Understanding correlation IDs, AsyncLocalStorage propagation, and distributed tracing across service boundaries"
category: "concepts"
tags: ["architecture", "tracing", "observability", "correlation"]
difficulty: "intermediate"
related_concepts: ["W3C Trace Context", "OpenTelemetry Integration", "Message Bus Architecture"]
prerequisites: ["Message Bus Architecture", "API Gateway"]
last_updated: "2025-11-15"
status: "published"
aliases:
  - request tracking
  - distributed tracing
  - trace correlation
  - request correlation
  - correlation id propagation
  - asynclocalstorage tracing
relatedConcepts:
  - OpenTelemetry
  - Jaeger
  - W3C Trace Context
  - distributed systems debugging
  - AsyncLocalStorage
  - message envelope
  - trace context
commonQuestions:
  - How do I track a request across services?
  - How do I find all logs for a specific request?
  - What is a correlation ID?
  - How does distributed tracing work?
  - Why use AsyncLocalStorage for tracing?
  - How do correlation IDs propagate automatically?
  - What's the difference between correlation ID and trace ID?
---

# Correlation ID and Distributed Tracing Architecture

> **Core Idea:** Correlation IDs flow automatically through all platform operations, enabling end-to-end request tracing without any developer intervention.

## Overview

The Banyan platform implements a zero-configuration distributed tracing system built on correlation IDs and Node.js AsyncLocalStorage. This architecture ensures that every request, from API Gateway entry to final service response, can be traced through the entire system without developers writing a single line of tracing code.

The correlation ID serves dual purposes:
1. **Request tracking**: Clients can track requests through the distributed system
2. **Distributed tracing**: The correlation ID becomes the OpenTelemetry trace ID for observability

## The Problem

### Challenge: Context Propagation in Distributed Systems

In microservices architectures, a single client request triggers multiple inter-service operations:

```typescript
// Without automatic context propagation:
// Service A handles API request
async function handleCreateOrder(request) {
  // How do we pass correlation ID to Service B?
  await messageBus.send('inventory.reserve', { productId: 123 });

  // And to Service C?
  await messageBus.send('payment.process', { amount: 99.99 });

  // And ensure logs from all services are correlated?
  logger.info('Order created'); // Missing correlation context
}
```

**Challenges Without Automatic Propagation:**

1. **Manual Threading**: Developers must manually pass correlation IDs through every function call
2. **Fragile**: Easy to forget, breaking trace continuity
3. **Verbose**: Adds boilerplate to every service boundary
4. **Error-Prone**: No compile-time guarantees that correlation propagates

### Example Scenario

```typescript
// The problematic manual approach
async function handleUserRegistration(input: RegisterUserInput, correlationId: string) {
  // Must manually pass correlationId everywhere
  logger.info('Starting registration', { correlationId });

  const user = await createUser(input, correlationId);
  await sendWelcomeEmail(user, correlationId);
  await updateAnalytics(user.id, correlationId);

  // Easy to forget correlationId in nested calls
  await someHelperFunction(user); // BROKEN - no correlation!
}
```

**Why This Matters:**

- Incomplete traces make debugging production issues nearly impossible
- Performance analysis requires complete request flows
- Compliance/audit trails need end-to-end tracking
- Developer cognitive load increases with manual propagation

## The Solution

The platform solves this through **automatic context propagation** using Node.js AsyncLocalStorage, providing zero-configuration distributed tracing.

### Core Principles

1. **Automatic Propagation**: Correlation IDs flow automatically through all async operations without manual intervention
2. **API Gateway as Source of Truth**: All correlation IDs originate from or are validated at the API Gateway
3. **AsyncLocalStorage for Isolation**: Thread-safe context isolation without manual passing
4. **Correlation ID = Trace ID**: Single identifier serves both business and technical tracing needs
5. **Zero Developer Overhead**: Services never explicitly handle correlation IDs

### How It Works

The architecture has three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  - Extract/Generate Correlation ID                          │
│  - Create initial trace context                             │
│  - Inject into message envelope                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Message Bus Layer                           │
│  - Preserve correlation ID in MessageEnvelope                │
│  - Establish AsyncLocalStorage context on message receipt    │
│  - Automatic propagation to all downstream operations        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  - Access correlation ID via AsyncContextManager             │
│  - Automatic inclusion in logs and telemetry                 │
│  - Transparent propagation to downstream services            │
└─────────────────────────────────────────────────────────────┘
```

## Implementation in the Platform

### Key Components

- **CorrelationManager (API Gateway)**: Extracts or generates correlation IDs at system entry
- **CorrelationContextManager (Message Bus)**: Manages AsyncLocalStorage-based context propagation
- **AsyncContextManager (Core)**: Platform-wide context access with performance optimization
- **TraceContextManager (Telemetry)**: Converts correlation IDs to OpenTelemetry trace IDs
- **MessageEnvelope**: Carries correlation ID through all service communication

### 1. API Gateway: Correlation ID Origin

The API Gateway is the authoritative source for correlation IDs:

```typescript
// From: platform/services/api-gateway/src/correlation/CorrelationManager.ts
export class CorrelationManagerImpl implements CorrelationManager {
  private readonly correlationHeaderName = 'X-Correlation-ID';

  extractOrGenerateCorrelationId(request: HttpRequest): string {
    // Check if client provided correlation ID in header
    const clientCorrelationId =
      request.headers[this.correlationHeaderName] ||
      request.headers[this.correlationHeaderName.toLowerCase()];

    if (
      clientCorrelationId &&
      typeof clientCorrelationId === 'string' &&
      clientCorrelationId.trim()
    ) {
      // Use client-provided correlation ID for request tracking
      return clientCorrelationId.trim();
    }

    // Generate UUID v4 using Node.js crypto module if not provided
    return randomUUID();
  }

  addCorrelationIdToResponse(response: HttpResponse, correlationId: string): HttpResponse {
    return {
      ...response,
      headers: {
        ...response.headers,
        [this.correlationHeaderName]: correlationId,
      },
    };
  }
}
```

**Key Points:**

- Client can optionally provide `X-Correlation-ID` header for request tracking
- If not provided, generates secure UUID v4
- Always echoes correlation ID back in response headers
- Correlation ID injected into all outgoing message envelopes

### 2. Message Bus: Context Establishment

The message bus establishes AsyncLocalStorage context when processing messages:

```typescript
// From: platform/packages/message-bus-client/src/context/CorrelationContextManager.ts
import { AsyncLocalStorage } from 'node:async_hooks';

/** AsyncLocalStorage instance for maintaining execution context */
const storage = new AsyncLocalStorage<MessageBusContext>();

/**
 * Execute function with correlation context.
 * All message bus operations within this scope will use this correlation ID.
 */
export function runWithContext<T>(context: MessageBusContext, fn: () => T): T {
  return storage.run(context, fn);
}

/**
 * Get current correlation ID from context.
 * Returns generated fallback ID if no context exists.
 */
export function getCurrentCorrelationId(): string {
  const context = getCurrentContext();
  if (context) {
    return context.correlationId;
  }

  // Generate fallback correlation ID for background processes
  return generateFallbackCorrelationId();
}
```

**Context Structure:**

```typescript
export interface MessageBusContext {
  /** Correlation ID for distributed tracing - used as trace ID */
  readonly correlationId: string;

  /** Authentication context from original request */
  readonly auth?: MessageAuthContext | null;

  /** W3C Trace Context for distributed tracing propagation */
  readonly traceContext?: TraceContextData;

  /** Source service that created this context */
  readonly sourceService: string;

  /** Timestamp when context was created */
  readonly timestamp: Date;
}
```

### 3. Core: High-Performance Context Access

The platform-core package provides optimized context access:

```typescript
// From: platform/packages/core/src/context.ts
export class AsyncContextManager {
  private static readonly storage = new AsyncLocalStorage();
  private static readonly contextCache = new WeakMap<TraceContext, number>();
  private static readonly maxContextAge = 5 * 60 * 1000; // 5 minutes

  /**
   * Run a function with trace context - used by BaseService and telemetry
   * Performance optimized with context validation and cleanup
   */
  static run<T>(context: TraceContext, fn: () => T): T {
    // Validate context before running to prevent invalid context propagation
    AsyncContextManager.validateContext(context);

    // Mark context creation time for cleanup
    AsyncContextManager.contextCache.set(context, Date.now());

    try {
      return AsyncContextManager.storage.run(context, fn);
    } finally {
      // Schedule cleanup for old contexts to prevent memory leaks
      AsyncContextManager.scheduleContextCleanup();
    }
  }

  /**
   * Get current correlation ID for tracing
   */
  static getCurrentCorrelationId(): string | undefined {
    const context = AsyncContextManager.getCurrentContext();
    return context?.correlationId;
  }
}
```

**Performance Optimizations:**

- WeakMap-based caching for fast lookups (<1ms)
- Stale context detection prevents memory leaks
- Probabilistic cleanup (1% chance per call) avoids performance spikes
- Context validation at entry prevents invalid propagation

### 4. Telemetry: Correlation to Trace Mapping

The telemetry package maps correlation IDs to OpenTelemetry trace IDs:

```typescript
// From: platform/packages/telemetry/src/trace-context-manager.ts
export class TraceContextManager {
  /**
   * Creates trace context from message correlation ID
   * Used by BaseService when processing messages from the message bus
   */
  static createContextFromMessage(
    correlationId: string,
    serviceName: string,
    operationType: 'command' | 'query' | 'event',
    operationName: string,
    authContext?: AuthContext,
    parentTraceContext?: TraceContextData
  ): TraceContext {
    const context: TraceContext = {
      traceId: correlationId, // Correlation ID becomes trace ID
      spanId: TraceContextManager.generateSpanId(),
      correlationId,
      serviceName,
      operationType,
      operationName,
      startTime: new Date(),
    };

    if (authContext) {
      context.auth = authContext;
    }

    if (parentTraceContext) {
      context.parentTraceContext = parentTraceContext;
    }

    return context;
  }
}
```

**Key Insight:** The correlation ID directly becomes the OpenTelemetry trace ID, creating a unified identifier for both business and technical tracing.

## Message Envelope Structure

Every inter-service message carries correlation context:

```typescript
// From: platform/packages/message-bus-client/src/interfaces/MessageEnvelope.ts
export interface MessageEnvelope<T = unknown> {
  /** Unique identifier for this specific message */
  readonly id: string;

  /**
   * Correlation ID for distributed tracing.
   * - Originates from API Gateway for external requests
   * - Automatically propagated through all service-to-service calls
   * - Used as trace ID for telemetry integration
   * - Never manually set by developers - handled automatically by MessageBusClient
   */
  readonly correlationId: string;

  /**
   * W3C Trace Context for distributed tracing propagation.
   * Optional for backward compatibility with existing messages.
   */
  readonly traceContext?: TraceContextData;

  /** The actual message payload */
  readonly payload: T;

  /** Additional metadata for authentication, retry, routing */
  readonly metadata: MessageMetadata;
}
```

## Developer Experience: Zero Configuration

### What Developers Write

```typescript
// Handlers require ZERO correlation ID handling
@CommandHandler('CreateUser')
export class CreateUserHandler {
  async handle(input: CreateUserInput): Promise<CreateUserOutput> {
    // Correlation ID is automatically available in logs
    logger.info('Creating user', { email: input.email });

    // Automatically propagated to downstream services
    await this.messageBus.send('email.sendWelcome', {
      userId: user.id
    });

    // Automatically included in traces
    const user = await this.userRepository.create(input);

    return { userId: user.id };
  }
}
```

### What Happens Automatically

1. **Message Receipt**: BaseService establishes AsyncLocalStorage context
2. **Logger Access**: Logger automatically includes correlation ID from context
3. **Downstream Calls**: MessageBus automatically extracts correlation ID from context
4. **Trace Creation**: Telemetry automatically creates spans with correlation ID as trace ID
5. **Error Tracking**: Errors automatically tagged with correlation ID

### Accessing Correlation ID (Rare Cases)

In rare cases where explicit correlation ID access is needed:

```typescript
import { AsyncContextManager } from '@banyanai/platform-core';

// Get current correlation ID
const correlationId = AsyncContextManager.getCurrentCorrelationId();
console.log('Processing request:', correlationId);
```

## Benefits and Trade-offs

### Benefits

- **Zero Developer Overhead**: No manual correlation ID handling in 99% of code
- **Compile-Time Safety**: TypeScript prevents correlation ID being forgotten
- **Performance**: AsyncLocalStorage provides <1ms context lookups
- **Complete Traces**: Every operation automatically traced end-to-end
- **Memory Safe**: Automatic cleanup prevents context leaks
- **Debug-Friendly**: Single ID tracks request through entire system

### Trade-offs

- **AsyncLocalStorage Requirement**: Requires Node.js 16+ for async_hooks
- **Hidden State**: Context is "invisible" which can be surprising initially
- **Testing Complexity**: Tests must establish context or use fallback mechanisms
- **Node.js Specific**: Architecture tied to Node.js runtime features

### When This Architecture Excels

This correlation ID architecture is ideal for:

- **Microservices**: Multiple services handling single logical operation
- **High Traffic**: Millions of requests requiring efficient context propagation
- **Developer Productivity**: Teams focused on business logic, not infrastructure
- **Compliance**: Audit trails requiring end-to-end request tracking
- **Performance Analysis**: Identifying bottlenecks across service boundaries

## Correlation ID Flow Example

### Complete Request Flow

```typescript
// 1. Client sends request (optionally with X-Correlation-ID header)
POST /api/users
X-Correlation-ID: client-tracking-123

// 2. API Gateway extracts/generates correlation ID
const correlationId = correlationManager.extractOrGenerateCorrelationId(request);
// Result: "client-tracking-123" (or generated UUID if not provided)

// 3. API Gateway creates message envelope with correlation ID
const envelope = {
  correlationId: "client-tracking-123",
  payload: { name: "John", email: "john@example.com" },
  // ... other fields
};

// 4. Message bus establishes AsyncLocalStorage context
await CorrelationContextManager.runWithContext(
  { correlationId: "client-tracking-123", ... },
  async () => {
    // 5. Handler executes within context
    await handler.handle(envelope.payload);
  }
);

// 6. Within handler, correlation ID flows automatically
logger.info('Creating user');
// Logs: { correlationId: "client-tracking-123", message: "Creating user" }

await messageBus.send('email.sendWelcome', { userId: 123 });
// Email service receives message with correlationId: "client-tracking-123"

// 7. Response includes correlation ID header
HTTP/1.1 201 Created
X-Correlation-ID: client-tracking-123
```

### Cross-Service Propagation

```typescript
// Service A: User Service
@CommandHandler('CreateUser')
export class CreateUserHandler {
  async handle(input: CreateUserInput) {
    // Correlation ID: "abc-123" (from API Gateway)

    const user = await this.createUser(input);

    // Send to Email Service - correlation ID automatically included
    await this.messageBus.send('email.sendWelcome', { userId: user.id });
    // Message envelope: { correlationId: "abc-123", payload: {...} }

    // Send to Analytics Service - correlation ID automatically included
    await this.messageBus.send('analytics.track', {
      event: 'user.created',
      userId: user.id
    });
    // Message envelope: { correlationId: "abc-123", payload: {...} }

    return { userId: user.id };
  }
}

// Service B: Email Service (automatically receives same correlation ID)
@CommandHandler('SendWelcomeEmail')
export class SendWelcomeEmailHandler {
  async handle(input: { userId: string }) {
    // Correlation ID: "abc-123" (automatically from message envelope)
    logger.info('Sending welcome email', { userId: input.userId });
    // Logs include: correlationId: "abc-123"

    await this.emailProvider.send({...});
  }
}

// Service C: Analytics Service (automatically receives same correlation ID)
@EventHandler('UserCreated')
export class TrackUserCreatedHandler {
  async handle(event: UserCreatedEvent) {
    // Correlation ID: "abc-123" (automatically from event envelope)
    logger.info('Tracking user creation');
    // Logs include: correlationId: "abc-123"
  }
}
```

All three services share correlation ID "abc-123" without any manual passing!

## Troubleshooting Correlation ID Issues

### Missing Correlation ID in Logs

**Symptom:** Logs show `undefined` or missing correlation ID

**Cause:** Code executing outside AsyncLocalStorage context

**Solution:**
```typescript
// Ensure code runs within handler context
@CommandHandler('MyCommand')
export class MyHandler {
  async handle(input: Input) {
    // ✅ GOOD: Inside handler - has context
    logger.info('Processing');

    // ❌ BAD: setTimeout breaks context
    setTimeout(() => {
      logger.info('Delayed'); // No correlation ID!
    }, 1000);

    // ✅ GOOD: Use async/await instead
    await delay(1000);
    logger.info('Delayed'); // Has correlation ID!
  }
}
```

### Correlation ID Not Propagating

**Symptom:** Downstream services have different correlation IDs

**Cause:** Direct RabbitMQ usage bypassing MessageBusClient

**Solution:**
```typescript
// ❌ BAD: Direct RabbitMQ bypasses correlation propagation
await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)));

// ✅ GOOD: Use MessageBusClient for automatic propagation
await this.messageBus.send('service.command', data);
```

### Background Jobs Missing Correlation ID

**Symptom:** Scheduled/background jobs have no correlation ID

**Expected Behavior:** Background jobs generate fallback correlation IDs

```typescript
// Background jobs automatically get generated correlation ID
function generateFallbackCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `fallback-${timestamp}-${random}`;
  // Example: "fallback-l8k9x2-a7b3f91e"
}
```

This is normal - background jobs not triggered by external requests get generated IDs for tracing.

## Integration with OpenTelemetry

The correlation ID seamlessly integrates with OpenTelemetry distributed tracing:

```typescript
// Correlation ID becomes OpenTelemetry trace ID
const context: TraceContext = {
  traceId: correlationId, // "abc-123" → trace ID in Jaeger
  spanId: generateSpanId(),
  correlationId,
  serviceName: 'user-service',
  operationType: 'command',
  operationName: 'CreateUser',
  startTime: new Date(),
};
```

**In Jaeger UI:**
- Trace ID: `abc-123`
- All spans across all services share this trace ID
- Complete request flow visible in single trace

## Related Concepts

This correlation ID architecture enables:

- **[W3C Trace Context](../../04-reference/message-protocols/w3c-trace-context.md)** - Standard trace propagation format
- **[OpenTelemetry Integration](../infrastructure/telemetry-and-observability.md)** - Automatic instrumentation
- **[Message Bus Architecture](./message-bus-architecture.md)** - Communication foundation
- **[BaseService Pattern](../../03-guides/creating-services.md)** - Automatic context establishment

## Best Practices

1. **Never Manually Pass Correlation IDs**
   - Let AsyncLocalStorage handle propagation
   - Exception: External system integration requiring explicit IDs

2. **Trust the Context**
   - Correlation ID is always available within handlers
   - Logger automatically includes it
   - Message bus automatically propagates it

3. **Use Standard Logging**
   - Platform logger automatically includes correlation ID
   - Don't create custom loggers that bypass this

4. **Avoid Context-Breaking Patterns**
   - Don't use raw `setTimeout` (breaks AsyncLocalStorage chain)
   - Use `async`/`await` instead of raw callbacks
   - Don't spawn child processes expecting correlation propagation

5. **Client-Provided IDs**
   - Accept `X-Correlation-ID` header for client request tracking
   - Validate format but trust client-provided IDs (they're opaque to platform)

## Glossary

**Correlation ID**: Unique identifier (UUID v4) that tracks a request through the distributed system. Originates at API Gateway and propagates automatically through all services.

**AsyncLocalStorage**: Node.js API (async_hooks module) that provides thread-safe context isolation without manual parameter passing.

**Trace ID**: OpenTelemetry identifier for distributed traces. In this platform, trace ID equals correlation ID.

**Span ID**: OpenTelemetry identifier for individual operations within a trace. Generated per operation.

**Message Envelope**: Data structure wrapping all inter-service messages, containing correlation ID, payload, and metadata.

**Context Propagation**: Automatic flow of correlation ID through async operations without manual intervention.
