# API Integration Overview

## Introduction

The banyan-core platform automatically generates external-facing APIs from your service contracts with zero configuration. Services expose their functionality through **REST**, **GraphQL**, and **WebSocket** endpoints without writing any HTTP code.

## Core Philosophy

**Services never handle HTTP**. They define contracts, and the API Gateway automatically:

1. Generates RESTful endpoints
2. Creates GraphQL schemas
3. Establishes WebSocket subscriptions
4. Handles authentication and rate limiting
5. Manages protocol translation to RabbitMQ

## Available API Protocols

### REST API
- **Auto-generated RESTful endpoints** from command and query contracts
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs following REST conventions
- JSON request/response bodies
- Available at `http://localhost:3003/api/*`

### GraphQL API
- **Dynamic schema generation** from contracts
- Permission-filtered queries and mutations
- Type-safe operations with auto-generated types
- Introspection and GraphiQL playground
- Available at `http://localhost:3003/graphql`

### WebSocket API
- **Real-time event subscriptions** for domain events
- Bi-directional communication
- Automatic reconnection and error handling
- Correlation ID propagation for tracing
- Available at `ws://localhost:3003/ws`

## How It Works

```
External Client (REST/GraphQL/WebSocket)
    ↓
API Gateway (Port 3003)
    ↓ Protocol Translation
RabbitMQ Message Bus
    ↓
Service Handler (Pure Business Logic)
```

### Request Flow

1. **Client makes HTTP/GraphQL/WS request** to API Gateway
2. **API Gateway validates** authentication and permissions
3. **Gateway translates** protocol to RabbitMQ message
4. **Message routed** to target service via message bus
5. **Service handler processes** business logic
6. **Response flows back** through same path

### Key Benefits

- **Zero HTTP code** in services - only domain logic
- **Automatic API generation** from contracts
- **Type safety** end-to-end with TypeScript
- **Protocol independence** - services don't know about REST/GraphQL
- **Automatic documentation** via OpenAPI and GraphQL introspection
- **Built-in observability** with distributed tracing

## API Gateway Port

All external APIs are served on **port 3003**:

```bash
# REST API
http://localhost:3003/api/users

# GraphQL API
http://localhost:3003/graphql

# WebSocket API
ws://localhost:3003/ws
```

## Authentication

All API requests must include authentication:

```bash
# JWT Bearer token
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3003/api/users
```

See [API Security](./api-security.md) for authentication details.

## Rate Limiting

API Gateway enforces rate limits per user:

- **100 requests per minute** for authenticated users
- **10 requests per minute** for anonymous users
- **429 Too Many Requests** when limit exceeded

See [API Security](./api-security.md) for rate limit configuration.

## API Documentation

### OpenAPI/Swagger
Auto-generated REST API documentation:
```
http://localhost:3003/api-docs
```

### GraphQL Playground
Interactive GraphQL explorer:
```
http://localhost:3003/graphql
```

## Next Steps

- [REST API Guide](./rest-api.md) - Building RESTful endpoints
- [GraphQL API Guide](./graphql-api.md) - Creating GraphQL schemas
- [API Contracts](./api-contracts.md) - Defining public contracts
- [API Security](./api-security.md) - Authentication and authorization
