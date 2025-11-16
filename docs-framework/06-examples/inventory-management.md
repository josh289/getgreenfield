---
title: "Inventory Management Example"
description: "Inventory tracking service with stock management, reservations, and low-stock alerts"
category: "examples"
tags: ["example", "inventory", "stock", "reservations", "reference"]
difficulty: "intermediate"
last_updated: "2025-01-15"
status: "published"
---

# Inventory Management Example

> **Reference Implementation**: A complete inventory management service with stock tracking, reservations, and automated reordering.

## Overview

This example demonstrates inventory management patterns including stock tracking, reservation systems, concurrency handling, and integration with order processing.

## Features

- Product stock tracking
- Inventory reservations with expiry
- Stock level monitoring
- Low-stock alerts
- Automatic reservation cleanup
- Concurrency control for stock updates
- Integration with order service

## Architecture

```
Commands:
- AddStock
- RemoveStock
- ReserveInventory
- ReleaseReservation
- ConfirmReservation

Queries:
- GetInventory
- ListLowStockProducts
- GetReservation

Events:
- StockAdded
- StockRemoved
- InventoryReserved
- ReservationReleased
- ReservationConfirmed
- LowStockDetected

Read Models:
- InventoryReadModel
- ReservationReadModel
```

## Key Implementation Patterns

### Stock Reservation

```typescript
@CommandHandlerDecorator(ReserveInventoryCommand)
export class ReserveInventoryHandler extends CommandHandler<ReserveInventoryCommand, ReserveInventoryResult> {
  async handle(command: ReserveInventoryCommand): Promise<ReserveInventoryResult> {
    const inventory = await InventoryReadModel.findByProductId(command.productId);

    // Check availability
    const availableStock = inventory.quantity - inventory.reserved;
    if (availableStock < command.quantity) {
      return {
        success: false,
        error: 'Insufficient stock available'
      };
    }

    // Create reservation
    const reservationId = this.generateId();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await ReservationReadModel.create({
      id: reservationId,
      productId: command.productId,
      quantity: command.quantity,
      orderId: command.orderId,
      expiresAt,
      status: 'active'
    });

    // Update reserved count
    await InventoryReadModel.update(command.productId, {
      reserved: inventory.reserved + command.quantity
    });

    return {
      success: true,
      reservationId,
      expiresAt: expiresAt.toISOString()
    };
  }
}
```

### Reservation Expiry

```typescript
// Background job to clean up expired reservations
export class ReservationCleanupJob {
  async run() {
    const expiredReservations = await ReservationReadModel.findExpired();

    for (const reservation of expiredReservations) {
      // Release inventory
      const inventory = await InventoryReadModel.findByProductId(reservation.productId);
      await InventoryReadModel.update(reservation.productId, {
        reserved: inventory.reserved - reservation.quantity
      });

      // Mark reservation as expired
      await ReservationReadModel.update(reservation.id, {
        status: 'expired'
      });

      Logger.info('Reservation expired and released', {
        reservationId: reservation.id,
        productId: reservation.productId
      });
    }
  }
}
```

### Concurrency Control

```typescript
@CommandHandlerDecorator(AddStockCommand)
export class AddStockHandler extends CommandHandler<AddStockCommand, AddStockResult> {
  async handle(command: AddStockCommand): Promise<AddStockResult> {
    // Use optimistic locking with version
    const inventory = await InventoryReadModel.findByProductId(command.productId);

    try {
      await InventoryReadModel.updateWithVersion(
        command.productId,
        inventory.version,
        {
          quantity: inventory.quantity + command.quantity,
          version: inventory.version + 1
        }
      );

      return { success: true };
    } catch (error) {
      if (error instanceof VersionConflictError) {
        // Retry with fresh data
        return this.handle(command);
      }
      throw error;
    }
  }
}
```

### Event Integration

```typescript
// Subscribe to OrderPlaced events
@EventHandlerDecorator(OrderPlaced)
export class OrderPlacedHandler extends EventHandler<OrderPlaced> {
  async handle(event: OrderPlaced): Promise<void> {
    Logger.info('Order placed, reserving inventory', { orderId: event.orderId });

    for (const item of event.items) {
      const result = await this.reserveInventory(item.productId, item.quantity, event.orderId);

      if (!result.success) {
        // Emit failure event
        await this.publishEvent(new InventoryReservationFailed(
          event.orderId,
          item.productId,
          result.error
        ));
        return;
      }
    }

    await this.publishEvent(new InventoryReserved(event.orderId));
  }
}
```

## Low Stock Monitoring

```typescript
@CommandHandlerDecorator(RemoveStockCommand)
export class RemoveStockHandler extends CommandHandler<RemoveStockCommand, RemoveStockResult> {
  async handle(command: RemoveStockCommand): Promise<RemoveStockResult> {
    const inventory = await InventoryReadModel.findByProductId(command.productId);

    const newQuantity = inventory.quantity - command.quantity;

    await InventoryReadModel.update(command.productId, {
      quantity: newQuantity
    });

    // Check for low stock
    if (newQuantity <= inventory.reorderPoint) {
      await this.publishEvent(new LowStockDetected(
        command.productId,
        newQuantity,
        inventory.reorderQuantity
      ));
    }

    return { success: true };
  }
}
```

## Use Cases

Use this example when you need:
- Product inventory tracking
- Stock reservations for orders
- Concurrency control for stock updates
- Low-stock monitoring and alerts
- Integration with order processing
- Audit trail of inventory changes

## Integration Points

- **Order Service**: Reserve inventory when order placed
- **Warehouse Service**: Update stock from warehouse shipments
- **Notification Service**: Send alerts for low stock
- **Analytics Service**: Track inventory turnover

## Additional Resources

- [Event-Driven Integration](../01-tutorials/intermediate/multi-service-integration.md)
- [Concurrency Patterns](../03-guides/concurrency-patterns.md)
- [Background Jobs](../03-guides/background-jobs.md)
