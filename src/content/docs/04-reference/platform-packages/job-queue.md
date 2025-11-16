---
title: "@banyanai/platform-job-queue"
description: Production-ready job queue abstraction over BullMQ for background processing
category: platform-packages
tags: [jobs, queue, background-processing, bullmq, redis, scheduling, workers]
related:
  - ./telemetry.md
  - ./core.md
  - ../../02-guides/job-queues.md
difficulty: intermediate
packageName: "@banyanai/platform-job-queue"
packageVersion: "1.0.0-alpha"
npmUrl: "https://www.npmjs.com/package/@banyanai/platform-job-queue"
githubUrl: "https://github.com/banyanai/banyan-core/tree/master/platform/packages/job-queue"
relatedConcepts:
  - Background job processing
  - Distributed task queues
  - Job scheduling
  - Worker pools
  - Retry strategies
commonQuestions:
  - How do I create a job queue?
  - How do I process jobs with workers?
  - How do I schedule recurring jobs?
  - How do I track job progress?
  - How do I handle job failures and retries?
  - How do I scale workers horizontally?
---

# @banyanai/platform-job-queue

Production-ready job queue abstraction over BullMQ for the Banyan Platform. Provides background job processing, bulk operations, scheduled tasks, and automatic telemetry integration.

## Installation

```bash
pnpm add @banyanai/platform-job-queue
```

## Overview

The job queue package wraps BullMQ to provide:

- **Background Job Processing**: Asynchronous execution of long-running tasks
- **Bulk Operations**: Efficient handling of large-scale operations (e.g., 20k+ user enrollments)
- **Scheduled Tasks**: Recurring jobs with cron patterns or one-time scheduled jobs
- **Retry Logic**: Automatic retries with exponential/fixed backoff
- **Progress Tracking**: Real-time job progress monitoring
- **Horizontal Scaling**: Independent worker scaling
- **Automatic Telemetry**: Built-in logging, metrics, and tracing via OpenTelemetry

## Infrastructure

Uses existing Redis infrastructure (no additional services required):

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

## Main Exports

### Classes

- **`JobQueue<TData, TResult>`** - Queue management and job creation
- **`Worker<TData, TResult>`** - Job processing with concurrency control
- **`JobScheduler`** - Scheduled and recurring jobs
- **`JobMetrics`** - Queue metrics and monitoring

### Types

- **`Job<TData, TResult>`** - Job interface with progress tracking
- **`JobOptions`** - Job configuration options
- **`QueueOptions`** - Queue configuration options
- **`WorkerOptions`** - Worker configuration options
- **`ScheduledJobOptions`** - Scheduling configuration options
- **`JobState`** - Job state enumeration
- **`QueueStats`** - Queue statistics interface

### Utilities

- **`setGlobalRedisConfig()`** - Configure Redis connection globally
- **`parseRedisConnectionString()`** - Parse Redis connection strings

## API Reference

### JobQueue

Main queue management class for adding jobs and managing queues.

#### Constructor

```typescript
constructor(name: string, options: Partial<QueueOptions>)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique queue name |
| `options` | `Partial<QueueOptions>` | Yes | Queue configuration |

**Options:**

```typescript
interface QueueOptions {
  // Required: Redis connection
  connection: RedisConnection;

  // Optional: Default options for all jobs
  defaultJobOptions?: JobOptions;

  // Optional: Redis key prefix (default: 'banyan:jobs')
  prefix?: string;

  // Optional: Rate limiting
  limiter?: {
    max: number;           // Max jobs
    duration: number;      // Per duration (ms)
    bounceBack?: boolean;  // Bounce back when limited
  };

  // Optional: Enable telemetry (default: true)
  enableTelemetry?: boolean;
}
```

**Redis Connection:**

```typescript
interface RedisConnection {
  host: string;                   // Redis host URL or connection string
  port?: number;                  // Redis port (default: 6379)
  password?: string;              // Redis password
  db?: number;                    // Redis database number (default: 0)
  tls?: Record<string, unknown>;  // TLS configuration
  maxRetriesPerRequest?: number;  // Max retry attempts
  enableOfflineQueue?: boolean;   // Enable offline queue
}
```

#### Methods

##### add()

Add a single job to the queue.

```typescript
async add(
  name: string,
  data: TData,
  opts?: JobOptions
): Promise<Job<TData, TResult>>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Job name/type |
| `data` | `TData` | Yes | Job payload data |
| `opts` | `JobOptions` | No | Job-specific options |

**Job Options:**

```typescript
interface JobOptions {
  priority?: number;              // Priority (1 = highest)
  delay?: number;                 // Delay in milliseconds
  attempts?: number;              // Max retry attempts
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;                // Backoff delay (ms)
  };
  timeout?: number;               // Execution timeout (ms)
  removeOnComplete?: boolean | {
    age?: number;                 // Keep for N seconds
    count?: number;               // Keep last N jobs
  };
  removeOnFail?: boolean | {
    age?: number;
    count?: number;
  };
  jobId?: string;                 // Custom job ID
}
```

**Returns:** Promise resolving to created Job instance

**Example:**

```typescript
const job = await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to our platform!'
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

console.log(`Job created: ${job.id}`);
```

##### addBulk()

Add multiple jobs to the queue efficiently.

```typescript
async addBulk(
  jobs: BulkJobData<TData>[]
): Promise<Job<TData, TResult>[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobs` | `BulkJobData<TData>[]` | Yes | Array of job configurations |

**Bulk Job Data:**

```typescript
interface BulkJobData<TData> {
  name: string;         // Job name/type
  data: TData;          // Job payload
  opts?: JobOptions;    // Job-specific options
}
```

**Returns:** Promise resolving to array of created Job instances

**Example:**

```typescript
const jobs = await queue.addBulk([
  {
    name: 'enroll-user',
    data: { userId: 'user-1', courseId: 'course-123' }
  },
  {
    name: 'enroll-user',
    data: { userId: 'user-2', courseId: 'course-123' }
  },
  // ... up to 20,000+ jobs
]);

console.log(`Added ${jobs.length} jobs`);
```

##### getJob()

Retrieve a job by ID.

```typescript
async getJob(jobId: string): Promise<Job<TData, TResult> | null>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | `string` | Yes | Job identifier |

**Returns:** Promise resolving to Job or null if not found

##### getJobCounts()

Get count of jobs in each state.

```typescript
async getJobCounts(): Promise<Record<string, number>>
```

**Returns:** Promise resolving to job counts by state:

```typescript
{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}
```

##### pause()

Pause the queue (stop processing new jobs).

```typescript
async pause(): Promise<void>
```

##### resume()

Resume a paused queue.

```typescript
async resume(): Promise<void>
```

##### close()

Close the queue connection.

```typescript
async close(): Promise<void>
```

### Worker

Job processing class with concurrency control and automatic telemetry.

#### Constructor

```typescript
constructor(
  queueName: string,
  processor: JobProcessor<TData, TResult>,
  options: WorkerOptions
)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queueName` | `string` | Yes | Name of queue to process |
| `processor` | `JobProcessor<TData, TResult>` | Yes | Job processing function |
| `options` | `WorkerOptions` | Yes | Worker configuration |

**Job Processor:**

```typescript
type JobProcessor<TData, TResult> = (
  job: Job<TData, TResult>
) => Promise<TResult>
```

**Worker Options:**

```typescript
interface WorkerOptions {
  // Required: Redis connection
  connection: RedisConnection;

  // Optional: Concurrency (default: 1)
  concurrency?: number;

  // Optional: Rate limiter
  limiter?: {
    max: number;
    duration: number;
    groupKey?: string;
  };

  // Optional: Job lock duration (ms, default: 30000)
  lockDuration?: number;

  // Optional: Lock renewal interval (ms, default: lockDuration / 2)
  lockRenewTime?: number;

  // Optional: Skip delayed jobs (default: false)
  skipDelayedJobs?: boolean;

  // Optional: Max stalled count (default: 1)
  maxStalledCount?: number;

  // Optional: Stalled check interval (ms, default: 30000)
  stalledInterval?: number;

  // Optional: Auto-run worker (default: true)
  autorun?: boolean;

  // Optional: Skip retry delay (default: false)
  skipRetryDelay?: boolean;

  // Optional: Enable telemetry (default: true)
  enableTelemetry?: boolean;

  // Optional: Enable metrics (default: true)
  enableMetrics?: boolean;
}
```

#### Methods

##### on()

Register event handlers for worker events.

```typescript
on(event: string, handler: (...args: unknown[]) => void): void
```

**Worker Events:**

- **`completed`** - Job completed successfully
  ```typescript
  worker.on('completed', (job: Job, result: TResult) => {
    console.log(`Job ${job.id} completed:`, result);
  });
  ```

- **`failed`** - Job failed
  ```typescript
  worker.on('failed', (job: Job | undefined, error: Error) => {
    console.error(`Job ${job?.id} failed:`, error);
  });
  ```

- **`progress`** - Job progress updated
  ```typescript
  worker.on('progress', (job: Job, progress: number | object) => {
    console.log(`Job ${job.id} progress:`, progress);
  });
  ```

- **`active`** - Job started processing
  ```typescript
  worker.on('active', (job: Job) => {
    console.log(`Job ${job.id} started`);
  });
  ```

- **`stalled`** - Job stalled (stuck in processing)
  ```typescript
  worker.on('stalled', (jobId: string) => {
    console.warn(`Job ${jobId} stalled`);
  });
  ```

- **`error`** - Worker error
  ```typescript
  worker.on('error', (error: Error) => {
    console.error('Worker error:', error);
  });
  ```

- **`drained`** - Queue is empty
  ```typescript
  worker.on('drained', () => {
    console.log('Queue is empty');
  });
  ```

- **`closed`** - Worker closed
  ```typescript
  worker.on('closed', () => {
    console.log('Worker closed');
  });
  ```

##### close()

Close the worker and stop processing jobs.

```typescript
async close(): Promise<void>
```

### JobScheduler

Scheduled and recurring job management.

#### Constructor

```typescript
constructor(queueName: string, options: Partial<QueueOptions>)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queueName` | `string` | Yes | Name of queue for scheduled jobs |
| `options` | `Partial<QueueOptions>` | Yes | Queue configuration |

#### Methods

##### addRecurring()

Add a recurring job with cron pattern.

```typescript
async addRecurring(
  name: string,
  data: unknown,
  options: ScheduledJobOptions
): Promise<void>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Job name/type |
| `data` | `unknown` | Yes | Job payload data |
| `options` | `ScheduledJobOptions` | Yes | Scheduling options |

**Scheduled Job Options:**

```typescript
interface ScheduledJobOptions {
  // For recurring jobs
  pattern?: string;      // Cron pattern (e.g., '0 2 * * *')
  timezone?: string;     // Timezone (e.g., 'America/New_York')

  // For one-time scheduled jobs
  date?: Date;           // Execution date
}
```

**Example:**

```typescript
// Run every day at 2 AM EST
await scheduler.addRecurring(
  'daily-report',
  { reportType: 'summary' },
  {
    pattern: '0 2 * * *',
    timezone: 'America/New_York'
  }
);
```

**Common Cron Patterns:**

```typescript
'0 * * * *'      // Every hour
'0 0 * * *'      // Every day at midnight
'0 2 * * *'      // Every day at 2 AM
'0 0 * * 0'      // Every Sunday at midnight
'0 0 1 * *'      // First day of month at midnight
'*/15 * * * *'   // Every 15 minutes
```

##### addScheduled()

Add a one-time scheduled job.

```typescript
async addScheduled(
  name: string,
  data: unknown,
  options: ScheduledJobOptions
): Promise<void>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Job name/type |
| `data` | `unknown` | Yes | Job payload data |
| `options` | `ScheduledJobOptions` | Yes | Scheduling options with `date` |

**Example:**

```typescript
// Run once at specific date/time
await scheduler.addScheduled(
  'reminder',
  { message: 'Meeting tomorrow', userId: 'user-123' },
  {
    date: new Date('2025-10-30T10:00:00Z')
  }
);
```

##### close()

Close the scheduler.

```typescript
async close(): Promise<void>
```

### JobMetrics

Queue metrics and monitoring with telemetry integration.

#### Constructor

```typescript
constructor(queueName: string, options: Partial<QueueOptions>)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queueName` | `string` | Yes | Name of queue to monitor |
| `options` | `Partial<QueueOptions>` | Yes | Queue configuration |

#### Methods

##### getStats()

Get current queue statistics.

```typescript
async getStats(): Promise<QueueStats>
```

**Returns:** Promise resolving to queue statistics:

```typescript
interface QueueStats {
  waiting: number;              // Jobs waiting to be processed
  active: number;               // Jobs currently processing
  completed: number;            // Total completed jobs
  failed: number;               // Total failed jobs
  delayed: number;              // Jobs delayed for later
  avgProcessingTime?: number;   // Average processing time (ms)
  throughput?: number;          // Jobs per second
}
```

**Example:**

```typescript
const stats = await metrics.getStats();
console.log(`Queue: ${stats.active} active, ${stats.waiting} waiting`);
```

**Automatic Telemetry:**

When `enableTelemetry: true` (default), metrics are automatically published to OpenTelemetry:

- `job_queue_waiting_jobs` - Waiting jobs gauge
- `job_queue_active_jobs` - Active jobs gauge
- `job_queue_completed_jobs_total` - Completed jobs counter
- `job_queue_failed_jobs_total` - Failed jobs counter
- `job_queue_delayed_jobs` - Delayed jobs gauge
- `job_queue_avg_processing_time_ms` - Average processing time
- `job_queue_throughput` - Jobs per second throughput

##### close()

Close the metrics collector.

```typescript
async close(): Promise<void>
```

### Job Interface

The Job interface represents a job in the queue.

```typescript
interface Job<TData = unknown, TResult = unknown> {
  // Job identification
  id: string;                   // Unique job identifier
  name: string;                 // Job name/type

  // Job data
  data: TData;                  // Job payload data
  opts: JobOptions;             // Job options

  // Job state
  progress: number | Record<string, unknown>;  // Job progress
  returnvalue?: TResult;        // Job result after completion
  failedReason?: string;        // Failure reason if failed
  attemptsMade: number;         // Number of attempts made

  // Timestamps
  timestamp: number;            // Created timestamp
  processedOn?: number;         // Started processing timestamp
  finishedOn?: number;          // Finished timestamp

  // Methods
  updateProgress(progress: number | Record<string, unknown>): Promise<void>;
  remove(): Promise<void>;
  retry(): Promise<void>;
  getState(): Promise<JobState>;
  moveToFailed(error: Error | { message: string }, token: string): Promise<void>;
}
```

**Job State:**

```typescript
type JobState =
  | 'waiting'    // In queue, not started
  | 'active'     // Currently processing
  | 'completed'  // Successfully completed
  | 'failed'     // Failed after retries
  | 'delayed'    // Waiting for delay to expire
  | 'paused';    // Queue paused
```

## Usage Examples

### Basic Queue and Worker

```typescript
import { JobQueue, Worker } from '@banyanai/platform-job-queue';

// Create queue
const queue = new JobQueue('email-notifications', {
  connection: {
    host: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Create worker
const worker = new Worker(
  'email-notifications',
  async (job) => {
    const { to, subject, body } = job.data;

    // Update progress
    await job.updateProgress(50);

    // Send email (your implementation)
    await sendEmail(to, subject, body);

    // Update progress
    await job.updateProgress(100);

    return { sent: true, timestamp: new Date() };
  },
  {
    connection: {
      host: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    concurrency: 5  // Process 5 jobs concurrently
  }
);

// Add event handlers
worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

// Add jobs
await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to our platform!'
});
```

### Bulk Operations

```typescript
import { JobQueue } from '@banyanai/platform-job-queue';

const queue = new JobQueue('user-enrollment', {
  connection: { host: 'redis://localhost:6379' }
});

// Enroll 20,000 users in a course
const enrollments = users.map(user => ({
  name: 'enroll-user',
  data: {
    userId: user.id,
    courseId: 'course-123',
    enrolledAt: new Date()
  }
}));

// Add all jobs in one operation
const jobs = await queue.addBulk(enrollments);
console.log(`Queued ${jobs.length} enrollments`);
```

### Scheduled and Recurring Jobs

```typescript
import { JobScheduler, Worker } from '@banyanai/platform-job-queue';

// Create scheduler
const scheduler = new JobScheduler('scheduled-tasks', {
  connection: { host: 'redis://localhost:6379' }
});

// Run daily report at 2 AM EST
await scheduler.addRecurring(
  'daily-report',
  { reportType: 'summary', recipients: ['admin@example.com'] },
  {
    pattern: '0 2 * * *',
    timezone: 'America/New_York'
  }
);

// Run weekly report every Monday
await scheduler.addRecurring(
  'weekly-report',
  { reportType: 'detailed' },
  {
    pattern: '0 0 * * 1',
    timezone: 'America/New_York'
  }
);

// One-time reminder
await scheduler.addScheduled(
  'meeting-reminder',
  { message: 'Meeting at 3 PM', userId: 'user-123' },
  {
    date: new Date('2025-10-30T14:45:00Z')
  }
);

// Create worker for scheduled tasks
const worker = new Worker(
  'scheduled-tasks',
  async (job) => {
    if (job.name === 'daily-report') {
      await generateDailyReport(job.data);
    } else if (job.name === 'weekly-report') {
      await generateWeeklyReport(job.data);
    } else if (job.name === 'meeting-reminder') {
      await sendReminder(job.data);
    }
  },
  {
    connection: { host: 'redis://localhost:6379' },
    concurrency: 2
  }
);
```

### Progress Tracking

```typescript
import { Worker } from '@banyanai/platform-job-queue';

const worker = new Worker(
  'data-processing',
  async (job) => {
    const { items } = job.data;
    const total = items.length;

    for (let i = 0; i < items.length; i++) {
      await processItem(items[i]);

      // Update progress as percentage
      await job.updateProgress((i + 1) / total * 100);

      // Or update with detailed progress object
      await job.updateProgress({
        percentage: (i + 1) / total * 100,
        processed: i + 1,
        total: total,
        currentItem: items[i].name,
        estimatedTimeRemaining: calculateETA(i, total, startTime)
      });
    }

    return { processedCount: total };
  },
  {
    connection: { host: 'redis://localhost:6379' }
  }
);

// Monitor progress
worker.on('progress', (job, progress) => {
  if (typeof progress === 'number') {
    console.log(`Job ${job.id}: ${progress}%`);
  } else {
    console.log(`Job ${job.id}:`, progress);
  }
});
```

### Job Priority and Delay

```typescript
import { JobQueue } from '@banyanai/platform-job-queue';

const queue = new JobQueue('tasks', {
  connection: { host: 'redis://localhost:6379' }
});

// High priority job (processed first)
await queue.add('critical-task', { data: 'important' }, {
  priority: 1  // 1 = highest priority
});

// Normal priority job
await queue.add('normal-task', { data: 'regular' }, {
  priority: 10
});

// Delayed job (execute in 1 hour)
await queue.add('delayed-task', { data: 'later' }, {
  delay: 60 * 60 * 1000  // 1 hour in milliseconds
});

// Delayed job (execute at specific time)
const executeAt = new Date('2025-10-30T15:00:00Z');
const delay = executeAt.getTime() - Date.now();

await queue.add('scheduled-task', { data: 'specific-time' }, {
  delay: delay
});
```

### Retry Configuration

```typescript
import { JobQueue } from '@banyanai/platform-job-queue';

const queue = new JobQueue('api-calls', {
  connection: { host: 'redis://localhost:6379' },
  defaultJobOptions: {
    // Retry up to 5 times
    attempts: 5,

    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Job with custom retry strategy
await queue.add('flaky-api-call', { url: 'https://api.example.com' }, {
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 5000  // Wait 5 seconds between retries
  },
  timeout: 30000  // 30 second timeout per attempt
});
```

### Job Cleanup

```typescript
import { JobQueue } from '@banyanai/platform-job-queue';

const queue = new JobQueue('cleanup-example', {
  connection: { host: 'redis://localhost:6379' },
  defaultJobOptions: {
    // Remove completed jobs after 1 day or keep last 1000
    removeOnComplete: {
      age: 86400,      // 1 day in seconds
      count: 1000      // Keep last 1000 completed jobs
    },

    // Keep failed jobs indefinitely for debugging
    removeOnFail: false
  }
});

// Job-specific cleanup
await queue.add('temp-job', { data: 'temporary' }, {
  removeOnComplete: true,  // Remove immediately when completed
  removeOnFail: true       // Remove immediately when failed
});
```

### Monitoring and Metrics

```typescript
import { JobMetrics } from '@banyanai/platform-job-queue';

const metrics = new JobMetrics('email-notifications', {
  connection: { host: 'redis://localhost:6379' }
});

// Get current stats
const stats = await metrics.getStats();
console.log({
  waiting: stats.waiting,
  active: stats.active,
  completed: stats.completed,
  failed: stats.failed,
  delayed: stats.delayed
});

// Monitor continuously
setInterval(async () => {
  const stats = await metrics.getStats();

  if (stats.failed > 100) {
    console.warn('High failure rate detected!');
  }

  if (stats.waiting > 1000) {
    console.warn('Queue backlog detected!');
  }
}, 60000);  // Check every minute
```

### Global Configuration

```typescript
import { setGlobalRedisConfig, JobQueue, Worker } from '@banyanai/platform-job-queue';

// Set global Redis config
setGlobalRedisConfig({
  host: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  db: 0
});

// Now all queues and workers can use simplified config
const queue = new JobQueue('notifications', {
  connection: {}  // Uses global config
});

const worker = new Worker(
  'notifications',
  async (job) => { /* ... */ },
  {
    connection: {}  // Uses global config
  }
);
```

### Rate Limiting

```typescript
import { JobQueue, Worker } from '@banyanai/platform-job-queue';

// Limit queue to 100 jobs per 60 seconds
const queue = new JobQueue('api-calls', {
  connection: { host: 'redis://localhost:6379' },
  limiter: {
    max: 100,           // Maximum 100 jobs
    duration: 60000,    // Per 60 seconds
    bounceBack: false   // Don't retry when rate limited
  }
});

// Limit worker to 10 jobs per second
const worker = new Worker(
  'api-calls',
  async (job) => {
    await callExternalAPI(job.data);
  },
  {
    connection: { host: 'redis://localhost:6379' },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
      groupKey: 'api-rate-limit'  // Shared across workers
    }
  }
);
```

### Error Handling

```typescript
import { Worker } from '@banyanai/platform-job-queue';

const worker = new Worker(
  'error-prone-tasks',
  async (job) => {
    try {
      // Your job processing logic
      const result = await processJob(job.data);
      return result;
    } catch (error) {
      // Log error (automatically logged if telemetry enabled)
      console.error(`Job ${job.id} error:`, error);

      // Optionally mark job as failed with custom error
      if (error instanceof UnrecoverableError) {
        await job.moveToFailed(
          { message: `Unrecoverable: ${error.message}` },
          'worker-token'
        );
      }

      // Re-throw to trigger retry
      throw error;
    }
  },
  {
    connection: { host: 'redis://localhost:6379' },
    enableTelemetry: true  // Automatic error logging
  }
);

// Handle worker-level errors
worker.on('error', (error) => {
  console.error('Worker error:', error);
  // Alert operations team
});

// Handle failed jobs
worker.on('failed', (job, error) => {
  if (job && job.attemptsMade >= 3) {
    console.error(`Job ${job.id} failed permanently:`, error);
    // Send to dead letter queue or alert
  }
});
```

## Integration with Platform Services

### With BaseService

```typescript
import { BaseService } from '@banyanai/platform-base-service';
import { JobQueue, Worker } from '@banyanai/platform-job-queue';

class MyService {
  private queue: JobQueue;
  private worker: Worker;

  async start() {
    // Initialize queue
    this.queue = new JobQueue('my-service-jobs', {
      connection: {
        host: process.env.REDIS_URL || 'redis://localhost:6379'
      }
    });

    // Initialize worker
    this.worker = new Worker(
      'my-service-jobs',
      this.processJob.bind(this),
      {
        connection: {
          host: process.env.REDIS_URL || 'redis://localhost:6379'
        },
        concurrency: 5
      }
    );

    // Start service
    await BaseService.start({
      name: 'my-service',
      version: '1.0.0'
    });
  }

  private async processJob(job: Job) {
    // Job processing logic with full service context
    return { processed: true };
  }

  async stop() {
    await this.worker.close();
    await this.queue.close();
  }
}
```

### With Telemetry

```typescript
import { JobQueue, Worker } from '@banyanai/platform-job-queue';
import { Logger, MetricsManager } from '@banyanai/platform-telemetry';

// Telemetry is automatic when enableTelemetry: true (default)
const queue = new JobQueue('telemetry-example', {
  connection: { host: 'redis://localhost:6379' },
  enableTelemetry: true  // Default
});

const worker = new Worker(
  'telemetry-example',
  async (job) => {
    // All job execution automatically logged and metered
    // Custom logging still available
    Logger.info('Processing special job', { jobId: job.id });

    return { processed: true };
  },
  {
    connection: { host: 'redis://localhost:6379' },
    enableTelemetry: true,   // Automatic logging
    enableMetrics: true      // Automatic metrics
  }
);

// Metrics automatically recorded:
// - job_queue_jobs_added_total
// - job_queue_bulk_jobs_added_total
// - job_queue_job_duration_ms
// - job_queue_job_executions_total
// - job_queue_waiting_jobs
// - job_queue_active_jobs
// - job_queue_completed_jobs_total
// - job_queue_failed_jobs_total
```

## Best Practices

### DO:

- ✅ Use descriptive job names for monitoring and debugging
- ✅ Configure appropriate retry strategies for each job type
- ✅ Set job timeouts to prevent stuck jobs
- ✅ Use bulk operations for large-scale job creation
- ✅ Monitor queue metrics and set up alerts
- ✅ Use job priorities for critical tasks
- ✅ Clean up completed jobs to prevent Redis bloat
- ✅ Use concurrency to scale processing
- ✅ Handle errors gracefully in job processors
- ✅ Update job progress for long-running tasks

### DON'T:

- ❌ Don't create jobs for every tiny operation (use jobs for async/long-running tasks)
- ❌ Don't disable telemetry in production (loses observability)
- ❌ Don't set unlimited retries (can cause infinite loops)
- ❌ Don't store large payloads in job data (use references instead)
- ❌ Don't forget to close queues and workers on shutdown
- ❌ Don't ignore failed jobs (set up monitoring and alerts)
- ❌ Don't use blocking operations in job processors
- ❌ Don't share Redis connections across different queue systems

## Troubleshooting

### Jobs Not Processing

```typescript
// Check worker is running
worker.on('ready', () => {
  console.log('Worker is ready and listening');
});

// Check queue stats
const stats = await queue.getJobCounts();
console.log('Queue stats:', stats);

// Check if queue is paused
await queue.resume();
```

### High Failure Rate

```typescript
// Increase retry attempts
await queue.add('job', data, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000
  }
});

// Add timeout
await queue.add('job', data, {
  timeout: 60000  // 1 minute timeout
});

// Monitor failures
worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, {
    name: job?.name,
    attempts: job?.attemptsMade,
    error: error.message
  });
});
```

### Queue Backlog

```typescript
// Increase worker concurrency
const worker = new Worker('queue', processor, {
  connection: { host: 'redis://localhost:6379' },
  concurrency: 20  // Process more jobs concurrently
});

// Add more worker instances
const worker2 = new Worker('queue', processor, options);
const worker3 = new Worker('queue', processor, options);

// Monitor backlog
const stats = await metrics.getStats();
if (stats.waiting > 1000) {
  console.warn('Queue backlog detected, scale up workers');
}
```

### Memory Issues

```typescript
// Configure job cleanup
const queue = new JobQueue('queue', {
  connection: { host: 'redis://localhost:6379' },
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600,   // Keep for 1 hour
      count: 100   // Keep last 100
    },
    removeOnFail: {
      age: 86400,  // Keep failures for 1 day
      count: 500
    }
  }
});
```

### Connection Issues

```typescript
// Configure connection retries
const queue = new JobQueue('queue', {
  connection: {
    host: 'redis://localhost:6379',
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true  // Queue commands while offline
  }
});

// Handle connection errors
worker.on('error', (error) => {
  if (error.message.includes('ECONNREFUSED')) {
    console.error('Redis connection refused');
    // Alert operations team
  }
});
```

## Performance Considerations

### Throughput Optimization

```typescript
// Use bulk operations for adding many jobs
const jobs = items.map(item => ({
  name: 'process-item',
  data: item
}));
await queue.addBulk(jobs);  // Much faster than individual adds

// Increase worker concurrency
const worker = new Worker('queue', processor, {
  connection: { host: 'redis://localhost:6379' },
  concurrency: 50  // Process 50 jobs concurrently
});

// Horizontal scaling (multiple worker instances)
// Deploy multiple worker processes/containers
```

### Memory Efficiency

```typescript
// Store references, not large data
await queue.add('process-file', {
  fileId: 'file-123',  // Store ID
  bucket: 's3-bucket'
});
// Not: { fileContent: Buffer.alloc(10000000) }

// Configure cleanup aggressively
removeOnComplete: { count: 10 }  // Keep only last 10
```

## Related Resources

- **[Job Queue Guide](../../02-guides/job-queues.md)** - Comprehensive job queue usage guide
- **[Telemetry Package](./telemetry.md)** - Automatic logging and metrics
- **[BullMQ Documentation](https://docs.bullmq.io/)** - Underlying BullMQ library
- **[Redis Best Practices](https://redis.io/docs/management/optimization/)** - Redis optimization
