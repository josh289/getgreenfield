import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';

const Philosophy: React.FC = () => {
  const philosophyRef = useRef<HTMLDivElement>(null);

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

    const elements = philosophyRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <Section id="philosophy" dark>
      <div ref={philosophyRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Built for how both AI and developers actually think"
            align="center"
            accent="teal"
          />
        </div>
        
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100 max-w-3xl">
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed text-white mb-8">
              "If AI or humans can't understand it,<br/>it's wrong."
            </blockquote>

            <p className="text-xl text-slate-300 mb-12 leading-relaxed">
              Greenfield Platform respects the cognitive limits of both AI and human intelligence. We build software that keeps
              both within their optimal operating range. Every design decision starts with one question: can both AI and developers
              understand this completely without losing accuracy?
            </p>
          </div>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8">
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">Dual Cognitive Limits</h3>
              <p className="text-slate-300">
                Both AI and humans have context limits. Exceeding them causes AI hallucinations and human confusion. Respect both.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">Patterns Over Code</h3>
              <p className="text-slate-300">
                Solve problems once, reuse everywhere. Build libraries of understanding, not just libraries of functions.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3 text-teal-400">Context Is Everything</h3>
              <p className="text-slate-300">
                Maintain understanding across time and teams. Knowledge should accumulate, not evaporate with personnel changes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3 text-orange-400">Simplicity Scales</h3>
              <p className="text-slate-300">
                Small contexts keep AI accurate and humans productive. Scale through multiplication, not expansion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Philosophy;