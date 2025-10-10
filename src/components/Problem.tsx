import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Brain, AlertTriangle } from 'lucide-react';

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
      title: "AI Hallucinations",
      description: "Large contexts break AI accuracy. Invented functions, misunderstood architecture, broken code."
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
      title: "Context Overflow",
      description: "Production systems exceed AI's ability to maintain coherence and understand structure."
    }
  ];

  return (
    <Section id="problem" dark>
      <div ref={problemRef} className="max-w-6xl mx-auto py-24">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Why AI Can't Build Software That Works"
            subtitle="Current AI fails with large codebases. It hallucinates, loses context, and generates broken code. Without boundaries, AI generates plausible-looking disasters."
            align="center"
            accent="cyan"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 max-w-4xl mx-auto">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="p-8 rounded-xl bg-gray-800/50 border border-gray-700 h-full hover:bg-gray-800 hover:border-[#00d9ff] hover:shadow-[0_10px_40px_rgba(0,217,255,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="mb-4">{problem.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-gray-100">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-24 text-center">
          <p className="text-xl text-gray-100 max-w-3xl mx-auto">
            What if we could architect software so AI never loses context or hallucinates?
          </p>
        </div>
      </div>
    </Section>
  );
};

export default Problem;