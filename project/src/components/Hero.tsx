import React, { useEffect, useRef } from 'react';
import Button from './ui/Button';

const Hero: React.FC = () => {
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

  return (
    <div ref={heroRef} className="relative min-h-screen flex items-center pt-20 pb-16">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 -left-1/4 w-1/2 h-1/2 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-1/3 h-1/3 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <span className="inline-block px-3 py-1 text-xs font-medium text-blue-400 bg-blue-900/30 rounded-full mb-6 border border-blue-800">
              A New Way to Work
            </span>
          </div>
          
          <h1 className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200 text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            Stop Managing Tasks.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Start Evolving Context.
            </span>
          </h1>
          
          <p className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          From kickoff to commit, RelayMCP keeps your specs, code, and decisions in sync—so you can guide any model you trust, stay in flow, and never lose the thread.
          </p>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">Request Early Access</Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
          
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-500 mt-16 md:mt-24 flex justify-center">
            <div className="p-1 border border-slate-800 rounded-md bg-slate-900/50 backdrop-blur-sm">
              <div className="animate-pulse flex items-center text-sm">
                <span className="h-2 w-2 rounded-full bg-teal-500 mr-2"></span>
                <span className="text-slate-400">Built for modern engineering teams</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
    </div>
  );
};

export default Hero;