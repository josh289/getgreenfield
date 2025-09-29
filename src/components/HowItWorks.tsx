import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Target, Zap, Settings, Eye, Library } from 'lucide-react';

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
      title: 'Business Services (Actors)',
      description: 'Self-contained microservices under 1,000 lines. Each owns a business domain with clear boundaries.'
    },
    {
      icon: <Zap className="w-12 h-12 text-purple-500" />,
      title: 'Three Simple Handlers',
      description: 'Commands change state. Queries read data. Events react asynchronously. That\'s all you write.'
    },
    {
      icon: <Settings className="w-12 h-12 text-teal-500" />,
      title: 'Zero Infrastructure Code',
      description: 'Just write handler functions. Platform handles auth, tracing, errors, scaling automatically.'
    },
    {
      icon: <Eye className="w-12 h-12 text-orange-500" />,
      title: 'Type-Safe Contracts',
      description: 'Service contracts define APIs. Complete visibility. AI and humans understand every interaction.'
    },
    {
      icon: <Library className="w-12 h-12 text-green-500" />,
      title: 'Reusable Patterns',
      description: 'Every handler becomes a pattern. Solutions compound. Your codebase gets smarter over time.'
    }
  ];

  return (
    <Section>
      <div id="how-it-works" className="scroll-mt-20">
        <div ref={howItWorksRef} className="max-w-6xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="The Cognitive Architecture that changes everything"
              subtitle="Greenfield Platform organizes software around how humans think, not how computers process"
              align="center"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mt-16">
            {architectureSteps.map((step, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="text-center flex flex-col items-center">
                  <div className="bg-slate-800/50 rounded-full p-6 inline-block mb-6">
                    {step.icon}
                  </div>
                  <div className="bg-blue-500/10 rounded-full px-4 py-1 inline-block mb-4">
                    <span className="text-blue-400 text-sm font-medium">Step {index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white text-center">
                    {step.title}
                  </h3>
                  <p className="text-slate-300 text-base text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Flow Indicator */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
            <div className="flex justify-center items-center">
              <div className="flex items-center space-x-4 overflow-x-auto pb-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    {index < 4 && (
                      <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-16">
            <div className="rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-slate-700 p-8 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl opacity-20">
                <div className="absolute top-0 -right-12 w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-3xl"></div>
              </div>

              <div className="relative z-10 max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">The Result: Software That Scales With Human Understanding</h3>
                <p className="text-slate-300 mb-6">
                  No more cognitive overload. No more lost context. No more exponential complexity.
                  Just architecture that thinks like you do.
                </p>
                <div className="flex justify-center items-center space-x-6 text-slate-400">
                  <div className="flex items-center">
                    <span className="text-red-400 mr-2">🧠💥</span>
                    <span className="line-through">Monolithic mess</span>
                  </div>
                  <span className="text-2xl">→</span>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">🧠✨</span>
                    <span className="text-green-400">Cognitive clarity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default HowItWorks;