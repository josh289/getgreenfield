import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Target, Zap, Settings } from 'lucide-react';

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

  const architectureSteps = [
    {
      icon: <Target className="w-12 h-12 text-blue-500" />,
      title: 'Perfect Context',
      description: 'Every piece under 1,000 lines'
    },
    {
      icon: <Zap className="w-12 h-12 text-cyan-500" />,
      title: 'Zero Hallucinations',
      description: 'Bounded contexts eliminate confusion'
    },
    {
      icon: <Settings className="w-12 h-12 text-teal-500" />,
      title: 'Infinite Scale',
      description: 'AI builds systems of any size'
    }
  ];

  return (
    <Section>
      <div id="how-it-works" className="scroll-mt-20">
        <div ref={howItWorksRef} className="max-w-6xl mx-auto py-24">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="Greenfield Makes AI Development Actually Work"
              subtitle="Bounded contexts prevent hallucinations. Perfect size for AI understanding."
              align="center"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-24 max-w-4xl mx-auto">
            {architectureSteps.map((step, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="text-center flex flex-col items-center p-8 rounded-xl bg-gray-800/30 border border-gray-700 hover:border-[#00d9ff] hover:shadow-[0_10px_40px_rgba(0,217,255,0.15)] hover:-translate-y-1 transition-all duration-300">
                  <div className="bg-gray-900/50 rounded-full p-6 inline-block mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-100 text-sm text-center leading-relaxed">
                    {step.description}
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

export default HowItWorks;