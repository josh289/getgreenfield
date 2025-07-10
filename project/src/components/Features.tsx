import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { PanelTop, GitBranch, CircuitBoard, LayoutList, BookOpen, Lock } from 'lucide-react';

const Features: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);

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

    const elements = featuresRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <PanelTop className="w-8 h-8 text-blue-500" />,
      title: "Living Context",
      description: "Your AI agents understand your projects, not just prompts"
    },
    {
      icon: <CircuitBoard className="w-8 h-8 text-purple-500" />,
      title: "Reusable Processes",
      description: "Build a relay once, use it forever (and it gets smarter)"
    },
    {
      icon: <LayoutList className="w-8 h-8 text-teal-500" />,
      title: "Tool Integration",
      description: "Works with Claude, Cursor, Slack, and 100+ tools via MCP"
    },
    {
      icon: <GitBranch className="w-8 h-8 text-green-500" />,
      title: "True Collaboration",
      description: "AI agents are team members, not just tools"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-orange-500" />,
      title: "Your Data, Your Control",
      description: "Secure MCP tools, your infrastructure, your rules"
    },
    {
      icon: <Lock className="w-8 h-8 text-red-500" />,
      title: "See What's Working",
      description: "Track relay performance, optimize over time"
    }
  ];

  return (
    <Section>
      <div id="features" className="scroll-mt-20">
        <div ref={featuresRef} className="max-w-6xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle 
              title="Everything You Need for Human + AI Work"
              subtitle="RelayMCP brings together all the capabilities teams need to work effectively with AI agents"
             align="center"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 h-full">
                  <div className="bg-slate-900/50 rounded-lg p-4 inline-block mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300">
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