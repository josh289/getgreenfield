/**
 * Order Aggregate - Event-Sourced Root
 *
 * This aggregate demonstrates:
 * - Business invariant enforcement
 * - Event emission (not direct state mutation)
 * - Event handlers for state reconstruction
 * - Aggregate lifecycle management
 */

import { Aggregate, AggregateRoot } from '@banyanai/platform-domain-modeling';
import {
  ItemAdded,
  ItemRemoved,
  OrderCancelled,
  OrderCreated,
  OrderPlaced,
} from '../events/index.js';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

@Aggregate({ aggregateName: 'Order' })
export class Order extends AggregateRoot {
  private customerId: string = '';
  private items: OrderItem[] = [];
  private status: 'draft' | 'placed' | 'cancelled' = 'draft';
  private total: number = 0;
  private createdAt?: Date;
  private placedAt?: Date;

  // ============================================================================
  // BUSINESS METHODS (Commands - emit events)
  // ============================================================================

  create(orderId: string, customerId: string, createdBy?: string) {
    if (this.customerId) {
      throw new Error('Order already created');
    }

    this.raiseEvent(new OrderCreated(orderId, customerId, new Date(), createdBy));
  }

  addItem(productId: string, quantity: number, price: number) {
    // Invariant: can't modify placed orders
    if (this.status !== 'draft') {
      throw new Error('Cannot modify order after it has been placed');
    }

    // Invariant: positive quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Invariant: positive price
    if (price < 0) {
      throw new Error('Price must be non-negative');
    }

    this.raiseEvent(new ItemAdded(this.id, productId, quantity, price, new Date()));
  }

  removeItem(productId: string) {
    if (this.status !== 'draft') {
      throw new Error('Cannot modify order after it has been placed');
    }

    const item = this.items.find((i) => i.productId === productId);
    if (!item) {
      throw new Error(`Product ${productId} not in order`);
    }

    this.raiseEvent(new ItemRemoved(this.id, productId, new Date()));
  }

  placeOrder() {
    // Invariant: can't place empty order
    if (this.items.length === 0) {
      throw new Error('Cannot place order with no items');
    }

    // Invariant: can only place draft orders
    if (this.status !== 'draft') {
      throw new Error('Order already placed or cancelled');
    }

    this.raiseEvent(new OrderPlaced(this.id, this.customerId, this.total, new Date()));
  }

  cancel() {
    // Invariant: can only cancel placed orders
    if (this.status !== 'placed') {
      throw new Error('Can only cancel placed orders');
    }

    this.raiseEvent(new OrderCancelled(this.id, new Date()));
  }

  // ============================================================================
  // EVENT HANDLERS (State reconstruction)
  // ============================================================================

  protected onOrderCreated(event: OrderCreated) {
    this.id = event.orderId;
    this.customerId = event.customerId;
    this.createdAt = event.createdAt;
    this.status = 'draft';
    this.items = [];
    this.total = 0;
  }

  protected onItemAdded(event: ItemAdded) {
    this.items.push({
      productId: event.productId,
      quantity: event.quantity,
      price: event.price,
    });
    this.total += event.quantity * event.price;
  }

  protected onItemRemoved(event: ItemRemoved) {
    const itemIndex = this.items.findIndex((i) => i.productId === event.productId);
    if (itemIndex >= 0) {
      const item = this.items[itemIndex];
      this.total -= item.quantity * item.price;
      this.items.splice(itemIndex, 1);
    }
  }

  protected onOrderPlaced(event: OrderPlaced) {
    this.status = 'placed';
    this.placedAt = event.placedAt;
  }

  protected onOrderCancelled(event: OrderCancelled) {
    this.status = 'cancelled';
  }

  // ============================================================================
  // GETTERS (Query aggregate state - read-only)
  // ============================================================================

  getStatus(): string {
    return this.status;
  }

  getTotal(): number {
    return this.total;
  }

  getItems(): OrderItem[] {
    return [...this.items]; // Return copy to prevent mutation
  }

  getCustomerId(): string {
    return this.customerId;
  }
}
