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
            title="Our Philosophy"
            align="center"
            accent="teal"
          />
        </div>
        
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100 max-w-3xl">
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed text-white mb-8">
              "You don't rise to your goals.<br/>You fall to your systems."
            </blockquote>
            
            <p className="text-xl text-slate-300 mb-12 leading-relaxed">
              RelayMCP builds the system that catches you — and carries you. We believe that the right operating 
              system doesn't just organize tasks but transforms how humans and AI work together.
            </p>
          </div>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200 grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-8">
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3">Context First</h3>
              <p className="text-slate-300">
                All work should build upon and preserve valuable context, not fragment it.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3">Flow Over Force</h3>
              <p className="text-slate-300">
                Work should flow naturally through well-designed systems, not be forced into artificial constraints.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <h3 className="text-xl font-semibold mb-3">Evolution Over Completion</h3>
              <p className="text-slate-300">
                Success comes from evolving systems and knowledge, not just completing isolated tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Philosophy;