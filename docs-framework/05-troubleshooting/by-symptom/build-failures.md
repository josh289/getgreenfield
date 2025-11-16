---
title: Build Failures
description: Troubleshooting guide for TypeScript compilation errors and Docker build failures
category: troubleshooting
tags: [build, typescript, docker, compilation, dependencies]
related:
  - ../../03-service-development/development-workflow.md
  - ./service-wont-start.md
  - ../debugging-tools/log-analysis.md
difficulty: beginner
---

# Build Failures

## Observable Symptoms

- TypeScript compilation errors
- Docker build failures
- npm/pnpm install errors
- Missing module errors
- Import resolution failures

## Quick Fix

```bash
# Clean and rebuild
rm -rf dist/ node_modules/
pnpm install
pnpm run build

# Docker build with no cache
docker compose build --no-cache my-service

# Check build logs
pnpm run build 2>&1 | tee build.log
grep -i "error" build.log
```

## Common Causes (Ordered by Frequency)

### 1. Missing `.js` Extension in Imports

**Frequency:** Very Common (40% of cases)

**Symptoms:**
- Build succeeds but runtime error: "Cannot find module"
- Error: `ERR_MODULE_NOT_FOUND`
- Imports work in development but fail in production

**Diagnostic Steps:**

```bash
# Find imports without .js extension
grep -r "from ['\"]\..*[^\.js]['\"]" src/

# Should find lines like:
# import { User } from './User'
# import { config } from '../config'
```

**Examples:**

```typescript
// ❌ WRONG: Missing .js extension
import { BusinessError } from '../errors';
import { UserAggregate } from './domain/User';
import { config } from '../config';

// ✓ CORRECT: Has .js extension
import { BusinessError } from '../errors.js';
import { UserAggregate } from './domain/User.js';
import { config } from '../config.js';
```

**Why Required:**

ES modules in Node.js require explicit file extensions. TypeScript doesn't add them automatically.

**Solution:**

Add `.js` extension to all relative imports:

```bash
# Manual fix
# Edit each file to add .js

# Or use find/replace in editor
# Find: from ['"](\./[^'"]+)['"]
# Replace: from '$1.js'
```

**Automated Fix:**

```bash
# Use eslint rule to enforce
# .eslintrc.json
{
  "rules": {
    "import/extensions": ["error", "always", { "js": "always" }]
  }
}
```

**Prevention:**
- Configure editor to add .js automatically
- Use linter rule to catch missing extensions
- Review imports in code review

---

### 2. Platform Package Version Mismatch

**Frequency:** Very Common (30% of cases)

**Symptoms:**
- Type errors between platform packages
- "Types have separate declarations of a private property"
- Incompatible package versions
- Build succeeds but runtime errors

**Diagnostic Steps:**

```bash
# Check platform package versions
grep "@banyanai/platform-" package.json | grep version

# Should all be same version
# ❌ BAD:
# "@banyanai/platform-core": "^1.0.115"
# "@banyanai/platform-cqrs": "^1.0.110"

# ✓ GOOD:
# "@banyanai/platform-core": "^1.0.116"
# "@banyanai/platform-cqrs": "^1.0.116"
```

**Solution:**

Update all platform packages to same version:

```json
// package.json
{
  "dependencies": {
    "@banyanai/platform-base-service": "^1.0.116",
    "@banyanai/platform-core": "^1.0.116",
    "@banyanai/platform-cqrs": "^1.0.116",
    "@banyanai/platform-message-bus-client": "^1.0.116",
    "@banyanai/platform-event-sourcing": "^1.0.116",
    "@banyanai/platform-telemetry": "^1.0.116"
  }
}
```

Reinstall:

```bash
rm -rf node_modules/ pnpm-lock.yaml
pnpm install
pnpm run build
```

**Prevention:**
- Use exact versions in production: `"1.0.116"` instead of `"^1.0.116"`
- Update all packages together
- Use renovate/dependabot to keep versions in sync

---

### 3. Type-Only Import for Decorators

**Frequency:** Common (15% of cases)

**Symptoms:**
- Error: "Cannot use namespace as a value"
- Decorator metadata errors
- Build fails when using contract in decorator

**Diagnostic Steps:**

```typescript
// Check imports for decorators
grep -A 5 "@CommandHandlerDecorator\|@QueryHandlerDecorator" src/

// Look for "import type" in those lines
```

**Examples:**

```typescript
// ❌ WRONG: Type-only import
import type { CreateUserCommand } from '../contracts/commands.js';

@CommandHandlerDecorator(CreateUserCommand)  // ERROR: Cannot use type as value
export class CreateUserHandler { }

// ✓ CORRECT: Value import
import { CreateUserCommand } from '../contracts/commands.js';

@CommandHandlerDecorator(CreateUserCommand)  // OK: Has runtime value
export class CreateUserHandler { }
```

**Solution:**

Change type-only imports to value imports for decorators:

```typescript
// For decorator arguments, use value imports
import { CreateUserCommand } from '../contracts/commands.js';

// Type-only imports OK for type annotations
import type { CreateUserInput } from '../types.js';

@CommandHandlerDecorator(CreateUserCommand)  // Needs value
export class CreateUserHandler {
  async handle(input: CreateUserInput) {  // Type annotation OK
    // ...
  }
}
```

**Prevention:**
- Never use `import type` for decorator arguments
- Use linter rule to catch type-only imports of contract classes
- Document import requirements in team guidelines

---

### 4. Missing TypeScript Configuration

**Frequency:** Common (10% of cases)

**Symptoms:**
- Decorators not emitted
- Module resolution errors
- Import errors
- "Cannot find module" at runtime

**Diagnostic Steps:**

```bash
# Check tsconfig.json exists
cat tsconfig.json

# Verify key settings
jq '.compilerOptions | {
  experimentalDecorators,
  emitDecoratorMetadata,
  module,
  moduleResolution
}' tsconfig.json
```

**Required Settings:**

```json
{
  "compilerOptions": {
    // REQUIRED for decorators
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    // REQUIRED for ES modules
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",

    // Recommended
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Solution:**

Use provided `tsconfig.json` template or ensure all required options present:

```bash
# Copy from template
cp microservice-template/tsconfig.json .

# Or update existing config
```

**Verify Build Output:**

```bash
# Build and check decorator metadata
pnpm run build
cat dist/commands/CreateUserHandler.js | grep -A 5 "__decorate"

# Should see decorator metadata
```

**Prevention:**
- Don't modify critical compiler options
- Use provided tsconfig.json template
- Run type checking in CI/CD

---

### 5. Missing Dependencies

**Frequency:** Occasional (3% of cases)

**Symptoms:**
- "Cannot find module '@banyanai/platform-*'"
- npm/pnpm install failures
- Package not found errors

**Diagnostic Steps:**

```bash
# Check package.json dependencies
cat package.json | jq '.dependencies'

# Try installing
pnpm install

# Check for errors
pnpm install 2>&1 | grep -i "error\|fail"
```

**Common Issues:**

**A. Missing Platform Package:**

```json
// package.json missing required dependency
{
  "dependencies": {
    "@banyanai/platform-core": "^1.0.116"
    // Missing: @banyanai/platform-cqrs
  }
}
```

**B. Registry Authentication:**

```bash
# Platform packages require authentication
# Check .npmrc
cat .npmrc

# Should have:
@banyanai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**C. NODE_AUTH_TOKEN Not Set:**

```bash
# Check token
echo $NODE_AUTH_TOKEN

# If empty, set it
export NODE_AUTH_TOKEN=$(gh auth token)

# Or add to .env
echo "NODE_AUTH_TOKEN=$(gh auth token)" >> .env
```

**Solution:**

1. Add missing dependencies to package.json
2. Ensure .npmrc configured correctly
3. Set NODE_AUTH_TOKEN environment variable
4. Reinstall:

```bash
export NODE_AUTH_TOKEN=$(gh auth token)
rm -rf node_modules/ pnpm-lock.yaml
pnpm install
```

**Prevention:**
- Document authentication requirements
- Use .npmrc template
- Check dependencies in package.json

---

### 6. Docker Build Cache Issues

**Frequency:** Occasional (2% of cases)

**Symptoms:**
- Docker build uses outdated dependencies
- Changes not reflected in built image
- Stale node_modules in container

**Diagnostic Steps:**

```bash
# Check Docker build cache
docker image ls | grep my-service

# Check .dockerignore
cat .dockerignore

# Should exclude:
# node_modules
# */node_modules
# dist
```

**Solution:**

**A. Build with No Cache:**

```bash
docker compose build --no-cache my-service
```

**B. Update .dockerignore:**

```bash
# .dockerignore
node_modules
*/node_modules
dist
*/dist
.git
.env
.npm
coverage
*.log
```

**C. Multi-Stage Build:**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
```

**Prevention:**
- Use multi-stage builds
- Properly configure .dockerignore
- Build with --no-cache when dependency changes

---

## TypeScript-Specific Errors

### "Cannot use namespace 'X' as a value"

**Cause:** Type-only import used where value needed

**Solution:**
```typescript
// Change from:
import type { CreateUserCommand } from './commands.js';

// To:
import { CreateUserCommand } from './commands.js';
```

### "Property 'X' does not exist on type 'Y'"

**Cause:** Type mismatch or incorrect type definition

**Solution:**
1. Check type definitions match usage
2. Verify platform package versions match
3. Run `pnpm install` to update types

### "Cannot find module 'X' or its corresponding type declarations"

**Cause:** Missing package or type definitions

**Solution:**
1. Install missing package: `pnpm add X`
2. Install types: `pnpm add -D @types/X`
3. Add `.js` extension if relative import

---

## Docker Build Errors

### "Cannot find package @banyanai/platform-*"

**Cause:** Missing authentication token or wrong registry

**Solution:**
```dockerfile
# Ensure .npmrc copied before install
COPY .npmrc ./

# Build with token
NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN docker compose build my-service
```

### "ENOENT: no such file or directory"

**Cause:** Missing source files or wrong COPY path

**Solution:**
```dockerfile
# Verify paths in Dockerfile
COPY package.json pnpm-lock.yaml ./  # Correct
COPY src ./src  # Ensure src/ exists
```

### "node:internal/modules/esm/resolve: Module not found"

**Cause:** Missing .js extension or wrong module resolution

**Solution:**
1. Add .js extensions to imports
2. Verify package.json has `"type": "module"`
3. Check tsconfig.json module settings

---

## Build Verification Steps

After fixing build issues:

### 1. Local Build Succeeds

```bash
# Clean build
rm -rf dist/
pnpm run build

# Should complete without errors
# Check output
ls dist/

# Should see compiled JavaScript files
```

### 2. Type Check Passes

```bash
pnpm run type-check

# Should show no errors
```

### 3. Docker Build Succeeds

```bash
docker compose build my-service

# Should complete successfully
# Check image created
docker images | grep my-service
```

### 4. Service Starts

```bash
docker compose up my-service

# Should start without errors
# Check logs
docker logs my-service
```

---

## Common Build Commands

```bash
# Clean build
rm -rf dist/ && pnpm run build

# Build with logging
pnpm run build 2>&1 | tee build.log

# Type check only
pnpm run type-check

# Build all packages (monorepo)
pnpm -r run build

# Build specific package
cd platform/packages/cqrs && pnpm run build

# Docker build (no cache)
docker compose build --no-cache my-service

# Docker build with specific target
docker build --target builder -t my-service:build .
```

---

## Prevention Checklist

Before committing, verify:

- [ ] All imports have `.js` extension
- [ ] All platform packages at same version
- [ ] Value imports for decorator arguments
- [ ] tsconfig.json has required settings
- [ ] package.json includes all dependencies
- [ ] .dockerignore excludes node_modules
- [ ] .npmrc configured with authentication
- [ ] NODE_AUTH_TOKEN set for Docker builds
- [ ] Type check passes: `pnpm run type-check`
- [ ] Build succeeds: `pnpm run build`
- [ ] Docker build succeeds

---

## Debugging Build Errors

### Enable Verbose TypeScript Output

```bash
# Build with verbose logging
npx tsc --noEmit --listFiles --pretty

# Shows all files being compiled
```

### Check Module Resolution

```bash
# Trace module resolution
npx tsc --noEmit --traceResolution > resolution.log

# Review resolution.log for import failures
grep "Module not found" resolution.log
```

### Inspect Docker Build Layers

```bash
# Build with progress output
DOCKER_BUILDKIT=1 docker build --progress=plain .

# Shows each layer and command output
```

### Test in Isolation

```bash
# Test single file compilation
npx tsc src/commands/CreateUserHandler.ts --noEmit

# Identifies file-specific errors
```

---

## Related Documentation

- [Development Workflow](../../03-service-development/development-workflow.md) - Build and development process
- [Service Won't Start](./service-wont-start.md) - Runtime startup errors
- [TypeScript Setup](../../01-getting-started/environment-setup.md) - TypeScript configuration
- [Docker Setup](../../04-operations/deployment.md) - Docker best practices

---

## Summary

Most build failures are caused by:

1. **Missing `.js` extensions** - Add to all relative imports
2. **Package version mismatch** - Keep all platform packages at same version
3. **Type-only imports for decorators** - Use value imports instead
4. **Missing TypeScript config** - Ensure experimentalDecorators enabled
5. **Docker cache issues** - Build with --no-cache

Always check build logs for specific error messages and fix systematically from first error to last.
