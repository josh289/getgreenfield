/**
 * LoginWithAuth0Handler - Exchanges Auth0 token for platform token
 *
 * CRITICAL PATTERN:
 * 1. Business service validates Auth0 token using JWKS (this handler)
 * 2. Business service extracts user identity from validated claims
 * 3. Business service calls auth-service to get/create platform user
 * 4. Auth-service returns platform JWT with database permissions
 *
 * This pattern ensures:
 * - Business service can independently validate tokens
 * - No runtime dependency on auth-service for authentication
 * - Better performance and reliability
 */

import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Command } from '@banyanai/platform-contract-system';
import { Logger } from '@banyanai/platform-telemetry';
import { TokenValidator } from '../auth/TokenValidator.js';

// CRITICAL: In production, use the actual auth-service client
// For this example, we'll show the interface
interface AuthServiceClient {
  authenticateExternalUser(request: {
    externalProvider: string;
    externalUserId: string;
    email: string;
    name: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
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
    isNewUser?: boolean;
  }>;
}

@Command({
  description: 'Authenticates user with Auth0 token and returns platform JWT',
  permissions: [], // Public endpoint
})
export class LoginWithAuth0Command {
  auth0Token: string;
  ipAddress?: string;
  userAgent?: string;

  constructor(auth0Token: string, ipAddress?: string, userAgent?: string) {
    this.auth0Token = auth0Token;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }
}

export interface LoginWithAuth0Result {
  success: boolean;
  platformToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    email: string;
    name: string;
    permissions: string[];
    roles: string[];
  };
  isNewUser?: boolean;
  error?: string;
}

@CommandHandlerDecorator(LoginWithAuth0Command)
export class LoginWithAuth0Handler extends CommandHandler<
  LoginWithAuth0Command,
  LoginWithAuth0Result
> {
  private tokenValidator: TokenValidator;

  constructor() {
    super();

    // Initialize token validator with Auth0 configuration
    const jwksUri = process.env.AUTH0_JWKS_URI;
    const issuer = process.env.AUTH0_ISSUER;
    const audience = process.env.AUTH0_AUDIENCE;

    if (!jwksUri || !issuer || !audience) {
      throw new Error(
        'Missing Auth0 configuration. Set AUTH0_JWKS_URI, AUTH0_ISSUER, and AUTH0_AUDIENCE',
      );
    }

    this.tokenValidator = new TokenValidator(jwksUri, {
      issuer,
      audience,
      algorithms: ['RS256'],
      clockTolerance: 60, // 60 seconds clock skew tolerance
    });

    Logger.info('LoginWithAuth0Handler initialized', { issuer, audience });
  }

  async handle(
    command: LoginWithAuth0Command,
    _user: AuthenticatedUser | null,
  ): Promise<LoginWithAuth0Result> {
    try {
      Logger.info('Processing Auth0 login request', {
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
      });

      // STEP 1: CRITICAL - Business service validates token itself
      const claims = await this.tokenValidator.validate(command.auth0Token);

      Logger.info('Auth0 token validated successfully', {
        sub: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified,
      });

      // STEP 2: Extract user identity from validated claims
      const externalUserId = claims.sub;
      const email = claims.email || '';
      const name = claims.name || email;

      if (!email) {
        return {
          success: false,
          error: 'Email claim is required but not present in token',
        };
      }

      // STEP 3: Exchange external identity for platform token
      // In production, use the auto-generated auth-service client:
      // const authClient = this.getServiceClient(AuthServiceClient);
      // For this example, we'll show the call pattern:

      const authResult = await this.callAuthService({
        externalProvider: 'auth0',
        externalUserId,
        email,
        name,
        metadata: {
          auth0Claims: {
            email_verified: claims.email_verified,
            picture: claims.picture,
            locale: claims.locale,
          },
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
        },
      });

      if (!authResult.success) {
        Logger.error('Auth service authentication failed', new Error(authResult.error || 'Unknown error'), {
          externalUserId,
          email,
        });

        return {
          success: false,
          error: authResult.error || 'Authentication with platform failed',
        };
      }

      Logger.info('Auth0 login completed successfully', {
        userId: authResult.user?.id,
        email: authResult.user?.email,
        isNewUser: authResult.isNewUser,
        permissionCount: authResult.user?.permissions.length,
      });

      // STEP 4: Return platform token and user info
      return {
        success: true,
        platformToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresIn: 3600, // Platform tokens typically expire in 1 hour
        user: authResult.user,
        isNewUser: authResult.isNewUser,
      };
    } catch (error) {
      Logger.error('Auth0 login failed', error as Error, {
        ipAddress: command.ipAddress,
      });

      // Return user-friendly error messages
      const errorMessage =
        error instanceof Error
          ? this.getUserFriendlyErrorMessage(error)
          : 'Authentication failed';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Call auth-service to authenticate external user
   * In production, use the auto-generated client from platform-client-system
   */
  private async callAuthService(request: {
    externalProvider: string;
    externalUserId: string;
    email: string;
    name: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
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
    isNewUser?: boolean;
  }> {
    // In production, this would be:
    // return await this.messageBus.sendCommand('AuthService.Commands.AuthenticateExternalUser', request);

    // For this example, we'll simulate the call:
    Logger.info('Calling auth-service to authenticate external user', {
      externalProvider: request.externalProvider,
      externalUserId: request.externalUserId,
      email: request.email,
    });

    // This is where you'd actually call the auth-service via message bus
    throw new Error(
      'Auth service integration not implemented in example. ' +
        'In production, use: await this.messageBus.sendCommand("AuthService.Commands.AuthenticateExternalUser", request)',
    );
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('expired')) {
      return 'Your login session has expired. Please log in again.';
    }

    if (message.includes('invalid signature')) {
      return 'Invalid authentication token. Please log in again.';
    }

    if (message.includes('invalid issuer')) {
      return 'Authentication token is not from a trusted provider.';
    }

    if (message.includes('invalid audience')) {
      return 'Authentication token is not intended for this application.';
    }

    if (message.includes('jwks')) {
      return 'Unable to verify authentication. Please try again later.';
    }

    // Default message for unknown errors
    return 'Authentication failed. Please try again.';
  }
}
