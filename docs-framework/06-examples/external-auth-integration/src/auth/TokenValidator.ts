/**
 * TokenValidator - Validates JWT tokens from external providers
 *
 * CRITICAL: This runs in the BUSINESS SERVICE, not auth-service.
 * Business services validate external tokens themselves using JWKS.
 *
 * Validates:
 * - Signature (using JWKS public key)
 * - Issuer (must match configured issuer)
 * - Audience (must match configured audience)
 * - Expiration (must not be expired)
 * - Required claims (sub, email, etc.)
 */

import { type JwtPayload, type VerifyOptions, decode, verify } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { Logger } from '@banyanai/platform-telemetry';
import { type JsonWebKey, JwksClient } from './JwksClient.js';

export interface TokenClaims extends JwtPayload {
  sub: string; // Subject (user ID)
  iss: string; // Issuer
  aud: string | string[]; // Audience
  exp: number; // Expiration
  iat: number; // Issued at
  email?: string;
  name?: string;
  email_verified?: boolean;
  [key: string]: unknown;
}

export interface ValidationOptions {
  issuer: string; // e.g., 'https://your-tenant.auth0.com/'
  audience: string; // Your API identifier
  algorithms: string[]; // ['RS256']
  clockTolerance?: number; // Clock skew tolerance in seconds
}

export class TokenValidator {
  private jwksClient: JwksClient;
  private options: ValidationOptions;

  constructor(jwksUri: string, options: ValidationOptions) {
    this.jwksClient = new JwksClient(jwksUri);
    this.options = {
      clockTolerance: 60, // Default 60 seconds tolerance
      ...options,
    };

    Logger.info('TokenValidator initialized', {
      issuer: options.issuer,
      audience: options.audience,
      algorithms: options.algorithms,
    });
  }

  /**
   * Validate a JWT token
   *
   * @param token - The JWT token to validate
   * @returns Validated token claims
   * @throws Error if validation fails
   */
  async validate(token: string): Promise<TokenClaims> {
    try {
      // 1. Decode token header to get key ID (kid)
      const decoded = decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }

      const { header, payload } = decoded;

      if (!header.kid) {
        throw new Error('Token missing key ID (kid) in header');
      }

      Logger.debug('Validating token', {
        kid: header.kid,
        algorithm: header.alg,
      });

      // 2. Fetch public key from JWKS
      const jwk = await this.jwksClient.getKey(header.kid);

      // 3. Convert JWK to PEM format for verification
      const publicKey = this.jwkToPem(jwk);

      // 4. Verify signature and claims
      const verifyOptions: VerifyOptions = {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: this.options.algorithms as any,
        clockTolerance: this.options.clockTolerance,
      };

      const claims = verify(token, publicKey, verifyOptions) as TokenClaims;

      // 5. Additional claim validation
      this.validateClaims(claims);

      Logger.info('Token validated successfully', {
        sub: claims.sub,
        email: claims.email,
        iss: claims.iss,
      });

      return claims;
    } catch (error) {
      Logger.error('Token validation failed', error as Error, {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      });

      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Token validation failed: ' + String(error));
    }
  }

  /**
   * Validate additional claims beyond standard JWT validation
   */
  private validateClaims(claims: TokenClaims): void {
    // Ensure subject exists
    if (!claims.sub) {
      throw new Error('Token missing required claim: sub');
    }

    // Optionally require email
    if (!claims.email) {
      Logger.warn('Token missing email claim', { sub: claims.sub });
    }

    // You can add custom claim validation here
    // For example, checking email_verified for Auth0:
    // if (claims.email_verified === false) {
    //   throw new Error('Email not verified');
    // }
  }

  /**
   * Convert JWK to PEM format
   */
  private jwkToPem(jwk: JsonWebKey): string {
    try {
      return jwkToPem(jwk as any);
    } catch (error) {
      Logger.error('Failed to convert JWK to PEM', error as Error, { kid: jwk.kid });
      throw new Error('Failed to convert JWK to PEM format');
    }
  }

  /**
   * Decode token without verification (for debugging)
   * WARNING: Do not use for authentication!
   */
  decodeWithoutVerification(token: string): TokenClaims | null {
    try {
      const decoded = decode(token);
      return decoded as TokenClaims;
    } catch (error) {
      Logger.error('Failed to decode token', error as Error);
      return null;
    }
  }

  /**
   * Clear JWKS cache
   */
  clearCache(): void {
    this.jwksClient.clearCache();
  }
}
