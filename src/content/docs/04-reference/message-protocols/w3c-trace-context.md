---
title: "W3C Trace Context Protocol Reference"
description: "W3C Trace Context standard implementation for distributed tracing propagation across service boundaries"
category: "reference"
tags: ["protocols", "tracing", "w3c", "distributed-systems"]
api_version: "1.0.0"
package: "@banyanai/platform-message-bus-client"
last_updated: "2025-11-15"
status: "published"
---

# W3C Trace Context Protocol Reference

> **Package:** `@banyanai/platform-message-bus-client` | **Standard:** [W3C Trace Context](https://www.w3.org/TR/trace-context/)

## Overview

The Banyan platform implements the W3C Trace Context specification to propagate distributed tracing context across service boundaries. This enables parent-child span relationships between services, creating complete trace hierarchies in Jaeger and other OpenTelemetry-compatible tracing systems.

W3C Trace Context is optional and complementary to the platform's correlation ID system. While correlation IDs provide business-level request tracking, W3C Trace Context provides technical-level span relationships for performance analysis.

### Key Features

- **Standards-Compliant**: Full W3C Trace Context 1.0 specification implementation
- **Automatic Propagation**: Trace context flows automatically through MessageEnvelope
- **OpenTelemetry Integration**: Seamless integration with OTel instrumentation
- **Parent-Child Spans**: Proper span hierarchy across distributed services
- **Jaeger Visualization**: Complete trace trees in Jaeger UI

## W3C Trace Context Standard

The W3C Trace Context specification defines HTTP headers for propagating distributed tracing context:

```
traceparent: 00-{trace-id}-{parent-id}-{trace-flags}
tracestate: {vendor-specific-data}
```

### Format Specifications

| Field | Format | Length | Description |
|-------|--------|--------|-------------|
| `version` | `00` | 2 chars | Specification version (always `00`) |
| `trace-id` | hex string | 32 chars | Trace identifier (16 bytes) |
| `parent-id` | hex string | 16 chars | Parent span identifier (8 bytes) |
| `trace-flags` | hex string | 2 chars | Trace flags (1 byte) |
| `tracestate` | string | variable | Vendor-specific state (optional) |

### Example Traceparent Header

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                │
             │  └─ trace-id (32 hex chars)      │                └─ trace-flags
             │                                   └─ parent-id (16 hex chars)
             └─ version
```

## Platform Implementation

### TraceContextData Interface

The platform represents W3C Trace Context using the `TraceContextData` interface:

```typescript
// From: platform/packages/message-bus-client/src/interfaces/MessageEnvelope.ts

/**
 * W3C Trace Context data for distributed tracing propagation.
 * Follows W3C Trace Context specification (https://www.w3.org/TR/trace-context/)
 */
export interface TraceContextData {
  /** Trace ID - 32 hexadecimal characters (16 bytes) */
  readonly traceId: string;

  /** Parent span ID - 16 hexadecimal characters (8 bytes) */
  readonly spanId: string;

  /** Trace flags - 2 hexadecimal characters (1 byte) */
  readonly traceFlags: string;

  /** Optional vendor-specific trace state */
  readonly traceState?: string;
}
```

### Message Envelope Integration

Trace context is embedded in the MessageEnvelope structure:

```typescript
export interface MessageEnvelope<T = unknown> {
  /** Unique identifier for this specific message */
  readonly id: string;

  /**
   * Correlation ID for distributed tracing.
   * Used as trace ID for telemetry integration.
   */
  readonly correlationId: string;

  /**
   * W3C Trace Context for distributed tracing propagation.
   * Optional for backward compatibility with existing messages.
   * Follows W3C Trace Context specification.
   */
  readonly traceContext?: TraceContextData;

  /** The actual message payload */
  readonly payload: T;

  /** Additional metadata */
  readonly metadata: MessageMetadata;
}
```

**Key Design Decision:** `traceContext` is optional to maintain backward compatibility with services that haven't adopted W3C Trace Context yet.

### Trace Context in AsyncLocalStorage

Trace context flows through AsyncLocalStorage alongside correlation ID:

```typescript
// From: platform/packages/message-bus-client/src/context/CorrelationContextManager.ts

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

## Creating Trace Context

### From HTTP Headers (API Gateway)

The API Gateway extracts W3C Trace Context from incoming HTTP requests:

```typescript
// Extracting traceparent header
const traceparentHeader = request.headers['traceparent'];
// Example: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"

const traceContext = parseTraceparent(traceparentHeader);

function parseTraceparent(header: string): TraceContextData | undefined {
  if (!header) return undefined;

  const parts = header.split('-');
  if (parts.length !== 4) return undefined;

  const [version, traceId, spanId, traceFlags] = parts;

  // Validate format
  if (version !== '00') return undefined;
  if (traceId.length !== 32) return undefined;
  if (spanId.length !== 16) return undefined;
  if (traceFlags.length !== 2) return undefined;

  return {
    traceId,
    spanId,
    traceFlags,
    traceState: request.headers['tracestate'] as string | undefined
  };
}
```

### In Message Bus Context

When sending messages, the message bus automatically includes trace context:

```typescript
// From: platform/packages/message-bus-client/src/context/CorrelationContextManager.ts

/**
 * Get current trace context from correlation context.
 * Returns undefined if no trace context exists.
 */
export function getCurrentTraceContext(): TraceContextData | undefined {
  const context = getCurrentContext();
  return context?.traceContext;
}

/**
 * Create correlation context from message envelope.
 * Used when processing incoming messages to establish context.
 */
export function createContext(
  correlationId: string,
  sourceService: string,
  auth?: MessageAuthContext | null,
  traceContext?: TraceContextData
): MessageBusContext {
  return {
    correlationId,
    ...(auth !== undefined && { auth }),
    ...(traceContext && { traceContext }),
    sourceService,
    timestamp: new Date(),
  };
}
```

## OpenTelemetry Integration

### Converting to OpenTelemetry SpanContext

The telemetry package converts W3C Trace Context to OpenTelemetry SpanContext:

```typescript
// From: platform/packages/telemetry/src/trace-context-manager.ts

/**
 * Extract parent span context from W3C Trace Context.
 * This enables distributed tracing across service boundaries.
 */
private static extractParentContextFromStorage(): SpanContext | undefined {
  try {
    // Get trace context from AsyncLocalStorage
    const currentContext = TraceContextManager.getCurrentContext();
    const traceContextData = currentContext?.parentTraceContext;

    if (!traceContextData) {
      return undefined;
    }

    // Parse trace flags from hex string
    const traceFlags = parseInt(traceContextData.traceFlags, 16);

    // Convert W3C Trace Context to OpenTelemetry SpanContext
    const spanContext: SpanContext = {
      traceId: traceContextData.traceId,
      spanId: traceContextData.spanId,
      traceFlags: traceFlags || TraceFlags.NONE,
      isRemote: true, // This is a remote parent span from another service
    };

    return spanContext;
  } catch (error) {
    // If parsing fails, return undefined to proceed without parent context
    return undefined;
  }
}
```

### Creating Child Spans

When creating spans, the telemetry system links them to parent spans via trace context:

```typescript
// From: platform/packages/telemetry/src/trace-context-manager.ts

private static createOTelSpan(context: TraceContext): Span {
  // Check if there's parent trace context from message bus
  let parentContext = otelContext.active();

  try {
    // Extract parent span context from W3C Trace Context
    const messageBusTraceContext = TraceContextManager.extractParentContextFromStorage();
    if (messageBusTraceContext) {
      // Set parent context from message bus
      parentContext = trace.setSpanContext(otelContext.active(), messageBusTraceContext);
    }
  } catch {
    // If extraction fails, proceed with active context
  }

  // Create span with parent context
  const span = TraceContextManager.tracer.startSpan(
    spanName,
    {
      kind: SpanKind.SERVER,
      attributes: {
        'operation.type': context.operationType,
        'operation.name': context.operationName,
        'correlation.id': context.correlationId,
      },
    },
    parentContext // Parent context from W3C Trace Context
  );

  return span;
}
```

## Trace Propagation Flow

### Complete Request Flow with W3C Trace Context

```typescript
// 1. Client sends request with W3C Trace Context headers
POST /api/orders HTTP/1.1
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
tracestate: vendor=value

// 2. API Gateway extracts trace context
const traceContext = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  traceFlags: '01',
  traceState: 'vendor=value'
};

// 3. API Gateway creates message envelope with trace context
const envelope = {
  correlationId: 'gateway-generated-uuid',
  traceContext: {
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
    spanId: '00f067aa0ba902b7', // Parent span from API Gateway
    traceFlags: '01',
  },
  payload: { productId: 123, quantity: 2 }
};

// 4. Order Service receives message and establishes context
await CorrelationContextManager.runWithContext(
  {
    correlationId: envelope.correlationId,
    traceContext: envelope.traceContext, // Parent trace context
    sourceService: 'api-gateway'
  },
  async () => {
    // 5. Telemetry creates child span linked to parent
    const span = createOTelSpan({
      traceId: envelope.correlationId,
      parentTraceContext: envelope.traceContext, // Links to API Gateway span
      serviceName: 'order-service',
      operationName: 'CreateOrder'
    });
    // This span's parent is the API Gateway span (00f067aa0ba902b7)

    // 6. Order Service calls Inventory Service
    await messageBus.send('inventory.reserve', { productId: 123 });
    // Message includes current span as parent in traceContext
  }
);

// 7. Inventory Service creates child span
// Parent: Order Service span
// Trace ID: Same 4bf92f3577b34da6a3ce929d0e0e4736
// Result: Complete trace hierarchy in Jaeger
```

### Trace Hierarchy Visualization

```
Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736

┌─────────────────────────────────────────────┐
│  Client Request                             │
│  traceparent: 00-4bf92...                  │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────┐
│  API Gateway Span                             │
│  spanId: 00f067aa0ba902b7                    │
│  Operation: POST /api/orders                  │
└───────────────┬───────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────┐
│  Order Service Span                           │
│  spanId: a1b2c3d4e5f60718                    │
│  parentId: 00f067aa0ba902b7                  │
│  Operation: command/CreateOrder               │
└───────────────┬───────┬───────────────────────┘
                │       │
       ┌────────┘       └──────────┐
       ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐
│ Inventory Span   │    │ Payment Span         │
│ parentId: a1b2.. │    │ parentId: a1b2..    │
└──────────────────┘    └──────────────────────┘
```

## Accessing Trace Context in Handlers

Handlers rarely need explicit trace context access, but it's available when needed:

```typescript
import { getCurrentTraceContext } from '@banyanai/platform-message-bus-client';

@CommandHandler('CreateOrder')
export class CreateOrderHandler {
  async handle(input: CreateOrderInput) {
    // Get current W3C Trace Context (if present)
    const traceContext = getCurrentTraceContext();

    if (traceContext) {
      console.log('Trace ID:', traceContext.traceId);
      console.log('Parent Span ID:', traceContext.spanId);
      console.log('Trace Flags:', traceContext.traceFlags);
    }

    // Most code doesn't need explicit access - telemetry handles it automatically
    const order = await this.orderRepository.create(input);
    return { orderId: order.id };
  }
}
```

## Trace Flags

The `traceFlags` field is a 2-character hex string (1 byte) containing bit flags:

| Bit | Flag Name | Description |
|-----|-----------|-------------|
| 0 | `sampled` | `1` = trace is sampled, `0` = not sampled |
| 1-7 | (reserved) | Reserved for future use |

### Common Trace Flags Values

| Hex Value | Binary | Meaning |
|-----------|--------|---------|
| `00` | `00000000` | Not sampled |
| `01` | `00000001` | Sampled |

### Example: Checking Sampled Flag

```typescript
function isSampled(traceFlags: string): boolean {
  const flags = parseInt(traceFlags, 16);
  return (flags & 0x01) === 0x01;
}

const traceContext: TraceContextData = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  traceFlags: '01', // Sampled
};

console.log(isSampled(traceContext.traceFlags)); // true
```

## Trace State

The optional `traceState` field carries vendor-specific trace context:

### Format

```
tracestate: vendor1=value1,vendor2=value2
```

### Example

```typescript
const traceContext: TraceContextData = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  traceFlags: '01',
  traceState: 'jaeger=sampling-rate:0.5,datadog=priority:2'
};
```

**Platform Behavior:** The platform preserves `traceState` but doesn't interpret it. Vendor-specific tracing systems (Jaeger, Datadog, etc.) can use this field for their own propagation needs.

## Validation and Error Handling

### Trace Context Validation

```typescript
function validateTraceContext(context: TraceContextData): boolean {
  // Validate trace ID format (32 hex characters)
  if (!/^[0-9a-f]{32}$/i.test(context.traceId)) {
    return false;
  }

  // Validate span ID format (16 hex characters)
  if (!/^[0-9a-f]{16}$/i.test(context.spanId)) {
    return false;
  }

  // Validate trace flags format (2 hex characters)
  if (!/^[0-9a-f]{2}$/i.test(context.traceFlags)) {
    return false;
  }

  // Trace ID must not be all zeros
  if (context.traceId === '00000000000000000000000000000000') {
    return false;
  }

  // Span ID must not be all zeros
  if (context.spanId === '0000000000000000') {
    return false;
  }

  return true;
}
```

### Handling Invalid Trace Context

```typescript
// Platform behavior: If trace context is invalid, proceed without it
try {
  const traceContext = parseAndValidateTraceContext(headers);
  return traceContext;
} catch (error) {
  // Log warning but don't fail request
  logger.warn('Invalid W3C Trace Context, proceeding without parent trace', {
    error: error.message
  });
  return undefined;
}
```

## Integration with Correlation IDs

W3C Trace Context and correlation IDs serve complementary purposes:

| Aspect | Correlation ID | W3C Trace Context |
|--------|---------------|-------------------|
| **Purpose** | Business request tracking | Technical span relationships |
| **Scope** | Entire request flow | Individual service spans |
| **Format** | UUID v4 | 32-char hex trace ID |
| **Propagation** | MessageEnvelope.correlationId | MessageEnvelope.traceContext |
| **Primary Use** | Logs, debugging, audit | Performance analysis, span hierarchy |

### Combined Usage Example

```typescript
const envelope: MessageEnvelope<OrderData> = {
  id: 'msg-uuid-1',

  // Correlation ID: Business-level request tracking
  correlationId: 'client-tracking-abc-123',

  // W3C Trace Context: Technical span relationships
  traceContext: {
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
    spanId: '00f067aa0ba902b7',
    traceFlags: '01'
  },

  payload: { orderId: 123 },
  metadata: { /* ... */ }
};
```

**In Jaeger:**
- Trace ID: `4bf92f3577b34da6a3ce929d0e0e4736` (from traceContext)
- Tags include: `correlation.id: client-tracking-abc-123`

## Testing with W3C Trace Context

### Creating Test Trace Context

```typescript
function createTestTraceContext(options?: {
  traceId?: string;
  spanId?: string;
  sampled?: boolean;
}): TraceContextData {
  return {
    traceId: options?.traceId || '4bf92f3577b34da6a3ce929d0e0e4736',
    spanId: options?.spanId || '00f067aa0ba902b7',
    traceFlags: options?.sampled !== false ? '01' : '00',
  };
}

// Usage in tests
const traceContext = createTestTraceContext({
  traceId: 'test-trace-id-12345678901234567890',
  sampled: true
});
```

### Testing Trace Propagation

```typescript
describe('W3C Trace Context Propagation', () => {
  it('should propagate trace context through message bus', async () => {
    const parentTraceContext = createTestTraceContext();

    // Send message with trace context
    await messageBus.send('test.command', { data: 'test' }, {
      traceContext: parentTraceContext
    });

    // Verify handler receives trace context
    const handler = getRegisteredHandler('test.command');
    const receivedContext = await handler.getTraceContext();

    expect(receivedContext?.traceId).toBe(parentTraceContext.traceId);
    expect(receivedContext?.spanId).toBe(parentTraceContext.spanId);
  });
});
```

## Performance Considerations

### Overhead

W3C Trace Context adds minimal overhead:

- **Message Size**: ~100 bytes per message (traceContext field)
- **Parse Time**: <0.1ms to parse/validate trace context
- **Memory**: ~200 bytes per active context in AsyncLocalStorage

### Sampling

Use trace flags to control sampling:

```typescript
// High-traffic endpoints: Sample 10%
const shouldSample = Math.random() < 0.1;
const traceFlags = shouldSample ? '01' : '00';

const traceContext: TraceContextData = {
  traceId: generateTraceId(),
  spanId: generateSpanId(),
  traceFlags, // '01' for 10% of requests, '00' for others
};
```

## Common Issues and Solutions

### Issue: Broken Trace Hierarchy

**Symptom:** Spans appear disconnected in Jaeger despite being part of same request

**Cause:** Trace context not propagated through message envelope

**Solution:**
```typescript
// ❌ BAD: Missing trace context
await messageBus.send('downstream.command', payload);

// ✅ GOOD: MessageBusClient automatically includes trace context
await this.messageBus.send('downstream.command', payload);
// Trace context automatically extracted from AsyncLocalStorage
```

### Issue: Invalid Trace Context Format

**Symptom:** Warnings about invalid trace context in logs

**Cause:** Manually created trace context with incorrect format

**Solution:**
```typescript
// ❌ BAD: Invalid format
const traceContext = {
  traceId: 'too-short',
  spanId: 'also-short',
  traceFlags: '1' // Wrong length
};

// ✅ GOOD: Correct format
const traceContext = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736', // 32 hex chars
  spanId: '00f067aa0ba902b7',                 // 16 hex chars
  traceFlags: '01'                            // 2 hex chars
};
```

### Issue: Missing Parent Spans

**Symptom:** Root span appears in service, not API Gateway

**Cause:** Trace context lost between API Gateway and service

**Solution:** Ensure API Gateway includes trace context in initial message envelope.

## External Resources

### W3C Specification
- [W3C Trace Context Specification](https://www.w3.org/TR/trace-context/)
- [W3C Trace Context Level 2 (Draft)](https://w3c.github.io/trace-context/)

### OpenTelemetry Integration
- [OpenTelemetry Trace Specification](https://opentelemetry.io/docs/specs/otel/trace/api/)
- [OpenTelemetry Context Propagation](https://opentelemetry.io/docs/specs/otel/context/)

### Related Platform Documentation
- [Correlation ID and Distributed Tracing](../../02-concepts/architecture/correlation-and-tracing.md)
- [Telemetry and Observability](../../02-concepts/infrastructure/telemetry-and-observability.md)
- [MessageEnvelope Reference](./message-envelope.md)

## Glossary

**Trace ID**: Globally unique identifier (32 hex characters) for a distributed trace spanning multiple services.

**Span ID**: Identifier (16 hex characters) for a single operation within a trace. Each span has a unique span ID.

**Parent Span**: The span that initiated the current span. Used to build trace hierarchies.

**Trace Flags**: Bit flags (2 hex characters) indicating trace sampling and other options.

**Trace State**: Optional vendor-specific trace propagation data.

**traceparent**: HTTP header format defined by W3C Trace Context: `version-traceid-spanid-flags`

**tracestate**: HTTP header for vendor-specific trace context: `vendor=value,vendor2=value2`
