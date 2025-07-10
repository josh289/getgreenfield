import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Code2, GitBranch, Cpu } from 'lucide-react';

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

  const features = [
    {
      icon: <Code2 className="w-12 h-12 text-blue-500" />,
      title: 'Create Your Workspace',
      description: 'Projects, processes, knowledge base. Invite human teammates. Add AI agents with specific roles.'
    },
    {
      icon: <GitBranch className="w-12 h-12 text-purple-500" />,
      title: 'Build Relays (Smart Processes)',
      description: 'Map out any workflow. Assign steps to humans OR AI. Context flows automatically.'
    },
    {
      icon: <Cpu className="w-12 h-12 text-teal-500" />,
      title: 'Work Together Naturally',
      description: 'Access from RelayMCP, Claude, or Cursor. AI understands your project context. Every output builds on previous work.'
    }
  ];

  return (
    <Section>
      <div id="how-it-works" className="scroll-mt-20">
        <div ref={howItWorksRef} className="max-w-6xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="One Workspace. Full Context. Real Collaboration."
              subtitle="RelayMCP is designed from the ground up for teams that include both humans AND AI agents"
             align="center"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="text-center flex flex-col items-center">
                  <div className="bg-slate-800/50 rounded-full p-6 inline-block mb-6">
                    {feature.icon}
                  </div>
                  <div className="bg-blue-500/10 rounded-full px-4 py-1 inline-block mb-4">
                    <span className="text-blue-400 text-sm font-medium">Step {index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white text-center max-w-xs">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 text-lg text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-16">
            <div className="rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-slate-700 p-8 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl opacity-20">
                <div className="absolute top-0 -right-12 w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-3xl"></div>
              </div>
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Ready to See It in Action?</h3>
                <p className="text-slate-300 mb-6">
                  Watch how RelayMCP transforms the way teams work with AI agents as true collaborators.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md transition-colors inline-flex items-center text-lg font-medium">
                  <span>Watch Demo</span>
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default HowItWorks;