import React, { useState, useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import {
  Zap, MessageSquare, Package, CreditCard, Bell, BarChart,
  Search, CheckCircle, Play, Pause,
  Brain, Sparkles, Code, GitBranch
} from 'lucide-react';

const ActorDemo: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<'order' | 'message' | 'ai'>('ai');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  // Animation observer
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

  // Animation stepper
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        if (currentStep < flows[activeFlow].steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setIsAnimating(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, currentStep, activeFlow]);

  const flows = {
    ai: {
      title: "AI Builds Without Hallucinating",
      description: "See how bounded contexts enable AI to generate perfect code",
      trigger: { icon: Brain, label: "AI Task: Build Order System", color: "purple" },
      actors: [
        { id: 'context', icon: GitBranch, label: 'Bounded Context', color: 'blue' },
        { id: 'contract', icon: Code, label: 'Service Contract', color: 'green' },
        { id: 'handlers', icon: Sparkles, label: 'Generated Handlers', color: 'purple' },
        { id: 'events', icon: Zap, label: 'Event Choreography', color: 'yellow' }
      ],
      steps: [
        { from: 'trigger', to: 'context', event: 'AI analyzes bounded context (<1000 lines)', highlight: ['context'] },
        { from: 'context', to: 'contract', event: 'AI generates type-safe contract', highlight: ['contract'] },
        { from: 'contract', to: 'handlers', event: 'AI creates handlers without confusion', highlight: ['handlers'] },
        { from: 'handlers', to: 'events', event: 'AI wires up event choreography', highlight: ['events'] },
      ],
      metrics: {
        traditional: { accuracy: '45%', time: '2 days', errors: '15-20' },
        actors: { accuracy: '100%', time: '1 hour', errors: '0' }
      }
    },
    order: {
      title: "Order Processing Flow",
      description: "Watch how actors handle a complex e-commerce transaction",
      trigger: { icon: Package, label: "Place Order", color: "blue" },
      actors: [
        { id: 'order', icon: Package, label: 'Order Actor', color: 'blue' },
        { id: 'inventory', icon: Package, label: 'Inventory Actor', color: 'green' },
        { id: 'payment', icon: CreditCard, label: 'Payment Actor', color: 'purple' },
        { id: 'shipping', icon: Package, label: 'Shipping Actor', color: 'orange' },
        { id: 'notification', icon: Bell, label: 'Notification Actor', color: 'red' },
        { id: 'analytics', icon: BarChart, label: 'Analytics Actor', color: 'teal' }
      ],
      steps: [
        { from: 'trigger', to: 'order', event: 'PlaceOrder command', highlight: ['order'] },
        { from: 'order', to: 'all', event: 'OrderPlaced event broadcast', highlight: ['inventory', 'payment', 'notification', 'analytics'] },
        { from: 'payment', to: 'shipping', event: 'PaymentProcessed → Create shipping', highlight: ['shipping'] },
        { from: 'shipping', to: 'notification', event: 'ShippingCreated → Send tracking', highlight: ['notification'] }
      ],
      metrics: {
        traditional: { lines: '500+', coupling: 'High', testability: 'Poor' },
        actors: { lines: '50', coupling: 'Zero', testability: 'Perfect' }
      }
    },
    message: {
      title: "Collaboration Message Flow",
      description: "See how one message triggers multiple parallel processes",
      trigger: { icon: MessageSquare, label: "Post Message", color: "green" },
      actors: [
        { id: 'collab', icon: MessageSquare, label: 'Collaboration Actor', color: 'green' },
        { id: 'search', icon: Search, label: 'Search Actor', color: 'blue' },
        { id: 'notify', icon: Bell, label: 'Notification Actor', color: 'red' },
        { id: 'stats', icon: BarChart, label: 'Statistics Actor', color: 'purple' },
        { id: 'achieve', icon: CheckCircle, label: 'Achievement Actor', color: 'yellow' }
      ],
      steps: [
        { from: 'trigger', to: 'collab', event: 'PostMessage command', highlight: ['collab'] },
        { from: 'collab', to: 'all', event: 'MessagePosted event → All actors', highlight: ['search', 'notify', 'stats', 'achieve'] },
        { from: 'achieve', to: 'notify', event: 'AchievementUnlocked → Notify user', highlight: ['notify'] }
      ],
      metrics: {
        traditional: { complexity: 'O(n²)', maintenance: 'Nightmare', scaling: 'Vertical' },
        actors: { complexity: 'O(1)', maintenance: 'Simple', scaling: 'Horizontal' }
      }
    }
  };

  const currentFlow = flows[activeFlow];
  const activeSteps = currentFlow.steps.slice(0, currentStep + 1);

  const handlePlayPause = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      setCurrentStep(0);
      setIsAnimating(true);
    }
  };

  const sampleCode = {
    contract: `export const OrderServiceContract = {
  commands: [{
    name: 'PlaceOrder',
    inputSchema: PlaceOrderSchema,
    permissions: ['order:create']
  }],

  events: [{
    name: 'OrderPlaced',
    broadcast: true
  }]
};`,
    handler: `@CommandHandler('PlaceOrder')
export class PlaceOrderHandler {
  async handle(cmd: PlaceOrder) {
    // Just business logic!
    if (!cmd.items?.length) {
      throw new BusinessError('No items');
    }

    return {
      orderId: newId(),
      status: 'pending'
    };
    // Platform handles everything else
  }
}`,
    event: `@EventHandler('OrderPlaced')
export class InventoryHandler {
  async handle(event: OrderPlaced) {
    await this.reserveItems(event.items);
    emit('InventoryReserved', {
      orderId: event.orderId
    });
  }
}`
  };

  return (
    <Section id="actor-demo">
      <div ref={demoRef} className="max-w-7xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="See Actors in Action"
            subtitle="Watch how AI builds perfect event-driven systems with bounded contexts"
            align="center"
            accent="blue"
          />
        </div>

        {/* Flow Selector */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {Object.entries(flows).map(([key, flow]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveFlow(key as keyof typeof flows);
                  setCurrentStep(0);
                  setIsAnimating(false);
                }}
                className={`px-6 py-3 rounded-lg border transition-all duration-300 ${
                  activeFlow === key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white'
                    : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {React.createElement(flow.trigger.icon, { className: "w-5 h-5" })}
                  <span>{flow.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Visualization */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">

            {/* Header */}
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{currentFlow.title}</h3>
                  <p className="text-slate-400">{currentFlow.description}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isAnimating ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play Animation
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    {showCode ? 'Hide' : 'Show'} Code
                  </button>
                </div>
              </div>
            </div>

            {/* Main Visualization Area */}
            <div className="p-8">
              {/* Step Timeline at Top */}
              <div className="mb-6">
                {/* Current Step Display */}
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-bold shadow-lg">
                        {currentStep + 1}
                      </div>
                      <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-lg text-white font-semibold">
                            {currentFlow.steps[currentStep]?.event || "Ready to start"}
                          </div>
                          {currentFlow.steps[currentStep]?.event?.includes('broadcast') && (
                            <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full font-medium">
                              Broadcast
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {currentStep === currentFlow.steps.length - 1
                            ? "✓ Final step - Flow complete"
                            : `→ Next: ${currentFlow.steps[currentStep + 1]?.event?.split(' ').slice(0, 3).join(' ') || "Complete"}...`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm font-medium text-slate-300">
                        Step {currentStep + 1} of {currentFlow.steps.length}
                      </div>
                      <div className="flex gap-1">
                        {currentFlow.steps.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx <= currentStep ? 'bg-blue-400' : 'bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2">
                  {currentFlow.steps.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                        index <= currentStep
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                          : 'bg-slate-700'
                      }`}
                      title={step.event}
                    />
                  ))}
                </div>
              </div>

              {/* Animation Container */}
              <div className="relative h-96 bg-slate-900/30 rounded-lg border border-slate-700/50 overflow-hidden">

                {/* Trigger Node (Left Side) */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
                  <div className={`relative p-6 rounded-xl shadow-lg transition-all duration-500 ${
                    currentStep >= 0 ? 'scale-105' : ''
                  } ${
                    currentFlow.trigger.color === 'purple'
                      ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border-2 border-purple-500'
                      : currentFlow.trigger.color === 'blue'
                      ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-2 border-blue-500'
                      : 'bg-gradient-to-br from-green-500/30 to-green-600/30 border-2 border-green-500'
                  }`}>
                    {React.createElement(currentFlow.trigger.icon, {
                      className: `w-10 h-10 ${
                        currentFlow.trigger.color === 'purple' ? 'text-purple-400' :
                        currentFlow.trigger.color === 'blue' ? 'text-blue-400' : 'text-green-400'
                      }`
                    })}
                    <div className="text-sm text-white mt-2 font-medium">{currentFlow.trigger.label}</div>
                    {currentStep === 0 && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                </div>


                {/* Actor Nodes (Right Side - Grid layout) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="grid grid-cols-2 gap-2" style={{ width: '320px' }}>
                    {currentFlow.actors.map((actor, index) => {
                      const isHighlighted = activeSteps.some(step =>
                        step.highlight?.includes(actor.id) ||
                        (step.highlight?.includes('all') && actor.id !== 'order' && actor.id !== 'collab')
                      );

                      const getActorColors = (color: string, isHighlighted: boolean) => {
                        if (!isHighlighted) return 'bg-slate-800/50 border-slate-600/50 opacity-60';

                        const colorMap: Record<string, string> = {
                          blue: 'bg-gradient-to-br from-blue-500/40 to-blue-600/40 border-blue-500',
                          green: 'bg-gradient-to-br from-green-500/40 to-green-600/40 border-green-500',
                          purple: 'bg-gradient-to-br from-purple-500/40 to-purple-600/40 border-purple-500',
                          orange: 'bg-gradient-to-br from-orange-500/40 to-orange-600/40 border-orange-500',
                          red: 'bg-gradient-to-br from-red-500/40 to-red-600/40 border-red-500',
                          yellow: 'bg-gradient-to-br from-yellow-500/40 to-yellow-600/40 border-yellow-500',
                          teal: 'bg-gradient-to-br from-teal-500/40 to-teal-600/40 border-teal-500'
                        };
                        return colorMap[color] || colorMap.blue;
                      };

                      const getIconColor = (color: string) => {
                        const colorMap: Record<string, string> = {
                          blue: 'text-blue-400',
                          green: 'text-green-400',
                          purple: 'text-purple-400',
                          orange: 'text-orange-400',
                          red: 'text-red-400',
                          yellow: 'text-yellow-400',
                          teal: 'text-teal-400'
                        };
                        return colorMap[color] || 'text-blue-400';
                      };

                      // Calculate grid position (max 3 rows per column)
                      const row = index % 3;
                      const col = Math.floor(index / 3);

                      return (
                        <div
                          key={actor.id}
                          className={`relative p-3 rounded-lg border-2 transition-all duration-500 ${
                            getActorColors(actor.color, isHighlighted)
                          } ${isHighlighted ? 'scale-105 shadow-2xl z-10 ring-4 ring-opacity-50' : ''}`}
                          style={{
                            gridColumn: col + 1,
                            gridRow: row + 1,
                            boxShadow: isHighlighted ? `0 0 30px ${actor.color === 'blue' ? '#3b82f6' : actor.color === 'green' ? '#10b981' : actor.color === 'purple' ? '#8b5cf6' : '#f59e0b'}40` : 'none'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {React.createElement(actor.icon, { className: `w-5 h-5 ${getIconColor(actor.color)} flex-shrink-0 ${isHighlighted ? 'animate-pulse' : ''}` })}
                            <div className="text-xs text-white font-medium">{actor.label}</div>
                          </div>
                          {isHighlighted && (
                            <div className="absolute -top-1 -right-1">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simple Connection Indicators */}
                {currentStep > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Animated dots showing flow direction */}
                    <div className="absolute left-32 top-1/2 -translate-y-1/2">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '800ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1000ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics Comparison */}
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <h4 className="text-red-400 font-semibold mb-3">Traditional Monolithic</h4>
                  <div className="space-y-2">
                    {Object.entries(currentFlow.metrics.traditional).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-slate-400 capitalize">{key}:</span>
                        <span className="text-red-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-3">Actor Architecture</h4>
                  <div className="space-y-2">
                    {Object.entries(currentFlow.metrics.actors).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-slate-400 capitalize">{key}:</span>
                        <span className="text-green-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Code Examples (Collapsible) */}
              {showCode && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-lg font-semibold text-white">Actor Implementation (Auto-Generated by AI)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <h5 className="text-blue-400 font-medium mb-2">Service Contract</h5>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        <code>{sampleCode.contract}</code>
                      </pre>
                    </div>

                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <h5 className="text-green-400 font-medium mb-2">Command Handler</h5>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        <code>{sampleCode.handler}</code>
                      </pre>
                    </div>

                    <div className="bg-slate-950/50 rounded-lg p-4">
                      <h5 className="text-purple-400 font-medium mb-2">Event Handler</h5>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        <code>{sampleCode.event}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Benefits Footer */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-t border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-white font-semibold">AI builds this perfectly every time</div>
                    <div className="text-slate-400 text-sm">No hallucinations • No context loss • 100% accuracy</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">90%</div>
                    <div className="text-xs text-slate-400">Less Code</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">100x</div>
                    <div className="text-xs text-slate-400">Faster</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">0</div>
                    <div className="text-xs text-slate-400">AI Errors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold">Perfect AI Context</h4>
              <p className="text-slate-400 text-sm mt-1">Every actor under 1000 lines</p>
            </div>
            <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-center">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold">No Hallucinations</h4>
              <p className="text-slate-400 text-sm mt-1">AI never loses track</p>
            </div>
            <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold">Event Choreography</h4>
              <p className="text-slate-400 text-sm mt-1">Automatic parallel processing</p>
            </div>
            <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-center">
              <GitBranch className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold">Infinite Scale</h4>
              <p className="text-slate-400 text-sm mt-1">Add actors without complexity</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default ActorDemo;