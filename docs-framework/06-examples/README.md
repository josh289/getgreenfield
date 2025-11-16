# Examples

This section contains complete, working code examples demonstrating real-world use cases of the Banyan platform.

## Overview

Examples are practical reference implementations that you can study, run, and adapt for your own projects. Each example is a fully functional application demonstrating specific platform features or common use cases.

## How to Use Examples

### Study the Code
- Read through the complete implementation
- Understand how components interact
- Note best practices and patterns used
- See concepts from documentation in action

### Run the Examples
- Clone or copy the example code
- Follow setup instructions in the example's README
- Run the application locally
- Experiment with modifications

### Adapt for Your Needs
- Use examples as templates for similar features
- Copy patterns and adapt to your domain
- Reference when implementing similar functionality
- Compare your implementation to working examples

## Example Categories

### Basic Examples
Foundational patterns and simple use cases:
- **Hello World Service**: Minimal service with one command and one query
- **CQRS Basics**: Simple command and query separation
- **Event Publishing**: Publishing and handling domain events
- **Service Testing**: Comprehensive test examples

### Intermediate Examples
Real-world features and integrations:
- **User Management Service**: Complete CRUD with authentication
- **Event-Sourced Aggregate**: Shopping cart with event sourcing
- **Multi-Service Application**: Order processing across multiple services
- **Read Model Projections**: Building query-optimized views from events
- **Authorization Patterns**: Permission and policy-based security

### Advanced Examples
Complex scenarios and architectural patterns:
- **Distributed Saga**: Multi-step transaction across services
- **Event-Driven Architecture**: Complex event choreography
- **Custom Platform Extension**: Extending platform capabilities
- **High-Performance Service**: Optimization techniques and patterns
- **Multi-Tenant Application**: Tenant isolation and data partitioning

### Integration Examples
Working with external systems:
- **REST API Integration**: Consuming external HTTP APIs
- **Webhook Receiver**: Processing external webhook notifications
- **Third-Party Authentication**: OAuth and SAML integration
- **Message Queue Integration**: Connecting to external message systems

### Full Applications
Complete, production-ready reference applications:
- **E-Commerce Platform**: Order management, inventory, payments
- **Task Management System**: Projects, tasks, collaboration
- **Content Management System**: Articles, media, publishing workflow
- **Analytics Dashboard**: Data collection, processing, visualization

## Example Structure

Each example includes:

### README.md
- **Overview**: What the example demonstrates
- **Prerequisites**: What you need to run it
- **Setup Instructions**: Step-by-step setup
- **Architecture**: How it's structured
- **Key Features**: What to pay attention to
- **Running the Example**: How to start and test it
- **Learning Objectives**: What you'll learn

### Complete Source Code
- Fully functional implementation
- Well-commented code explaining key decisions
- Following all platform conventions and best practices
- Comprehensive test coverage

### Documentation
- Architecture diagrams
- API documentation
- Testing strategy
- Deployment considerations

## Learning Path

### If you're new to the platform:
1. Start with **Hello World Service**
2. Progress to **CQRS Basics**
3. Explore **Event Publishing**
4. Study **Service Testing**

### If you're building real features:
1. Find examples similar to your use case
2. Study the implementation approach
3. Adapt patterns to your domain
4. Reference when you get stuck

### If you're learning advanced patterns:
1. Review intermediate examples first
2. Study full application architectures
3. Analyze advanced pattern implementations
4. Experiment with variations

## Code Quality

All examples:
- Pass all tests with 90%+ coverage
- Follow platform coding standards
- Use TypeScript strict mode
- Include comprehensive error handling
- Demonstrate best practices

## Running Examples Locally

### General Setup
```bash
# Navigate to example directory
cd docs-new/06-examples/example-name

# Install dependencies
pnpm install

# Start dependencies (if needed)
docker compose up -d

# Run the example
pnpm start
```

### Testing Examples
```bash
# Run example tests
pnpm test

# Run with coverage
pnpm test -- --coverage
```

## Contributing Examples

Examples demonstrating real-world use cases are always welcome! When contributing:
- Ensure code is production-quality
- Include comprehensive documentation
- Add tests with 90%+ coverage
- Follow all platform conventions

## Available Examples

### 1. [Basic CRUD Service - Todo List](./basic-crud-service/)
**Difficulty:** Beginner | **Time:** 30-60 minutes

A simple todo list service demonstrating fundamental platform patterns without event sourcing. Perfect for understanding:
- Command and query handlers
- Read models for data persistence
- Two-layer authorization
- Zero-infrastructure startup

**Start here if you're new to the platform.**

### 2. [Event-Sourced Service - Order Management](./event-sourced-service/)
**Difficulty:** Intermediate | **Time:** 1-2 hours

An order management service using event sourcing. Learn:
- Event-sourced aggregates
- Domain events as source of truth
- Read model projections with `@MapFromEvent`
- Event store integration
- Temporal queries

**Prerequisites:** Complete the Basic CRUD example first.

### 3. [External Auth Integration - Auth0 / OIDC](./external-auth-integration/)
**Difficulty:** Advanced | **Time:** 2-3 hours

Demonstrates integrating external identity providers (Auth0, Okta, etc.) with proper token validation. Learn:
- JWT validation with JWKS
- Auth0/OIDC integration patterns
- Security best practices
- Integration with platform auth-service

**Critical Pattern:** Business services validate tokens themselves using JWKS, not via auth-service.
