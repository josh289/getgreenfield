---
title: "Payment Processing Example"
description: "Payment service with Stripe integration, transaction handling, and refund management"
category: "examples"
tags: ["example", "payments", "stripe", "transactions", "reference"]
difficulty: "intermediate"
last_updated: "2025-01-15"
status: "published"
---

# Payment Processing Example

> **Reference Implementation**: A complete payment service with Stripe integration, transaction handling, and comprehensive error handling.

## Overview

This example demonstrates payment processing patterns including third-party gateway integration, idempotency, webhook handling, and reconciliation.

## Features

- Stripe payment integration
- Idempotent payment processing
- Webhook handling for async events
- Refund and chargeback management
- Transaction history
- Payment method management
- Fraud detection hooks
- PCI compliance patterns

## Architecture

```
Commands:
- ProcessPayment
- RefundPayment
- SavePaymentMethod
- DeletePaymentMethod

Queries:
- GetPayment
- ListPayments
- GetPaymentMethod

Events:
- PaymentProcessed
- PaymentFailed
- RefundIssued
- ChargebackReceived

Read Models:
- PaymentReadModel
- PaymentMethodReadModel
```

## Key Implementation Patterns

### Payment Processing with Idempotency

```typescript
@CommandHandlerDecorator(ProcessPaymentCommand)
export class ProcessPaymentHandler extends CommandHandler<ProcessPaymentCommand, ProcessPaymentResult> {
  constructor(private stripeClient: StripeClient) {
    super();
  }

  async handle(command: ProcessPaymentCommand): Promise<ProcessPaymentResult> {
    // Check for existing payment (idempotency)
    const existing = await PaymentReadModel.findByOrderId(command.orderId);
    if (existing && existing.status === 'succeeded') {
      Logger.info('Payment already processed', { orderId: command.orderId });
      return {
        success: true,
        paymentId: existing.id,
        status: existing.status
      };
    }

    try {
      // Create Stripe payment intent with idempotency key
      const paymentIntent = await this.stripeClient.paymentIntents.create({
        amount: Math.round(command.amount * 100), // Convert to cents
        currency: 'usd',
        customer: command.customerId,
        payment_method: command.paymentMethodId,
        confirm: true,
        metadata: {
          orderId: command.orderId
        }
      }, {
        idempotencyKey: `order-${command.orderId}`
      });

      // Store payment record
      const paymentId = this.generateId();
      await PaymentReadModel.create({
        id: paymentId,
        orderId: command.orderId,
        customerId: command.customerId,
        amount: command.amount,
        currency: 'usd',
        status: paymentIntent.status,
        stripePaymentIntentId: paymentIntent.id,
        createdAt: new Date()
      });

      // Publish event
      await this.publishEvent(new PaymentProcessed(
        paymentId,
        command.orderId,
        command.amount,
        paymentIntent.status
      ));

      return {
        success: true,
        paymentId,
        status: paymentIntent.status
      };
    } catch (error) {
      Logger.error('Payment processing failed', { error, orderId: command.orderId });

      // Store failed payment
      const paymentId = this.generateId();
      await PaymentReadModel.create({
        id: paymentId,
        orderId: command.orderId,
        customerId: command.customerId,
        amount: command.amount,
        currency: 'usd',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date()
      });

      // Publish failure event
      await this.publishEvent(new PaymentFailed(
        paymentId,
        command.orderId,
        error instanceof Error ? error.message : 'Unknown error'
      ));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }
}
```

### Refund Processing

```typescript
@CommandHandlerDecorator(RefundPaymentCommand)
export class RefundPaymentHandler extends CommandHandler<RefundPaymentCommand, RefundPaymentResult> {
  constructor(private stripeClient: StripeClient) {
    super();
  }

  async handle(command: RefundPaymentCommand): Promise<RefundPaymentResult> {
    const payment = await PaymentReadModel.findById(command.paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'succeeded') {
      return { success: false, error: 'Can only refund successful payments' };
    }

    try {
      // Create Stripe refund
      const refund = await this.stripeClient.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: command.amount ? Math.round(command.amount * 100) : undefined,
        reason: command.reason
      });

      // Update payment record
      await PaymentReadModel.update(payment.id, {
        refundedAmount: (payment.refundedAmount || 0) + (command.amount || payment.amount),
        status: command.amount === payment.amount ? 'refunded' : 'partially_refunded'
      });

      // Publish event
      await this.publishEvent(new RefundIssued(
        payment.id,
        payment.orderId,
        command.amount || payment.amount,
        command.reason
      ));

      return { success: true, refundId: refund.id };
    } catch (error) {
      Logger.error('Refund failed', { error, paymentId: command.paymentId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed'
      };
    }
  }
}
```

### Webhook Handler

```typescript
// Stripe webhook endpoint handler
export class StripeWebhookHandler {
  async handleWebhook(payload: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      Logger.error('Webhook signature verification failed', { error });
      throw new Error('Invalid signature');
    }

    Logger.info('Processing Stripe webhook', { type: event.type, id: event.id });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        Logger.info('Unhandled webhook event type', { type: event.type });
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    const payment = await PaymentReadModel.findByOrderId(orderId);
    if (payment) {
      await PaymentReadModel.update(payment.id, {
        status: 'succeeded',
        updatedAt: new Date()
      });

      await this.publishEvent(new PaymentProcessed(
        payment.id,
        orderId,
        payment.amount,
        'succeeded'
      ));
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const payment = await PaymentReadModel.findByStripeChargeId(dispute.charge as string);
    if (payment) {
      await PaymentReadModel.update(payment.id, {
        disputeStatus: 'open',
        disputeReason: dispute.reason,
        updatedAt: new Date()
      });

      await this.publishEvent(new ChargebackReceived(
        payment.id,
        payment.orderId,
        dispute.amount / 100,
        dispute.reason
      ));
    }
  }
}
```

### Payment Method Management

```typescript
@CommandHandlerDecorator(SavePaymentMethodCommand)
export class SavePaymentMethodHandler extends CommandHandler<SavePaymentMethodCommand, SavePaymentMethodResult> {
  constructor(private stripeClient: StripeClient) {
    super();
  }

  async handle(command: SavePaymentMethodCommand): Promise<SavePaymentMethodResult> {
    try {
      // Attach payment method to customer
      await this.stripeClient.paymentMethods.attach(command.paymentMethodId, {
        customer: command.customerId
      });

      // Store payment method
      const paymentMethod = await this.stripeClient.paymentMethods.retrieve(command.paymentMethodId);

      await PaymentMethodReadModel.create({
        id: this.generateId(),
        customerId: command.customerId,
        stripePaymentMethodId: command.paymentMethodId,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        createdAt: new Date()
      });

      return { success: true };
    } catch (error) {
      Logger.error('Failed to save payment method', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save payment method'
      };
    }
  }
}
```

## Security Best Practices

1. **Never store card numbers** - Use Stripe's tokenization
2. **Validate webhook signatures** - Prevent fake webhooks
3. **Use idempotency keys** - Prevent duplicate charges
4. **Log all transactions** - Complete audit trail
5. **Implement rate limiting** - Prevent abuse
6. **Use HTTPS only** - Secure communication
7. **Validate amounts** - Prevent amount manipulation

## Use Cases

Use this example when you need:
- Credit card payment processing
- Subscription billing
- Refund management
- Transaction history
- Payment method storage
- Webhook event handling

## Integration Points

- **Order Service**: Process payments for orders
- **Inventory Service**: Confirm inventory on payment success
- **Notification Service**: Send payment receipts
- **Accounting Service**: Record transactions

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [PCI Compliance Guide](../03-guides/pci-compliance.md)
- [Webhook Security](../03-guides/webhook-security.md)
- [Idempotency Patterns](../03-guides/idempotency.md)
