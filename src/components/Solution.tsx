import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { RefreshCw, Target, Eye, Library, Infinity } from 'lucide-react';

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
            title="Unlock AI's Full Potential"
            subtitle="Greenfield gives AI perfect context boundaries. No hallucinations. No confusion. Just AI that builds production-ready systems with 100% accuracy."
            align="center"
            accent="teal"
          />
        </div>
        
        {/* Four Pillars Section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 h-full relative">
              <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl opacity-20">
                <div className="absolute top-0 -right-12 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl"></div>
              </div>
              <h3 className="text-2xl font-bold mb-6 relative z-10">How We Make AI Development Actually Work:</h3>

              <div className="space-y-6 relative z-10">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-medium border border-blue-700">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-blue-400">Perfect AI Context</h4>
                    <p className="text-slate-300 mt-1">Every piece under 1,000 lines. AI never loses track, never hallucinates.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 font-medium border border-purple-700">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-purple-400">Zero Hallucinations</h4>
                    <p className="text-slate-300 mt-1">Bounded contexts eliminate AI confusion. Every output is accurate and reliable.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-teal-900/50 flex items-center justify-center text-teal-400 font-medium border border-teal-700">
                      <Library className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-teal-400">AI Memory Bank</h4>
                    <p className="text-slate-300 mt-1">AI learns patterns that work. Reuses proven solutions automatically.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center text-orange-400 font-medium border border-orange-700">
                      <Infinity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-orange-400">Infinite AI Scale</h4>
                    <p className="text-slate-300 mt-1">AI builds systems of any size by working in perfect chunks.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div className="grid grid-cols-1 gap-6 h-full">
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-center">The Cognitive Breakthrough</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <span className="text-red-300">Traditional: Monolithic complexity</span>
                    <span className="text-red-400">🧠💥</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-teal-500"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-teal-900/20 border border-teal-700 rounded-lg">
                    <span className="text-teal-300">Greenfield: Cognitive chunks</span>
                    <span className="text-teal-400">🧠✨</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-center">Visual Architecture</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="h-6 bg-blue-500/30 border border-blue-500 rounded text-xs flex items-center justify-center">UI</div>
                    <div className="h-6 bg-purple-500/30 border border-purple-500 rounded text-xs flex items-center justify-center">API</div>
                    <div className="h-6 bg-teal-500/30 border border-teal-500 rounded text-xs flex items-center justify-center">Data</div>
                    <div className="h-6 bg-orange-500/30 border border-orange-500 rounded text-xs flex items-center justify-center">Auth</div>
                  </div>
                  <div className="text-center text-sm text-slate-400">
                    Each bounded context (&lt;1000 lines)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-4 bg-slate-600/30 border border-slate-600 rounded text-xs flex items-center justify-center">Pattern</div>
                    <div className="h-4 bg-slate-600/30 border border-slate-600 rounded text-xs flex items-center justify-center">Pattern</div>
                    <div className="h-4 bg-slate-600/30 border border-slate-600 rounded text-xs flex items-center justify-center">Pattern</div>
                  </div>
                  <div className="text-center text-sm text-slate-400">
                    Reusable solution patterns
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Final Result Section */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-16 text-center">
          <div className="max-w-4xl mx-auto p-8 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-slate-700">
            <h3 className="text-2xl font-bold mb-4">The Result: Software That Thinks Like You Do</h3>
            <p className="text-xl text-slate-300">
              No more cognitive overload. No more lost context. No more exponential complexity.
              Just software that grows smarter with every change, designed around human understanding.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Solution;