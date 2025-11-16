# Banyan Platform Documentation

> Build enterprise microservices with zero infrastructure code. Write only business logic.

Welcome to the Banyan Platform - a TypeScript microservices platform that eliminates infrastructure complexity so you can focus entirely on solving business problems.

## What is Banyan?

Banyan abstracts away all the complexity of modern microservices architecture:

- **Zero Infrastructure Code**: No HTTP servers, message queues, databases, or tracing code
- **One-Line Service Startup**: Services start with just `BaseService.start()`
- **Message Bus Abstraction**: Services communicate exclusively through RabbitMQ (automatically)
- **Type-Safe Contracts**: Compile-time validation prevents runtime communication errors
- **Enterprise Features Built-In**: Distributed tracing, event sourcing, two-layer authorization, metrics

## Quick Start in 3 Steps

### 1. Install the Platform (5 minutes)
```bash
# Clone and start the platform
git clone <repository-url>
cd banyan-core
docker compose up
```

### 2. Create Your First Service (5 minutes)
```bash
# Generate a new microservice
npx @banyanai/platform-cli create my-service

# Your service is ready - handlers in /commands/, /queries/, /events/
```

### 3. Call Your API (2 minutes)
```bash
# REST API
curl http://localhost:3000/api/my-service/my-command

# GraphQL
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ myQuery { field } }"}'
```

## Visual Learning Paths

```
BEGINNER (0-1 week)           INTERMEDIATE (1-4 weeks)      ADVANCED (1+ months)
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│                     │       │                     │       │                     │
│ Getting Started     │──────>│ Tutorials           │──────>│ Advanced Guides     │
│ (35 min total)      │       │ (2-4 hours)         │       │ (4-6 hours)         │
│                     │       │                     │       │                     │
│ ✓ Installation      │       │ ✓ Event Sourcing    │       │ ✓ Saga Patterns     │
│ ✓ First Service     │       │ ✓ Multi-Service     │       │ ✓ Custom Extensions │
│ ✓ Call APIs         │       │ ✓ Authorization     │       │ ✓ Performance Opt   │
│ ✓ Platform Overview │       │ ✓ Read Models       │       │ ✓ Custom Infra      │
└─────────────────────┘       └─────────────────────┘       └─────────────────────┘
         │                             │                             │
         │                             │                             │
         └─────────────────────────────┴─────────────────────────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │                     │
                            │ Concepts & Patterns │
                            │ (As needed)         │
                            │                     │
                            │ ✓ CQRS             │
                            │ ✓ Event Sourcing   │
                            │ ✓ Message Bus      │
                            │ ✓ Authorization    │
                            └─────────────────────┘
```

## Navigate by Your Goal

### I want to build my first service
**Time**: 35 minutes | **Difficulty**: Beginner

Start here: [Getting Started](./00-getting-started/README.md)

1. [Install the platform](./00-getting-started/01-installation.md) (5 min)
2. [Create your first service](./00-getting-started/02-your-first-service.md) (15 min)
3. [Call APIs](./00-getting-started/03-calling-apis.md) (10 min)
4. [Explore next steps](./00-getting-started/04-next-steps.md) (5 min)

### I want to understand the architecture
**Time**: 1-2 hours | **Difficulty**: Intermediate

Start here: [Concepts](./02-concepts/README.md)

**Recommended reading order:**
1. [Message Bus Architecture](./02-concepts/architecture/) - Core communication foundation
2. [Zero Infrastructure Design](./02-concepts/architecture/) - Platform philosophy
3. [CQRS Pattern](./02-concepts/patterns/) - Command/Query separation
4. [Event Sourcing](./02-concepts/patterns/) - Event-driven state
5. [Two-Layer Authorization](./02-concepts/patterns/) - Security model

### I'm getting an error
**Time**: 5-30 minutes | **Difficulty**: Any level

Start here: [Troubleshooting](./05-troubleshooting/README.md)

**Find solutions by:**
- [Symptom](./05-troubleshooting/by-symptom/) - "Service won't start", "Messages not received"
- [Component](./05-troubleshooting/by-component/) - API Gateway, Auth Service, Message Bus
- [Error Code](./05-troubleshooting/common-errors/) - Specific error messages

**Quick diagnostic tools:**
- Logs: `docker compose logs -f service-name`
- Traces: http://localhost:16686 (Jaeger)
- Message Bus: http://localhost:15672 (RabbitMQ)

### I need API reference documentation
**Time**: 2-5 minutes | **Difficulty**: Any level

Start here: [Reference](./04-reference/README.md)

**Quick lookup:**
- [REST API](./04-reference/rest-api/) - HTTP endpoints and formats
- [GraphQL API](./04-reference/graphql-api/) - Schema and queries
- [Decorators](./04-reference/decorators/) - All `@` decorators
- [Platform Packages](./04-reference/platform-packages/) - `@banyanai/platform-*` APIs
- [Message Protocols](./04-reference/message-protocols/) - Message formats

### I want to accomplish a specific task
**Time**: 15-60 minutes | **Difficulty**: Varies

Start here: [Guides](./03-guides/README.md)

**Common tasks:**
- [Create a new handler](./03-guides/service-development/) - Commands, queries, events
- [Add authentication](./03-guides/security/) - Users, roles, permissions
- [Implement event sourcing](./03-guides/data-management/) - Event store, aggregates
- [Call another service](./03-guides/api-integration/) - Service clients
- [Write tests](./03-guides/service-development/) - Unit, integration, message bus

### I want hands-on practice
**Time**: 90 minutes - 6 hours | **Difficulty**: Beginner to Advanced

Start here: [Tutorials](./01-tutorials/README.md)

**Learning path:**
- **Beginner** (90 min - 3 hrs): Todo service, user management, blog platform
- **Intermediate** (2-4 hrs): Event-sourced orders, multi-service workflows, notifications
- **Advanced** (4-6 hrs): Saga orchestration, custom read models, performance tuning

## Documentation Structure

This documentation follows the [Divio Documentation System](https://documentation.divio.com/):

### [00 - Getting Started](./00-getting-started/README.md)
> Fast path to your first working service

Quick start guides to get you up and running with the Banyan platform in 35 minutes. Perfect for your first experience with the platform.

**Time**: 35 minutes | **Difficulty**: 🟢 Beginner

### [01 - Tutorials](./01-tutorials/README.md)
> Hands-on learning through building real features

Step-by-step, hands-on tutorials organized by skill level:
- **Beginner**: Build your first service, basic CQRS patterns
- **Intermediate**: Event sourcing, service integration, authorization
- **Advanced**: Sagas, custom infrastructure, platform extensions

**Time**: 90 minutes - 6 hours | **Difficulty**: 🟢 🟡 🔴 All levels

### [02 - Concepts](./02-concepts/README.md)
> Deep understanding of architecture and patterns

Deep dives into the platform's architecture, design patterns, and infrastructure:
- **Architecture**: Message bus, service discovery, API gateway
- **Patterns**: CQRS, event sourcing, domain modeling
- **Infrastructure**: Telemetry, deployment, scalability

**Time**: 1-2 hours | **Difficulty**: 🟡 Intermediate

### [03 - Guides](./03-guides/README.md)
> Task-oriented how-to instructions

How-to guides for common development tasks:
- **Service Development**: Handlers, contracts, testing
- **API Integration**: REST, GraphQL, webhooks
- **Security**: Authentication, authorization, policies
- **Data Management**: Event sourcing, projections, caching

**Time**: 15-60 minutes per guide | **Difficulty**: 🟡 Intermediate

### [04 - Reference](./04-reference/README.md)
> Complete technical specifications and APIs

Complete API and technical reference documentation:
- **REST API**: HTTP endpoints, request/response formats
- **GraphQL API**: Schema, queries, mutations
- **Decorators**: All platform decorators with parameters
- **Platform Packages**: API documentation for `@banyanai/platform-*`
- **Message Protocols**: Command, query, and event message formats

**Time**: 2-5 minutes per lookup | **Difficulty**: 🟢 Any level

### [05 - Troubleshooting](./05-troubleshooting/README.md)
> Solutions to common problems and errors

Diagnostic guides and solutions to common problems:
- **By Symptom**: "Service won't start", "Messages not being received"
- **By Component**: API Gateway issues, Auth problems, Message bus errors
- **Common Errors**: Error codes, stack traces, and solutions

**Time**: 5-30 minutes | **Difficulty**: 🟢 Any level

### [06 - Examples](./06-examples/README.md)
> Real-world code examples and sample applications

Complete, working code examples and sample applications demonstrating real-world use cases.

**Time**: 30 minutes - 2 hours per example | **Difficulty**: 🟢 🟡 🔴 All levels

## Quick Links - Most Used Docs

- [Installation Guide](./00-getting-started/01-installation.md) - Get the platform running
- [Your First Service](./00-getting-started/02-your-first-service.md) - Create a microservice
- [Writing Handlers](./03-guides/service-development/) - Commands, queries, events
- [REST API Reference](./04-reference/rest-api/) - HTTP endpoints
- [GraphQL API Reference](./04-reference/graphql-api/) - GraphQL schema
- [Decorator Reference](./04-reference/decorators/) - All `@` decorators
- [Service Won't Start](./05-troubleshooting/by-symptom/) - Common startup issues
- [Message Bus Errors](./05-troubleshooting/by-component/) - RabbitMQ troubleshooting

## Recent Updates

### Version 1.0.116 (Latest)
- GraphQL API support with auto-generated schema
- WebSocket support for real-time subscriptions
- Enhanced contract system with validation
- Improved distributed tracing

See [CHANGELOG](../CHANGELOG.md) for full release history.

## Documentation Conventions

> 💡 **Best Practice**: Recommended approaches and patterns

> ⚠️ **Warning**: Important caveats and gotchas

> 🎯 **Goal**: What you'll accomplish in this section

> 🔧 **Configuration**: Environment and setup requirements

> ✨ **New Feature**: Recently added capabilities

**Difficulty Levels:**
- 🟢 **Beginner**: New to the platform (0-1 week experience)
- 🟡 **Intermediate**: Comfortable with basics (1-4 weeks experience)
- 🔴 **Advanced**: Experienced with platform (1+ months experience)

## Get Help and Support

- **Documentation Issues**: See [Navigation Guide](./NAVIGATION_GUIDE.md) for how to use these docs
- **Platform Issues**: Check [Troubleshooting](./05-troubleshooting/README.md)
- **Code Examples**: Browse [Examples](./06-examples/README.md)
- **Quick Reference**: See [Quick Reference Card](./QUICK_REFERENCE.md)

## Contributing to Documentation

Documentation improvements are always welcome! Please see our contribution guidelines in the main repository.

## Platform Version

This documentation is for Banyan Platform version 1.0.0 and later.

---

**Ready to start?** → [Install the Platform](./00-getting-started/01-installation.md) (5 minutes)
