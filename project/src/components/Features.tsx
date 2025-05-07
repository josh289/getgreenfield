import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { PanelTop, GitBranch, CircuitBoard, LayoutList, BookOpen } from 'lucide-react';

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

  const architectureSteps = [
    {
      icon: <PanelTop className="w-8 h-8 text-blue-500" />,
      title: "Canvas",
      description: "Where raw ideas take shape"
    },
    {
      icon: <CircuitBoard className="w-8 h-8 text-purple-500" />,
      title: "Best Practice Layer",
      description: "Shapes work through golden paths"
    },
    {
      icon: <LayoutList className="w-8 h-8 text-teal-500" />,
      title: "Relay Engine",
      description: "Orchestrates human-AI flows"
    },
    {
      icon: <GitBranch className="w-8 h-8 text-green-500" />,
      title: "GitHub Integration",
      description: "Anchors work to artifacts"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-orange-500" />,
      title: "Doc Center",
      description: "Compounds living knowledge"
    }
  ];

  return (
    <Section id="features">
      <div ref={featuresRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle 
            title="How contxtl's Relay Engine Powers Evolution"
            subtitle="This isn't a tool. It's a living system. Here's how the pieces flow together to evolve your work naturally."
            align="center"
            accent="purple"
          />
        </div>
        
        <div className="mt-16 relative">
          {/* Flowing connection line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 hidden lg:block">
            <div className="absolute inset-0 animate-pulse opacity-50"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {architectureSteps.map((step, index) => (
              <div 
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="relative">
                  <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 hover:bg-slate-800/50 hover:border-slate-600 transition-all">
                    {/* Connection dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hidden lg:block"></div>
                    
                    <div className="text-center">
                      <div className="inline-block mb-4">{step.icon}</div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-slate-300 text-sm">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-500 mt-16">
          <div className="rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-slate-700 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl opacity-20">
              <div className="absolute top-0 -right-12 w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-3xl"></div>
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <h3 className="text-2xl font-bold mb-4">Experience the Flow</h3>
              <p className="text-slate-300 mb-6">
                See how contxtl creates a living system where every piece flows naturally into the next, 
                preserving and evolving context at each step.
              </p>
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-md transition-colors inline-flex items-center">
                <span>Watch the demo</span>
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Features;