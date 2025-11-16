/**
 * Domain Events for Order Aggregate
 *
 * These events represent facts that happened in the domain.
 * They are:
 * - Immutable (past tense names)
 * - The source of truth for state
 * - Used to rebuild aggregates and update read models
 */

import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent({
  description: 'Order was created',
  broadcast: true,
})
export class OrderCreated {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly createdAt: Date,
    public readonly createdBy?: string,
  ) {}
}

@DomainEvent({
  description: 'Item was added to order',
  broadcast: false, // Internal event, don't broadcast
})
export class ItemAdded {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly addedAt: Date,
  ) {}
}

@DomainEvent({
  description: 'Item was removed from order',
  broadcast: false,
})
export class ItemRemoved {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly removedAt: Date,
  ) {}
}

@DomainEvent({
  description: 'Order was placed',
  broadcast: true, // Other services might care (inventory, shipping, etc.)
})
export class OrderPlaced {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly total: number,
    public readonly placedAt: Date,
  ) {}
}

@DomainEvent({
  description: 'Order was cancelled',
  broadcast: true,
})
export class OrderCancelled {
  constructor(
    public readonly orderId: string,
    public readonly cancelledAt: Date,
  ) {}
}
