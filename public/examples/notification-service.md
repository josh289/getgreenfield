---
title: "Notification Service Example"
description: "Multi-channel notification service with email, SMS, and push notification support"
category: "examples"
tags: ["example", "notifications", "email", "sms", "reference"]
difficulty: "intermediate"
last_updated: "2025-01-15"
status: "published"
---

# Notification Service Example

> **Reference Implementation**: A complete multi-channel notification service supporting email, SMS, and push notifications.

## Overview

This example demonstrates a notification service that listens to platform events and sends notifications through multiple channels based on user preferences.

## Features

- Multi-channel support (email, SMS, push)
- User notification preferences
- Template-based messages
- Delivery status tracking
- Retry logic for failed deliveries
- Event-driven integration
- Rate limiting and throttling

## Architecture

```
Commands:
- SendNotification
- UpdatePreferences
- RetryFailedNotification

Queries:
- GetNotificationStatus
- GetUserPreferences
- ListNotificationHistory

Events Subscribed:
- OrderPlaced
- OrderShipped
- PaymentProcessed
- UserRegistered

Events Published:
- NotificationSent
- NotificationFailed

Read Models:
- NotificationReadModel
- UserPreferencesReadModel
```

## Key Implementation Patterns

### Event-Driven Notifications

```typescript
// Listen to domain events and send notifications
@EventHandlerDecorator(OrderPlaced)
export class OrderPlacedHandler extends EventHandler<OrderPlaced> {
  constructor(
    private emailService: EmailService,
    private smsService: SmsService
  ) {
    super();
  }

  async handle(event: OrderPlaced): Promise<void> {
    Logger.info('Order placed, sending notification', { orderId: event.orderId });

    // Get user preferences
    const preferences = await UserPreferencesReadModel.findByUserId(event.customerId);

    // Get user contact info
    const user = await this.getUserInfo(event.customerId);

    // Send via preferred channels
    const tasks: Promise<void>[] = [];

    if (preferences.emailNotifications) {
      tasks.push(this.sendEmailNotification(user.email, event));
    }

    if (preferences.smsNotifications && user.phoneNumber) {
      tasks.push(this.sendSmsNotification(user.phoneNumber, event));
    }

    await Promise.allSettled(tasks);
  }

  private async sendEmailNotification(email: string, event: OrderPlaced): Promise<void> {
    const template = await this.loadTemplate('order-confirmation');
    const message = this.renderTemplate(template, {
      orderId: event.orderId,
      items: event.items,
      total: event.total
    });

    await this.emailService.send({
      to: email,
      subject: 'Order Confirmation',
      html: message
    });

    await NotificationReadModel.create({
      id: this.generateId(),
      userId: event.customerId,
      type: 'order-confirmation',
      channel: 'email',
      status: 'sent',
      sentAt: new Date()
    });
  }
}
```

### Template System

```typescript
export class TemplateService {
  private templates = new Map<string, string>();

  loadTemplate(name: string): string {
    return this.templates.get(name) || this.loadFromFile(name);
  }

  renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || '';
    });
  }

  // Example templates
  private getOrderConfirmationTemplate(): string {
    return `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <p>Order ID: {{orderId}}</p>
      <p>Total: ${{total}}</p>
      <h2>Items:</h2>
      <ul>
        {{#items}}
        <li>{{name}} - Quantity: {{quantity}}</li>
        {{/items}}
      </ul>
    `;
  }
}
```

### Retry Logic

```typescript
@CommandHandlerDecorator(SendNotificationCommand)
export class SendNotificationHandler extends CommandHandler<SendNotificationCommand, SendNotificationResult> {
  async handle(command: SendNotificationCommand): Promise<SendNotificationResult> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.sendNotification(command);
        return { success: true };
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          // Mark as failed
          await NotificationReadModel.create({
            id: command.notificationId,
            userId: command.userId,
            type: command.type,
            channel: command.channel,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts: attempt
          });

          return {
            success: false,
            error: 'Failed after maximum retries'
          };
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return { success: false, error: 'Unexpected error' };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Rate Limiting

```typescript
export class RateLimiter {
  private counters = new Map<string, { count: number; resetAt: number }>();

  async checkLimit(userId: string, channel: string, limit: number, windowMs: number): Promise<boolean> {
    const key = `${userId}:${channel}`;
    const now = Date.now();

    const counter = this.counters.get(key);

    if (!counter || now > counter.resetAt) {
      this.counters.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return true;
    }

    if (counter.count >= limit) {
      return false;
    }

    counter.count++;
    return true;
  }
}

// Usage in handler
const canSend = await rateLimiter.checkLimit(
  userId,
  'sms',
  10, // max 10 SMS
  3600000 // per hour
);

if (!canSend) {
  return { success: false, error: 'Rate limit exceeded' };
}
```

### User Preferences

```typescript
@CommandHandlerDecorator(UpdatePreferencesCommand)
export class UpdatePreferencesHandler extends CommandHandler<UpdatePreferencesCommand, UpdatePreferencesResult> {
  async handle(command: UpdatePreferencesCommand): Promise<UpdatePreferencesResult> {
    await UserPreferencesReadModel.update(command.userId, {
      emailNotifications: command.emailNotifications,
      smsNotifications: command.smsNotifications,
      pushNotifications: command.pushNotifications,
      quietHoursStart: command.quietHoursStart,
      quietHoursEnd: command.quietHoursEnd,
      timezone: command.timezone
    });

    return { success: true };
  }
}
```

## Integration Examples

### Email Service (SendGrid/SES)

```typescript
export class EmailService {
  async send(options: EmailOptions): Promise<void> {
    // SendGrid example
    await sendgrid.send({
      to: options.to,
      from: 'noreply@example.com',
      subject: options.subject,
      html: options.html
    });
  }
}
```

### SMS Service (Twilio)

```typescript
export class SmsService {
  async send(phoneNumber: string, message: string): Promise<void> {
    await twilioClient.messages.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message
    });
  }
}
```

## Use Cases

Use this example when you need:
- Multi-channel notifications
- Event-driven messaging
- User notification preferences
- Delivery tracking and retries
- Template-based messages
- Rate limiting

## Integration Points

- **Order Service**: Send order confirmations
- **Payment Service**: Payment notifications
- **User Service**: Registration welcome messages
- **Shipping Service**: Shipping updates

## Additional Resources

- [Event-Driven Architecture](../02-concepts/event-driven-architecture.md)
- [Background Jobs](../03-guides/background-jobs.md)
- [External Service Integration](../03-guides/external-services.md)
