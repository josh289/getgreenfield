import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Code, Zap, TrendingDown } from 'lucide-react';

const CodeComparison: React.FC = () => {
  const comparisonRef = useRef<HTMLDivElement>(null);

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

    const elements = comparisonRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const beforeCode = `// Traditional microservice - Express setup (100+ lines)
import express from 'express';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

// Manual middleware stack
app.use(authMiddleware);
app.use(tracingMiddleware);
app.use(validationMiddleware);
app.use(loggingMiddleware);

// Manual RabbitMQ connection
const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();
await channel.assertExchange('orders', 'topic');
await channel.assertQueue('order.created');

// HTTP route with all the boilerplate
app.post('/api/users', async (req, res) => {
  try {
    // Manual auth validation
    const token = req.headers.authorization;
    const user = await verifyToken(token);
    if (!user?.permissions.includes('users:create')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Manual input validation
    const { email, firstName, lastName } = req.body;
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Business logic buried in HTTP handler
    const userId = \`user-\${Date.now()}\`;

    // Manual event publishing to message bus
    await channel.publish('users', 'user.created',
      Buffer.from(JSON.stringify({
        userId, email, firstName, lastName
      }))
    );

    // Manual distributed tracing
    span.setAttributes({ userId, email });
    span.end();

    // Manual response
    res.status(201).json({
      userId,
      email,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Create user failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Start HTTP server
app.listen(3000);`;

  const afterCode = `// Banyan Platform - Just business logic (15 lines)
import { CommandHandler, CommandHandlerDecorator }
  from '@banyanai/platform-base-service';
import { CreateUserCommand, CreateUserResult }
  from './contracts';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler
  extends CommandHandler<CreateUserCommand, CreateUserResult> {

  async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    // Your business logic - that's it!
    return {
      userId: \`user-\${Date.now()}\`,
      email: command.email,
      createdAt: new Date().toISOString()
    };
  }
}

// Platform automatically provides:
// ✅ POST /api/users REST endpoint
// ✅ GraphQL createUser mutation
// ✅ Permission validation (users:create)
// ✅ Message bus routing via RabbitMQ
// ✅ Distributed tracing with OpenTelemetry
// ✅ Input validation from contract
// ✅ Event publishing and choreography
// ✅ Service discovery registration`;

  return (
    <Section id="code-comparison">
      <div ref={comparisonRef} className="max-w-7xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Write Only Business Logic"
            subtitle="No HTTP servers. No message queues. No infrastructure code. Just handlers."
            align="center"
          />
        </div>

        {/* Comparison Container */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Before - Traditional */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f4d03f]/20 rounded-lg border border-[#f4d03f]/50">
                    <Code className="w-5 h-5 text-[#f4d03f]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Traditional Microservices</h3>
                    <p className="text-sm text-gray-200">Express.js + manual infrastructure</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[#1a2e1a]/50 backdrop-blur-sm rounded-xl border border-[#f4d03f]/50 overflow-hidden">
                <div className="bg-[#f4d03f]/10 px-4 py-2 border-b border-[#f4d03f]/50 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#f4d03f]/80">order-service.js</span>
                  <span className="text-xs text-[#f4d03f] font-semibold">~100 lines</span>
                </div>
                <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
                  <pre className="text-sm leading-relaxed">
                    <code className="font-mono text-gray-100">{beforeCode}</code>
                  </pre>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#f4d03f]/10 border border-[#f4d03f]/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#f4d03f]">100+</div>
                  <div className="text-xs text-gray-200">Lines of code</div>
                </div>
                <div className="p-3 bg-[#f4d03f]/10 border border-[#f4d03f]/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#f4d03f]">High</div>
                  <div className="text-xs text-gray-200">Complexity</div>
                </div>
                <div className="p-3 bg-[#f4d03f]/10 border border-[#f4d03f]/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#f4d03f]">Poor</div>
                  <div className="text-xs text-gray-200">AI Context</div>
                </div>
              </div>
            </div>

            {/* After - Greenfield */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#50c878]/20 rounded-lg border border-[#50c878]/50">
                    <Zap className="w-5 h-5 text-[#50c878]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Greenfield Platform</h3>
                    <p className="text-sm text-gray-200">Actor architecture + auto-infrastructure</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[#1a2e1a]/50 backdrop-blur-sm rounded-xl border border-[#50c878]/50 overflow-hidden">
                <div className="bg-[#50c878]/10 px-4 py-2 border-b border-[#50c878]/50 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#50c878]/80">order-actor.ts</span>
                  <span className="text-xs text-[#50c878] font-semibold">~10 lines</span>
                </div>
                <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
                  <pre className="text-sm leading-relaxed">
                    <code className="font-mono text-gray-100">{afterCode}</code>
                  </pre>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#50c878]/10 border border-[#50c878]/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#50c878]">10</div>
                  <div className="text-xs text-gray-200">Lines of code</div>
                </div>
                <div className="p-3 bg-[#50c878]/10 border border-[#50c878]/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#50c878]">Low</div>
                  <div className="text-xs text-gray-200">Complexity</div>
                </div>
                <div className="p-3 bg-[#50c878]/10 border border-[#50c878]/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#50c878]">Perfect</div>
                  <div className="text-xs text-gray-200">AI Context</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Differences */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="bg-gradient-to-r from-[#f4d03f]/10 via-[#1a2e1a]/50 to-[#50c878]/10 rounded-xl border border-gray-400/80 p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingDown className="w-6 h-6 text-[#50c878]" />
              <h3 className="text-2xl font-bold text-white">The Platform Does the Heavy Lifting</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#1a2e1a]/50 rounded-lg border border-gray-400">
                <h4 className="text-[#50c878] font-semibold mb-2">Auto-Routing</h4>
                <p className="text-sm text-gray-100">HTTP endpoints, gRPC, and GraphQL generated from actors</p>
              </div>

              <div className="p-4 bg-[#1a2e1a]/50 rounded-lg border border-gray-400">
                <h4 className="text-[#50c878] font-semibold mb-2">Auth & Validation</h4>
                <p className="text-sm text-gray-100">Type-safe validation and role-based access control built-in</p>
              </div>

              <div className="p-4 bg-[#1a2e1a]/50 rounded-lg border border-gray-400">
                <h4 className="text-[#50c878] font-semibold mb-2">Event Choreography</h4>
                <p className="text-sm text-gray-100">Automatic event publishing and subscription management</p>
              </div>

              <div className="p-4 bg-[#1a2e1a]/50 rounded-lg border border-gray-400">
                <h4 className="text-[#50c878] font-semibold mb-2">Observability</h4>
                <p className="text-sm text-gray-100">Distributed tracing, metrics, and logging out of the box</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#50c878]/10 border border-[#50c878]/50 rounded-lg">
            <Zap className="w-5 h-5 text-[#50c878]" />
            <span className="text-white font-medium">Write 90% less code. Ship 10x faster.</span>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default CodeComparison;
