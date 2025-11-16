import React from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Box, Shield, Zap, Activity, Cpu, Cloud } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Box className="w-8 h-8" />,
      title: "Bounded Contexts",
      description: "AI never loses context. Each actor stays under 1,000 lines. Self-contained domains that any LLM can fully understand."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Zero Hallucinations",
      description: "Type-safe contracts between actors. Compile-time validation. Runtime guarantees. No AI guesswork, just working code."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Event Choreography",
      description: "Actors communicate via typed events. Zero coupling. Perfect separation of concerns. Change one actor without touching others."
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Built-in Observability",
      description: "Distributed tracing out of the box. Metrics, spans, and events for every actor. Production debugging without the setup."
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Actor Model",
      description: "State machines with supervision trees. Fault tolerance built-in. Failures are isolated, recovery is automatic."
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Deploy Anywhere",
      description: "Cloud-agnostic from day one. Docker ready, Kubernetes native. Your infrastructure, your choice, zero vendor lock-in."
    }
  ];

  return (
    <Section>
      <div id="features" className="scroll-mt-20">
        <div className="max-w-6xl mx-auto py-24">
          <SectionTitle
            title="Built for AI-First Development"
            subtitle="Architecture patterns that make sense to both humans and language models"
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg p-8 border border-[#252525] bg-black/40 hover:border-[#00d9ff] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cyan glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00d9ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg mb-6 bg-black/50 border border-[#252525] group-hover:border-[#00d9ff] group-hover:bg-[#00d9ff]/10 transition-all duration-300">
                    <div className="text-[#00d9ff] transition-all duration-300 group-hover:scale-110">
                      {feature.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-200 leading-relaxed group-hover:text-white transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Features;
