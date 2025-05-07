import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Compass, RefreshCw, FlaskConical, Lightbulb } from 'lucide-react';

const Solution: React.FC = () => {
  const solutionRef = useRef<HTMLDivElement>(null);

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

    const elements = solutionRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <Section id="solution">
      <div ref={solutionRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle 
            title="Context is the New Unit of Work."
            subtitle="cntxtl introduces a new way of working where context flows seamlessly between humans and AI, evolving with each step."
            align="center"
            accent="teal"
          />
        </div>
        
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 h-full relative">
              <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl opacity-20">
                <div className="absolute top-0 -right-12 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl"></div>
              </div>
              <h3 className="text-2xl font-bold mb-6 relative z-10">How Relay structures work:</h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-medium border border-blue-700">P</div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-blue-400">Projects</h4>
                    <p className="text-slate-300 mt-1">The container for your team's evolving knowledge and work.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 font-medium border border-purple-700">R</div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-purple-400">Relays</h4>
                    <p className="text-slate-300 mt-1">Structured flows that guide work through best practices and golden paths.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-teal-900/50 flex items-center justify-center text-teal-400 font-medium border border-teal-700">L</div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-teal-400">Legs</h4>
                    <p className="text-slate-300 mt-1">Executable steps where context packets are passed between human and AI executors.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center text-orange-400 font-medium border border-orange-700">C</div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-orange-400">Context Packets</h4>
                    <p className="text-slate-300 mt-1">Knowledge passed like batons between executors, evolving with each leg.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 flex flex-col">
                <Compass className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Context-Driven</h3>
                <p className="text-slate-300 flex-grow">Knowledge evolves and compounds with each step of work.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 flex flex-col">
                <RefreshCw className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Seamless Flow</h3>
                <p className="text-slate-300 flex-grow">Context flows naturally between humans and AI executors.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 flex flex-col">
                <FlaskConical className="w-10 h-10 text-teal-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Best Practices</h3>
                <p className="text-slate-300 flex-grow">Golden paths guide work through optimal patterns.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 flex flex-col">
                <Lightbulb className="w-10 h-10 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Continuous Evolution</h3>
                <p className="text-slate-300 flex-grow">Every leg builds upon previous context, nothing is lost.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Solution;