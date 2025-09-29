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
      title: "User Management Business Service",
      description: "See how Greenfield transforms complex code into simple handlers",
      input: `// Traditional approach - complex, tightly coupled
class UserService {
  constructor() {
    this.db = new Database();
    this.emailService = new EmailService();
    this.notificationService = new NotificationService();
    this.validationService = new ValidationService();
    this.auditLogger = new AuditLogger();
    this.cacheService = new CacheService();
  }

  async createUser(data) {
    // Complex validation logic
    if (!data.email || !data.password) throw new Error('Missing fields');
    if (!this.validationService.isValidEmail(data.email)) throw new Error('Invalid email');
    if (await this.db.userExists(data.email)) throw new Error('User exists');

    // Transaction handling
    const transaction = await this.db.beginTransaction();
    try {
      const user = await this.db.createUser(data, transaction);
      await this.emailService.sendWelcome(user.email);
      await this.notificationService.notifyAdmins(user);
      await this.auditLogger.logUserCreation(user);
      await this.cacheService.invalidate('users');
      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}`,
      output: {
        contexts: [
          {
            name: "Service Contract",
            description: "Type-safe API definition",
            code: `export const UserServiceContract = {
  commands: [{
    name: 'CreateUser',
    inputSchema: CreateUserSchema,
    permissions: ['users:create']
  }],
  events: [{
    name: 'UserCreated',
    broadcast: true
  }]
};`
          },
          {
            name: "Command Handler",
            description: "Your entire business logic - just a function",
            code: `@CommandHandler('CreateUser')
export class CreateUserHandler {
  async handle(cmd: CreateUser, user: AuthUser) {
    // Validate business rules
    if (await this.userExists(cmd.email)) {
      throw new BusinessError('User exists');
    }

    // Create user - that's it!
    return { userId: newId(), email: cmd.email };

    // Platform automatically:
    // - Validates input
    // - Handles transactions
    // - Emits UserCreated event
    // - Sends to message bus
  }
}`
          },
          {
            name: "Event Handlers",
            description: "React to changes asynchronously",
            code: `@EventHandler('UserCreated')
export class WelcomeEmailHandler {
  async handle(event: UserCreated) {
    await this.emailService.sendWelcome(event.email);
  }
}

@EventHandler('UserCreated')
export class NotifyAdminsHandler {
  async handle(event: UserCreated) {
    await this.notifyAdmins(event);
  }
}`
          }
        ],
        events: [
          "CreateUser command → Message Bus",
          "Platform validates & authorizes",
          "Handler executes (5 lines of code)",
          "UserCreated event broadcast",
          "All handlers react in parallel"
        ]
      }
    },
    {
      title: "Order Service (Actor)",
      description: "Complex order flow becomes simple event choreography",
      input: `// Traditional monolithic approach
class OrderProcessor {
  async processOrder(orderData) {
    // Check inventory availability
    const items = await this.inventory.checkAvailability(orderData.items);
    if (!items.allAvailable) throw new Error('Out of stock');

    // Calculate pricing with discounts
    const pricing = await this.pricing.calculate(items, orderData.customerId);
    const tax = await this.taxService.calculate(pricing, orderData.address);

    // Process payment
    const payment = await this.paymentGateway.charge(pricing.total + tax);
    if (!payment.success) throw new Error('Payment failed');

    // Reserve inventory
    await this.inventory.reserve(items, orderData.id);

    // Create order in database
    const order = await this.db.orders.create({...orderData, payment, status: 'pending'});

    // Send notifications
    await this.email.sendOrderConfirmation(order);
    await this.sms.sendTrackingInfo(order);

    // Update analytics
    await this.analytics.trackPurchase(order);

    return order;
  }
}`,
      output: {
        contexts: [
          {
            name: "Order Service Contract",
            description: "Define commands and events",
            code: `export const OrderServiceContract = {
  commands: [{
    name: 'PlaceOrder',
    inputSchema: PlaceOrderSchema,
    permissions: ['orders:create']
  }],
  queries: [{
    name: 'GetOrder',
    inputSchema: GetOrderSchema
  }],
  events: [{
    name: 'OrderPlaced',
    broadcast: true
  }]
};`
          },
          {
            name: "Place Order Command",
            description: "Just the business logic - that's all",
            code: `@CommandHandler('PlaceOrder')
export class PlaceOrderHandler {
  async handle(cmd: PlaceOrder) {
    // Validate order
    if (!cmd.items.length) {
      throw new BusinessError('No items');
    }

    // Create order - platform handles everything else
    return {
      orderId: newId(),
      total: cmd.total
    };

    // Platform automatically emits OrderPlaced event
  }
}`
          },
          {
            name: "Choreographed Event Handlers",
            description: "Services react independently",
            code: `// Inventory Service
@EventHandler('OrderPlaced')
async handle(event) {
  await this.reserveItems(event.items);
}

// Payment Service
@EventHandler('OrderPlaced')
async handle(event) {
  await this.processPayment(event.total);
}

// Notification Service
@EventHandler('OrderPlaced')
async handle(event) {
  await this.sendConfirmation(event);
}`
          }
        ],
        events: [
          "PlaceOrder → Message Bus",
          "Handler: 5 lines of business logic",
          "OrderPlaced event → All services",
          "Parallel processing by actors",
          "Complete in milliseconds"
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
            subtitle="Watch how Greenfield transforms complex legacy code into clean, bounded contexts"
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
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-blue-500/50'
                }`}
              >
                {example.title}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Interface */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">

            {/* Header */}
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {currentExample.title}
                  </h3>
                  <p className="text-slate-400">
                    {currentExample.description}
                  </p>
                </div>
                <button
                  onClick={handleRunDemo}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="p-6 border-r border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Box className="w-5 h-5 text-red-400" />
                  <h4 className="text-lg font-semibold text-white">Legacy Code</h4>
                  <button
                    onClick={() => handleCopy(currentExample.input, 'input')}
                    className="ml-auto p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedStates.input ? (
                      <span className="text-green-400 text-sm">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="bg-slate-950/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    <code>{currentExample.input}</code>
                  </pre>
                </div>
              </div>

              {/* Output Side */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-green-400" />
                  <h4 className="text-lg font-semibold text-white">Greenfield Architecture</h4>
                </div>

                {!showOutput && !isProcessing && (
                  <div className="bg-slate-950/30 rounded-lg p-8 text-center">
                    <p className="text-slate-400 mb-4">Click "Try it yourself" to see the transformation</p>
                    <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-lg flex items-center justify-center">
                      <Play className="w-8 h-8 text-slate-500" />
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="bg-slate-950/30 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                    <p className="text-slate-400">Transforming to Business Services...</p>
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-slate-500">
                        📝 Generating Service Contract
                      </div>
                      <div className="text-sm text-slate-500">
                        ⚡ Creating Command/Query/Event handlers
                      </div>
                      <div className="text-sm text-slate-500">
                        🚀 Removing all infrastructure code
                      </div>
                    </div>
                  </div>
                )}

                {showOutput && (
                  <div className="space-y-6">
                    {/* Bounded Contexts */}
                    <div>
                      <h5 className="text-md font-semibold text-green-400 mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Business Service Components ({currentExample.output.contexts.length})
                      </h5>
                      <div className="space-y-3">
                        {currentExample.output.contexts.map((context, index) => (
                          <div key={index} className="bg-slate-950/50 rounded-lg p-4 border border-green-500/20">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h6 className="text-white font-medium">{context.name}</h6>
                                <p className="text-slate-400 text-sm">{context.description}</p>
                              </div>
                              <button
                                onClick={() => handleCopy(context.code, `context-${index}`)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                              >
                                {copiedStates[`context-${index}`] ? (
                                  <span className="text-green-400 text-xs">✓</span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <pre className="text-xs text-slate-300 bg-slate-900/50 rounded p-2 overflow-x-auto">
                              <code>{context.code}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Flow */}
                    <div>
                      <h5 className="text-md font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Event Flow
                      </h5>
                      <div className="bg-slate-950/50 rounded-lg p-4 border border-purple-500/20">
                        <div className="flex flex-wrap gap-2">
                          {currentExample.output.events.map((event, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-green-400 font-semibold">✓ 90% Less Code</div>
                          <div className="text-slate-400">Just handlers, no infrastructure</div>
                        </div>
                        <div>
                          <div className="text-blue-400 font-semibold">✓ Event Choreography</div>
                          <div className="text-slate-400">Services react independently</div>
                        </div>
                        <div>
                          <div className="text-purple-400 font-semibold">✓ Type-Safe Contracts</div>
                          <div className="text-slate-400">Compile-time API validation</div>
                        </div>
                        <div>
                          <div className="text-yellow-400 font-semibold">✓ Auto Scaling</div>
                          <div className="text-slate-400">Platform handles everything</div>
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
          <p className="text-slate-400 mb-6">
            This is just a preview. The full Greenfield platform includes automated refactoring,
            pattern library integration, and AI-powered optimization.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold">
            Get Early Access to Greenfield
          </button>
        </div>
      </div>
    </Section>
  );
};

export default LiveDemo;