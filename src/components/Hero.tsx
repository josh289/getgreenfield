import React, { useEffect, useRef } from 'react';
import Button from './ui/Button';
import ProofGrid from './ProofGrid';

interface HeroProps {
  onEarlyAccess: () => void;
}

const Hero: React.FC<HeroProps> = ({ onEarlyAccess }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = heroRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToProof = () => {
    const proofSection = document.getElementById('proof-section');
    if (proofSection) {
      proofSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={heroRef} className="relative min-h-screen flex items-center pt-20 pb-16">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 -left-1/4 w-1/2 h-1/2 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-1/3 h-1/3 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <span className="inline-block px-4 py-2 text-sm font-medium text-blue-400 bg-blue-900/30 rounded-full mb-8 border border-blue-800">
              Greenfield Platform
            </span>
          </div>

          <h1 className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200 text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Unlock AI's full potential
            </span><br />
            for software development
          </h1>

          <p className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300 text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            AI can finally build complete systems. Bounded contexts prevent hallucinations.
            Ship production-ready software 100x faster with AI that actually works.
          </p>

          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-400 flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Button size="lg" onClick={onEarlyAccess} className="px-8 py-4 text-lg">
              Unlock AI Development
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToProof} className="px-8 py-4 text-lg">
              See the Proof
            </Button>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-500">
            <ProofGrid />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
    </div>
  );
};

export default Hero;