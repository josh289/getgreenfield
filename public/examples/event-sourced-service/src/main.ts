/**
 * Order Service - Event-Sourced Microservice
 *
 * Demonstrates event sourcing with aggregates and read model projections
 */

import 'reflect-metadata';
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function main() {
  try {
    Logger.info('Starting Order Service (Event-Sourced)...');

    await BaseService.start({
      serviceName: 'order-service',
      serviceVersion: '1.0.0',
      features: {
        eventSourcing: true, // CRITICAL: Enables event store and read model projections
      },
    });

    Logger.info('Order Service started successfully with event sourcing enabled');
  } catch (error) {
    Logger.error('Failed to start Order Service', error as Error);
    process.exit(1);
  }
}

main();
