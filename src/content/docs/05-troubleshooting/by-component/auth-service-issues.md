---
title: Auth Service Issues
description: Troubleshooting guide for authentication, authorization, and token management issues
category: troubleshooting
tags: [auth-service, authentication, authorization, jwt, tokens, permissions]
related:
  - ../../02-core-concepts/authentication.md
  - ../../02-core-concepts/authorization.md
  - ../by-symptom/authentication-errors.md
  - ../common-errors/error-catalog.md
difficulty: intermediate
---

# Auth Service Issues

The auth-service handles authentication, authorization, JWT token management, and permission validation. This guide helps diagnose and resolve common auth-service problems.

## Quick Fix

```bash
# Check auth-service status
docker ps | grep auth-service

# View auth-service logs
docker logs auth-service -f --tail 100

# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Decode JWT token to inspect claims
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d | jq
```

## Common Problems

### 1. Token Generation Failed

**Symptoms:**
- Login succeeds but no token returned
- Error: "Token generation failed"
- Null or undefined token in response
- Auth service logs show token generation errors

**Diagnostic Steps:**

```bash
# Check auth-service logs for JWT errors
docker logs auth-service 2>&1 | grep -i "token generation"

# Verify JWT_SECRET is configured
docker exec auth-service env | grep JWT_SECRET

# Check token manager initialization
docker logs auth-service 2>&1 | grep "JWTManager"
```

**Common Causes:**

**A. Missing JWT_SECRET**

```bash
# Check environment variables
docker exec auth-service env | grep JWT

# Should have either:
# JWT_SECRET=your-secret-key (for HS256)
# OR
# JWKS_URI=https://auth-provider.com/.well-known/jwks.json (for RS256)
```

**Solution:**

Add JWT_SECRET to docker-compose.yml:

```yaml
services:
  auth-service:
    environment:
      - JWT_SECRET=change-this-in-production-to-secure-random-string
      - JWT_ALGORITHM=HS256  # or RS256 if using JWKS
      - JWT_EXPIRES_IN=1h
      - JWT_REFRESH_EXPIRES_IN=7d
```

**B. Invalid JWT Algorithm Configuration**

```typescript
// Check JWTManager initialization in auth-service
const jwtManager = new JWTManager({
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256', // Must match JWT_ALGORITHM env var
  expiresIn: '1h',
  refreshExpiresIn: '7d'
});
```

**Solution:**

Ensure JWT_ALGORITHM matches signing configuration:
- Use `HS256` for symmetric signing (single secret)
- Use `RS256` for asymmetric signing (public/private key pair)

**C. User Data Missing Required Fields**

```typescript
// Token generation requires userId, email, permissions
throw new Error('Token generation failed'); // From JWTManager.ts:166

// Ensure user object has required fields:
const tokenPayload = {
  userId: user.userId,      // REQUIRED
  email: user.email,        // REQUIRED
  permissions: user.permissions || [] // Optional but recommended
};
```

**Solution:**

Verify user object before token generation:

```typescript
if (!user.userId || !user.email) {
  throw new Error('User must have userId and email for token generation');
}
```

---

### 2. Token Validation Failures

**Symptoms:**
- Valid tokens rejected with "Invalid token"
- Intermittent token validation failures
- Token works in one service but not another
- "Token expired" for recently issued tokens

**Diagnostic Steps:**

```bash
# Decode token to check expiration
TOKEN="your.jwt.token"
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.exp, .iat'

# Check current timestamp
date +%s

# Compare token exp with current time
# If exp < current, token is expired

# Check JWT_SECRET consistency across services
docker exec auth-service env | grep JWT_SECRET
docker exec api-gateway env | grep JWT_SECRET
# Secrets MUST match!
```

**Common Causes:**

**A. JWT_SECRET Mismatch**

```bash
# Each service using JWT must have SAME secret
# Check all services:
for service in auth-service api-gateway user-service; do
  echo "=== $service ==="
  docker exec $service env | grep JWT_SECRET
done
```

**Solution:**

Use shared environment variable or secrets management:

```yaml
# docker-compose.yml
x-shared-jwt: &shared-jwt
  JWT_SECRET: ${JWT_SECRET:-change-this-in-production}
  JWT_ALGORITHM: ${JWT_ALGORITHM:-HS256}

services:
  auth-service:
    environment:
      <<: *shared-jwt

  api-gateway:
    environment:
      <<: *shared-jwt
```

**B. Clock Skew Between Services**

```bash
# Check time on each container
for service in auth-service api-gateway; do
  echo "=== $service ==="
  docker exec $service date
done

# Times should be within a few seconds
# Large differences cause exp/iat validation failures
```

**Solution:**

Sync container clocks or add clock skew tolerance:

```typescript
// In JWT validation config
const jwtOptions = {
  clockTolerance: 30 // Allow 30 seconds clock skew
};
```

**C. Token Format Issues**

```typescript
// Common token format errors
throw new Error('Invalid token format'); // From JWTManager.ts:299

// Token must be: "Bearer <token>" in Authorization header
// OR just the token string if passed directly
```

**Solution:**

```typescript
// Correct token extraction
const authHeader = req.headers.authorization;
const token = authHeader?.startsWith('Bearer ')
  ? authHeader.substring(7)
  : authHeader;

// Validate format
if (!token || token.split('.').length !== 3) {
  throw new Error('Invalid JWT format');
}
```

---

### 3. Permission Denied Errors

**Symptoms:**
- User cannot access operations they should have permission for
- "Permission denied" errors with correct permissions
- Inconsistent permission checking across operations
- Permission format validation errors

**Diagnostic Steps:**

```bash
# Decode token to check permissions
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.permissions'

# Expected format: ["resource:action", ...]
# e.g., ["users:create", "users:read", "posts:update"]

# Check handler permission requirements
grep -r "@RequiresPermission" src/commands/ src/queries/

# Verify permission format
# Must be: "resource:action" (lowercase, colon-separated)
```

**Common Permission Errors:**

```typescript
// From Permission.ts domain model

// Error: "Permission must be a non-empty string"
throw new Error('Permission must be a non-empty string'); // Line 290

// Error: "Permission must follow 'service:action' format"
throw new Error(`Permission must follow 'service:action' format, got: ${permission}`); // Line 295

// Error: "Permission service and action cannot be empty"
throw new Error(`Permission service and action cannot be empty, got: ${permission}`); // Line 301

// Error: Invalid characters in permission
throw new Error(
  `Permission service contains invalid characters (only lowercase letters, numbers, hyphens allowed), got: ${service}`
); // Line 307

throw new Error(
  `Permission action contains invalid characters (only lowercase letters, numbers, hyphens allowed), got: ${action}`
); // Line 313
```

**Solution:**

**A. Fix Permission Format**

```typescript
// ❌ WRONG: Various invalid formats
@RequiresPermission('users-create')     // Missing colon
@RequiresPermission('Users:Create')     // Uppercase
@RequiresPermission('users:')           // Empty action
@RequiresPermission(':create')          // Empty resource
@RequiresPermission('user service:create') // Space in resource
@RequiresPermission('users:create!')    // Invalid character

// ✓ CORRECT: Proper format
@RequiresPermission('users:create')
@RequiresPermission('user-profiles:read')
@RequiresPermission('api-keys:delete')
```

**B. Grant Missing Permissions**

```bash
# Query user permissions from database
docker exec postgres psql -U postgres -d platform -c \
  "SELECT data->'permissions' FROM projections WHERE projection_name='user_read_model' AND id='user-123';"

# Add permission to user via command
curl -X POST http://localhost:3000/api/users/grant-permission \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "permission": "posts:create"
  }'
```

**C. Wildcard Permission Patterns**

```typescript
// Support for wildcard permissions
// "users:*" grants all actions on users resource
// "*:read" grants read on all resources
// "admin:*" grants all admin permissions

// Check if user has wildcard permission
function hasPermission(userPermissions: string[], required: string): boolean {
  const [resource, action] = required.split(':');

  return userPermissions.some(p => {
    if (p === required) return true; // Exact match
    if (p === `${resource}:*`) return true; // Resource wildcard
    if (p === `*:${action}`) return true; // Action wildcard
    if (p === '*:*') return true; // Super admin
    return false;
  });
}
```

---

### 4. Refresh Token Issues

**Symptoms:**
- Cannot refresh access token
- "Refresh token not found or invalid"
- "Token is not a refresh token"
- Refresh token works once then fails

**Diagnostic Steps:**

```bash
# Check refresh token in database
docker exec postgres psql -U postgres -d platform -c \
  "SELECT token_id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE user_id='user-123' ORDER BY created_at DESC LIMIT 5;"

# Decode refresh token
echo $REFRESH_TOKEN | cut -d'.' -f2 | base64 -d | jq '{type, tokenId, userId, exp}'

# Should have: "type": "refresh"
```

**Common Causes:**

**A. Token Type Mismatch**

```typescript
// Error: "Token is not a refresh token"
throw new Error('Token is not a refresh token'); // JWTManager.ts:258

// Refresh endpoint must receive refresh token, not access token
// Access tokens have: "type": "access"
// Refresh tokens have: "type": "refresh"
```

**Solution:**

```typescript
// Client should store both tokens separately
localStorage.setItem('accessToken', loginResponse.accessToken);
localStorage.setItem('refreshToken', loginResponse.refreshToken);

// Use refresh token for refresh endpoint
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('refreshToken')}` // NOT accessToken!
  }
});
```

**B. Refresh Token Revoked**

```typescript
// Error: "Refresh token not found or invalid"
throw new Error('Refresh token not found or invalid'); // JWTManager.ts:264

// Token may be revoked in database
```

**Diagnostic:**

```sql
-- Check if token is revoked
SELECT
  token_id,
  user_id,
  expires_at,
  revoked_at,
  CASE
    WHEN revoked_at IS NOT NULL THEN 'Revoked'
    WHEN expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM refresh_tokens
WHERE token_id = 'token-id-from-jwt'
```

**Solution:**

If token is revoked, user must re-authenticate:

```typescript
// Handle refresh failure by redirecting to login
try {
  const newToken = await refreshAccessToken();
} catch (error) {
  if (error.message.includes('Refresh token not found')) {
    // Token revoked or expired, require login
    redirectToLogin();
  }
}
```

**C. Refresh Token Expired**

```bash
# Check token expiration
echo $REFRESH_TOKEN | cut -d'.' -f2 | base64 -d | jq '.exp'
date +%s

# If exp < current time, token expired
```

**Solution:**

Configure longer refresh token expiration:

```yaml
# docker-compose.yml
auth-service:
  environment:
    - JWT_REFRESH_EXPIRES_IN=30d  # Increase from default 7d
```

---

### 5. External Auth Provider Issues

**Symptoms:**
- OAuth/SAML login failures
- "User ID is required" from external auth
- "Provider type is required"
- "Valid provider email is required"
- Duplicate user creation on external login

**Diagnostic Steps:**

```bash
# Check external auth configuration
docker exec auth-service env | grep -E "OAUTH|SAML|EXTERNAL_AUTH"

# View external auth logs
docker logs auth-service 2>&1 | grep "ExternalAuthProvider"

# Check recent external auth errors
docker logs auth-service 2>&1 | grep -A5 "External auth failed"
```

**Common Errors from ExternalAuthProvider.ts:**

```typescript
// Line 199: Missing user ID
throw new Error('User ID is required');

// Line 203: Missing provider type
throw new Error('Provider type is required');

// Line 207: Missing provider ID
throw new Error('Provider ID is required');

// Line 211: Invalid email
throw new Error('Valid provider email is required');
```

**Solution:**

**A. Ensure Complete External Auth Data**

```typescript
// External auth must provide all required fields
const externalAuthData = {
  userId: 'external-user-id',        // REQUIRED
  providerType: 'google',            // REQUIRED: 'google', 'github', 'saml', etc.
  providerId: 'provider-instance-id', // REQUIRED
  email: 'user@example.com',         // REQUIRED (valid email format)
  name: 'John Doe',                  // Optional
  metadata: {}                        // Optional
};

await authenticateExternalUser(externalAuthData);
```

**B. Prevent Duplicate User Creation**

Recently fixed in commit `91c0c65e`:

```typescript
// Check if user exists before creating
// Uses getInstance pattern to prevent duplicates

const user = await User.getInstance(userId);
if (!user) {
  // Create new user
  const newUser = new User(userId);
  await newUser.register(email, hashedPassword, 'external');
  await aggregateAccess.save(newUser, correlationId);
}
```

**C. Configure External Auth Providers**

```yaml
# docker-compose.yml
auth-service:
  environment:
    # Google OAuth
    - GOOGLE_CLIENT_ID=your-client-id
    - GOOGLE_CLIENT_SECRET=your-client-secret
    - GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

    # GitHub OAuth
    - GITHUB_CLIENT_ID=your-client-id
    - GITHUB_CLIENT_SECRET=your-client-secret
    - GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

    # SAML
    - SAML_ENTRY_POINT=https://sso.example.com/saml/login
    - SAML_ISSUER=http://localhost:3000
    - SAML_CALLBACK_URL=http://localhost:3000/api/auth/saml/callback
```

---

### 6. Policy Validation Issues

**Symptoms:**
- Ownership policies fail for valid users
- Cannot edit own resources
- Admin users blocked by policies
- Policy checks return incorrect results

**Diagnostic Steps:**

```bash
# Check user context in request
docker logs auth-service 2>&1 | grep "ExecutionContext"

# Verify user ID matches resource owner
docker logs auth-service 2>&1 | grep "Policy check"

# Check admin role assignment
docker exec postgres psql -U postgres -d platform -c \
  "SELECT id, data->'roles' as roles FROM projections WHERE projection_name='user_read_model' AND id='user-123';"
```

**Solution:**

**A. Implement Proper Policy Checks**

```typescript
import { RequiresPermission } from '@banyanai/platform-base-service';
import { PolicyViolationError } from '@banyanai/platform-cqrs';

@CommandHandler(UpdateUserCommand)
@RequiresPermission('users:update') // Layer 1: Permission check
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: ExecutionContext) {
    // Layer 2: Policy check (ownership or admin)
    const isOwner = command.userId === context.user.userId;
    const isAdmin = context.user.roles?.includes('admin');

    if (!isOwner && !isAdmin) {
      throw new PolicyViolationError(
        'OwnershipPolicy',
        context.user.userId,
        'UpdateUser',
        'User can only update their own profile unless they are an admin'
      );
    }

    // Proceed with update
    const user = await this.aggregateAccess.getById(command.userId);
    user.updateProfile(command.name, command.bio);
    await this.aggregateAccess.save(user, context.correlationId);

    return { userId: user.userId };
  }
}
```

**B. Add Role-Based Policies**

```typescript
// Check if user has specific role
function hasRole(user: User, role: string): boolean {
  return user.roles?.includes(role) || false;
}

// Policy: Admins can do anything, users can edit own resources
if (!hasRole(context.user, 'admin') && resourceOwnerId !== context.user.userId) {
  throw new PolicyViolationError(
    'AdminOrOwnerPolicy',
    context.user.userId,
    'UpdateResource',
    'Only admins or resource owners can perform this action'
  );
}
```

---

### 7. Authentication Required Errors

**Symptoms:**
- "Authentication required" for all operations
- Cannot authenticate even with valid credentials
- Bypass auth not working in development
- Anonymous access blocked unexpectedly

**Diagnostic Steps:**

```bash
# Check if bypass auth enabled (dev only)
docker exec auth-service env | grep BYPASS_AUTH

# Check authentication middleware
docker logs auth-service 2>&1 | grep "Authentication"

# Test login endpoint
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Solution:**

**A. Enable Bypass Auth (Development Only)**

```yaml
# docker-compose.yml (dev environment)
auth-service:
  environment:
    - BYPASS_AUTH=true  # WARNING: Only use in development!
    - NODE_ENV=development
```

**B. Fix Authentication Middleware**

```typescript
// Ensure authentication runs before authorization
app.use(authenticationMiddleware); // Extract and validate JWT
app.use(authorizationMiddleware);  // Check permissions
app.use(handlerMiddleware);        // Execute handler
```

**C. Allow Anonymous Operations**

```typescript
// Mark operations that don't require auth
@QueryHandler(GetPublicPostsQuery)
// NO @RequiresPermission decorator = allows anonymous access
export class GetPublicPostsHandler {
  async handle(query: GetPublicPostsQuery) {
    // Anyone can query public posts
    return this.postRepository.findPublicPosts();
  }
}
```

---

## Debugging Tools

### Decode JWT Tokens

```bash
# Create helper function
decode_jwt() {
  echo $1 | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
}

# Use it
decode_jwt "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBlcm1pc3Npb25zIjpbInVzZXJzOnJlYWQiXSwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE2MDk0NjI4MDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

### Check Permission Database

```sql
-- View all user permissions
SELECT
  id,
  data->>'email' as email,
  data->'permissions' as permissions,
  data->'roles' as roles
FROM projections
WHERE projection_name = 'user_read_model'
ORDER BY data->>'email';

-- Find users with specific permission
SELECT
  id,
  data->>'email' as email
FROM projections
WHERE projection_name = 'user_read_model'
  AND data->'permissions' ? 'users:create';

-- Find admin users
SELECT
  id,
  data->>'email' as email
FROM projections
WHERE projection_name = 'user_read_model'
  AND data->'roles' ? 'admin';
```

### Monitor Auth Operations

```bash
# Watch authentication attempts
docker logs auth-service -f 2>&1 | grep -E "login|authenticate"

# Watch permission checks
docker logs auth-service -f 2>&1 | grep -E "permission|denied|granted"

# Watch token operations
docker logs auth-service -f 2>&1 | grep -E "token|jwt|refresh"
```

### Test Permission Validation

```typescript
// Test permission format validator
import { Permission } from './domain/Permission';

function testPermission(perm: string) {
  try {
    Permission.validate(perm);
    console.log(`✓ Valid: ${perm}`);
  } catch (error) {
    console.log(`✗ Invalid: ${perm} - ${error.message}`);
  }
}

testPermission('users:create');        // ✓ Valid
testPermission('users-create');        // ✗ Invalid: must use colon
testPermission('Users:Create');        // ✗ Invalid: must be lowercase
testPermission('user service:create'); // ✗ Invalid: no spaces
```

---

## Best Practices

### 1. Use Environment-Specific Secrets

```bash
# .env.development
JWT_SECRET=dev-secret-not-secure

# .env.production
JWT_SECRET=production-secret-change-this-to-random-string-min-32-chars
```

### 2. Rotate JWT Secrets

```typescript
// Support for multiple secrets during rotation
const jwtSecrets = [
  process.env.JWT_SECRET,     // Current secret
  process.env.JWT_SECRET_OLD  // Previous secret (for validation only)
];

// Validate with any valid secret
function validateToken(token: string) {
  for (const secret of jwtSecrets) {
    try {
      return jwt.verify(token, secret);
    } catch {
      continue;
    }
  }
  throw new Error('Invalid token');
}
```

### 3. Implement Token Refresh Strategy

```typescript
// Auto-refresh before expiration
async function ensureValidToken() {
  const token = localStorage.getItem('accessToken');
  const decoded = jwt.decode(token);

  // Refresh if less than 5 minutes remaining
  const expiresIn = decoded.exp * 1000 - Date.now();
  if (expiresIn < 5 * 60 * 1000) {
    const newToken = await refreshAccessToken();
    localStorage.setItem('accessToken', newToken);
  }

  return token;
}
```

### 4. Log Security Events

```typescript
// Log all authentication and authorization events
Logger.security('User login', {
  userId,
  email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
});

Logger.security('Permission denied', {
  userId: context.user.userId,
  operation: 'CreateUser',
  required: ['users:create'],
  actual: context.user.permissions,
  timestamp: new Date().toISOString()
});
```

---

## Related Documentation

- [Authentication Concepts](../../02-core-concepts/authentication.md)
- [Authorization & Permissions](../../02-core-concepts/authorization.md)
- [Authentication Errors](../by-symptom/authentication-errors.md)
- [Error Catalog - Auth Errors](../common-errors/error-catalog.md#authentication--authorization-errors)
- [JWT Best Practices](../../03-guides/security/jwt-tokens.md)

---

## Summary

Most auth-service issues are caused by:

1. **Missing or mismatched JWT_SECRET** - Ensure all services use same secret
2. **Invalid permission format** - Use `resource:action` format (lowercase, colon-separated)
3. **Token expiration** - Implement refresh token strategy
4. **External auth configuration** - Provide all required fields
5. **Policy vs Permission confusion** - Layer 1 (permissions) at gateway, Layer 2 (policies) in handlers

Use `docker logs auth-service` and token decoding to diagnose most issues quickly.
