---
title: Authentication
description: JWT authentication, token validation, and development mode for banyan-core services
category: Security
tags: [authentication, jwt, tokens, development-mode, jwks, oidc]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - overview.md
  - permission-based-authorization.md
  - external-auth-providers.md
  - rbac.md
---

# Authentication

This guide covers JWT-based authentication in banyan-core, including token generation, validation, and development mode for local testing.

## Use This Guide If...

- You're implementing user authentication flows
- You need to generate and validate JWT tokens
- You want to understand token structure and claims
- You're setting up development mode for testing
- You need to troubleshoot authentication issues

## Authentication Overview

Authentication in banyan-core answers the question: **"WHO is making this request?"**

The platform uses **JWT (JSON Web Tokens)** for stateless authentication:

1. User authenticates (login) → Receives JWT access token + refresh token
2. Client includes token in requests → `Authorization: Bearer <token>`
3. API Gateway validates token → Extracts user identity and permissions
4. Services receive authenticated user context → Apply business logic

## Token Types

### Access Token (Short-lived)

**Purpose**: Authenticate API requests
**Lifetime**: 5 minutes (configurable, typically 5-15 minutes)
**Storage**: Memory only (never localStorage)
**Revocation**: Cannot be revoked (expires naturally)

```json
{
  "sub": "user-123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "permissions": ["product:read", "product:create", "order:read"],
  "iat": 1705334400,
  "exp": 1705334700
}
```

### Refresh Token (Long-lived)

**Purpose**: Obtain new access tokens
**Lifetime**: 7 days (configurable)
**Storage**: Secure, HTTP-only cookie or secure storage
**Revocation**: Can be revoked in database

```json
{
  "sub": "user-123",
  "type": "refresh",
  "jti": "refresh-token-uuid",
  "iat": 1705334400,
  "exp": 1705939200
}
```

## JWT Validation Modes

The platform supports two JWT validation modes:

### Mode 1: HS256 (Shared Secret) - Simple

**When to use**: Development, small deployments, auth-service owns authentication
**Algorithm**: HMAC with SHA-256 (symmetric)
**Configuration**: Single shared secret

```bash
# Environment configuration
JWT_SECRET=your-secret-key-min-32-characters
```

**Characteristics:**
- ✓ Simple setup
- ✓ Fast validation
- ✓ No external dependencies
- ✗ Secret must be shared across services
- ✗ Cannot use external identity providers

### Mode 2: RS256 (JWKS) - Production

**When to use**: Production, external identity providers (Auth0, Okta, etc.)
**Algorithm**: RSA with SHA-256 (asymmetric)
**Configuration**: JWKS URI for public key discovery

```bash
# Environment configuration
JWKS_URI=https://your-identity-provider.com/.well-known/jwks.json
JWT_ISSUER=https://your-identity-provider.com/
JWT_AUDIENCE=https://your-api.com
```

**Characteristics:**
- ✓ No shared secrets needed
- ✓ Supports external identity providers
- ✓ Key rotation support
- ✓ Better security posture
- ✗ Requires JWKS endpoint
- ✗ Slightly slower validation

### Dual Mode (Both HS256 and RS256)

The API Gateway supports both modes simultaneously:

```bash
# Both modes enabled
JWT_SECRET=fallback-secret-for-internal-services
JWKS_URI=https://auth-provider.com/.well-known/jwks.json
JWT_ISSUER=https://auth-provider.com/
JWT_AUDIENCE=https://your-api.com
```

The gateway automatically detects the algorithm from the JWT header and validates accordingly.

## Token Generation (Auth Service)

The auth-service is responsible for generating JWT tokens after successful authentication.

### Generating Tokens

```typescript
// platform/services/auth-service/src/tokens/JWTManager.ts
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class JWTManager {
  private readonly secret: string;
  private readonly accessTokenExpiry: string = '5m';
  private readonly refreshTokenExpiry: string = '7d';

  constructor() {
    this.secret = process.env.JWT_SECRET || 'development-secret-key';

    // Security check
    if (process.env.NODE_ENV === 'production' && this.secret === 'development-secret-key') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  /**
   * Generate access token + refresh token pair
   */
  async generateTokenPair(userContext: {
    userId: string;
    email: string;
    permissions: string[];
    roles: string[];
  }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        sub: userContext.userId,
        email: userContext.email,
        name: userContext.email, // Or full name if available
        permissions: userContext.permissions,
        roles: userContext.roles,
      },
      this.secret,
      {
        algorithm: 'HS256',
        expiresIn: this.accessTokenExpiry,
      }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        sub: userContext.userId,
        type: 'refresh',
        jti: uuidv4(), // Unique token ID for revocation
      },
      this.secret,
      {
        algorithm: 'HS256',
        expiresIn: this.refreshTokenExpiry,
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using valid refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Validate refresh token
      const decoded = jwt.verify(refreshToken, this.secret) as {
        sub: string;
        type: string;
        jti: string;
      };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // TODO: Check if refresh token has been revoked in database
      // const isRevoked = await this.checkTokenRevocation(decoded.jti);
      // if (isRevoked) throw new Error('Token has been revoked');

      // Query user's current permissions (may have changed since token issued)
      const user = await this.getUserById(decoded.sub);
      const permissions = await this.getUserPermissions(user);
      const roles = await this.getUserRoles(user);

      // Generate new access token with current permissions
      return jwt.sign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          permissions,
          roles,
        },
        this.secret,
        {
          algorithm: 'HS256',
          expiresIn: this.accessTokenExpiry,
        }
      );
    } catch (error) {
      throw new Error('Failed to refresh token: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
```

### Token Claims

Standard claims included in access tokens:

| Claim | Description | Example |
|-------|-------------|---------|
| `sub` | Subject (User ID) | `"user-123"` |
| `email` | User email address | `"alice@example.com"` |
| `name` | User display name | `"Alice Smith"` |
| `permissions` | Array of permissions | `["product:create", "order:read"]` |
| `roles` | Array of role names | `["manager", "user"]` |
| `iat` | Issued at timestamp | `1705334400` |
| `exp` | Expiry timestamp | `1705334700` |
| `iss` | Issuer (optional) | `"https://auth.example.com"` |
| `aud` | Audience (optional) | `"https://api.example.com"` |

## Token Validation (API Gateway)

The API Gateway validates JWTs on every request before routing to services.

### Validation Flow

```typescript
// platform/services/api-gateway/src/auth/JWTAuthenticationEngine.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export class JWTAuthenticationEngineImpl {
  private readonly validationMode: 'hs256' | 'rs256';
  private readonly jwtSecret?: string;
  private readonly jwksClient?: JwksClient;

  async validateJWTToken(token: string): Promise<AuthenticatedUser> {
    // 1. Remove "Bearer " prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // 2. Detect algorithm from token header
    const algorithm = this.detectTokenAlgorithm(cleanToken);

    // 3. Validate based on algorithm
    let decoded: JWTPayload;
    if (algorithm === 'HS256' && this.jwtSecret) {
      decoded = await this.validateHS256Token(cleanToken);
    } else if (algorithm === 'RS256' && this.jwksClient) {
      decoded = await this.validateRS256Token(cleanToken);
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // 4. Extract permissions from claims
    const permissions = this.extractPermissionsFromClaims(decoded);

    // 5. Build authenticated user object
    return {
      userId: decoded.sub,
      email: decoded.email || `${decoded.sub}@unknown`,
      name: decoded.name || decoded.sub,
      permissions,
    };
  }

  private async validateHS256Token(token: string): Promise<JWTPayload> {
    return jwt.verify(token, this.jwtSecret!) as JWTPayload;
  }

  private async validateRS256Token(token: string): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        if (!header.kid) {
          return callback(new Error('JWT header missing "kid" (key ID)'));
        }

        this.jwksClient?.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          const signingKey = key?.getPublicKey();
          callback(null, signingKey);
        });
      };

      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: this.jwtIssuer,
          audience: this.jwtAudience,
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as JWTPayload);
        }
      );
    });
  }

  private extractPermissionsFromClaims(decoded: JWTPayload): string[] {
    // Check for direct permissions array
    if (Array.isArray(decoded.permissions)) {
      return decoded.permissions;
    }

    // Check for namespaced permissions (Auth0 pattern)
    for (const key of Object.keys(decoded)) {
      if (key.includes('permissions') && Array.isArray(decoded[key])) {
        return decoded[key] as string[];
      }
    }

    // Check for OAuth2 scope claim (space-separated)
    if (typeof decoded.scope === 'string') {
      return decoded.scope.split(' ').filter(Boolean);
    }

    return [];
  }
}
```

### Validation Errors

Common validation errors and their meanings:

| Error | Meaning | HTTP Status |
|-------|---------|-------------|
| `TokenExpiredError` | Token has expired | 401 Unauthorized |
| `JsonWebTokenError` | Invalid signature or malformed token | 401 Unauthorized |
| `Missing "kid"` | RS256 token missing key ID | 401 Unauthorized |
| `JWKS fetch failed` | Cannot reach JWKS endpoint | 503 Service Unavailable |
| `Missing "sub" claim` | Token missing required subject claim | 401 Unauthorized |

## Development Mode

For local development and testing, the platform supports **development auth mode** that bypasses JWT validation.

### Enabling Development Mode

```bash
# .env or docker-compose.yml
DEVELOPMENT_AUTH_ENABLED=true
```

⚠️ **WARNING**: NEVER set this in production! The API Gateway will reject development headers if this variable is not explicitly set to `"true"`.

### Using Development Headers

Instead of JWT tokens, send these headers:

```bash
# Required header
X-Dev-User-Id: test-user-123

# Optional permissions header (comma-separated)
X-Dev-Permissions: product:create,product:read,order:read,order:create
```

### Example Development Request

```bash
# Using curl
curl -X POST http://localhost:3000/api/create-product \
  -H "X-Dev-User-Id: alice" \
  -H "X-Dev-Permissions: product:create,product:read" \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":29.99,"categoryId":"cat-1"}'

# Using fetch
fetch('http://localhost:3000/api/create-product', {
  method: 'POST',
  headers: {
    'X-Dev-User-Id': 'alice',
    'X-Dev-Permissions': 'product:create,product:read',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Widget',
    price: 29.99,
    categoryId: 'cat-1',
  }),
});
```

### Development Mode Security

The gateway creates a mock authenticated user:

```typescript
handleDevelopmentMode(headers: HttpHeaders): AuthenticatedUser | null {
  // Only works if explicitly enabled
  if (!this.developmentAuthEnabled) {
    return null;
  }

  const devUserId = headers['X-Dev-User-Id'] || headers['x-dev-user-id'];
  const devPermissions = headers['X-Dev-Permissions'] || headers['x-dev-permissions'];

  if (!devUserId) {
    return null;
  }

  const permissions = devPermissions
    ? devPermissions.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  return {
    userId: devUserId,
    email: `${devUserId}@development.local`,
    name: `Development User ${devUserId}`,
    permissions,
  };
}
```

## Authentication Flows

### Flow 1: Username/Password Login

```
┌──────┐                          ┌──────────────┐
│Client│                          │ Auth Service │
└──┬───┘                          └──────┬───────┘
   │                                     │
   │ POST /api/login                     │
   │ { email, password }                 │
   ├────────────────────────────────────>│
   │                                     │
   │                        Validate credentials
   │                        Query user permissions
   │                        Generate JWT tokens
   │                                     │
   │ { accessToken, refreshToken }       │
   │<────────────────────────────────────┤
   │                                     │
   │ Store tokens securely               │
   │                                     │
```

### Flow 2: Token Refresh

```
┌──────┐                          ┌──────────────┐
│Client│                          │ Auth Service │
└──┬───┘                          └──────┬───────┘
   │                                     │
   │ POST /api/refresh-token             │
   │ { refreshToken }                    │
   ├────────────────────────────────────>│
   │                                     │
   │                        Validate refresh token
   │                        Check not revoked
   │                        Query current permissions
   │                        Generate new access token
   │                                     │
   │ { accessToken }                     │
   │<────────────────────────────────────┤
   │                                     │
```

### Flow 3: External Provider (Auth0, Okta)

See [external-auth-providers.md](./external-auth-providers.md) for complete details.

```
┌──────┐    ┌─────────┐    ┌──────────────┐
│Client│    │Auth0/etc│    │ Auth Service │
└──┬───┘    └────┬────┘    └──────┬───────┘
   │             │                │
   │ Login redirect               │
   ├────────────>│                │
   │             │                │
   │ External JWT                 │
   │<────────────┤                │
   │             │                │
   │ Validate external JWT        │
   │ (in business service)        │
   │             │                │
   │ POST /api/authenticate-external-user
   │ { externalProvider, externalUserId, email, name }
   ├─────────────────────────────>│
   │             │                │
   │             │   Link identity or create user
   │             │   Query permissions
   │             │   Generate platform JWT
   │             │                │
   │ { accessToken, refreshToken }│
   │<───────────────────────────────┤
```

## Security Best Practices

### 1. Token Expiry Configuration

```bash
# Access tokens: Short-lived (5-15 minutes)
ACCESS_TOKEN_EXPIRY=5m

# Refresh tokens: Long-lived (7-30 days)
REFRESH_TOKEN_EXPIRY=7d
```

**Rationale:**
- Short access tokens limit exposure if compromised
- Long refresh tokens reduce re-authentication friction
- Refresh tokens can be revoked if stolen

### 2. Token Storage

```typescript
// ✓ GOOD: Memory only (React state, Vue store)
const [accessToken, setAccessToken] = useState<string | null>(null);

// ✗ BAD: localStorage (vulnerable to XSS)
localStorage.setItem('accessToken', token); // DON'T DO THIS

// ✓ GOOD: Refresh token in HTTP-only cookie
// Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

### 3. Secure Transmission

```bash
# ✓ Always use HTTPS in production
FORCE_HTTPS=true

# ✓ Configure secure headers
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
```

### 4. Secret Management

```bash
# ✗ BAD: Weak secret
JWT_SECRET=secret

# ✓ GOOD: Strong random secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)

# ✓ BETTER: Use key management service
JWT_SECRET=${KMS_DECRYPT(encrypted_secret)}
```

### 5. Token Revocation

Implement refresh token revocation for security events:

```typescript
// Store refresh tokens in database
interface RefreshToken {
  id: string;           // jti claim
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

// Revoke on:
// - User logout
// - Password change
// - Suspicious activity
// - User deleted/deactivated
async revokeRefreshToken(tokenId: string, reason: string) {
  await db.updateRefreshToken(tokenId, {
    revoked: true,
    revokedAt: new Date(),
    revokedReason: reason,
  });
}
```

## Troubleshooting Authentication

### Problem: "JWT validation failed: Invalid signature"

**Causes:**
- JWT_SECRET mismatch between auth-service and api-gateway
- Token signed with different algorithm than expected
- Token tampered with

**Solutions:**
```bash
# Ensure same secret across services
echo $JWT_SECRET  # Check in both auth-service and api-gateway

# Verify token structure
echo "eyJhbGc..." | base64 -d  # Decode header and payload

# Check algorithm in token header
{"alg":"HS256","typ":"JWT"}  # Should match configuration
```

### Problem: "Token has expired"

**Causes:**
- Access token lifetime exceeded (expected after 5 minutes)
- Clock skew between services

**Solutions:**
```bash
# Use refresh token to get new access token
POST /api/refresh-token

# Check server time synchronization
timedatectl status  # Ensure NTP sync enabled

# Add clock skew tolerance (gateway configuration)
JWT_CLOCK_TOLERANCE=30  # Allow 30 seconds skew
```

### Problem: "Development headers not working"

**Causes:**
- `DEVELOPMENT_AUTH_ENABLED` not set to `"true"`
- Header name typo

**Solutions:**
```bash
# Verify environment variable
echo $DEVELOPMENT_AUTH_ENABLED  # Must be exactly "true"

# Check exact header names (case-insensitive)
X-Dev-User-Id: alice        # ✓ Works
x-dev-user-id: alice        # ✓ Works
X_Dev_User_Id: alice        # ✗ Wrong format

# Verify in gateway logs
grep "Development mode" gateway.log
```

### Problem: "JWKS fetch failed"

**Causes:**
- JWKS_URI unreachable
- Network/firewall issues
- Invalid JWKS_URI

**Solutions:**
```bash
# Test JWKS endpoint manually
curl https://your-provider.com/.well-known/jwks.json

# Check network connectivity from gateway
docker exec api-gateway curl https://your-provider.com/.well-known/jwks.json

# Verify JWKS_URI configuration
echo $JWKS_URI  # Should be HTTPS, not HTTP
```

## Production Deployment Checklist

Before deploying authentication to production:

- [ ] `JWT_SECRET` is cryptographically random (32+ characters)
- [ ] `DEVELOPMENT_AUTH_ENABLED` is NOT set (or explicitly false)
- [ ] HTTPS/TLS is enforced for all endpoints
- [ ] Token expiry is configured appropriately (5-15 min access, 7-30 day refresh)
- [ ] Refresh token revocation is implemented
- [ ] Failed authentication attempts are logged and monitored
- [ ] Rate limiting is enabled on login endpoints
- [ ] CORS is configured correctly
- [ ] Security headers are set (HSTS, CSP, X-Frame-Options)
- [ ] Token rotation strategy is documented

## Next Steps

Now that you understand authentication:

1. **Layer 1 Authorization**: Learn [permission-based authorization](./permission-based-authorization.md)
2. **Layer 2 Authorization**: Implement [policy-based authorization](./policy-based-authorization.md)
3. **RBAC**: Configure [role-based access control](./rbac.md)
4. **External Providers**: Integrate [external auth providers](./external-auth-providers.md)

## Related Guides

- [Security Architecture Overview](./overview.md) - Two-layer authorization model
- [Permission-Based Authorization](./permission-based-authorization.md) - Layer 1 at API Gateway
- [External Auth Providers](./external-auth-providers.md) - Auth0, Okta, OIDC integration
- [RBAC](./rbac.md) - Role-based access control implementation
