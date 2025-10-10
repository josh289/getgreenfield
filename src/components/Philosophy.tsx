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
            title="Built to unlock AI's true capabilities"
            align="center"
            accent="cyan"
          />
        </div>
        
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100 max-w-3xl">
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed text-white mb-8">
              "If AI loses context,<br/>it fails."
            </blockquote>

            <p className="text-xl text-gray-100 mb-12 leading-relaxed">
              Greenfield Platform eliminates AI hallucinations through perfect context boundaries. We architect software
              so AI always has complete understanding. Every design decision enables AI to build with 100% accuracy.
            </p>
          </div>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8">
            <div className="p-6 rounded-xl bg-black/30 border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">AI Context Perfection</h3>
              <p className="text-gray-100">
                Keep AI within perfect context boundaries. No hallucinations, no confusion, just accurate code generation.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-black/30 border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">AI Pattern Learning</h3>
              <p className="text-gray-100">
                AI learns what works and reuses it. Every solution becomes part of AI's knowledge base.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-black/30 border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Bounded AI Power</h3>
              <p className="text-gray-100">
                AI operates at maximum capability within boundaries. Perfect context equals perfect output.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-black/30 border border-gray-800 hover:border-orange-500/50 transition-colors">
              <h3 className="text-xl font-semibold mb-3 text-orange-400">Unlimited AI Scale</h3>
              <p className="text-gray-100">
                AI builds massive systems through perfect small contexts. No size limits when AI never loses focus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Philosophy;