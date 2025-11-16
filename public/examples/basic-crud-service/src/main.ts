/**
 * Todo Service - Main Entry Point
 *
 * This demonstrates the zero-infrastructure startup pattern.
 * The entire service starts with one line of code.
 */

import 'reflect-metadata';
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function main() {
  try {
    Logger.info('Starting Todo Service...');

    // ONE LINE STARTUP - Platform handles everything:
    // - Telemetry initialization
    // - Database connection
    // - Message bus connection
    // - Handler discovery and registration
    // - Read model setup
    // - Service discovery registration
    // - Health checks
    // - Graceful shutdown
    await BaseService.start({
      serviceName: 'todo-service',
      serviceVersion: '1.0.0',
      features: {
        eventSourcing: false, // This example uses simple read models
      },
    });

    Logger.info('Todo Service started successfully');
  } catch (error) {
    Logger.error('Failed to start Todo Service', error as Error);
    process.exit(1);
  }
}

main();
