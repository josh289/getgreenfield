/**
 * JwksClient - Fetches and caches JWKS (JSON Web Key Set) public keys
 *
 * JWKS is used to verify JWT signatures from external providers like Auth0.
 * Keys are cached to avoid fetching on every request.
 *
 * Key Features:
 * - Automatic key caching with TTL
 * - Handles key rotation
 * - Error handling for network failures
 */

import { Logger } from '@banyanai/platform-telemetry';

export interface JsonWebKey {
  kid: string; // Key ID
  kty: string; // Key Type (RSA)
  use: string; // Public key use (sig for signature)
  n: string; // Modulus (RSA)
  e: string; // Exponent (RSA)
  alg: string; // Algorithm (RS256)
  x5c?: string[]; // X.509 certificate chain
  x5t?: string; // X.509 certificate SHA-1 thumbprint
}

interface CachedKey {
  key: JsonWebKey;
  expiresAt: number;
}

export class JwksClient {
  private keyCache = new Map<string, CachedKey>();
  private readonly jwksUri: string;
  private readonly cacheTtlMs: number;

  constructor(jwksUri: string, cacheTtlMs = 3600000) {
    // Default 1 hour cache
    this.jwksUri = jwksUri;
    this.cacheTtlMs = cacheTtlMs;

    Logger.info('JwksClient initialized', { jwksUri, cacheTtlMs });
  }

  /**
   * Get a public key by key ID (kid)
   * Returns cached key if available and not expired
   */
  async getKey(kid: string): Promise<JsonWebKey> {
    // Check cache first
    const cached = this.keyCache.get(kid);
    if (cached && cached.expiresAt > Date.now()) {
      Logger.debug('JWKS key cache hit', { kid });
      return cached.key;
    }

    Logger.debug('JWKS key cache miss, fetching from provider', { kid });

    // Fetch JWKS from provider
    try {
      const response = await fetch(this.jwksUri);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch JWKS: ${response.status} ${response.statusText}`,
        );
      }

      const jwks = (await response.json()) as { keys: JsonWebKey[] };

      if (!jwks.keys || !Array.isArray(jwks.keys)) {
        throw new Error('Invalid JWKS response: missing keys array');
      }

      // Find the requested key
      const key = jwks.keys.find((k) => k.kid === kid);

      if (!key) {
        throw new Error(
          `Key ${kid} not found in JWKS. Available keys: ${jwks.keys.map((k) => k.kid).join(', ')}`,
        );
      }

      // Cache the key
      this.keyCache.set(kid, {
        key,
        expiresAt: Date.now() + this.cacheTtlMs,
      });

      Logger.info('JWKS key fetched and cached', { kid, algorithm: key.alg });

      return key;
    } catch (error) {
      Logger.error('Failed to fetch JWKS', error as Error, { kid, jwksUri: this.jwksUri });
      throw error;
    }
  }

  /**
   * Clear the key cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    Logger.info('Clearing JWKS key cache');
    this.keyCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.keyCache.size,
      keys: Array.from(this.keyCache.keys()),
    };
  }
}
