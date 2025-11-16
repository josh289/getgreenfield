# Guides

This section contains task-oriented how-to guides for accomplishing specific goals with the Banyan platform.

## Overview

Guides are practical, goal-oriented documentation. They assume you understand basic concepts and provide step-by-step instructions for completing specific tasks.

## Content Organization

### [Service Development](./service-development/)
Building and maintaining microservices:
- **Creating a New Service**: Using the CLI and service templates
- **Writing Command Handlers**: Processing state-changing requests
- **Writing Query Handlers**: Reading data with caching
- **Writing Event Handlers**: Reacting to domain events
- **Testing Services**: Unit, integration, and message bus testing
- **Service Contracts**: Defining and validating inputs/outputs
- **Handler Discovery**: Organizing handlers for automatic registration

### [API Integration](./api-integration/)
Exposing and consuming APIs:
- **REST API Integration**: HTTP endpoints through the API Gateway
- **GraphQL API Integration**: GraphQL schema and resolvers
- **Webhook Integration**: Receiving external system notifications
- **Service-to-Service Communication**: Using generated clients
- **Contract Broadcasting**: Publishing your service's capabilities
- **API Versioning**: Managing contract changes over time

### [Security](./security/)
Authentication, authorization, and security best practices:
- **Authentication Setup**: User authentication flows
- **Permission-Based Authorization**: API Gateway permission checks
- **Policy-Based Authorization**: Business rule enforcement in handlers
- **Role Management**: Defining and assigning roles
- **Securing Service Communication**: Message bus security
- **API Key Management**: External system authentication

### [Data Management](./data-management/)
Working with data, events, and state:
- **Event Sourcing Implementation**: Building event-sourced aggregates
- **Read Model Projections**: Creating query-optimized views
- **Event Store Management**: Working with the event store
- **Caching Strategies**: Query result caching with Redis
- **Data Migration**: Evolving schemas and events
- **Snapshotting**: Optimizing aggregate rehydration

## Guide Format

Each guide follows a consistent structure:
1. **Goal**: What you'll accomplish
2. **Prerequisites**: What you need before starting
3. **Steps**: Numbered, actionable instructions
4. **Code examples**: Working code snippets
5. **Verification**: How to confirm success
6. **Troubleshooting**: Common issues and solutions
7. **Next steps**: Related tasks and guides

## When to Use Guides vs. Tutorials

**Use Guides when:**
- You know what you want to accomplish
- You need to solve a specific problem
- You want quick, focused instructions
- You're comfortable with basic platform concepts

**Use Tutorials when:**
- You're learning the platform
- You want to understand the "why" behind tasks
- You prefer hands-on, structured learning
- You're exploring platform capabilities

## Documentation Contents

*Guide documentation files will be added here*
