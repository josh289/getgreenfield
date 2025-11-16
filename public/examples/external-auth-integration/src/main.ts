/**
 * External Auth Integration Service
 *
 * Demonstrates Auth0/OIDC integration with the platform.
 * Shows how business services validate external tokens themselves.
 */

import 'reflect-metadata';
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function main() {
  try {
    Logger.info('Starting External Auth Integration Example...');

    // Validate Auth0 configuration
    const requiredEnvVars = ['AUTH0_JWKS_URI', 'AUTH0_ISSUER', 'AUTH0_AUDIENCE'];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(
          `Missing required environment variable: ${envVar}. ` +
            'Check .env.example for required Auth0 configuration.',
        );
      }
    }

    await BaseService.start({
      serviceName: 'external-auth-example',
      serviceVersion: '1.0.0',
      features: {
        eventSourcing: false,
      },
    });

    Logger.info('External Auth Integration Example started successfully', {
      auth0Issuer: process.env.AUTH0_ISSUER,
      auth0Audience: process.env.AUTH0_AUDIENCE,
    });

    Logger.info(
      'Ready to accept Auth0 tokens. ' +
        'Test with: POST /api/login with {"auth0Token": "eyJ..."}',
    );
  } catch (error) {
    Logger.error('Failed to start External Auth Integration Example', error as Error);
    process.exit(1);
  }
}

main();
