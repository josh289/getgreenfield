import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Brain, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

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
      icon: <Brain className="w-8 h-8 text-red-500" />,
      title: "AI Context Collapse: Too much context degrades AI performance",
      description: "AI hallucinations and errors multiply with larger contexts"
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
      title: "Human Review Bottleneck: Can't validate AI output fast enough",
      description: "AI generates changes 100x faster than humans can verify"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-red-500" />,
      title: "Cascading Failures: Mistakes compound exponentially",
      description: "Confused AI creates bad code that overwhelms human capacity"
    },
    {
      icon: <Zap className="w-8 h-8 text-red-500" />,
      title: "Dual Overload: Both AI and humans max out",
      description: "Neither artificial nor human intelligence can handle the chaos"
    }
  ];

  return (
    <Section id="problem" dark>
      <div ref={problemRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Why software development has been fundamentally broken"
            subtitle="Both AI and human brains hit cognitive limits with modern software complexity. AI loses accuracy with large contexts while humans can't review fast enough, creating a cascade of compounding errors."
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
        
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-16 text-center">
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            What if software could be built to respect the cognitive limits of both AI and humans?
          </p>
        </div>
      </div>
    </Section>
  );
};

export default Problem;