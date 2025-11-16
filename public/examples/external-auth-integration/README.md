# External Auth Integration Example - Auth0 / OIDC

## Overview

This example demonstrates how to integrate external identity providers (Auth0, Okta, Google Workspace, custom OIDC) with a business service. The **critical insight** is that **business services validate tokens themselves** - they do NOT forward tokens to the auth-service for validation.

## Critical Architecture Pattern

### ❌ WRONG: Forwarding tokens to auth-service

```
Browser → Business Service → Auth-Service (validates token) → Business Service
```

**Why this is wrong**: Creates tight coupling and single point of failure.

### ✅ CORRECT: Business service validates tokens

```
Browser → Business Service (validates token via JWKS) → Auth-Service (get/create user)
```

**Why this is correct**:
- Business service independently validates JWT using JWKS
- Auth-service only handles user management (get/create)
- No runtime dependency on auth-service for authentication
- Better performance and reliability

## What You'll Learn

- JWT validation with JWKS (JSON Web Key Set)
- Auth0 / OIDC integration patterns
- Token claims extraction and mapping
- Integration with platform auth-service for user management
- Security best practices for external auth
- Token caching and performance optimization

## Prerequisites

- Auth0 account (free tier works) or other OIDC provider
- Understanding of JWT and OAuth 2.0 / OIDC
- Node.js 20+
- pnpm installed

## Service Architecture

### Authentication Flow

```
1. User logs in with Auth0 → Receives Auth0 JWT
2. Browser sends Auth0 JWT to business service
3. Business service validates JWT signature via JWKS
4. Business service extracts user claims (sub, email, name)
5. Business service calls auth-service to get/create platform user
6. Auth-service returns platform JWT with database permissions
7. Business service uses platform JWT for subsequent requests
```

### Key Components

**In Business Service:**
- **JwksClient**: Fetches and caches public keys from Auth0
- **TokenValidator**: Validates JWT signature and claims
- **AuthMiddleware**: Express/HTTP middleware for authentication
- **LoginHandler**: Exchanges Auth0 identity for platform token

**In Platform Auth-Service:**
- **AuthenticateExternalUser**: Command to get/create user from external identity
- Returns platform JWT with database permissions

## Critical Security Principles

### 1. Business Service Validates Tokens

The business service MUST validate external tokens using JWKS:

```typescript
// Business service validates Auth0 token
const claims = await tokenValidator.validate(auth0Token);

// Then exchanges identity for platform token
const platformToken = await authServiceClient.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: claims.sub,
  email: claims.email,
  name: claims.name
});
```

**Never** send the external token to auth-service for validation.

### 2. JWKS Key Caching

Cache JWKS keys with TTL to avoid performance issues:

```typescript
class JwksClient {
  private keyCache = new Map<string, { key: JsonWebKey; expiresAt: number }>();

  async getKey(kid: string): Promise<JsonWebKey> {
    const cached = this.keyCache.get(kid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.key;
    }

    // Fetch from JWKS endpoint
    const key = await this.fetchKey(kid);

    // Cache for 1 hour
    this.keyCache.set(kid, {
      key,
      expiresAt: Date.now() + 3600000
    });

    return key;
  }
}
```

### 3. Token Claims Validation

Validate ALL important claims:

```typescript
interface ValidationOptions {
  issuer: string;           // e.g., 'https://your-tenant.auth0.com/'
  audience: string;         // Your API identifier
  algorithms: string[];     // ['RS256']
  requiredClaims: string[]; // ['sub', 'email']
}

async validate(token: string): Promise<TokenClaims> {
  const decoded = this.decode(token);

  // Validate issuer
  if (decoded.iss !== this.options.issuer) {
    throw new Error('Invalid issuer');
  }

  // Validate audience
  if (!decoded.aud.includes(this.options.audience)) {
    throw new Error('Invalid audience');
  }

  // Validate expiration
  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  // Validate signature using JWKS
  await this.verifySignature(token, decoded.kid);

  return decoded;
}
```

### 4. Error Handling

Handle all error cases explicitly:

```typescript
try {
  const claims = await tokenValidator.validate(token);
} catch (error) {
  if (error.message === 'Token expired') {
    return res.status(401).json({ error: 'Token expired' });
  }
  if (error.message === 'Invalid signature') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  // Log unexpected errors
  Logger.error('Token validation failed', error);
  return res.status(500).json({ error: 'Authentication failed' });
}
```

## Code Walkthrough

### 1. JWKS Client

```typescript
// src/auth/JwksClient.ts
import { Logger } from '@banyanai/platform-telemetry';

interface JsonWebKey {
  kid: string;
  kty: string;
  use: string;
  n: string;
  e: string;
  alg: string;
}

export class JwksClient {
  private keyCache = new Map<string, { key: JsonWebKey; expiresAt: number }>();
  private readonly jwksUri: string;
  private readonly cacheTtlMs: number;

  constructor(jwksUri: string, cacheTtlMs = 3600000) {
    this.jwksUri = jwksUri;
    this.cacheTtlMs = cacheTtlMs;
  }

  async getKey(kid: string): Promise<JsonWebKey> {
    // Check cache first
    const cached = this.keyCache.get(kid);
    if (cached && cached.expiresAt > Date.now()) {
      Logger.debug('JWKS key cache hit', { kid });
      return cached.key;
    }

    Logger.debug('JWKS key cache miss, fetching', { kid });

    // Fetch JWKS from provider
    const response = await fetch(this.jwksUri);
    if (!response.ok) {
      throw new Error(\`Failed to fetch JWKS: \${response.statusText}\`);
    }

    const jwks = await response.json();
    const key = jwks.keys.find((k: JsonWebKey) => k.kid === kid);

    if (!key) {
      throw new Error(\`Key \${kid} not found in JWKS\`);
    }

    // Cache the key
    this.keyCache.set(kid, {
      key,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return key;
  }

  clearCache() {
    this.keyCache.clear();
  }
}
```

### 2. Token Validator

```typescript
// src/auth/TokenValidator.ts
import { verify, decode } from 'jsonwebtoken';
import { JwksClient } from './JwksClient.js';
import { Logger } from '@banyanai/platform-telemetry';

export interface TokenClaims {
  sub: string;           // Subject (user ID)
  iss: string;           // Issuer
  aud: string | string[]; // Audience
  exp: number;           // Expiration
  iat: number;           // Issued at
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface ValidationOptions {
  issuer: string;
  audience: string;
  algorithms: string[];
}

export class TokenValidator {
  private jwksClient: JwksClient;
  private options: ValidationOptions;

  constructor(jwksUri: string, options: ValidationOptions) {
    this.jwksClient = new JwksClient(jwksUri);
    this.options = options;
  }

  async validate(token: string): Promise<TokenClaims> {
    try {
      // Decode header to get kid
      const decoded = decode(token, { complete: true });
      if (!decoded || !decoded.header.kid) {
        throw new Error('Invalid token: missing kid');
      }

      // Get public key from JWKS
      const key = await this.jwksClient.getKey(decoded.header.kid);

      // Convert JWK to PEM format (simplified - use a library in production)
      const publicKey = this.jwkToPem(key);

      // Verify signature and claims
      const claims = verify(token, publicKey, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: this.options.algorithms,
      }) as TokenClaims;

      Logger.info('Token validated successfully', {
        sub: claims.sub,
        email: claims.email,
      });

      return claims;
    } catch (error) {
      Logger.error('Token validation failed', error as Error);
      throw error;
    }
  }

  private jwkToPem(jwk: any): string {
    // In production, use a library like jwk-to-pem
    // This is simplified for example purposes
    throw new Error('Implement jwkToPem using jwk-to-pem library');
  }
}
```

### 3. Login Handler

```typescript
// src/commands/LoginWithAuth0Handler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { TokenValidator } from '../auth/TokenValidator.js';
import { AuthServiceClient } from '../clients/AuthServiceClient.js';

export class LoginWithAuth0Command {
  auth0Token: string;

  constructor(auth0Token: string) {
    this.auth0Token = auth0Token;
  }
}

export interface LoginResult {
  success: boolean;
  platformToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    permissions: string[];
  };
  error?: string;
}

@CommandHandlerDecorator(LoginWithAuth0Command)
export class LoginWithAuth0Handler extends CommandHandler<LoginWithAuth0Command, LoginResult> {
  private tokenValidator: TokenValidator;
  private authServiceClient: AuthServiceClient;

  constructor() {
    super();

    // Initialize token validator with Auth0 config
    this.tokenValidator = new TokenValidator(
      process.env.AUTH0_JWKS_URI || '',
      {
        issuer: process.env.AUTH0_ISSUER || '',
        audience: process.env.AUTH0_AUDIENCE || '',
        algorithms: ['RS256'],
      }
    );

    this.authServiceClient = new AuthServiceClient();
  }

  async handle(
    command: LoginWithAuth0Command,
    user: AuthenticatedUser | null
  ): Promise<LoginResult> {
    try {
      Logger.info('Processing Auth0 login');

      // 1. CRITICAL: Business service validates token itself
      const claims = await this.tokenValidator.validate(command.auth0Token);

      // 2. Extract user identity from claims
      const externalUserId = claims.sub;
      const email = claims.email || '';
      const name = claims.name || email;

      // 3. Exchange external identity for platform token
      const authResult = await this.authServiceClient.authenticateExternalUser({
        externalProvider: 'auth0',
        externalUserId,
        email,
        name,
        metadata: {
          auth0Claims: claims,
        },
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Authentication failed',
        };
      }

      Logger.info('Auth0 login successful', {
        userId: authResult.user?.id,
        email: authResult.user?.email,
      });

      return {
        success: true,
        platformToken: authResult.accessToken,
        user: authResult.user,
      };
    } catch (error) {
      Logger.error('Auth0 login failed', error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}
```

### 4. Auth Service Client

```typescript
// src/clients/AuthServiceClient.ts
import { MessageBusClient } from '@banyanai/platform-message-bus-client';

export interface AuthenticateExternalUserRequest {
  externalProvider: string;
  externalUserId: string;
  email: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface AuthenticateExternalUserResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    permissions: string[];
    roles: string[];
  };
  error?: string;
}

export class AuthServiceClient {
  private messageBus: MessageBusClient;

  constructor() {
    this.messageBus = new MessageBusClient({
      url: process.env.MESSAGE_BUS_URL || 'amqp://localhost:5672',
      exchange: 'platform',
    });
  }

  async authenticateExternalUser(
    request: AuthenticateExternalUserRequest
  ): Promise<AuthenticateExternalUserResult> {
    const result = await this.messageBus.sendCommand(
      'AuthService.Commands.AuthenticateExternalUser',
      request
    );

    return result as AuthenticateExternalUserResult;
  }
}
```

## Setup Instructions

### 1. Create Auth0 Application

1. Go to [auth0.com](https://auth0.com) and create an account
2. Create a new "Single Page Application" or "Machine to Machine Application"
3. Note your:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
   - Client Secret (for M2M apps)

### 2. Configure Auth0 API

1. Go to Applications → APIs
2. Create a new API or use the Auth0 Management API
3. Note your API Identifier (audience)

### 3. Set Environment Variables

Create `.env`:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_JWKS_URI=https://your-tenant.auth0.com/.well-known/jwks.json

# Service Configuration
SERVICE_NAME=my-business-service
MESSAGE_BUS_URL=amqp://localhost:5672
```

### 4. Install Dependencies

```bash
pnpm add jsonwebtoken jwk-to-pem @types/jsonwebtoken
```

### 5. Test the Integration

```bash
# Get Auth0 token (using Auth0's test tool or your app)
export AUTH0_TOKEN="eyJ..."

# Call your business service
curl -X POST http://localhost:3000/api/login \\
  -H "Content-Type: application/json" \\
  -d '{"auth0Token": "'$AUTH0_TOKEN'"}'

# Response:
{
  "success": true,
  "platformToken": "eyJ...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "permissions": ["read", "write"]
  }
}
```

## Security Best Practices

### 1. Always Validate Issuer and Audience

```typescript
// ✅ GOOD
const claims = verify(token, publicKey, {
  issuer: 'https://your-tenant.auth0.com/',
  audience: 'https://your-api-identifier',
});

// ❌ BAD - accepts any issuer/audience
const claims = decode(token);
```

### 2. Use Strong Algorithms

```typescript
// ✅ GOOD
algorithms: ['RS256', 'RS384', 'RS512']

// ❌ BAD - allows symmetric algorithms
algorithms: ['HS256', 'RS256']
```

### 3. Cache JWKS Keys

```typescript
// ✅ GOOD - cache with TTL
private keyCache = new Map<string, { key: JsonWebKey; expiresAt: number }>();

// ❌ BAD - fetch on every request
const key = await fetch(jwksUri);
```

### 4. Handle Token Expiration

```typescript
// ✅ GOOD
if (claims.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}

// ❌ BAD - no expiration check
return claims;
```

### 5. Log Security Events

```typescript
Logger.info('Token validated', { sub: claims.sub, email: claims.email });
Logger.warn('Invalid token attempt', { ip, error: error.message });
Logger.error('JWKS fetch failed', error);
```

## Common Patterns

### Multiple Providers

Support Auth0, Okta, Google, etc.:

```typescript
const providers = {
  auth0: new TokenValidator(AUTH0_JWKS_URI, AUTH0_OPTIONS),
  okta: new TokenValidator(OKTA_JWKS_URI, OKTA_OPTIONS),
  google: new TokenValidator(GOOGLE_JWKS_URI, GOOGLE_OPTIONS),
};

const provider = detectProvider(token); // Based on issuer
const claims = await providers[provider].validate(token);
```

### Refresh Token Flow

```typescript
async refreshToken(refreshToken: string): Promise<LoginResult> {
  // Validate refresh token
  const claims = await this.tokenValidator.validate(refreshToken);

  // Get new access token from auth-service
  const result = await this.authServiceClient.refreshAccessToken({
    userId: claims.sub,
  });

  return result;
}
```

### Role Mapping

Map external roles to platform permissions:

```typescript
const auth0Roles = claims['https://your-app.com/roles'] || [];
const platformPermissions = auth0Roles.flatMap(role =>
  ROLE_MAPPINGS[role] || []
);

await authServiceClient.authenticateExternalUser({
  externalProvider: 'auth0',
  externalUserId: claims.sub,
  email: claims.email,
  name: claims.name,
  metadata: {
    requestedPermissions: platformPermissions,
  },
});
```

## Troubleshooting

### "Key not found in JWKS"
- Check that AUTH0_JWKS_URI is correct
- Verify token is from the same tenant
- Clear JWKS cache: `jwksClient.clearCache()`

### "Invalid signature"
- Ensure you're using the correct algorithm (RS256)
- Verify JWKS URI matches issuer
- Check for clock skew issues

### "Invalid audience"
- AUTH0_AUDIENCE must match API identifier exactly
- Check token was requested for correct audience

### "Token expired"
- Tokens have short lifespans (usually 1 hour)
- Implement refresh token flow
- Check server time synchronization

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [JWT Specification (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [JWKS Specification (RFC 7517)](https://tools.ietf.org/html/rfc7517)
- [Platform Auth Service](../../03-platform-services/auth-service.md)
