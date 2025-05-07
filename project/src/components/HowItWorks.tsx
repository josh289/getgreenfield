import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Paintbrush, Workflow, Play, BookOpen, PanelTop, CircuitBoard, LayoutList, GitBranch } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const howItWorksRef = useRef<HTMLDivElement>(null);

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

    const elements = howItWorksRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const evolutionSteps = [
    {
      icon: <Paintbrush className="w-8 h-8 text-blue-500" />,
      title: "Vibe on the Canvas",
      description: "Ignite ideas and raw intentions, setting the starting conditions for evolution.",
      systemComponent: {
        icon: <PanelTop className="w-6 h-6 text-blue-400" />,
        title: "Canvas",
        description: "Flexible workspace where humans and AI collaborate on initial ideas."
      }
    },
    {
      icon: <Workflow className="w-8 h-8 text-purple-500" />,
      title: "Structure Emerges",
      description: "Golden Paths guide ideas into living structures — Projects, Cycles, Relays, and Legs.",
      systemComponent: {
        icon: <CircuitBoard className="w-6 h-6 text-purple-400" />,
        title: "Best Practice Layer",
        description: "AI-powered patterns that shape work into optimal flows."
      }
    },
    {
      icon: <Play className="w-8 h-8 text-teal-500" />,
      title: "Work Flows Continuously",
      description: "Context propels agents and humans forward through seamless structured flows.",
      systemComponents: [
        {
          icon: <LayoutList className="w-6 h-6 text-teal-400" />,
          title: "Relay & Leg Orchestration",
          description: "Seamless handoffs between human and AI executors."
        },
        {
          icon: <GitBranch className="w-6 h-6 text-green-400" />,
          title: "GitHub Integration",
          description: "Connect evolving context to your codebase."
        }
      ]
    },
    {
      icon: <BookOpen className="w-8 h-8 text-orange-500" />,
      title: "Knowledge Evolves",
      description: "Every output enriches the Doc Center, compounding wisdom for future Cycles.",
      systemComponent: {
        icon: <BookOpen className="w-6 h-6 text-orange-400" />,
        title: "Doc Center",
        description: "Shared knowledge base that grows with every interaction."
      }
    }
  ];

  return (
    <Section id="how-it-works" dark>
      <div ref={howItWorksRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle 
            title="From idea to execution, cntxtl ensures humans and AI work with shared, evolving context"
            subtitle="A living system where knowledge flows seamlessly between human and AI collaborators, growing stronger with every interaction."
            align="center"
            accent="blue"
          />
        </div>
        
        <div className="mt-16 relative">
          {/* Connection line */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%-4rem)] bg-gradient-to-b from-blue-500 via-purple-500 to-teal-500 hidden md:block">
            <div className="absolute inset-0 animate-pulse opacity-50"></div>
          </div>
          
          {evolutionSteps.map((step, index) => (
            <div 
              key={index}
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mb-16 last:mb-0 relative"
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:ml-auto' : 'md:pl-12'}`}>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 relative">
                  {/* Connection dot */}
                  <div className="absolute top-10 hidden md:block right-0 md:right-auto md:left-0 transform translate-x-1/2 md:translate-x-0 md:-translate-x-1/2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-600"></div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">{step.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-slate-300">{step.description}</p>
                      </div>
                    </div>
                    
                    {/* System Component Cards */}
                    {step.systemComponent && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">{step.systemComponent.icon}</div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{step.systemComponent.title}</h4>
                            <p className="text-sm text-slate-400">{step.systemComponent.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {step.systemComponents && (
                      <div className="space-y-3">
                        {step.systemComponents.map((component, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mr-3">{component.icon}</div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-200">{component.title}</h4>
                                <p className="text-sm text-slate-400">{component.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default HowItWorks;