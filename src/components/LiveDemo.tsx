import React, { useState, useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Play, Copy, RefreshCw, Zap, Box, GitBranch } from 'lucide-react';

const LiveDemo: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    const elements = demoRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const examples = [
    {
      title: "Collaboration Actor Service",
      description: "See how complex workspace management becomes event-driven actors",
      input: `// Traditional monolithic approach - tightly coupled, complex
class CollaborationService {
  constructor() {
    this.db = new Database();
    this.notificationService = new NotificationService();
    this.searchService = new SearchService();
    this.analyticsService = new AnalyticsService();
    this.achievementService = new AchievementService();
    this.auditLogger = new AuditLogger();
  }

  async postMessage(workspaceId, channelId, userId, content) {
    // Complex validation and authorization
    const workspace = await this.db.getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const member = await this.db.getMember(workspaceId, userId);
    if (!member) throw new Error('Not a member');

    const channel = await this.db.getChannel(channelId);
    if (!channel || channel.workspaceId !== workspaceId) {
      throw new Error('Invalid channel');
    }

    // Transaction handling
    const transaction = await this.db.beginTransaction();
    try {
      // Store message
      const message = await this.db.createMessage({
        messageId: uuid(),
        workspaceId,
        channelId,
        userId,
        content,
        timestamp: Date.now()
      }, transaction);

      // Update statistics
      await this.db.incrementChannelMessageCount(channelId, transaction);
      await this.db.updateWorkspaceActivity(workspaceId, transaction);
      await this.db.updateUserMessageCount(userId, transaction);

      // Process mentions
      const mentions = this.extractMentions(content);
      for (const mentionedUser of mentions) {
        await this.notificationService.sendMention(mentionedUser, message);
        await this.db.addMention(mentionedUser, message.messageId, transaction);
      }

      // Update search index
      await this.searchService.indexMessage(message);

      // Check achievements
      const messageCount = await this.db.getUserMessageCount(userId);
      if (messageCount === 100) {
        await this.achievementService.unlock(userId, 'centurion');
      }

      // Analytics
      await this.analyticsService.trackMessage(message);

      // Audit log
      await this.auditLogger.log('message_posted', { userId, messageId: message.messageId });

      await transaction.commit();
      return message;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}`,
      output: {
        contexts: [
          {
            name: "Actor Service Contract",
            description: "Defines Commands, Queries, and Domain Events",
            code: `export const CollaborationServiceContract = {
  serviceName: "collaboration",

  commands: [{
    name: 'PostMessage',
    inputSchema: PostMessageSchema,
    permissions: ['workspace:message:post']
  }],

  queries: [{
    name: 'GetWorkspace',
    inputSchema: GetWorkspaceSchema,
    permissions: ['workspace:read']
  }],

  domainEvents: [{
    name: 'MessagePosted',
    broadcast: true,
    payloadSchema: MessagePostedSchema
  }]
};`
          },
          {
            name: "Command Handler",
            description: "Just business logic - no infrastructure",
            code: `@CommandHandler('PostMessage')
export class PostMessageHandler {
  async handle(cmd: PostMessage, user: AuthUser) {
    // Business rule validation
    if (!cmd.content || cmd.content.length > 5000) {
      throw new BusinessError('Invalid message');
    }

    // That's it! Just return the result
    return {
      messageId: newId(),
      postedAt: Date.now()
    };

    // Platform automatically:
    // - Validates input schema
    // - Checks permissions
    // - Handles transactions
    // - Emits MessagePosted event
  }
}`
          },
          {
            name: "Event Handlers (Choreography)",
            description: "Multiple actors react independently",
            code: `// Statistics Actor
@EventHandler('MessagePosted')
async updateStats(event: MessagePosted) {
  await this.incrementChannelStats(event.channelId);
  await this.updateWorkspaceActivity(event.workspaceId);
}

// Notification Actor
@EventHandler('MessagePosted')
async sendNotifications(event: MessagePosted) {
  for (const mention of event.mentions) {
    await this.sendMentionAlert(mention);
  }
}

// Search Actor
@EventHandler('MessagePosted')
async indexMessage(event: MessagePosted) {
  await this.searchIndex.add({
    messageId: event.messageId,
    content: event.content
  });
}

// Achievement Actor
@EventHandler('MessagePosted')
async checkAchievements(event: MessagePosted) {
  const count = await this.getMessageCount(event.userId);
  if (count === 100) {
    emit('AchievementUnlocked', {
      userId: event.userId,
      achievement: 'centurion'
    });
  }
}`
          },
          {
            name: "Query Handler",
            description: "Optimized reads with access control",
            code: `@QueryHandler('GetWorkspace')
export class GetWorkspaceHandler {
  async handle(query: GetWorkspace, user: AuthUser) {
    // Check access
    if (!await this.canAccess(query.workspaceId, user)) {
      throw new ForbiddenError();
    }

    // Return denormalized view
    return {
      workspaceId: query.workspaceId,
      name: workspace.name,
      memberCount: workspace.memberCount,
      // Conditionally include based on permissions
      members: user.canViewMembers ?
        await this.getMembers(query.workspaceId) : undefined
    };
  }
}`
          }
        ],
        events: [
          "PostMessage → Message Bus",
          "Command Handler validates & executes",
          "MessagePosted event → All actors",
          "5+ actors process in parallel",
          "Each actor handles one concern",
          "Complete in milliseconds"
        ]
      }
    },
    {
      title: "Order Processing Actor",
      description: "Complex e-commerce workflow becomes event-driven choreography",
      input: `// Traditional monolithic order processing
class OrderService {
  constructor() {
    this.db = new Database();
    this.inventoryService = new InventoryService();
    this.pricingService = new PricingService();
    this.paymentGateway = new PaymentGateway();
    this.shippingService = new ShippingService();
    this.emailService = new EmailService();
    this.analyticsService = new AnalyticsService();
  }

  async placeOrder(customerId, items, shippingAddress, paymentMethod) {
    // Begin transaction
    const transaction = await this.db.beginTransaction();
    try {
      // Validate customer
      const customer = await this.db.getCustomer(customerId);
      if (!customer) throw new Error('Customer not found');

      // Check inventory for all items
      for (const item of items) {
        const stock = await this.inventoryService.checkStock(item.productId);
        if (stock < item.quantity) {
          throw new Error(\`Insufficient stock for \${item.productId}\`);
        }
      }

      // Calculate pricing
      let subtotal = 0;
      for (const item of items) {
        const product = await this.db.getProduct(item.productId);
        subtotal += product.price * item.quantity;
      }

      // Apply discounts
      const discounts = await this.pricingService.calculateDiscounts(customer, items);
      const total = subtotal - discounts;

      // Calculate tax
      const tax = await this.pricingService.calculateTax(total, shippingAddress);

      // Process payment
      const payment = await this.paymentGateway.charge({
        amount: total + tax,
        customerId,
        paymentMethod
      });

      if (!payment.success) {
        throw new Error('Payment failed: ' + payment.error);
      }

      // Create order
      const order = await this.db.createOrder({
        orderId: uuid(),
        customerId,
        items,
        subtotal,
        discounts,
        tax,
        total: total + tax,
        paymentId: payment.id,
        shippingAddress,
        status: 'confirmed',
        createdAt: Date.now()
      }, transaction);

      // Reserve inventory
      for (const item of items) {
        await this.inventoryService.reserve(
          item.productId,
          item.quantity,
          order.orderId,
          transaction
        );
      }

      // Calculate shipping
      const shipping = await this.shippingService.calculateShipping(items, shippingAddress);
      await this.db.updateOrderShipping(order.orderId, shipping, transaction);

      // Send confirmation email
      await this.emailService.sendOrderConfirmation(customer.email, order);

      // Update analytics
      await this.analyticsService.trackPurchase({
        customerId,
        orderId: order.orderId,
        total: order.total,
        items
      });

      // Update customer statistics
      await this.db.incrementCustomerOrderCount(customerId, transaction);
      await this.db.updateCustomerTotalSpent(customerId, order.total, transaction);

      await transaction.commit();
      return order;
    } catch (error) {
      await transaction.rollback();
      // Refund payment if it was processed
      if (payment?.success) {
        await this.paymentGateway.refund(payment.id);
      }
      throw error;
    }
  }
}`,
      output: {
        contexts: [
          {
            name: "Order Actor Contract",
            description: "Commands, Queries, Events with schemas",
            code: `export const OrderServiceContract = {
  serviceName: "orders",

  commands: [{
    name: 'PlaceOrder',
    inputSchema: PlaceOrderSchema,
    outputSchema: OrderResultSchema,
    permissions: ['order:create']
  }],

  queries: [{
    name: 'GetOrderStatus',
    inputSchema: GetOrderSchema,
    outputSchema: OrderStatusSchema,
    permissions: ['order:read']
  }],

  domainEvents: [{
    name: 'OrderPlaced',
    broadcast: true,
    payloadSchema: OrderPlacedSchema
  }, {
    name: 'OrderShipped',
    broadcast: true
  }]
};`
          },
          {
            name: "Place Order Command",
            description: "Focus only on order business logic",
            code: `@CommandHandler('PlaceOrder')
export class PlaceOrderHandler {
  async handle(cmd: PlaceOrder, user: AuthUser) {
    // Business validation
    if (!cmd.items || cmd.items.length === 0) {
      throw new BusinessError('Order must have items');
    }

    if (cmd.total < 0) {
      throw new BusinessError('Invalid order total');
    }

    // Create order - that's it!
    const orderId = newId();

    return {
      orderId,
      status: 'pending',
      createdAt: Date.now()
    };

    // Platform automatically:
    // - Validates schema
    // - Checks permissions
    // - Handles transactions
    // - Emits OrderPlaced event
    // - Sends to message bus
  }
}`
          },
          {
            name: "Event-Driven Choreography",
            description: "Each actor handles one concern independently",
            code: `// Inventory Actor
@EventHandler('OrderPlaced')
export class ReserveInventoryHandler {
  async handle(event: OrderPlaced) {
    for (const item of event.items) {
      await this.reserveStock(item.productId, item.quantity);
      emit('InventoryReserved', {
        orderId: event.orderId,
        productId: item.productId
      });
    }
  }
}

// Payment Actor
@EventHandler('OrderPlaced')
export class ProcessPaymentHandler {
  async handle(event: OrderPlaced) {
    const result = await this.chargePayment({
      amount: event.total,
      customerId: event.customerId,
      paymentMethod: event.paymentMethod
    });

    if (result.success) {
      emit('PaymentProcessed', {
        orderId: event.orderId,
        paymentId: result.paymentId
      });
    } else {
      emit('PaymentFailed', {
        orderId: event.orderId,
        reason: result.error
      });
    }
  }
}

// Shipping Actor
@EventHandler('PaymentProcessed')
export class CreateShippingHandler {
  async handle(event: PaymentProcessed) {
    const label = await this.createShippingLabel(event.orderId);
    emit('ShippingCreated', {
      orderId: event.orderId,
      trackingNumber: label.trackingNumber
    });
  }
}

// Notification Actor
@EventHandler('OrderPlaced')
export class OrderConfirmationHandler {
  async handle(event: OrderPlaced) {
    await this.sendEmail({
      to: event.customerEmail,
      template: 'order-confirmation',
      data: { orderId: event.orderId }
    });
  }
}

// Analytics Actor
@EventHandler('OrderPlaced')
export class TrackPurchaseHandler {
  async handle(event: OrderPlaced) {
    await this.recordPurchase({
      customerId: event.customerId,
      total: event.total,
      items: event.items
    });
  }
}`
          },
          {
            name: "Saga Pattern for Compensation",
            description: "Handle failures with compensating transactions",
            code: `// Payment Failed - Trigger compensations
@EventHandler('PaymentFailed')
export class OrderFailureHandler {
  async handle(event: PaymentFailed) {
    // Release reserved inventory
    emit('ReleaseInventory', {
      orderId: event.orderId
    });

    // Update order status
    emit('UpdateOrderStatus', {
      orderId: event.orderId,
      status: 'failed',
      reason: event.reason
    });

    // Notify customer
    emit('SendFailureNotification', {
      orderId: event.orderId,
      customerId: event.customerId
    });
  }
}`
          }
        ],
        events: [
          "PlaceOrder command → Message Bus",
          "Order Actor validates & creates order",
          "OrderPlaced event → 5+ actors",
          "Inventory, Payment, Shipping react in parallel",
          "Saga handles failures automatically",
          "Complete distributed transaction"
        ]
      }
    }
  ];

  const handleRunDemo = async () => {
    setIsProcessing(true);
    setShowOutput(false);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setShowOutput(true);
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const currentExample = examples[selectedExample];

  return (
    <Section>
      <div ref={demoRef} className="max-w-7xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="See Greenfield in Action"
            subtitle="Watch how Greenfield transforms complex monolithic code into event-driven actors with bounded contexts"
            align="center"
          />
        </div>

        {/* Example Selector */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setSelectedExample(index)}
                className={`px-6 py-3 rounded-lg border transition-all duration-300 ${
                  selectedExample === index
                    ? 'bg-[#50c878] border-[#50c878] text-black font-semibold'
                    : 'bg-[#1a2e1a]/50 border-gray-400 text-gray-100 hover:border-[#50c878]/50'
                }`}
              >
                {example.title}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Interface */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <div className="bg-[#1a2e1a]/50 backdrop-blur-sm rounded-xl border border-gray-400/80 overflow-hidden">

            {/* Header */}
            <div className="bg-[#1a2e1a]/50 px-6 py-4 border-b border-gray-400/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {currentExample.title}
                  </h3>
                  <p className="text-gray-100">
                    {currentExample.description}
                  </p>
                </div>
                <button
                  onClick={handleRunDemo}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-[#50c878] text-black font-semibold rounded-lg hover:bg-[#3da85f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Try it yourself
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

              {/* Input Side */}
              <div className="p-6 border-r border-gray-400/80">
                <div className="flex items-center gap-2 mb-4">
                  <Box className="w-5 h-5 text-[#f4d03f]" />
                  <h4 className="text-lg font-semibold text-white">Legacy Code</h4>
                  <button
                    onClick={() => handleCopy(currentExample.input, 'input')}
                    className="ml-auto p-2 text-gray-200 hover:text-white transition-colors"
                  >
                    {copiedStates.input ? (
                      <span className="text-[#50c878] text-sm">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="bg-[#1a2e1a]/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100 whitespace-pre-wrap">
                    <code>{currentExample.input}</code>
                  </pre>
                </div>
              </div>

              {/* Output Side */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#50c878]" />
                  <h4 className="text-lg font-semibold text-white">Greenfield Architecture</h4>
                </div>

                {!showOutput && !isProcessing && (
                  <div className="bg-[#1a2e1a]/30 rounded-lg p-8 text-center">
                    <p className="text-gray-200 mb-4">Click "Try it yourself" to see the actor transformation</p>
                    <div className="w-16 h-16 mx-auto bg-[#1a2e1a]/50 rounded-lg flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-200" />
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="bg-[#1a2e1a]/30 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto bg-[#50c878]/20 rounded-lg flex items-center justify-center mb-4">
                      <RefreshCw className="w-8 h-8 text-[#50c878] animate-spin" />
                    </div>
                    <p className="text-gray-200">Transforming to Actor Services...</p>
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-gray-200">
                        📝 Generating Actor Service Contract
                      </div>
                      <div className="text-sm text-gray-200">
                        ⚡ Creating Command, Query & Event handlers
                      </div>
                      <div className="text-sm text-gray-200">
                        🚀 Enabling event choreography
                      </div>
                    </div>
                  </div>
                )}

                {showOutput && (
                  <div className="space-y-6">
                    {/* Bounded Contexts */}
                    <div>
                      <h5 className="text-md font-semibold text-[#50c878] mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Actor Service Components ({currentExample.output.contexts.length})
                      </h5>
                      <div className="space-y-3">
                        {currentExample.output.contexts.map((context, index) => (
                          <div key={index} className="bg-[#1a2e1a]/50 rounded-lg p-4 border border-[#50c878]/20">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h6 className="text-white font-medium">{context.name}</h6>
                                <p className="text-gray-100 text-sm">{context.description}</p>
                              </div>
                              <button
                                onClick={() => handleCopy(context.code, `context-${index}`)}
                                className="p-1 text-gray-200 hover:text-white transition-colors"
                              >
                                {copiedStates[`context-${index}`] ? (
                                  <span className="text-[#50c878] text-xs">✓</span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <pre className="text-xs text-gray-100 bg-[#1a2e1a]/50 rounded p-2 overflow-x-auto">
                              <code>{context.code}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Flow */}
                    <div>
                      <h5 className="text-md font-semibold text-[#f4d03f] mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Message Bus Event Flow
                      </h5>
                      <div className="bg-[#1a2e1a]/50 rounded-lg p-4 border border-[#f4d03f]/20">
                        <div className="flex flex-wrap gap-2">
                          {currentExample.output.events.map((event, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-[#f4d03f]/20 text-[#f4d03f]/80 rounded-full text-sm border border-[#f4d03f]/30"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-gradient-to-r from-[#50c878]/10 to-[#f4d03f]/10 rounded-lg p-4 border border-[#50c878]/20">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-[#50c878] font-semibold">✓ 90% Less Code</div>
                          <div className="text-gray-200">Just handlers, no infrastructure</div>
                        </div>
                        <div>
                          <div className="text-[#f4d03f] font-semibold">✓ Event Choreography</div>
                          <div className="text-gray-200">Actors react independently</div>
                        </div>
                        <div>
                          <div className="text-[#50c878] font-semibold">✓ Type-Safe Contracts</div>
                          <div className="text-gray-200">Compile-time API validation</div>
                        </div>
                        <div>
                          <div className="text-[#f4d03f] font-semibold">✓ Auto Scaling</div>
                          <div className="text-gray-200">Platform handles everything</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12 text-center">
          <p className="text-gray-100 mb-6">
            This is just a preview. The full Greenfield platform includes automated actor generation,
            service contract creation, and complete event choreography.
          </p>
          <button className="px-8 py-4 bg-[#50c878] text-black font-semibold rounded-lg hover:bg-[#3da85f] transition-all duration-300">
            Get Early Access to Greenfield
          </button>
        </div>
      </div>
    </Section>
  );
};

export default LiveDemo;