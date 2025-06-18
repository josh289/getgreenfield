import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Clock, GitBranch, Layers, XCircle } from 'lucide-react';

const Problem: React.FC = () => {
  const problemRef = useRef<HTMLDivElement>(null);

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

    const elements = problemRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const problems = [
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: "Fixed Time Boxes",
      description: "Two-week sprints create artificial constraints that slow down AI-augmented teams."
    },
    {
      icon: <Layers className="w-8 h-8 text-orange-500" />,
      title: "Context Fragmentation",
      description: "Sprint boundaries break the natural flow of knowledge evolution."
    },
    {
      icon: <GitBranch className="w-8 h-8 text-orange-500" />,
      title: "Rigid Workflows",
      description: "Traditional sprint cycles can't adapt to the fluid nature of AI collaboration."
    },
    {
      icon: <XCircle className="w-8 h-8 text-orange-500" />,
      title: "Lost Momentum",
      description: "Sprint transitions create artificial stops that break the flow of progress."
    }
  ];

  return (
    <Section id="problem" dark>
      <div ref={problemRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle 
            title="Sprints are Dead."
            subtitle="Traditional two-week timeboxes can't keep up with AI-augmented teams. RelayMCP powers continuous, context-driven work that evolves as you do."
            align="center"
            accent="purple"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 h-full hover:bg-slate-800 hover:border-slate-600 transition-all">
                <div className="mb-4">{problem.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-slate-300">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Problem;