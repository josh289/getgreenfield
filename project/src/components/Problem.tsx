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
      icon: <Clock className="w-8 h-8 text-red-500" />,
      title: "Every AI Conversation Is Groundhog Day",
      description: "Starting from zero. Every. Single. Time."
    },
    {
      icon: <Layers className="w-8 h-8 text-red-500" />,
      title: "Your Best Practices Live in People's Heads",
      description: "When they leave, the knowledge leaves."
    },
    {
      icon: <GitBranch className="w-8 h-8 text-red-500" />,
      title: "Tasks Get Done. Nothing Gets Smarter.",
      description: "You finish projects but lose the insights that made them successful."
    },
    {
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      title: "AI Tools Are Disconnected",
      description: "Powerful but isolated. No memory of your business context."
    }
  ];

  return (
    <Section id="problem" dark>
      <div ref={problemRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle 
            title="Knowledge Dies in Task Lists"
            subtitle="Teams waste knowledge by starting every AI interaction from scratch, losing context between projects, and treating AI as a tool instead of a learning system."
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
            What if every project made your entire organization smarter?
          </p>
        </div>
      </div>
    </Section>
  );
};

export default Problem;