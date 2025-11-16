---
title: External Auth Providers Integration
description: Integrate Auth0, Okta, Google, and other OIDC providers with banyan-core
category: Security
tags: [authentication, auth0, okta, oidc, sso, external-auth, jwks]
difficulty: advanced
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - overview.md
  - authentication.md
  - permission-based-authorization.md
  - rbac.md
---

# External Auth Providers Integration

This guide covers integrating external identity providers (Auth0, Okta, Google, etc.) with banyan-core while maintaining the platform's permission model.

## Use This Guide If...

- You're integrating Auth0, Okta, or another OIDC provider
- You want to use corporate SSO for authentication
- You need to support multiple identity providers
- You're implementing social login (Google, GitHub, etc.)
- You want to understand external token validation

## External Auth Architecture

### Critical Pattern: Business Services Validate External Tokens

⚠️ **IMPORTANT**: In banyan-core, **business services** validate external tokens, NOT the auth-service or API Gateway.

This pattern enables:
- Business services to use ANY external provider without platform changes
- Decoupled authentication - each service can use different providers
- No platform-level provider configuration needed
- Flexibility to change providers without affecting the platform

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌──────────────┐
│ Client  │     │ Auth0/  │     │  Business    │     │    Auth      │
│         │     │  Okta   │     │  Service     │     │  Service     │
└────┬────┘     └────┬────┘     └──────┬───────┘     └──────┬───────┘
     │               │                 │                     │
     │ 1. Login      │                 │                     │
     ├──────────────>│                 │                     │
     │               │                 │                     │
     │ 2. External JWT (Auth0 token)  │                     │
     │<──────────────┤                 │                     │
     │               │                 │                     │
     │ 3. Send external token to business service           │
     ├─────────────────────────────────>│                    │
     │               │                  │                    │
     │               │  4. Business service validates token  │
     │               │     via JWKS (Auth0 public key)      │
     │               │<─────────────────┤                    │
     │               │                  │                    │
     │               │  5. Extract user identity from token │
     │               │     (sub, email, name)               │
     │               │                  │                    │
     │               │  6. Call AuthenticateExternalUser    │
     │               │     (NO external token passed)       │
     │               │                  ├───────────────────>│
     │               │                  │                    │
     │               │                  │ 7. Auth service:   │
     │               │                  │    - Links identity│
     │               │                  │    - Queries perms │
     │               │                  │    - Generates JWT │
     │               │                  │                    │
     │               │  8. Platform JWT (banyan-core token) │
     │               │                  │<───────────────────┤
     │               │                  │                    │
     │ 9. Return platform JWT          │                    │
     │<─────────────────────────────────┤                    │
     │               │                  │                    │
     │ 10. Use platform JWT for subsequent requests         │
     │               │                  │                    │
```

### Key Principles

1. **Business Service Validates**: Business service validates external JWT using JWKS
2. **No Token Forwarding**: External token is NOT sent to auth-service
3. **Identity Extraction**: Business service extracts user identity (sub, email, name)
4. **Platform Token Exchange**: Call `AuthenticateExternalUser` with identity, get platform JWT
5. **Database Permissions**: Platform JWT contains permissions from database, not external provider

## Auth0 Integration

### Step 1: Configure Auth0

```bash
# Auth0 tenant settings
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# JWKS endpoint for token validation
AUTH0_JWKS_URI=https://your-tenant.auth0.com/.well-known/jwks.json
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://your-api.com
```

### Step 2: Validate Auth0 Token in Business Service

```typescript
// File: src/auth/Auth0TokenValidator.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export class Auth0TokenValidator {
  private readonly jwksClient: jwksClient.JwksClient;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: process.env.AUTH0_JWKS_URI!,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    this.issuer = process.env.AUTH0_ISSUER!;
    this.audience = process.env.AUTH0_AUDIENCE!;
  }

  /**
   * Validate Auth0 JWT token
   * Returns decoded token payload with user identity
   */
  async validateToken(token: string): Promise<{
    sub: string;
    email: string;
    name: string;
    [key: string]: unknown;
  }> {
    return new Promise((resolve, reject) => {
      // Get signing key from JWKS
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        if (!header.kid) {
          return callback(new Error('Auth0 JWT missing "kid" claim'));
        }

        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) {
            return callback(err);
          }
          const signingKey = key?.getPublicKey();
          callback(null, signingKey);
        });
      };

      // Verify token with Auth0 public key
      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: this.issuer,
          audience: this.audience,
        },
        (err, decoded) => {
          if (err) {
            return reject(new Error(`Auth0 token validation failed: ${err.message}`));
          }

          const payload = decoded as any;

          // Extract required fields
          if (!payload.sub) {
            return reject(new Error('Auth0 token missing "sub" claim'));
          }

          resolve({
            sub: payload.sub,
            email: payload.email || `${payload.sub}@auth0`,
            name: payload.name || payload.email || payload.sub,
            ...payload,
          });
        }
      );
    });
  }
}
```

### Step 3: Exchange for Platform JWT

```typescript
// File: src/auth/ExternalAuthService.ts
import { AuthServiceClient } from '@banyanai/platform-client-system';

export class ExternalAuthService {
  private readonly auth0Validator: Auth0TokenValidator;
  private readonly authServiceClient: AuthServiceClient;

  constructor() {
    this.auth0Validator = new Auth0TokenValidator();
    this.authServiceClient = new AuthServiceClient();
  }

  /**
   * Authenticate user with Auth0 token
   * Returns platform JWT with database permissions
   */
  async authenticateWithAuth0(auth0Token: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      permissions: string[];
    };
  }> {
    // 1. Validate Auth0 token (CRITICAL: Business service validates!)
    const auth0User = await this.auth0Validator.validateToken(auth0Token);

    // 2. Extract identity from validated token
    const externalProvider = 'auth0';
    const externalUserId = auth0User.sub;  // e.g., "auth0|123456"
    const email = auth0User.email;
    const name = auth0User.name;

    // 3. Exchange for platform JWT (NO external token sent!)
    const result = await this.authServiceClient.authenticateExternalUser({
      externalProvider,    // 'auth0'
      externalUserId,     // auth0User.sub
      email,              // from validated token
      name,               // from validated token
      metadata: {
        // Optional: Include additional Auth0 claims
        auth0UserId: auth0User.sub,
        auth0Metadata: auth0User.user_metadata,
        // ... other custom claims
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Authentication failed');
    }

    return {
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
      user: result.user!,
    };
  }
}
```

### Step 4: Use in API Endpoint

```typescript
// File: src/routes/auth.ts
import express from 'express';

const router = express.Router();
const externalAuthService = new ExternalAuthService();

/**
 * POST /auth/auth0
 * Exchange Auth0 token for platform JWT
 */
router.post('/auth/auth0', async (req, res) => {
  try {
    const { auth0Token } = req.body;

    if (!auth0Token) {
      return res.status(400).json({ error: 'auth0Token is required' });
    }

    // Validate Auth0 token and get platform JWT
    const result = await externalAuthService.authenticateWithAuth0(auth0Token);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: 'Bearer',
      expiresIn: 300, // 5 minutes
      user: result.user,
    });
  } catch (error) {
    console.error('Auth0 authentication failed:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

## Okta Integration

### Step 1: Configure Okta

```bash
# Okta settings
OKTA_DOMAIN=your-org.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret

# JWKS endpoint
OKTA_JWKS_URI=https://your-org.okta.com/oauth2/default/v1/keys
OKTA_ISSUER=https://your-org.okta.com/oauth2/default
OKTA_AUDIENCE=api://default
```

### Step 2: Validate Okta Token

```typescript
// File: src/auth/OktaTokenValidator.ts
export class OktaTokenValidator {
  private readonly jwksClient: jwksClient.JwksClient;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: process.env.OKTA_JWKS_URI!,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    this.issuer = process.env.OKTA_ISSUER!;
    this.audience = process.env.OKTA_AUDIENCE!;
  }

  async validateToken(token: string): Promise<{
    sub: string;
    email: string;
    name: string;
    [key: string]: unknown;
  }> {
    return new Promise((resolve, reject) => {
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        if (!header.kid) {
          return callback(new Error('Okta JWT missing "kid" claim'));
        }

        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          callback(null, key?.getPublicKey());
        });
      };

      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: this.issuer,
          audience: this.audience,
        },
        (err, decoded) => {
          if (err) {
            return reject(new Error(`Okta token validation failed: ${err.message}`));
          }

          const payload = decoded as any;

          if (!payload.sub) {
            return reject(new Error('Okta token missing "sub" claim'));
          }

          resolve({
            sub: payload.sub,
            email: payload.email || payload.preferred_username || `${payload.sub}@okta`,
            name: payload.name || payload.email || payload.sub,
            ...payload,
          });
        }
      );
    });
  }
}
```

### Step 3: Exchange for Platform JWT

```typescript
async authenticateWithOkta(oktaToken: string): Promise<AuthResult> {
  // 1. Validate Okta token
  const oktaUser = await this.oktaValidator.validateToken(oktaToken);

  // 2. Exchange for platform JWT
  const result = await this.authServiceClient.authenticateExternalUser({
    externalProvider: 'okta',
    externalUserId: oktaUser.sub,
    email: oktaUser.email,
    name: oktaUser.name,
    metadata: {
      oktaUserId: oktaUser.sub,
      oktaGroups: oktaUser.groups, // If using Okta groups
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Authentication failed');
  }

  return {
    accessToken: result.accessToken!,
    refreshToken: result.refreshToken!,
    user: result.user!,
  };
}
```

## Google Integration (OIDC)

### Step 1: Configure Google

```bash
# Google OAuth settings
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# JWKS endpoint
GOOGLE_JWKS_URI=https://www.googleapis.com/oauth2/v3/certs
GOOGLE_ISSUER=https://accounts.google.com
GOOGLE_AUDIENCE=your-client-id.apps.googleusercontent.com
```

### Step 2: Validate Google Token

```typescript
export class GoogleTokenValidator {
  private readonly jwksClient: jwksClient.JwksClient;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
      cache: true,
      cacheMaxAge: 600000,
    });

    this.issuer = 'https://accounts.google.com';
    this.audience = process.env.GOOGLE_CLIENT_ID!;
  }

  async validateToken(token: string): Promise<{
    sub: string;
    email: string;
    name: string;
    picture?: string;
    [key: string]: unknown;
  }> {
    return new Promise((resolve, reject) => {
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        if (!header.kid) {
          return callback(new Error('Google JWT missing "kid" claim'));
        }

        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          callback(null, key?.getPublicKey());
        });
      };

      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: this.issuer,
          audience: this.audience,
        },
        (err, decoded) => {
          if (err) {
            return reject(new Error(`Google token validation failed: ${err.message}`));
          }

          const payload = decoded as any;

          // Google tokens include email_verified claim
          if (!payload.email_verified) {
            return reject(new Error('Google email not verified'));
          }

          resolve({
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.email,
            picture: payload.picture,
            ...payload,
          });
        }
      );
    });
  }
}
```

### Step 3: Exchange for Platform JWT

```typescript
async authenticateWithGoogle(googleToken: string): Promise<AuthResult> {
  // 1. Validate Google token
  const googleUser = await this.googleValidator.validateToken(googleToken);

  // 2. Exchange for platform JWT
  const result = await this.authServiceClient.authenticateExternalUser({
    externalProvider: 'google',
    externalUserId: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name,
    metadata: {
      googleUserId: googleUser.sub,
      picture: googleUser.picture,
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Authentication failed');
  }

  return {
    accessToken: result.accessToken!,
    refreshToken: result.refreshToken!,
    user: result.user!,
  };
}
```

## Generic OIDC Provider

For any OIDC-compliant provider:

```typescript
export class OIDCTokenValidator {
  private readonly jwksClient: jwksClient.JwksClient;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(config: {
    jwksUri: string;
    issuer: string;
    audience: string;
  }) {
    this.jwksClient = jwksClient({
      jwksUri: config.jwksUri,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    this.issuer = config.issuer;
    this.audience = config.audience;
  }

  async validateToken(token: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        if (!header.kid) {
          return callback(new Error('OIDC JWT missing "kid" claim'));
        }

        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          callback(null, key?.getPublicKey());
        });
      };

      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: this.issuer,
          audience: this.audience,
        },
        (err, decoded) => {
          if (err) {
            return reject(new Error(`OIDC token validation failed: ${err.message}`));
          }
          resolve(decoded as Record<string, unknown>);
        }
      );
    });
  }
}
```

## Multi-Provider Support

Support multiple providers in the same service:

```typescript
export class MultiProviderAuthService {
  private readonly auth0Validator: Auth0TokenValidator;
  private readonly oktaValidator: OktaTokenValidator;
  private readonly googleValidator: GoogleTokenValidator;
  private readonly authServiceClient: AuthServiceClient;

  constructor() {
    this.auth0Validator = new Auth0TokenValidator();
    this.oktaValidator = new OktaTokenValidator();
    this.googleValidator = new GoogleTokenValidator();
    this.authServiceClient = new AuthServiceClient();
  }

  /**
   * Authenticate user with any supported provider
   * Detects provider from token issuer
   */
  async authenticate(token: string, provider?: string): Promise<AuthResult> {
    // If provider not specified, detect from token
    if (!provider) {
      provider = this.detectProvider(token);
    }

    let externalUser: {
      sub: string;
      email: string;
      name: string;
      [key: string]: unknown;
    };

    // Validate with appropriate provider
    switch (provider) {
      case 'auth0':
        externalUser = await this.auth0Validator.validateToken(token);
        break;
      case 'okta':
        externalUser = await this.oktaValidator.validateToken(token);
        break;
      case 'google':
        externalUser = await this.googleValidator.validateToken(token);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Exchange for platform JWT
    const result = await this.authServiceClient.authenticateExternalUser({
      externalProvider: provider,
      externalUserId: externalUser.sub,
      email: externalUser.email,
      name: externalUser.name,
      metadata: {
        provider,
        externalClaims: externalUser,
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Authentication failed');
    }

    return {
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
      user: result.user!,
    };
  }

  private detectProvider(token: string): string {
    // Decode token without verification to check issuer
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.payload) {
      throw new Error('Invalid JWT token');
    }

    const payload = decoded.payload as any;
    const issuer = payload.iss;

    if (issuer?.includes('auth0.com')) return 'auth0';
    if (issuer?.includes('okta.com')) return 'okta';
    if (issuer === 'https://accounts.google.com') return 'google';

    throw new Error(`Unknown token issuer: ${issuer}`);
  }
}
```

## API Gateway Configuration for External Providers

The API Gateway can also validate external tokens directly:

```bash
# .env for api-gateway
# Enable JWKS validation for external providers
JWKS_URI=https://your-provider.com/.well-known/jwks.json
JWT_ISSUER=https://your-provider.com/
JWT_AUDIENCE=https://your-api.com
```

This allows clients to use external tokens directly without token exchange (advanced scenario).

## User Identity Linking

The auth-service automatically handles identity linking:

### First Login (New User)

```
User logs in with Auth0
→ AuthenticateExternalUser called
→ No existing user with auth0|123456
→ Create new user with external identity
→ Return platform JWT
```

### Subsequent Logins (Existing User)

```
User logs in with Auth0 again
→ AuthenticateExternalUser called
→ User found with auth0|123456
→ Query current permissions from database
→ Return platform JWT with latest permissions
```

### Linking Multiple Identities

```
User has Auth0 identity (auth0|123456)
User logs in with Google (google-oauth2|789)
→ AuthenticateExternalUser called
→ User found by email
→ Link Google identity to existing user
→ User now has both identities:
  - auth0|123456
  - google-oauth2|789
→ Can authenticate with either provider
```

## Security Best Practices

### 1. Always Validate External Tokens

```typescript
// ✓ GOOD: Validate token before exchanging
const externalUser = await validator.validateToken(externalToken);
const result = await authService.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: externalUser.sub,
  email: externalUser.email,
  name: externalUser.name,
});

// ✗ BAD: Trusting client-provided identity without validation
const result = await authService.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: req.body.userId,  // NOT validated!
  email: req.body.email,
  name: req.body.name,
});
```

### 2. Verify Token Issuer and Audience

```typescript
// Always specify issuer and audience in validation
jwt.verify(token, getKey, {
  algorithms: ['RS256'],
  issuer: 'https://your-provider.com/',     // Required
  audience: 'https://your-api.com',         // Required
}, callback);
```

### 3. Handle Token Expiry

```typescript
try {
  const externalUser = await validator.validateToken(token);
} catch (error) {
  if (error.message.includes('expired')) {
    // Prompt user to refresh token with provider
    throw new Error('External token has expired. Please log in again.');
  }
  throw error;
}
```

### 4. Secure JWKS Caching

```typescript
// Enable caching to reduce JWKS requests
this.jwksClient = jwksClient({
  jwksUri: process.env.JWKS_URI!,
  cache: true,
  cacheMaxAge: 600000,  // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,  // Prevent abuse
});
```

### 5. Audit External Authentications

```typescript
Logger.info('External authentication successful', {
  provider: 'auth0',
  externalUserId: externalUser.sub,
  email: externalUser.email,
  isNewUser: result.isNewUser,
  identityLinked: result.identityLinked,
  platformUserId: result.user?.id,
});
```

## Testing External Auth

### Unit Testing Token Validation

```typescript
import { describe, expect, test, jest } from '@jest/globals';
import { Auth0TokenValidator } from '../auth/Auth0TokenValidator.js';
import jwt from 'jsonwebtoken';

describe('Auth0TokenValidator', () => {
  test('should validate valid Auth0 token', async () => {
    // Create mock JWKS client
    const mockJwksClient = {
      getSigningKey: jest.fn((kid, callback) => {
        callback(null, {
          getPublicKey: () => publicKey,
        });
      }),
    };

    // ... test implementation
  });

  test('should reject expired tokens', async () => {
    const expiredToken = 'expired-jwt';

    await expect(
      validator.validateToken(expiredToken)
    ).rejects.toThrow('expired');
  });

  test('should reject tokens with wrong issuer', async () => {
    const wrongIssuerToken = 'wrong-issuer-jwt';

    await expect(
      validator.validateToken(wrongIssuerToken)
    ).rejects.toThrow('issuer');
  });
});
```

### Integration Testing

```typescript
describe('External Auth Flow', () => {
  test('should create new user on first Auth0 login', async () => {
    const auth0Token = await getTestAuth0Token();

    const result = await externalAuthService.authenticateWithAuth0(auth0Token);

    expect(result.user.isNewUser).toBe(true);
    expect(result.accessToken).toBeDefined();
    expect(result.user.permissions).toBeInstanceOf(Array);
  });

  test('should link identity for existing user', async () => {
    // Create user with email
    const existingUser = await createTestUser({ email: 'test@example.com' });

    // Login with Auth0 (same email)
    const auth0Token = await getTestAuth0Token({ email: 'test@example.com' });
    const result = await externalAuthService.authenticateWithAuth0(auth0Token);

    expect(result.user.isNewUser).toBe(false);
    expect(result.user.id).toBe(existingUser.id);
  });
});
```

## Troubleshooting

### Problem: "JWKS fetch failed"

**Causes:**
- JWKS_URI unreachable
- Network/firewall issues
- Invalid URI

**Solutions:**
```bash
# Test JWKS endpoint
curl https://your-provider.com/.well-known/jwks.json

# Check from service
docker exec business-service curl https://your-provider.com/.well-known/jwks.json
```

### Problem: "Token validation failed: invalid signature"

**Causes:**
- Wrong JWKS_URI
- Token not from expected provider
- Kid not found in JWKS

**Solutions:**
```typescript
// Verify token issuer matches configuration
const decoded = jwt.decode(token, { complete: true });
console.log('Token issuer:', decoded.payload.iss);
console.log('Expected issuer:', process.env.AUTH0_ISSUER);
```

### Problem: "User created but permissions not found"

**Cause:**
- User created with external identity but no roles/permissions assigned

**Solution:**
```typescript
// Assign default role to new external users
if (result.isNewUser) {
  await authService.assignRoleToUser({
    userId: result.user.id,
    roleId: 'default-user-role',
  });
}
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Sending External Token to Auth Service

```typescript
// ✗ BAD: Sending external token to auth-service
await authService.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: 'auth0|123',
  externalToken: auth0Token,  // Don't do this!
});

// ✓ GOOD: Business service validates, only sends identity
const validated = await validator.validateToken(auth0Token);
await authService.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: validated.sub,
  email: validated.email,
  name: validated.name,
});
```

### ❌ Mistake 2: Not Validating External Tokens

```typescript
// ✗ BAD: Trusting client without validation
const identity = req.body; // Client can send anything!
await authService.authenticateExternalUser(identity);

// ✓ GOOD: Validate token first
const validated = await validator.validateToken(req.body.token);
await authService.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: validated.sub,
  email: validated.email,
  name: validated.name,
});
```

### ❌ Mistake 3: Using External Provider Permissions

```typescript
// ✗ BAD: Using Auth0 permissions directly
const auth0Permissions = auth0User.permissions;
// These permissions bypass platform's permission system!

// ✓ GOOD: Platform JWT has database permissions
const platformJWT = await authService.authenticateExternalUser(...);
// platformJWT contains permissions from platform database
```

## Next Steps

Now that you understand external auth providers:

1. **Security Overview**: Review [security architecture](./overview.md)
2. **Authentication**: Understand [JWT authentication](./authentication.md)
3. **RBAC**: Configure [roles and permissions](./rbac.md)

## Related Guides

- [Security Overview](./overview.md) - Two-layer authorization model
- [Authentication](./authentication.md) - JWT tokens and validation
- [Permission-Based Authorization](./permission-based-authorization.md) - Layer 1
- [Policy-Based Authorization](./policy-based-authorization.md) - Layer 2
- [RBAC](./rbac.md) - Role-based access control
