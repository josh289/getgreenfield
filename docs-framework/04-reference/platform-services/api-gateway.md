---
title: API Gateway Service
description: Protocol translation service for REST, GraphQL, and WebSocket APIs
category: platform-services
tags: [api-gateway, rest, graphql, websocket, protocol-translation]
related:
  - ./auth-service.md
  - ./service-discovery.md
  - ../graphql-api/overview.md
  - ../rest-api/overview.md
difficulty: advanced
---

# API Gateway Service

The API Gateway is the central entry point for all client requests, translating REST, GraphQL, and WebSocket protocols into internal message bus communications.

## Overview

The API Gateway provides:

- **Protocol Translation** - Converts HTTP/GraphQL/WebSocket to RabbitMQ messages
- **Authentication** - Validates JWT tokens and extracts user context
- **Authorization** - Enforces permission-based access control (Layer 1)
- **Dynamic Routing** - Auto-discovers services and their contracts
- **Schema Generation** - Creates GraphQL schemas from service contracts
- **Request Orchestration** - Manages request lifecycle with resilience patterns
- **Real-time Subscriptions** - WebSocket event streaming

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  REST API   │  │  GraphQL    │  │  WebSocket  │     │
│  │  Adapter    │  │  Engine     │  │  Handler    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                 │                 │             │
│         └─────────┬───────┴─────────┬───────┘            │
│                   │                 │                     │
│         ┌─────────▼─────────────────▼─────────┐         │
│         │   Request Orchestrator               │         │
│         │  - Auth Translation                  │         │
│         │  - Permission Validation             │         │
│         │  - Circuit Breakers                  │         │
│         │  - Correlation Tracking              │         │
│         └─────────┬──────────────────┘         │
│                   │                             │
│         ┌─────────▼─────────────┐              │
│         │  Message Bus Proxy     │              │
│         └─────────┬──────────────┘              │
└───────────────────┼──────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   RabbitMQ    │
            └───────────────┘
```

## Configuration

### Environment Variables

```bash
# Port Configuration
PORT=3003                           # HTTP/WebSocket port

# Authentication
JWT_SECRET=your-secret-key          # JWT signing secret
DEVELOPMENT_AUTH_ENABLED=false      # Enable dev mode (NEVER in production)

# Message Bus
MESSAGE_BUS_URL=amqp://admin:admin123@rabbitmq:5672

# Service Discovery
SERVICE_DISCOVERY_URL=http://service-discovery:3002

# Telemetry
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces

# GraphQL
GRAPHQL_INTROSPECTION_ENABLED=true  # Enable schema introspection
GRAPHQL_PLAYGROUND_ENABLED=true     # Enable GraphiQL playground
```

### Docker Compose

```yaml
api-gateway:
  build: ./platform/services/api-gateway
  ports:
    - "3003:3003"
  environment:
    - PORT=3003
    - JWT_SECRET=${JWT_SECRET}
    - MESSAGE_BUS_URL=amqp://admin:admin123@rabbitmq:5672
    - JAEGER_ENDPOINT=http://jaeger:4318/v1/traces
  depends_on:
    - rabbitmq
    - service-discovery
    - auth-service
```

## Endpoints

### REST API

**Base URL:** `http://localhost:3003/api/`

Auto-generated endpoints from service contracts:

```
POST   /api/users                  # CreateUserCommand
GET    /api/users/:userId          # GetUserQuery
GET    /api/users                  # ListUsersQuery
PUT    /api/users/:userId          # UpdateUserCommand
DELETE /api/users/:userId          # DeleteUserCommand

POST   /api/auth/authenticate      # AuthenticateUserCommand
POST   /api/auth/refresh-token     # RefreshTokenCommand
POST   /api/auth/revoke-token      # RevokeTokenCommand

GET    /api/roles                  # ListRolesQuery
GET    /api/roles/:roleName        # GetRoleQuery
POST   /api/roles                  # CreateRoleCommand
```

### GraphQL API

**Endpoint:** `http://localhost:3003/graphql`

```graphql
query {
  getUser(input: { userId: "user-123" }) {
    id
    email
    profile { firstName lastName }
  }
}

mutation {
  createUser(input: {
    email: "user@example.com"
    password: "password123"
    profile: { firstName: "John" }
  }) {
    success
    userId
  }
}

subscription {
  userCreated {
    userId
    email
  }
}
```

**GraphiQL Playground:** `http://localhost:3003/graphql` (browser)

### WebSocket API

**Endpoint:** `ws://localhost:3003/ws`

Supports both:
- Native WebSocket protocol (JSON events)
- GraphQL subscriptions (graphql-ws protocol)

```javascript
const ws = new WebSocket('ws://localhost:3003/ws');

ws.onopen = () => {
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'subscribe',
    eventType: 'UserCreated'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event received:', data);
};
```

### Health Check

**Endpoint:** `GET /health`

```bash
curl http://localhost:3003/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-11-15T14:30:00Z",
  "dependencies": {
    "messageBus": "healthy",
    "serviceDiscovery": "healthy"
  }
}
```

## Core Features

### 1. Protocol Translation

**REST → Message Bus:**
```
HTTP POST /api/users
└─> CreateUserCommand message
    └─> RabbitMQ publish to auth-service
        └─> Handler executes
            └─> Response via reply queue
                └─> HTTP 201 Created
```

**GraphQL → Message Bus:**
```
GraphQL mutation { createUser(...) }
└─> Parse GraphQL operation
    └─> Extract messageType from schema
        └─> CreateUserCommand message
            └─> RabbitMQ publish
                └─> GraphQL response
```

**WebSocket → Message Bus:**
```
WebSocket: subscribe to UserCreated
└─> Subscribe to UserCreated exchange
    └─> Event published by auth-service
        └─> Received via message bus
            └─> Forwarded to WebSocket client
```

### 2. Dynamic Schema Generation

GraphQL schema is auto-generated from service contracts:

```typescript
// Service contract
@Command({
  description: 'Create user',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  password!: string;
}

// Auto-generated GraphQL
input CreateUserInput {
  email: String!
  password: String!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
}
```

**Schema Caching:**
- Schemas cached per permission set
- 5-minute TTL
- Automatic refresh on contract changes

### 3. Permission-Based Filtering

Users only see operations they can access:

```graphql
# User with permissions: ["users:read"]
type Query {
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult
}
# No mutations visible

# Admin with permissions: ["users:read", "users:create", "admin:all"]
type Query {
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult
  getServiceHealth(input: GetServiceHealthInput!): ServiceHealthResult
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
  updateUser(input: UpdateUserInput!): UpdateUserResult
  deleteUser(input: DeleteUserInput!): DeleteUserResult
}
```

### 4. Request Lifecycle

```
1. Client Request
   └─> HTTP/GraphQL/WebSocket

2. Protocol Parsing
   └─> Extract operation and parameters

3. Authentication
   └─> Validate JWT token
   └─> Extract user context

4. Contract Discovery
   └─> Find matching contract
   └─> Validate permissions

5. Permission Check (Layer 1)
   └─> Compare user permissions with required permissions
   └─> Reject if insufficient

6. Message Creation
   └─> Create MessageEnvelope
   └─> Embed auth context
   └─> Add correlation ID
   └─> Add W3C trace context

7. Circuit Breaker Check
   └─> Check service health
   └─> Fail fast if circuit open

8. Message Bus Communication
   └─> Publish to RabbitMQ
   └─> Wait for response (commands/queries)
   └─> Or forward events (subscriptions)

9. Response Translation
   └─> Convert message to protocol format
   └─> Add response headers
   └─> Return to client
```

### 5. Resilience Patterns

**Circuit Breaker:**
```typescript
// Per-service circuit breaker
circuitBreaker.execute(serviceName, async () => {
  return await messageBusProxy.sendCommand(command);
});

// States: CLOSED → OPEN → HALF_OPEN → CLOSED
// Thresholds:
// - Failure rate: 50%
// - Window: 10 seconds
// - Open duration: 30 seconds
```

**Timeouts:**
```typescript
// Request timeouts
const timeout = 30000; // 30 seconds

// Query timeout (shorter)
const queryTimeout = 10000; // 10 seconds

// Command timeout (longer)
const commandTimeout = 60000; // 60 seconds
```

**Retry Logic:**
```typescript
// Automatic retry for transient failures
retryPolicy: {
  maxAttempts: 3,
  backoff: 'exponential',
  retryableErrors: ['TIMEOUT', 'SERVICE_UNAVAILABLE']
}
```

### 6. Distributed Tracing

**W3C Trace Context:**
```http
GET /api/users/user-123
Authorization: Bearer <token>
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

**Propagation:**
```
HTTP Request
└─> Extract traceparent header
    └─> Create span for gateway operation
        └─> Add to message metadata
            └─> Service receives with trace context
                └─> Creates child span
                    └─> Full distributed trace
```

**Jaeger Integration:**
- Automatic trace collection
- View at: `http://localhost:16686`

### 7. Correlation Tracking

Every request gets a unique correlation ID:

```typescript
// Auto-generated or from header
correlationId = request.headers['x-correlation-id'] || generateId();

// Added to all messages
messageEnvelope.metadata.correlationId = correlationId;

// Included in responses
response.headers['x-correlation-id'] = correlationId;

// Used for log correlation
logger.info('Request processed', { correlationId });
```

## Integration Patterns

### REST Client Integration

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3003/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// Create user
const response = await client.post('/users', {
  email: 'user@example.com',
  password: 'password123',
  profile: { firstName: 'John' }
});

// Get user
const user = await client.get('/users/user-123');
```

### GraphQL Client Integration

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:3003/graphql',
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  }),
  cache: new InMemoryCache()
});

// Query
const { data } = await client.query({
  query: gql`
    query GetUser($userId: ID!) {
      getUser(input: { userId: $userId }) {
        id
        email
      }
    }
  `,
  variables: { userId: 'user-123' }
});
```

### WebSocket Client Integration

```typescript
import { createClient } from 'graphql-ws';

const wsClient = createClient({
  url: 'ws://localhost:3003/graphql',
  connectionParams: {
    authToken: `Bearer ${accessToken}`
  }
});

// Subscribe to events
wsClient.subscribe(
  {
    query: `
      subscription {
        userCreated {
          userId
          email
        }
      }
    `
  },
  {
    next: (data) => console.log('User created:', data),
    error: (err) => console.error(err)
  }
);
```

## Monitoring and Observability

### Metrics

```prometheus
# Request metrics
api_gateway_requests_total{protocol="rest", method="GET", status="200"}
api_gateway_request_duration_seconds{protocol="graphql", operation="query"}

# Circuit breaker metrics
api_gateway_circuit_breaker_state{service="auth-service", state="closed"}
api_gateway_circuit_breaker_failures_total{service="auth-service"}

# Cache metrics
api_gateway_schema_cache_hits_total
api_gateway_schema_cache_misses_total
api_gateway_schema_cache_size
```

### Logs

```json
{
  "level": "info",
  "message": "REST request processed",
  "service": "api-gateway",
  "correlationId": "abc-123-def-456",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "userId": "user-123",
  "method": "POST",
  "path": "/api/users",
  "status": 201,
  "duration": 45,
  "timestamp": "2025-11-15T14:30:00.123Z"
}
```

### Health Checks

```bash
# Service health
curl http://localhost:3003/health

# Dependency health
curl http://localhost:3003/health/dependencies

# Readiness probe (Kubernetes)
curl http://localhost:3003/ready

# Liveness probe (Kubernetes)
curl http://localhost:3003/live
```

## Troubleshooting

### Common Issues

#### Gateway Not Starting

**Symptoms:**
- Container exits immediately
- Connection errors

**Checks:**
```bash
# Check logs
docker logs api-gateway

# Verify dependencies
docker ps | grep rabbitmq
docker ps | grep service-discovery

# Check environment variables
docker exec api-gateway env | grep MESSAGE_BUS_URL
```

#### Schema Not Updating

**Symptoms:**
- New operations not visible in GraphQL
- Old schema cached

**Fix:**
```bash
# Clear schema cache
curl -X POST http://localhost:3003/admin/clear-cache

# Restart service
docker restart api-gateway
```

#### High Latency

**Symptoms:**
- Slow responses
- Timeouts

**Checks:**
```bash
# Check circuit breaker status
curl http://localhost:3003/admin/circuit-breakers

# Check message bus health
docker exec rabbitmq rabbitmqctl status

# View distributed traces
# Open http://localhost:16686
```

#### WebSocket Disconnects

**Symptoms:**
- Frequent reconnections
- Connection timeouts

**Fix:**
```bash
# Check WebSocket configuration
# Increase timeout
export WS_TIMEOUT=60000

# Check network
docker network inspect flow-platform-network
```

## Security Considerations

### JWT Validation

- Signature verified using `JWT_SECRET`
- Expiration time enforced
- Required claims validated
- Invalid tokens rejected immediately

### CORS

- Configurable allowed origins
- Preflight request handling
- Credential support optional

### Rate Limiting

- Per-user rate limits
- Per-IP rate limits
- Configurable thresholds

### Input Validation

- JSON schema validation
- Type checking
- Size limits enforced

## Next Steps

- **[Auth Service](./auth-service.md)** - User authentication and authorization
- **[Service Discovery](./service-discovery.md)** - Contract registry and health monitoring
- **[GraphQL API](../graphql-api/overview.md)** - GraphQL reference
- **[REST API](../rest-api/overview.md)** - REST API reference
