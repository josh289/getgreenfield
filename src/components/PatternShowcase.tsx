import React, { useState, useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import {
  Shield,
  CreditCard,
  Database,
  MessageSquare,
  Users,
  Star,
  ArrowRight,
  Code,
  Download,
  Check,
  Zap
} from 'lucide-react';

const PatternShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('authentication');
  const [selectedPattern, setSelectedPattern] = useState(0);
  const showcaseRef = useRef<HTMLDivElement>(null);

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

    const elements = showcaseRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const categories = {
    authentication: {
      name: 'Authentication',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-cyan-500 to-cyan-600',
      patterns: [
        {
          name: 'OAuth2 + JWT',
          description: 'Complete OAuth2 flow with JWT tokens',
          complexity: 'Medium',
          reusability: 95,
          loc: 340,
          rating: 4.9,
          tags: ['Security', 'OAuth', 'JWT'],
          features: [
            'Multiple OAuth providers (Google, GitHub, etc.)',
            'Automatic token refresh',
            'Role-based access control',
            'Session management'
          ],
          code: `// Authentication Context
export class AuthContext {
  constructor(
    private tokenService: TokenService,
    private userService: UserService
  ) {}

  async authenticateWithProvider(provider: OAuthProvider): Promise<AuthResult> {
    const authCode = await provider.getAuthCode();
    const tokens = await this.tokenService.exchangeCode(authCode);
    const user = await this.userService.getProfile(tokens.accessToken);

    await this.tokenService.store(tokens);

    return { user, tokens };
  }
}`
        },
        {
          name: 'Multi-Factor Auth',
          description: 'SMS, Email, and TOTP 2FA implementation',
          complexity: 'High',
          reusability: 88,
          loc: 580,
          rating: 4.8,
          tags: ['2FA', 'Security', 'TOTP'],
          features: [
            'TOTP authenticator app support',
            'SMS verification',
            'Email verification',
            'Backup codes'
          ],
          code: `// Multi-Factor Authentication Context
export class MFAContext {
  async enableTOTP(userId: string): Promise<TOTPSetup> {
    const secret = generateTOTPSecret();
    const qrCode = await this.generateQRCode(secret, userId);

    await this.mfaRepo.storeTOTPSecret(userId, secret);

    return { secret, qrCode };
  }
}`
        },
        {
          name: 'Social Login',
          description: 'Simplified social authentication',
          complexity: 'Low',
          reusability: 92,
          loc: 180,
          rating: 4.7,
          tags: ['Social', 'OAuth', 'Simple'],
          features: [
            'Google, Facebook, Twitter login',
            'Account linking',
            'Profile synchronization',
            'One-click registration'
          ],
          code: `// Social Login Context
export class SocialLoginContext {
  async loginWithProvider(provider: SocialProvider): Promise<User> {
    const profile = await provider.authenticate();
    const user = await this.userService.findOrCreate(profile);

    await this.sessionService.create(user.id);

    return user;
  }
}`
        }
      ]
    },
    payment: {
      name: 'Payment',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      patterns: [
        {
          name: 'Stripe Integration',
          description: 'Complete Stripe payment processing',
          complexity: 'Medium',
          reusability: 94,
          loc: 420,
          rating: 4.9,
          tags: ['Stripe', 'Payments', 'Webhooks'],
          features: [
            'Payment intents',
            'Subscription management',
            'Webhook handling',
            'Refund processing'
          ],
          code: `// Payment Context
export class PaymentContext {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: paymentData.amount,
      currency: paymentData.currency,
      customer: paymentData.customerId
    });

    return this.paymentRepo.create({
      intentId: paymentIntent.id,
      status: 'pending',
      ...paymentData
    });
  }
}`
        },
        {
          name: 'Subscription Billing',
          description: 'Recurring billing with metered usage',
          complexity: 'High',
          reusability: 90,
          loc: 650,
          rating: 4.8,
          tags: ['Subscriptions', 'Billing', 'Metered'],
          features: [
            'Multiple billing cycles',
            'Usage-based billing',
            'Proration handling',
            'Dunning management'
          ],
          code: `// Subscription Context
export class SubscriptionContext {
  async createSubscription(plan: Plan, customer: Customer): Promise<Subscription> {
    const subscription = await this.stripe.createSubscription({
      customer: customer.stripeId,
      items: [{ price: plan.stripePriceId }]
    });

    return this.subscriptionRepo.create({
      customerId: customer.id,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: 'active'
    });
  }
}`
        }
      ]
    },
    dataProcessing: {
      name: 'Data Processing',
      icon: <Database className="w-5 h-5" />,
      color: 'from-cyan-500 to-orange-500',
      patterns: [
        {
          name: 'Event Sourcing',
          description: 'Complete event sourcing implementation',
          complexity: 'High',
          reusability: 96,
          loc: 720,
          rating: 4.9,
          tags: ['Events', 'CQRS', 'Sourcing'],
          features: [
            'Event store',
            'Snapshots',
            'Projection rebuilding',
            'Event replay'
          ],
          code: `// Event Sourcing Context
export class EventSourcingContext {
  async appendEvent(streamId: string, event: DomainEvent): Promise<void> {
    const eventRecord = {
      streamId,
      eventType: event.constructor.name,
      eventData: event.data,
      version: await this.getNextVersion(streamId),
      timestamp: new Date()
    };

    await this.eventStore.append(streamId, eventRecord);
    await this.eventBus.publish(event);
  }
}`
        },
        {
          name: 'Data Pipeline',
          description: 'ETL pipeline with error handling',
          complexity: 'Medium',
          reusability: 89,
          loc: 480,
          rating: 4.7,
          tags: ['ETL', 'Pipeline', 'Processing'],
          features: [
            'Batch processing',
            'Error recovery',
            'Data validation',
            'Progress tracking'
          ],
          code: `// Data Pipeline Context
export class DataPipelineContext {
  async processBatch(batch: DataBatch): Promise<ProcessingResult> {
    const validatedData = await this.validator.validate(batch.data);
    const transformedData = await this.transformer.transform(validatedData);
    const result = await this.loader.load(transformedData);

    await this.progressTracker.updateProgress(batch.id, 'completed');

    return result;
  }
}`
        }
      ]
    },
    communication: {
      name: 'Communication',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'from-cyan-500 to-orange-500',
      patterns: [
        {
          name: 'Real-time Chat',
          description: 'WebSocket-based chat system',
          complexity: 'Medium',
          reusability: 91,
          loc: 520,
          rating: 4.8,
          tags: ['WebSocket', 'Real-time', 'Chat'],
          features: [
            'Real-time messaging',
            'Typing indicators',
            'Message history',
            'File sharing'
          ],
          code: `// Chat Context
export class ChatContext {
  async sendMessage(roomId: string, message: Message): Promise<void> {
    const enrichedMessage = await this.messageProcessor.process(message);

    await this.messageRepo.store(roomId, enrichedMessage);
    await this.websocketService.broadcast(roomId, enrichedMessage);

    this.emit('messageReceived', { roomId, message: enrichedMessage });
  }
}`
        },
        {
          name: 'Email System',
          description: 'Transactional and marketing emails',
          complexity: 'Low',
          reusability: 95,
          loc: 290,
          rating: 4.9,
          tags: ['Email', 'Templates', 'Marketing'],
          features: [
            'Template engine',
            'Delivery tracking',
            'A/B testing',
            'Unsubscribe handling'
          ],
          code: `// Email Context
export class EmailContext {
  async sendTemplatedEmail(template: EmailTemplate, recipient: Recipient): Promise<void> {
    const renderedEmail = await this.templateEngine.render(template, recipient.data);

    const emailRecord = await this.emailRepo.create({
      templateId: template.id,
      recipientId: recipient.id,
      subject: renderedEmail.subject,
      body: renderedEmail.body
    });

    await this.emailProvider.send(emailRecord);
  }
}`
        }
      ]
    }
  };

  const currentCategory = categories[selectedCategory as keyof typeof categories];
  const currentPattern = currentCategory.patterns[selectedPattern];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'text-green-400 bg-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'High': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <Section>
      <div ref={showcaseRef} className="max-w-7xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Battle-Tested Pattern Library"
            subtitle="Production-ready patterns that save weeks of development time"
            align="center"
          />
        </div>

        {/* Category Selector */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  setSelectedPattern(0);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all duration-300 ${
                  selectedCategory === key
                    ? `bg-gradient-to-r ${category.color} text-black font-semibold border-transparent`
                    : 'bg-black/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Grid */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Pattern List */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {currentCategory.icon}
              {currentCategory.name} Patterns
            </h3>
            <div className="space-y-3">
              {currentCategory.patterns.map((pattern, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPattern(index)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                    selectedPattern === index
                      ? `bg-cyan-500/20 border-cyan-500/50`
                      : 'bg-black/50 border-gray-800/50 hover:border-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{pattern.name}</h4>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{pattern.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{pattern.description}</p>

                  <div className="flex items-center gap-4 text-xs">
                    <span className={`px-2 py-1 rounded-full ${getComplexityColor(pattern.complexity)}`}>
                      {pattern.complexity}
                    </span>
                    <span className="text-gray-500">{pattern.loc} LOC</span>
                    <span className="text-cyan-400">{pattern.reusability}% reusable</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Details */}
          <div className="lg:col-span-2">
            <div className="bg-black/50 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">

              {/* Header */}
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{currentPattern.name}</h3>
                    <p className="text-gray-300">{currentPattern.description}</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-all duration-300">
                    <Download className="w-4 h-4" />
                    Add to Project
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentPattern.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-black/50 text-gray-300 rounded-full text-sm border border-gray-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentPattern.rating}</div>
                    <div className="text-gray-400 text-sm">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentPattern.loc}</div>
                    <div className="text-gray-400 text-sm">Lines of Code</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentPattern.reusability}%</div>
                    <div className="text-gray-400 text-sm">Reusability</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getComplexityColor(currentPattern.complexity).split(' ')[0]}`}>
                      {currentPattern.complexity}
                    </div>
                    <div className="text-gray-400 text-sm">Complexity</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 border-b border-gray-700/50">
                <h4 className="text-lg font-semibold text-white mb-4">What's Included</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPattern.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Preview */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-lg font-semibold text-white">Code Preview</h4>
                </div>
                <div className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300">
                    <code>{currentPattern.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 rounded-xl p-8 border border-cyan-500/20">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Why Use Greenfield Patterns?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">10x Faster Development</h4>
                <p className="text-gray-300">Skip the research and implementation. Get production-ready code instantly.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Battle-Tested Quality</h4>
                <p className="text-gray-300">Every pattern is used in production by thousands of developers.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Team Consistency</h4>
                <p className="text-gray-300">Everyone uses the same proven patterns. No more reinventing the wheel.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12 text-center">
          <p className="text-gray-300 mb-6">
            Get access to 200+ production-ready patterns across all major categories
          </p>
          <button className="px-8 py-4 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-all duration-300">
            Browse Full Pattern Library
          </button>
        </div>
      </div>
    </Section>
  );
};

export default PatternShowcase;