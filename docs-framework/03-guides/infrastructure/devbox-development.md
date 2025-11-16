---
title: "DevBox Development Environment"
description: "Complete guide to using the DevBox container for isolated, consistent development with hot-reload and full platform integration"
category: "infrastructure"
tags: ["devbox", "docker", "development", "testing", "ci-cd"]
difficulty: "intermediate"
estimated_time: "15 minutes"
prerequisites:
  - "Docker and Docker Compose installed"
  - "Banyan platform repository cloned"
last_updated: "2025-01-16"
status: "published"
---

# DevBox Development Environment

> **TL;DR:** The DevBox is a containerized development environment with all tools pre-installed, all platform services accessible, and your workspace mounted for hot-reload development.

## Overview

The DevBox container provides a complete, isolated development environment for the Banyan Platform. It eliminates "works on my machine" problems by giving every developer the exact same environment with all dependencies pre-configured.

### What You'll Learn

- What the DevBox is and why you should use it
- How to build and test inside the DevBox
- How to run platform services with hot-reload
- How to debug issues using DevBox tools
- DevBox vs local development trade-offs

## What is the DevBox?

The DevBox is a **Docker container** that includes:

- ✅ **Node.js 20** - JavaScript/TypeScript runtime
- ✅ **pnpm** - Package manager with workspace support
- ✅ **All build tools** - TypeScript, Biome, Jest pre-installed
- ✅ **Development utilities** - git, gh, fzf, tmux, nano, vim
- ✅ **Native build tools** - gcc, g++, make, python3 for native modules
- ✅ **Network access** to all platform services (RabbitMQ, PostgreSQL, Redis, Jaeger)
- ✅ **Workspace mounted** at `/workspace` with hot-reload
- ✅ **Persistent command history** across container restarts
- ✅ **Claude Code CLI** for AI-assisted development

## Why Use the DevBox?

### Benefits

**1. Zero Local Setup**
- No need to install Node.js, pnpm, or any dependencies locally
- Works the same on macOS, Linux, and Windows

**2. CI/CD Parity**
- DevBox environment matches GitHub Actions exactly
- "It works in CI" = "It works on my machine"

**3. Isolated Environment**
- Doesn't pollute your local system with dependencies
- Multiple platform versions can coexist

**4. All Services Available**
- RabbitMQ, PostgreSQL, Redis, Jaeger accessible at `localhost`
- No port conflicts with your local services

**5. Hot Reload**
- Changes to your local files immediately reflect in container
- No need to rebuild for code changes

### When to Use DevBox

**Use DevBox for:**
- ✅ Building platform packages
- ✅ Running tests (unit, integration, comprehensive)
- ✅ Developing platform services (auth-service, api-gateway, etc.)
- ✅ Debugging with full observability stack
- ✅ Reproducing CI failures locally

**Use Local Development for:**
- ❌ Quick edits to markdown files
- ❌ Reviewing code (your IDE works better locally)
- ❌ Git operations (easier with local tools)

## Getting Started

### Start the DevBox

```bash
# From repository root
docker compose up -d

# Wait for services to be ready (~30 seconds)
docker compose ps
```

Expected output:
```
NAME                    STATUS
flow-platform-devbox   Up 30 seconds
rabbitmq               Up 30 seconds (healthy)
postgres               Up 30 seconds (healthy)
redis                  Up 30 seconds (healthy)
jaeger                 Up 30 seconds
grafana                Up 30 seconds
```

### Enter the DevBox

```bash
# Open a shell in the DevBox
docker compose exec devbox /bin/bash

# You're now inside the container
node@flow-platform-devbox:/workspace$
```

### Verify Environment

```bash
# Check versions
node --version    # v20.x
pnpm --version    # 8.x
tsc --version     # 5.x

# Check services are accessible
ping -c 1 rabbitmq
ping -c 1 postgres
ping -c 1 redis
```

## Common Development Tasks

### Building the Platform

**Build all packages:**

```bash
# Inside DevBox
pnpm install
pnpm run build
```

**Build specific package:**

```bash
# Inside DevBox
cd platform/packages/core
pnpm run build

# Or from root with filter
pnpm --filter @banyanai/platform-core run build
```

**Watch mode (hot-reload):**

```bash
# Inside DevBox
cd platform/packages/core
pnpm run dev

# Or parallel watch for all packages
pnpm -r --parallel run dev
```

### Running Tests

**All tests:**

```bash
# Inside DevBox
pnpm run test
```

**Specific package tests:**

```bash
# Inside DevBox
cd platform/packages/cqrs
pnpm run test

# Or from root
pnpm --filter @banyanai/platform-cqrs run test
```

**Integration tests (require services):**

```bash
# Inside DevBox - services are already running!
pnpm run test:integration

# Specific integration test
cd platform/packages/message-bus-client
pnpm run test -- --testPathPattern=integration
```

**Comprehensive tests:**

```bash
# Inside DevBox
cd platform/packages/telemetry
pnpm run test:comprehensive
```

**Watch mode for tests:**

```bash
# Inside DevBox
pnpm run test:watch

# Or specific file
pnpm run test:watch CreateUserHandler.test.ts
```

### Running Platform Services

The platform services (auth-service, api-gateway, service-discovery) can run inside the DevBox with hot-reload.

**Start all platform services:**

```bash
# Inside DevBox
pnpm -r --parallel run dev
```

**Start specific service:**

```bash
# Inside DevBox
cd platform/services/api-gateway
pnpm run dev

# API Gateway now accessible at http://localhost:3003
```

**Check service logs:**

```bash
# From host machine
docker compose logs -f devbox

# Or inside DevBox
# Services log to stdout
```

### Quality Checks

**Run full quality check:**

```bash
# Inside DevBox
./platform/scripts/quality-check-all.sh
```

This runs:
- TypeScript compilation
- Biome linting
- All tests
- Coverage checks (90%+ required)

**Quick quality check:**

```bash
# Inside DevBox
./platform/scripts/quick-quality-check.sh
```

## Advanced Usage

### Multiple Terminal Sessions

Open multiple shells in the same DevBox:

```bash
# Terminal 1: Run tests in watch mode
docker compose exec devbox /bin/bash
pnpm run test:watch

# Terminal 2: Run service in dev mode
docker compose exec devbox /bin/bash
cd platform/services/api-gateway && pnpm run dev

# Terminal 3: Interactive debugging
docker compose exec devbox /bin/bash
```

### Using tmux Inside DevBox

The DevBox includes `tmux` for managing multiple panes in one shell:

```bash
# Inside DevBox
tmux

# Split horizontally: Ctrl+b then "
# Split vertically: Ctrl+b then %
# Switch panes: Ctrl+b then arrow keys
# New window: Ctrl+b then c
# Detach: Ctrl+b then d
# Reattach: tmux attach
```

### Debugging with DevBox Tools

**View RabbitMQ queues:**

```bash
# Inside DevBox
curl -u admin:admin123 http://rabbitmq:15672/api/queues
```

**Check PostgreSQL:**

```bash
# Inside DevBox
PGPASSWORD=actor_pass123 psql -h postgres -U actor_user -d eventstore -c "\dt"
```

**Check Redis cache:**

```bash
# Inside DevBox
redis-cli -h redis -a redis123 keys '*'
```

**View Jaeger traces:**

```bash
# Open from host machine browser
open http://localhost:16686

# Or check if Jaeger is receiving traces
curl http://jaeger:16686/api/services
```

### Installing Additional Tools

```bash
# Inside DevBox (as node user)
npm install -g <package-name>

# Or install system packages (requires root)
docker compose exec -u root devbox apt-get update
docker compose exec -u root devbox apt-get install -y <package-name>
```

### Accessing DevBox Files from Host

All files at `/workspace` inside DevBox are your repository files:

```bash
# Edit on host machine
code platform/packages/core/src/index.ts

# Changes immediately available inside DevBox
# DevBox watches for changes and rebuilds automatically
```

## DevBox Configuration

### Environment Variables

The DevBox has access to all platform environment variables:

```bash
# Inside DevBox
echo $RABBITMQ_URL
# amqp://admin:admin123@rabbitmq:5672

echo $DATABASE_URL
# postgresql://actor_user:actor_pass123@postgres:5432/eventstore

echo $REDIS_URL
# redis://:redis123@redis:6379
```

### Volumes

The DevBox mounts several volumes:

- **Workspace**: `.` → `/workspace` (your code, hot-reload enabled)
- **Command history**: Persistent bash history across restarts
- **Claude config**: Persistent Claude Code configuration

### Ports

Services are accessible from **both** host and DevBox:

| Service | From Host | From DevBox |
|---------|-----------|-------------|
| RabbitMQ AMQP | `localhost:55671` | `rabbitmq:5672` |
| RabbitMQ UI | `localhost:55672` | `rabbitmq:15672` |
| PostgreSQL | `localhost:55432` | `postgres:5432` |
| Redis | `localhost:56379` | `redis:6379` |
| Jaeger UI | `localhost:16686` | `jaeger:16686` |
| Grafana | `localhost:5005` | `grafana:3000` |
| API Gateway | `localhost:3003` | `localhost:3003` |
| Auth Service | `localhost:3001` | `localhost:3001` |

## Troubleshooting

### DevBox Won't Start

**Problem:** DevBox container fails to start

**Solution 1:** Check if ports are in use

```bash
# Check port conflicts
lsof -i :3001
lsof -i :3003
lsof -i :55671

# Stop conflicting processes or change ports in docker-compose.yml
```

**Solution 2:** Rebuild DevBox image

```bash
docker compose down
docker compose build devbox
docker compose up -d
```

**Solution 3:** Clean volumes and restart

```bash
docker compose down -v
docker compose up -d
```

### Permission Issues

**Problem:** Cannot write files inside DevBox

**Solution:** Fix ownership

```bash
# Inside DevBox
sudo chown -R node:node /workspace

# Or from host
docker compose exec -u root devbox chown -R node:node /workspace
```

### Tests Fail Inside DevBox but Pass Locally

**Problem:** Different environment behavior

**Solution 1:** Check service connectivity

```bash
# Inside DevBox
ping rabbitmq
ping postgres
ping redis

# All should respond
```

**Solution 2:** Check environment variables

```bash
# Inside DevBox
env | grep -E "RABBITMQ|DATABASE|REDIS"

# Should show correct URLs with service names, not localhost
```

**Solution 3:** Clear node_modules and reinstall

```bash
# Inside DevBox
rm -rf node_modules platform/*/node_modules
pnpm install
pnpm run build
pnpm run test
```

### Slow Build Performance

**Problem:** Builds are slower in DevBox than locally

**Solution 1:** Use watch mode instead of rebuilding

```bash
# Inside DevBox
pnpm -r --parallel run dev
```

**Solution 2:** Increase Docker resources

```bash
# Docker Desktop → Settings → Resources
# CPU: 4+ cores
# Memory: 8+ GB
# Swap: 2+ GB
```

**Solution 3:** Use build filters

```bash
# Only build what you're working on
pnpm --filter @banyanai/platform-core run build
```

### Command History Not Persisting

**Problem:** Bash history lost on DevBox restart

**Solution:** Check volume mount

```bash
# Verify volume exists
docker volume ls | grep command-history

# If missing, recreate
docker compose down
docker compose up -d
```

### Services Not Accessible

**Problem:** Cannot connect to RabbitMQ/PostgreSQL from DevBox

**Solution 1:** Wait for health checks

```bash
# Check service health
docker compose ps

# All should show "healthy" or "Up"
# If "starting", wait 30 seconds and check again
```

**Solution 2:** Check network

```bash
# Inside DevBox
docker network ls | grep flow-platform

# All services should be on same network
```

**Solution 3:** Restart services

```bash
docker compose restart rabbitmq postgres redis
```

## Best Practices

### 1. Use DevBox for Clean Builds

Before committing, verify your changes work in a clean environment:

```bash
# Inside DevBox
rm -rf node_modules platform/*/node_modules
pnpm install
pnpm run build
pnpm run test
./platform/scripts/quality-check-all.sh
```

### 2. Keep DevBox Running

Don't constantly stop/start DevBox:

```bash
# Start once
docker compose up -d

# Enter/exit as needed
docker compose exec devbox /bin/bash
exit

# Stop only when done for the day
docker compose down
```

### 3. Use Watch Mode for Development

Enable hot-reload for faster iteration:

```bash
# Terminal 1: Watch platform packages
docker compose exec devbox /bin/bash
pnpm -r --parallel run dev

# Terminal 2: Watch tests
docker compose exec devbox /bin/bash
pnpm run test:watch

# Edit files on host, see changes immediately
```

### 4. Match CI Environment

CI runs in DevBox, so test there before pushing:

```bash
# Inside DevBox
pnpm run build
pnpm run test
pnpm run lint

# If these pass, CI will pass too
```

### 5. Use Persistent History

Your bash history persists across restarts:

```bash
# Inside DevBox
history | grep pnpm

# Use Ctrl+R to search history
# Use !! to repeat last command
# Use !pnpm to repeat last pnpm command
```

## Comparison: DevBox vs Local vs CI

| Feature | DevBox | Local | CI (GitHub Actions) |
|---------|--------|-------|---------------------|
| Setup time | 2 min (first time) | 15 min (install tools) | Automatic |
| Environment | Docker container | Host machine | Docker container |
| Consistency | ✅ Always same | ❌ Varies by machine | ✅ Always same |
| Service access | ✅ All services ready | ⚠️ Manual setup | ✅ All services ready |
| Hot reload | ✅ Yes | ✅ Yes | ❌ No |
| Performance | ⚠️ Slight overhead | ✅ Native speed | ⚠️ Varies |
| Debugging | ✅ Full access | ✅ Full access | ❌ Limited |
| Matches CI | ✅ Exact match | ❌ Different | ✅ Exact match |

**Recommendation:** Use DevBox for builds/tests, local for editing, CI for validation.

## DevBox Architecture

```mermaid
graph TB
    Host[Your Machine]
    DevBox[DevBox Container]
    RabbitMQ[RabbitMQ Container]
    Postgres[PostgreSQL Container]
    Redis[Redis Container]
    Jaeger[Jaeger Container]

    Host -->|Workspace mounted| DevBox
    Host -->|Edit files| Workspace[/workspace]
    Workspace -->|Hot reload| DevBox

    DevBox -->|amqp://rabbitmq:5672| RabbitMQ
    DevBox -->|postgresql://postgres:5432| Postgres
    DevBox -->|redis://redis:6379| Redis
    DevBox -->|http://jaeger:4318| Jaeger

    Host -->|Browser| Jaeger
    Host -->|Browser| RabbitMQ

    style DevBox fill:#5f67ee,color:#fff
    style Workspace fill:#7d85ff,color:#fff
```

## Further Reading

- [Installation Guide](../../00-getting-started/01-installation.md) - Set up the platform
- [Local Development](./local-development.md) - Development workflows
- [Testing Services](../service-development/testing-services.md) - Testing strategies
- [Deployment](./deployment.md) - Production deployment
- [Observability](./observability.md) - Monitoring and debugging

## Quick Reference

**Start DevBox:**
```bash
docker compose up -d
docker compose exec devbox /bin/bash
```

**Build everything:**
```bash
pnpm install && pnpm run build
```

**Run all tests:**
```bash
pnpm run test
```

**Quality check:**
```bash
./platform/scripts/quality-check-all.sh
```

**Stop DevBox:**
```bash
exit  # Exit shell
docker compose down  # Stop all services
```

---

**Pro Tip:** Add this alias to your `~/.bashrc` or `~/.zshrc` for quick DevBox access:
```bash
alias devbox='docker compose exec devbox /bin/bash'
```

Then just run `devbox` to enter the container!
