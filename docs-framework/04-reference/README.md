# Reference

This section contains complete technical reference documentation for APIs, decorators, packages, and protocols.

## Overview

Reference documentation is information-oriented and comprehensive. It provides detailed technical specifications, API signatures, parameter descriptions, and return values. Reference docs are designed for lookup, not learning.

## Content Organization

### [REST API](./rest-api/)
Complete HTTP API reference for the API Gateway:
- **Endpoints**: All available HTTP endpoints
- **Request Formats**: Headers, parameters, body schemas
- **Response Formats**: Status codes, response bodies, error formats
- **Authentication**: API key and token authentication
- **Rate Limiting**: Request limits and headers
- **Versioning**: API version negotiation

### [GraphQL API](./graphql-api/)
Complete GraphQL API reference:
- **Schema**: Full GraphQL schema definition
- **Queries**: All available queries with arguments
- **Mutations**: All available mutations with arguments
- **Subscriptions**: Real-time subscription support
- **Types**: Object types, input types, enums
- **Directives**: Custom GraphQL directives
- **Error Handling**: GraphQL error formats

### [Decorators](./decorators/)
All platform decorators with complete parameter documentation:
- **Handler Decorators**: `@CommandHandler`, `@QueryHandler`, `@EventHandler`
- **Authorization Decorators**: `@RequiresPermission`, `@RequiresPolicy`
- **Validation Decorators**: `@Validate`, `@ValidateNested`
- **Event Sourcing Decorators**: `@Aggregate`, `@ApplyEvent`, `@MapFromEvent`
- **Projection Decorators**: `@Projection`, `@On`
- **Contract Decorators**: `@Contract`, `@Field`

### [Platform Packages](./platform-packages/)
API documentation for all `@banyanai/platform-*` packages:
- **@banyanai/platform-core**: Foundational types and utilities
- **@banyanai/platform-base-service**: Service startup and lifecycle
- **@banyanai/platform-cqrs**: Command and query handling
- **@banyanai/platform-event-sourcing**: Event store and aggregates
- **@banyanai/platform-contract-system**: Contract definition and validation
- **@banyanai/platform-client-system**: Auto-generated service clients
- **@banyanai/platform-message-bus-client**: RabbitMQ abstraction
- **@banyanai/platform-telemetry**: OpenTelemetry integration
- **@banyanai/platform-saga-framework**: Distributed transactions

### [Message Protocols](./message-protocols/)
Complete message format specifications:
- **Command Messages**: Structure, routing, correlation
- **Query Messages**: Structure, caching, correlation
- **Event Messages**: Structure, topics, versioning
- **Reply Messages**: Response formats, errors
- **Message Metadata**: Tracing, correlation, causation
- **Contract Messages**: Service capability broadcasting

## How to Use Reference Documentation

Reference docs are designed for:
- **Quick lookup**: Finding specific API signatures or parameters
- **Implementation**: Writing code with correct method calls
- **Validation**: Verifying message formats and protocols
- **Integration**: Understanding interface contracts
- **Troubleshooting**: Checking if you're using APIs correctly

## API Documentation Format

Each API reference includes:
- **Signature**: Complete method/function signature
- **Description**: What it does
- **Parameters**: Each parameter with type, description, and whether it's required
- **Return Value**: Return type and description
- **Throws**: Exceptions that may be thrown
- **Examples**: Code examples showing usage
- **Related**: Links to related APIs and documentation

## Version Information

All reference documentation is versioned and corresponds to specific platform releases. Check the platform version compatibility at the top of each reference page.

## Documentation Contents

*Reference documentation files will be added here*
