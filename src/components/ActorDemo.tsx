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
            accent="sprout"
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
                    ? 'bg-[#50c878] border-transparent text-black font-semibold'
                    : 'bg-[#1a2e1a]/50 border-gray-400 text-gray-100 hover:border-[#50c878]/50'
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
          <div className="bg-[#1a2e1a]/50 backdrop-blur-sm rounded-xl border border-gray-400/80 overflow-hidden">

            {/* Header */}
            <div className="bg-[#1a2e1a]/50 px-6 py-4 border-b border-gray-400/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{currentFlow.title}</h3>
                  <p className="text-gray-100">{currentFlow.description}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="flex items-center gap-2 px-4 py-2 bg-[#50c878] text-black font-semibold rounded-lg hover:bg-[#3da85f] transition-colors"
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
                    className="px-4 py-2 border border-gray-400 text-gray-100 rounded-lg hover:border-[#50c878] transition-colors"
                  >
                    {showCode ? 'Hide' : 'Show'} Code
                  </button>
                </div>
              </div>
            </div>

            {/* Main Visualization Area */}
            <div className="p-8">

              {/* Side-by-side: Event Timeline + Animation */}
              <div className="grid grid-cols-[280px,1fr] gap-6">

                {/* Event Timeline - Left Side */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-200 mb-4 uppercase tracking-wider px-2">
                    Event Flow ({currentStep + 1}/{currentFlow.steps.length})
                  </div>
                  {currentFlow.steps.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-[#50c878]/20 border-[#50c878] shadow-lg shadow-[#50c878]/20 scale-105'
                          : index < currentStep
                          ? 'bg-[#1a2e1a]/30 border-[#f4d03f]/50 opacity-90'
                          : 'bg-[#1a2e1a]/30 border-gray-400 opacity-85'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                          index === currentStep
                            ? 'bg-[#50c878] text-black animate-pulse'
                            : index < currentStep
                            ? 'bg-[#f4d03f] text-white'
                            : 'bg-gray-600 text-gray-100'
                        }`}>
                          {index < currentStep ? '✓' : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium leading-snug ${
                            index === currentStep
                              ? 'text-white'
                              : index < currentStep
                              ? 'text-gray-200'
                              : 'text-gray-100'
                          }`}>
                            {step.event}
                          </div>
                          {index === currentStep && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Zap className="w-3 h-3 text-[#50c878] animate-pulse" />
                              <span className="text-[10px] text-[#50c878]/80 font-semibold uppercase">Active Now</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Animation Container - Right Side */}
              <div className="relative h-96 bg-[#1a2e1a]/30 rounded-lg border border-gray-400/80 overflow-hidden">

                {/* Trigger Node (Left Side) */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
                  <div className={`relative p-6 rounded-xl shadow-lg transition-all duration-500 ${
                    currentStep >= 0 ? 'scale-105' : ''
                  } ${
                    currentFlow.trigger.color === 'purple'
                      ? 'bg-gradient-to-br from-[#50c878]/30 to-[#3da85f]/30 border-2 border-[#50c878]'
                      : currentFlow.trigger.color === 'blue'
                      ? 'bg-gradient-to-br from-[#50c878]/30 to-[#3da85f]/30 border-2 border-[#50c878]'
                      : 'bg-gradient-to-br from-[#f4d03f]/30 to-[#d4b82f]/30 border-2 border-[#f4d03f]'
                  }`}>
                    {React.createElement(currentFlow.trigger.icon, {
                      className: `w-10 h-10 ${
                        currentFlow.trigger.color === 'purple' ? 'text-[#50c878]' :
                        currentFlow.trigger.color === 'blue' ? 'text-[#50c878]' : 'text-[#f4d03f]'
                      }`
                    })}
                    <div className="text-sm text-white mt-2 font-medium">{currentFlow.trigger.label}</div>
                    {currentStep === 0 && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#50c878] rounded-full animate-ping"></div>
                    )}
                  </div>
                </div>


                {/* Actor Nodes (Right Side - Grid layout) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="grid grid-cols-2 gap-2" style={{ width: '320px' }}>
                    {currentFlow.actors.map((actor, index) => {
                      const currentStepData = currentFlow.steps[currentStep];
                      const isHighlighted = currentStepData && (
                        currentStepData.highlight?.includes(actor.id) ||
                        (currentStepData.highlight?.includes('all') && actor.id !== 'order' && actor.id !== 'collab')
                      );

                      const getActorColors = (color: string, isHighlighted: boolean) => {
                        if (!isHighlighted) return 'bg-[#1a2e1a]/50 border-gray-400/50 opacity-60';

                        const colorMap: Record<string, string> = {
                          blue: 'bg-gradient-to-br from-[#50c878]/40 to-[#3da85f]/40 border-[#50c878]',
                          green: 'bg-gradient-to-br from-[#f4d03f]/40 to-[#d4b82f]/40 border-[#f4d03f]',
                          purple: 'bg-gradient-to-br from-[#50c878]/40 to-[#3da85f]/40 border-[#50c878]',
                          orange: 'bg-gradient-to-br from-[#f4d03f]/40 to-[#d4b82f]/40 border-[#f4d03f]',
                          red: 'bg-gradient-to-br from-[#f4d03f]/40 to-[#d4b82f]/40 border-[#f4d03f]',
                          yellow: 'bg-gradient-to-br from-[#f4d03f]/40 to-[#d4b82f]/40 border-[#f4d03f]',
                          teal: 'bg-gradient-to-br from-[#50c878]/40 to-[#3da85f]/40 border-[#50c878]'
                        };
                        return colorMap[color] || colorMap.blue;
                      };

                      const getIconColor = (color: string) => {
                        const colorMap: Record<string, string> = {
                          blue: 'text-[#50c878]',
                          green: 'text-[#f4d03f]',
                          purple: 'text-[#50c878]',
                          orange: 'text-[#f4d03f]',
                          red: 'text-[#f4d03f]',
                          yellow: 'text-[#f4d03f]',
                          teal: 'text-[#50c878]'
                        };
                        return colorMap[color] || 'text-[#50c878]';
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
                            boxShadow: isHighlighted ? `0 0 30px ${actor.color === 'blue' || actor.color === 'purple' || actor.color === 'teal' ? '#50c878' : '#f4d03f'}40` : 'none'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {React.createElement(actor.icon, { className: `w-5 h-5 ${getIconColor(actor.color)} flex-shrink-0 ${isHighlighted ? 'animate-pulse' : ''}` })}
                            <div className="text-xs text-white font-medium">{actor.label}</div>
                          </div>
                          {isHighlighted && (
                            <div className="absolute -top-1 -right-1">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#50c878] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#50c878]"></span>
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
                        <div className="w-2 h-2 bg-[#50c878] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#50c878] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 bg-[#50c878] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-[#f4d03f] rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        <div className="w-2 h-2 bg-[#f4d03f] rounded-full animate-pulse" style={{ animationDelay: '800ms' }}></div>
                        <div className="w-2 h-2 bg-[#f4d03f] rounded-full animate-pulse" style={{ animationDelay: '1000ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              </div>
              {/* End of side-by-side grid */}

              {/* Metrics Comparison */}
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="p-4 bg-[#f4d03f]/10 border border-[#f4d03f]/50 rounded-lg">
                  <h4 className="text-[#f4d03f] font-semibold mb-3">Traditional Monolithic</h4>
                  <div className="space-y-2">
                    {Object.entries(currentFlow.metrics.traditional).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-200 capitalize">{key}:</span>
                        <span className="text-[#f4d03f]/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-[#50c878]/10 border border-[#50c878]/50 rounded-lg">
                  <h4 className="text-[#50c878] font-semibold mb-3">Actor Architecture</h4>
                  <div className="space-y-2">
                    {Object.entries(currentFlow.metrics.actors).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-200 capitalize">{key}:</span>
                        <span className="text-[#50c878]/80">{value}</span>
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
                    <div className="bg-[#1a2e1a]/50 rounded-lg p-4">
                      <h5 className="text-[#50c878] font-medium mb-2">Service Contract</h5>
                      <pre className="text-xs text-gray-100 overflow-x-auto">
                        <code>{sampleCode.contract}</code>
                      </pre>
                    </div>

                    <div className="bg-[#1a2e1a]/50 rounded-lg p-4">
                      <h5 className="text-[#f4d03f] font-medium mb-2">Command Handler</h5>
                      <pre className="text-xs text-gray-100 overflow-x-auto">
                        <code>{sampleCode.handler}</code>
                      </pre>
                    </div>

                    <div className="bg-[#1a2e1a]/50 rounded-lg p-4">
                      <h5 className="text-[#50c878] font-medium mb-2">Event Handler</h5>
                      <pre className="text-xs text-gray-100 overflow-x-auto">
                        <code>{sampleCode.event}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Benefits Footer */}
            <div className="bg-gradient-to-r from-[#50c878]/10 to-[#1a2e1a]/50 border-t border-gray-400 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-8 h-8 text-[#50c878]" />
                  <div>
                    <div className="text-white font-semibold">AI builds this perfectly every time</div>
                    <div className="text-gray-100 text-sm">No hallucinations • No context loss • 100% accuracy</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#50c878]">90%</div>
                    <div className="text-xs text-gray-200">Less Code</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#f4d03f]">100x</div>
                    <div className="text-xs text-gray-200">Faster</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#50c878]">0</div>
                    <div className="text-xs text-gray-200">AI Errors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-[#1a2e1a]/30 border border-gray-400 rounded-lg text-center hover:border-[#50c878]/50 transition-colors">
              <CheckCircle className="w-8 h-8 text-[#50c878] mx-auto mb-2" />
              <h4 className="text-white font-semibold">Perfect AI Context</h4>
              <p className="text-gray-100 text-sm mt-1">Every actor under 1000 lines</p>
            </div>
            <div className="p-4 bg-[#1a2e1a]/30 border border-gray-400 rounded-lg text-center hover:border-[#50c878]/50 transition-colors">
              <Sparkles className="w-8 h-8 text-[#50c878] mx-auto mb-2" />
              <h4 className="text-white font-semibold">No Hallucinations</h4>
              <p className="text-gray-100 text-sm mt-1">AI never loses track</p>
            </div>
            <div className="p-4 bg-[#1a2e1a]/30 border border-gray-400 rounded-lg text-center hover:border-[#f4d03f]/50 transition-colors">
              <Zap className="w-8 h-8 text-[#f4d03f] mx-auto mb-2" />
              <h4 className="text-white font-semibold">Event Choreography</h4>
              <p className="text-gray-100 text-sm mt-1">Automatic parallel processing</p>
            </div>
            <div className="p-4 bg-[#1a2e1a]/30 border border-gray-400 rounded-lg text-center hover:border-[#50c878]/50 transition-colors">
              <GitBranch className="w-8 h-8 text-[#50c878] mx-auto mb-2" />
              <h4 className="text-white font-semibold">Infinite Scale</h4>
              <p className="text-gray-100 text-sm mt-1">Add actors without complexity</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default ActorDemo;