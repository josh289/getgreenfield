import React, { useEffect, useRef } from 'react';

interface ProofPoint {
  icon: string;
  title: string;
  description: string;
}

const proofPoints: ProofPoint[] = [
  {
    icon: '⚡',
    title: 'Complex SaaS → Production in 7 days',
    description: 'From concept to production-ready software'
  },
  {
    icon: '🔄',
    title: 'Legacy systems → Greenfield experience',
    description: 'Transform existing code into modern applications'
  },
  {
    icon: '🚀',
    title: 'Any team → 1000x productivity',
    description: 'Exponential development speed for all skill levels'
  },
  {
    icon: '👥',
    title: 'Serving 30,000+ users in production',
    description: 'Battle-tested at scale with real users'
  }
];

const ProofGrid: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.proof-card');
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('opacity-100', 'translate-y-0', 'scale-100');
                card.classList.remove('opacity-0', 'translate-y-8', 'scale-95');
              }, index * 150);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef} className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {proofPoints.map((point, index) => (
          <div
            key={index}
            className="proof-card opacity-0 translate-y-8 scale-95 transition-all duration-700 ease-out group"
          >
            <div className="relative p-6 h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {point.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
                  {point.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {point.description}
                </p>
              </div>

              {/* Animated border effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional proof statement */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-full border border-blue-800/50">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-3 animate-pulse"></span>
          <span className="text-slate-300 font-medium">
            Transforming how software gets built
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProofGrid;