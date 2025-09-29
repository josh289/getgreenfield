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
      title: "AI Hallucinations: Large contexts break AI accuracy",
      description: "AI invents functions, misunderstands architecture, creates bugs"
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
      title: "Context Overflow: AI can't handle real codebases",
      description: "Production systems exceed AI's ability to maintain coherence"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-red-500" />,
      title: "Compounding Errors: AI mistakes cascade through systems",
      description: "One hallucination breaks ten things, creating more confusion"
    },
    {
      icon: <Zap className="w-8 h-8 text-red-500" />,
      title: "Unreliable Output: AI can't be trusted with critical code",
      description: "Without boundaries, AI generates plausible-looking disasters"
    }
  ];

  return (
    <Section id="problem" dark>
      <div ref={problemRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Why AI can't build software that works"
            subtitle="Current AI fails with large codebases. It hallucinates, loses context, and generates broken code. The promise of AI development remains locked behind fundamental architectural problems."
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
            What if we could architect software so AI never loses context or hallucinates?
          </p>
        </div>
      </div>
    </Section>
  );
};

export default Problem;