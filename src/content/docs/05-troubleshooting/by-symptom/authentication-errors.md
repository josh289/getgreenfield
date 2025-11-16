---
title: Authentication Errors
description: Troubleshooting authentication failures at the API Gateway
category: troubleshooting
tags: [authentication, jwt, jwks, auth0, keycloak, security]
related:
  - ../../02-core-concepts/authentication.md
  - ../by-component/api-gateway-issues.md
  - ./api-calls-failing.md
difficulty: intermediate
---

# Authentication Errors

## Observable Symptoms

- HTTP 401 Unauthorized responses
- Error: "Authentication required" or "Invalid token"
- JWT validation failures
- Development headers not working
- Token signature verification errors

## Quick Fix

```bash
# Check authentication mode
docker logs api-gateway 2>&1 | grep "JWTAuthenticationEngine\|DEVELOPMENT_AUTH"

# Test with development headers
curl -H "X-Dev-User-Id: test-user" \
     -H "X-Dev-Permissions: *" \
     http://localhost:3000/api/endpoint

# Decode JWT to inspect claims
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq

# Check JWT signature algorithm
echo "YOUR_JWT_TOKEN" | cut -d. -f1 | base64 -d | jq '.alg'
```

## Authentication Modes

The API Gateway supports three authentication modes:

1. **Development Mode** - Bypass JWT with dev headers (local only)
2. **HS256 (Symmetric)** - Shared secret JWT validation
3. **RS256 (Asymmetric)** - JWKS public key validation

---

## Common Causes (Ordered by Frequency)

### 1. Development Mode Not Enabled

**Frequency:** Very Common (40% of cases)

**Symptoms:**
- Development headers ignored
- 401 error even with X-Dev-User-Id header
- Local development requires JWT

**Diagnostic Steps:**

```bash
# Check if development mode enabled
docker logs api-gateway 2>&1 | grep "DEVELOPMENT_AUTH_ENABLED"

# Check environment variables
docker compose exec api-gateway env | grep DEVELOPMENT
```

**Solution:**

Enable development mode in `docker-compose.yml`:

```yaml
services:
  api-gateway:
    environment:
      - DEVELOPMENT_AUTH_ENABLED=true
```

Restart API Gateway:

```bash
docker compose restart api-gateway
```

Test with development headers:

```bash
curl -H "X-Dev-User-Id: test-user-123" \
     -H "X-Dev-Permissions: *" \
     http://localhost:3000/api/endpoint
```

**Security Warning:** NEVER enable `DEVELOPMENT_AUTH_ENABLED` in production!

**Prevention:**
- Use environment-specific docker-compose files
- Document development setup requirements
- Add warning comments in docker-compose.yml

---

### 2. JWT Missing Required 'sub' Claim

**Frequency:** Very Common (25% of cases)

**Symptoms:**
- Error: "JWT missing required 'sub' claim"
- Valid JWT but authentication fails
- Token from OIDC provider but no user ID

**Diagnostic Steps:**

```bash
# Decode JWT payload
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq

# Check for 'sub' claim
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq '.sub'
```

**Example Token:**

```json
// ❌ WRONG: No 'sub' claim
{
  "email": "user@example.com",
  "name": "John Doe",
  "permissions": ["users:read"]
  // Missing: "sub" field
}

// ✓ CORRECT: Has 'sub' claim
{
  "sub": "auth0|123456789",  // Required user identifier
  "email": "user@example.com",
  "name": "John Doe",
  "permissions": ["users:read"]
}
```

**Solution:**

Ensure your identity provider includes `sub` claim in JWT:

**Auth0:**
```javascript
// Auth0 includes 'sub' by default
// Typically: "sub": "auth0|user-id"
```

**Keycloak:**
```javascript
// Keycloak includes 'sub' by default
// Typically: "sub": "uuid-format-user-id"
```

**Custom JWT issuer:**
```typescript
// Include 'sub' when generating token
const token = jwt.sign({
  sub: userId,  // REQUIRED
  email: user.email,
  permissions: user.permissions
}, secret);
```

**Prevention:**
- Validate JWT structure in auth service
- Use standard OIDC providers (Auth0, Keycloak)
- Test JWT structure before deployment

---

### 3. Algorithm Mismatch (HS256 vs RS256)

**Frequency:** Common (20% of cases)

**Symptoms:**
- Error: "invalid algorithm"
- JWT validation fails
- Token from Auth0/Keycloak rejected

**Diagnostic Steps:**

```bash
# Check JWT header for algorithm
echo "YOUR_JWT_TOKEN" | cut -d. -f1 | base64 -d | jq '.alg'

# Check API Gateway configuration
docker logs api-gateway 2>&1 | grep "Configured for.*mode"

# Logs will show:
# "Configured for HS256 mode" (if JWT_SECRET set)
# OR
# "Configured for RS256 mode" (if JWKS_URI set)
```

**Algorithm Detection:**

```bash
# JWT header shows algorithm
echo "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d. -f1 | base64 -d

# Output:
# {"alg":"RS256","typ":"JWT"}  ← Use JWKS_URI
# OR
# {"alg":"HS256","typ":"JWT"}  ← Use JWT_SECRET
```

**Solution:**

**For RS256 (Auth0, Keycloak, Okta):**

```yaml
# docker-compose.yml
api-gateway:
  environment:
    - JWKS_URI=https://your-tenant.auth0.com/.well-known/jwks.json
    # Remove JWT_SECRET if present
```

**For HS256 (Custom JWT):**

```yaml
# docker-compose.yml
api-gateway:
  environment:
    - JWT_SECRET=your-secret-key-min-32-chars
    # Remove JWKS_URI if present
```

**Never set both** JWT_SECRET and JWKS_URI - gateway will prefer JWKS_URI.

**Prevention:**
- Use RS256 for production (more secure)
- Document authentication mode in README
- Match algorithm to provider

---

### 4. Invalid Token Signature

**Frequency:** Common (10% of cases)

**Symptoms:**
- Error: "invalid signature"
- Token structure valid but signature fails
- Different secret between auth service and gateway

**Diagnostic Steps:**

```bash
# Check if JWT_SECRET matches between services
docker compose exec auth-service env | grep JWT_SECRET
docker compose exec api-gateway env | grep JWT_SECRET

# Should be identical
```

**Common Causes:**

**A. Secret Mismatch (HS256):**

```yaml
# ❌ WRONG: Different secrets
auth-service:
  environment:
    - JWT_SECRET=secret-one

api-gateway:
  environment:
    - JWT_SECRET=secret-two  # Different!

# ✓ CORRECT: Same secret
auth-service:
  environment:
    - JWT_SECRET=shared-secret-key

api-gateway:
  environment:
    - JWT_SECRET=shared-secret-key  # Must match
```

**B. Wrong JWKS URI (RS256):**

```yaml
# ❌ WRONG: Typo in JWKS URI
api-gateway:
  environment:
    - JWKS_URI=https://tenant.auth0.com/.well-known/jwks.json  # Missing 'us'

# ✓ CORRECT: Exact URI from provider
api-gateway:
  environment:
    - JWKS_URI=https://tenant.us.auth0.com/.well-known/jwks.json
```

**C. Token from Different Provider:**

```bash
# Token issued by different Auth0 tenant
# Gateway configured for tenant-a
# Token from tenant-b

# Solution: Ensure gateway configured for correct provider
```

**Solution:**

1. **For HS256:** Ensure JWT_SECRET matches exactly between auth service and gateway
2. **For RS256:** Verify JWKS_URI is correct
3. **Test JWKS endpoint:**

```bash
# Verify JWKS accessible
curl https://your-tenant.us.auth0.com/.well-known/jwks.json | jq

# Should return public keys
```

**Prevention:**
- Use environment variables from shared .env file
- Rotate secrets securely
- Test with tokens from correct provider

---

### 5. Expired Token

**Frequency:** Occasional (3% of cases)

**Symptoms:**
- Error: "jwt expired"
- Token worked before but now fails
- Intermittent authentication failures

**Diagnostic Steps:**

```bash
# Decode token and check expiration
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq '.exp'

# Compare to current Unix timestamp
date +%s

# If exp < current timestamp, token is expired
```

**Example:**

```json
// JWT payload
{
  "sub": "user-123",
  "iat": 1704067200,  // Issued at: 2024-01-01 00:00:00
  "exp": 1704070800   // Expires at: 2024-01-01 01:00:00
}

// Current time: 1704074400 (2024-01-01 02:00:00)
// Token expired 1 hour ago
```

**Solution:**

1. **Refresh Token:**

```javascript
// Frontend: Refresh token before expiration
const token = localStorage.getItem('jwt');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresIn = payload.exp * 1000 - Date.now();

if (expiresIn < 5 * 60 * 1000) {  // Less than 5 minutes
  await refreshToken();
}
```

2. **Increase Token Lifetime (Development Only):**

```typescript
// Auth service (development only)
const token = jwt.sign({ sub: userId }, secret, {
  expiresIn: '24h'  // Longer for development
});
```

3. **Production:** Use refresh token pattern to get new access tokens

**Prevention:**
- Implement automatic token refresh
- Show expiration warning to user
- Use refresh tokens in production

---

### 6. Missing Permissions in JWT

**Frequency:** Occasional (2% of cases)

**Symptoms:**
- Authentication succeeds (200 OK from auth endpoint)
- But 403 Forbidden on API calls
- User authenticated but not authorized

**Note:** This is actually an **authorization** issue, not authentication. Covered here because it often looks like auth failure.

**Diagnostic Steps:**

```bash
# Check permissions in JWT
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq '.permissions'

# Check required permissions for operation
curl http://localhost:3001/api/services/my-service/contracts | jq \
  '.contracts[] | select(.name=="CreateUser") | .requiredPermissions'

# Compare: Does user have all required permissions?
```

**Permission Formats in JWT:**

The gateway automatically detects permissions in multiple formats:

```json
// Format 1: Direct permissions array (recommended)
{
  "sub": "user-123",
  "permissions": ["users:create", "users:read"]
}

// Format 2: Namespaced (Auth0 custom claims)
{
  "sub": "auth0|user-123",
  "https://api.yourapp.com/permissions": ["users:create"]
}

// Format 3: OAuth2 scope string
{
  "sub": "user-123",
  "scope": "users:create users:read"  // Space-separated
}
```

**Solution:**

Ensure identity provider includes permissions in JWT:

**Auth0:**
```javascript
// Add permissions to token in Auth0 Action/Rule
exports.onExecutePostLogin = async (event, api) => {
  const permissions = event.authorization?.permissions || [];
  api.accessToken.setCustomClaim('permissions', permissions);
};
```

**Keycloak:**
```javascript
// Map roles to permissions in Keycloak client scope
// Add "permissions" mapper to access token
```

**Custom Auth:**
```typescript
const token = jwt.sign({
  sub: userId,
  permissions: user.permissions  // Include user permissions
}, secret);
```

**Prevention:**
- Verify permissions included in token claims
- Test with actual tokens from auth provider
- Document required permissions per operation

---

## Authentication Flow Debugging

### Development Mode Flow

```
1. Client → Gateway: X-Dev-User-Id + X-Dev-Permissions headers
2. Gateway: Validates headers, creates auth context
3. Gateway → Service: Message with authContext {userId, permissions}
4. Service: Receives authContext from message
```

**Debug:**

```bash
# Check dev headers accepted
docker logs api-gateway 2>&1 | grep "Development auth"

# Should see: "Using development auth" in logs
```

### JWT Mode Flow (HS256)

```
1. Client → Gateway: Authorization: Bearer <jwt>
2. Gateway: Decodes JWT header to get algorithm (HS256)
3. Gateway: Validates signature with JWT_SECRET
4. Gateway: Validates expiration, issuer (if configured)
5. Gateway: Extracts userId (sub) and permissions
6. Gateway → Service: Message with authContext
```

**Debug:**

```bash
# Check HS256 mode active
docker logs api-gateway 2>&1 | grep "Configured for HS256"

# Check JWT validation
docker logs api-gateway 2>&1 | grep "JWT validation\|token\|signature"
```

### JWKS Mode Flow (RS256)

```
1. Client → Gateway: Authorization: Bearer <jwt>
2. Gateway: Decodes JWT header to get algorithm (RS256) and kid
3. Gateway: Fetches public keys from JWKS_URI (cached 10 min)
4. Gateway: Finds matching public key by kid
5. Gateway: Validates signature with public key
6. Gateway: Validates expiration, issuer, audience (if configured)
7. Gateway: Extracts userId (sub) and permissions
8. Gateway → Service: Message with authContext
```

**Debug:**

```bash
# Check RS256 mode active
docker logs api-gateway 2>&1 | grep "Configured for RS256\|JWKS"

# Check JWKS fetch
docker logs api-gateway 2>&1 | grep "JWKS\|public key"

# Verify JWKS accessible
curl https://your-tenant.us.auth0.com/.well-known/jwks.json
```

---

## Configuration Examples

### Example 1: Development Mode Only (Local)

```yaml
api-gateway:
  environment:
    - DEVELOPMENT_AUTH_ENABLED=true
```

**Usage:**

```bash
curl -H "X-Dev-User-Id: test-user" \
     -H "X-Dev-Permissions: users:create,users:read" \
     http://localhost:3000/api/create-user
```

### Example 2: HS256 with Shared Secret

```yaml
api-gateway:
  environment:
    - JWT_SECRET=your-secret-key-min-32-characters-long
```

**Token Generation:**

```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign({
  sub: 'user-123',
  permissions: ['users:create', 'users:read']
}, 'your-secret-key-min-32-characters-long', {
  expiresIn: '1h'
});
```

### Example 3: Auth0 with RS256

```yaml
api-gateway:
  environment:
    - JWKS_URI=https://your-tenant.us.auth0.com/.well-known/jwks.json
    - JWT_ISSUER=https://your-tenant.us.auth0.com/  # Optional but recommended
    - JWT_AUDIENCE=https://api.yourapp.com  # Optional but recommended
```

**Auth0 Configuration:**
1. Create API in Auth0 dashboard
2. Set API identifier as JWT_AUDIENCE
3. Enable RBAC and include permissions in token
4. Configure rules/actions to add permissions claim

### Example 4: Keycloak with RS256

```yaml
api-gateway:
  environment:
    - JWKS_URI=https://keycloak.example.com/realms/myrealm/protocol/openid-connect/certs
    - JWT_ISSUER=https://keycloak.example.com/realms/myrealm
    - JWT_AUDIENCE=my-client-id
```

### Example 5: Development + Production (Flexible)

```yaml
api-gateway:
  environment:
    - DEVELOPMENT_AUTH_ENABLED=true  # For quick testing with headers
    - JWKS_URI=https://your-tenant.us.auth0.com/.well-known/jwks.json  # For real tokens
```

With this config, both development headers AND real JWTs work.

---

## Testing Authentication

### Test Development Headers

```bash
# Minimal test
curl -H "X-Dev-User-Id: test" \
     -H "X-Dev-Permissions: *" \
     http://localhost:3000/api/endpoint

# With specific permissions
curl -H "X-Dev-User-Id: user-123" \
     -H "X-Dev-Permissions: users:create,users:read,users:update" \
     http://localhost:3000/api/create-user
```

### Test HS256 JWT

```bash
# Generate token (using jwt.io or library)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test with token
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/endpoint
```

### Test RS256 JWT (Auth0)

```bash
# Get token from Auth0
# Using Auth0 test token or authentication flow

TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ii4uLiJ9..."

# Test with token
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/endpoint
```

### Decode and Inspect JWT

```bash
# Header
echo "$TOKEN" | cut -d. -f1 | base64 -d | jq

# Payload
echo "$TOKEN" | cut -d. -f2 | base64 -d | jq

# Check expiration
echo "$TOKEN" | cut -d. -f2 | base64 -d | jq '.exp'
date +%s  # Compare to current timestamp
```

---

## Common Error Messages

### "JWT missing required 'sub' claim"

**Solution:** Ensure token includes `sub` field with user ID

### "invalid algorithm"

**Solution:** Match JWT algorithm (HS256/RS256) with gateway configuration

### "invalid signature"

**Solution:** Verify JWT_SECRET matches or JWKS_URI is correct

### "jwt expired"

**Solution:** Refresh token or increase expiration time (dev only)

### "JWKS client not configured"

**Solution:** Set either JWT_SECRET or JWKS_URI in gateway environment

---

## Verification Steps

After fixing authentication:

### 1. Authentication Succeeds

```bash
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/endpoint

# Should return 200 OK (not 401)
```

### 2. User ID Extracted

```bash
# Check logs show user ID
docker logs api-gateway 2>&1 | tail -20

# Should see: "Authenticated user: user-123"
```

### 3. Permissions Available

```bash
# Request that requires permissions should work
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/create-user

# Should return 200 or 403 (if permissions wrong)
# NOT 401 (authentication works)
```

---

## Related Documentation

- [Authentication Concepts](../../02-core-concepts/authentication.md) - Authentication architecture
- [API Gateway Issues](../by-component/api-gateway-issues.md) - Gateway-specific troubleshooting
- [API Calls Failing](./api-calls-failing.md) - General API troubleshooting
- [Error Catalog](../common-errors/error-catalog.md#authentication--authorization-errors) - Error reference

---

## Summary

Most authentication errors are caused by:

1. **Development mode not enabled** - Set `DEVELOPMENT_AUTH_ENABLED=true` locally
2. **Missing `sub` claim** - Ensure JWT includes user ID in `sub` field
3. **Algorithm mismatch** - Match HS256/RS256 with gateway config
4. **Invalid signature** - Verify JWT_SECRET or JWKS_URI correct
5. **Expired token** - Refresh token or increase expiration

Always decode JWT to inspect structure, claims, and expiration before troubleshooting.
