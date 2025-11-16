---
title: "Installation and Setup"
description: "Install the Banyan Platform and verify your development environment in under 5 minutes"
category: "getting-started"
tags: ["installation", "docker", "setup", "environment"]
difficulty: "beginner"
estimated_time: "5 minutes"
prerequisites:
  - "Node.js 20 or higher"
  - "Docker and Docker Compose"
  - "pnpm package manager"
last_updated: "2025-01-15"
status: "published"
---

# Installation and Setup

> **TL;DR:** Install prerequisites, start Docker containers, and verify your development environment is running.

## Overview

This guide walks you through setting up a complete local development environment for the Banyan Platform. In just a few minutes, you'll have all infrastructure services running and ready for development.

### What You'll Learn

- How to install required development tools
- How to start the platform infrastructure services
- How to verify your environment is working correctly
- How to access monitoring and debugging tools

### Prerequisites

Before you begin, ensure you have:
- **Node.js 20.x or higher** - JavaScript runtime
- **Docker 20.x or higher** - Container platform
- **Docker Compose 2.x or higher** - Multi-container orchestration
- **pnpm 8.x or higher** - Package manager

## Quick Start

If you already have all prerequisites installed:

```bash
# Clone repository
git clone https://github.com/yourusername/banyan-core.git
cd banyan-core

# Start infrastructure
docker compose up -d

# Install dependencies
pnpm install

# Build platform
pnpm run build
```

**You're ready!** Skip to [Verify Your Setup](#verify-your-setup) to confirm everything works.

## Step 1: Install Prerequisites

### Check Current Versions

First, verify which tools you already have:

```bash
node --version    # Should show v20.x or higher
pnpm --version    # Should show 8.x or higher
docker --version  # Should show 20.x or higher
docker compose version  # Should show 2.x or higher
```

### Install Node.js 20

If you need to install or upgrade Node.js:

**Using nvm (recommended):**
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20
nvm install 20
nvm use 20
```

**Or download directly:**
- Visit [nodejs.org](https://nodejs.org/)
- Download the LTS version (20.x)
- Follow installation instructions for your OS

### Install pnpm

```bash
npm install -g pnpm
```

### Install Docker

**Linux:**
```bash
# Follow official Docker installation guide
# https://docs.docker.com/engine/install/

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

**macOS:**
- Download [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- Docker Compose is included

**Windows:**
- Download [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- Docker Compose is included

### Verify

Confirm all tools are installed:

```bash
node --version    # v20.11.0 or higher
pnpm --version    # 8.15.0 or higher
docker --version  # 24.0.0 or higher
docker compose version  # 2.20.0 or higher
```

## Step 2: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/banyan-core.git

# Navigate into the directory
cd banyan-core
```

### Verify

```bash
ls -la
```

You should see:
```
docker-compose.yml
package.json
pnpm-workspace.yaml
platform/
docs/
```

## Step 3: Start Infrastructure Services

The Banyan Platform requires several infrastructure services. Docker Compose starts them all with one command:

```bash
docker compose up -d
```

**This starts:**
- **RabbitMQ** - Message bus for service communication
- **PostgreSQL** - Event store database
- **Redis** - Cache and session storage
- **Jaeger** - Distributed tracing UI
- **Prometheus** - Metrics collection
- **Grafana** - Metrics dashboards
- **DevBox** - Development container with all tools

### Verify

Check all containers are running:

```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS
rabbitmq               Up 10 seconds
postgres               Up 10 seconds
redis                  Up 10 seconds
jaeger                 Up 10 seconds
prometheus             Up 10 seconds
grafana                Up 10 seconds
devbox                 Up 10 seconds
```

All services should show "Up" status.

### Access Web Interfaces

Open these URLs in your browser to verify services are accessible:

**RabbitMQ Management Console:**
- URL: [http://localhost:55672](http://localhost:55672)
- Username: `admin`
- Password: `admin123`
- You should see the RabbitMQ dashboard

**Jaeger Tracing UI:**
- URL: [http://localhost:16686](http://localhost:16686)
- You should see the Jaeger search interface

**Grafana Dashboards:**
- URL: [http://localhost:5005](http://localhost:5005)
- Username: `admin`
- Password: `admin`
- You should see the Grafana home page

**Prometheus Metrics:**
- URL: [http://localhost:9090](http://localhost:9090)
- You should see the Prometheus query interface

## Step 4: Configure GitHub Packages Authentication

The Banyan Platform packages are published to **GitHub Packages** (not the public npm registry). You need to configure authentication before installing dependencies.

### Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Banyan Platform Development")
4. Select the `read:packages` scope
5. Click **"Generate token"**
6. **Copy the token** (you won't be able to see it again)

### Configure .npmrc File

Create or update the `.npmrc` file in your **project root** (not your home directory):

```bash
# From repository root
cat > .npmrc << 'EOF'
@banyanai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
EOF
```

### Set Environment Variable

**Option A: Temporary (current session only)**
```bash
export NODE_AUTH_TOKEN=your_github_token_here
```

**Option B: Permanent (recommended)**

Add to your shell configuration file:

```bash
# For bash (~/.bashrc)
echo 'export NODE_AUTH_TOKEN=your_github_token_here' >> ~/.bashrc
source ~/.bashrc

# For zsh (~/.zshrc)
echo 'export NODE_AUTH_TOKEN=your_github_token_here' >> ~/.zshrc
source ~/.zshrc
```

**Important Security Notes:**
- Never commit `.npmrc` files with hardcoded tokens to version control
- The `.npmrc` in this repository uses `${NODE_AUTH_TOKEN}` which safely reads from environment
- Keep your GitHub token secure and rotate it periodically

### Alternative: Hardcoded Token (Not Recommended)

If you're working on a secure local machine, you can hardcode the token:

```bash
# .npmrc (DO NOT COMMIT THIS)
@banyanai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_yourActualTokenHere
```

⚠️ **Warning:** Never commit this file if it contains a hardcoded token!

## Step 5: Install Platform Dependencies

Now that authentication is configured, install dependencies:

```bash
# From repository root
pnpm install
```

This installs:
- All platform package dependencies from GitHub Packages
- All service dependencies
- Development tools (TypeScript, Jest, Biome)

### Verify

```bash
ls -la node_modules/@banyanai/
```

You should see platform packages:
```
platform-base-service/
platform-core/
platform-cqrs/
platform-event-sourcing/
platform-telemetry/
```

### Troubleshooting Installation

**Problem:** `401 Unauthorized` error during installation

**Solution:** Check your authentication setup

```bash
# Verify NODE_AUTH_TOKEN is set
echo $NODE_AUTH_TOKEN

# Should output your token (not empty)
# If empty, set it:
export NODE_AUTH_TOKEN=your_github_token_here

# Retry installation
pnpm install
```

**Problem:** `404 Not Found` for packages

**Solution:** Verify `.npmrc` configuration

```bash
# Check .npmrc file exists
cat .npmrc

# Should contain:
# @banyanai:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}

# If missing, recreate it (see Step 4)
```

**Problem:** Token permissions insufficient

**Solution:** Ensure your GitHub token has `read:packages` scope

1. Go to [GitHub Token Settings](https://github.com/settings/tokens)
2. Click on your token
3. Verify `read:packages` is checked
4. If not, regenerate token with correct scope

## Step 6: Build the Platform

```bash
# Build all packages and services
pnpm run build
```

**Build order matters** but pnpm workspace handles it automatically:
```
core → domain-modeling → contract-system → telemetry →
message-bus-client → cqrs → event-sourcing →
client-system → base-service
```

This takes 1-2 minutes on first build.

### Verify

```bash
ls -la platform/packages/core/dist/
```

You should see compiled JavaScript files:
```
index.js
index.d.ts
interfaces.js
types.js
```

## Verify Your Setup

Run a comprehensive check to ensure everything works:

```bash
# Check TypeScript compilation
pnpm run type-check

# Run platform tests
pnpm run test

# Check services can start
docker compose logs rabbitmq
docker compose logs postgres
```

Expected results:
- **type-check**: No TypeScript errors
- **test**: All tests pass
- **logs**: Services show "ready to accept connections"

## Next Steps

Now that your environment is set up, you can:

- **[Create Your First Service](./02-your-first-service.md)** - Build a simple microservice in 10 minutes
- **[Development Workflow](../03-guides/development-workflow.md)** - Learn daily development patterns
- **[Platform Architecture](../02-concepts/architecture-overview.md)** - Understand how the platform works

## Common Issues

### Docker Compose Won't Start

**Problem:** Services fail to start with port conflicts

**Solution:** Check if ports are already in use

```bash
# Find process using port
lsof -i :55671
lsof -i :55432

# Either kill the process or change ports in docker-compose.yml
```

### pnpm Install Fails

**Problem:** `pnpm install` shows dependency resolution errors

**Solution:** Clear cache and reinstall

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

### Build Errors

**Problem:** TypeScript compilation errors during build

**Solution:** Clean and rebuild from scratch

```bash
pnpm run clean
pnpm install
pnpm run build
```

For more help, see [Troubleshooting Guide](../05-troubleshooting/common-errors.md).

### RabbitMQ Connection Issues

**Problem:** Cannot connect to RabbitMQ

**Solution:** Verify RabbitMQ is running and accessible

```bash
# Check RabbitMQ container status
docker compose ps rabbitmq

# View RabbitMQ logs
docker compose logs rabbitmq

# Restart RabbitMQ
docker compose restart rabbitmq
```

**Check connection URLs:**
- From host machine: `amqp://admin:admin123@localhost:55671`
- From inside Docker: `amqp://admin:admin123@rabbitmq:5672`

### PostgreSQL Connection Issues

**Problem:** Database connection failed

**Solution:** Verify PostgreSQL is running

```bash
# Check PostgreSQL container
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U actor_user -d eventstore
```

If successful, you should see the PostgreSQL prompt:
```
eventstore=#
```

Type `\q` to exit.

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pnpm Workspace Guide](https://pnpm.io/workspaces)
- [Node.js Installation Guide](https://nodejs.org/en/download/)
- [Platform Development Guide](../03-guides/platform-development.md)

## Development Tips

### Fast Container Restarts

```bash
# Restart specific service
docker compose restart rabbitmq

# View logs for specific service
docker compose logs -f postgres

# Stop all services
docker compose down

# Start with fresh state
docker compose down -v  # Removes volumes
docker compose up -d
```

### Accessing the DevBox Container

The DevBox is a **containerized development environment** with all tools pre-installed and all platform services accessible. It's the recommended way to build and test the platform.

```bash
# Enter DevBox container
docker compose exec devbox /bin/bash

# Inside container you have:
# - Node.js 20, pnpm, TypeScript
# - All build and development tools
# - Access to RabbitMQ, PostgreSQL, Redis, Jaeger
# - Your workspace mounted at /workspace with hot-reload
```

**Why use DevBox:**
- ✅ Zero local setup - no need to install Node.js or dependencies
- ✅ Matches CI environment exactly
- ✅ All services ready for integration testing
- ✅ Isolated from your local system

**See the [DevBox Development Guide](../03-guides/infrastructure/devbox-development.md) for comprehensive usage, examples, and best practices.**

### Environment Variables

Default development environment variables are set in `docker-compose.yml`. To override locally, create a `.env` file:

```bash
# .env
NODE_ENV=development
RABBITMQ_URL=amqp://admin:admin123@localhost:55671
POSTGRES_URL=postgresql://actor_user:actor_pass123@localhost:55432/eventstore
REDIS_URL=redis://:redis123@localhost:56379
LOG_LEVEL=debug
```

**Important:** Never commit `.env` files with secrets to version control.
