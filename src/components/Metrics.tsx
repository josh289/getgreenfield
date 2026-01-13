import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';

const Metrics: React.FC = () => {
  const metricsRef = useRef<HTMLDivElement>(null);

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

    const elements = metricsRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const metrics = [
    {
      number: '100%',
      label: 'AI Accuracy',
      detail: 'with bounded contexts'
    },
    {
      number: '10x',
      label: 'Faster Development',
      detail: 'vs traditional microservices'
    },
    {
      number: '<1000',
      label: 'Lines per Context',
      detail: 'perfect for AI understanding'
    },
    {
      number: '0',
      label: 'Coupling',
      detail: 'between services'
    }
  ];

  return (
    <Section>
      <div className="max-w-6xl mx-auto py-24">
        <div
          ref={metricsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 group"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl p-8 border transition-all duration-300 bg-[#1a2e1a]/40 border-[#2d4a2d] hover:border-[#50c878] hover:shadow-[0_0_30px_rgba(80,200,120,0.15)] hover:-translate-y-1">

                {/* Subtle sprout glow overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#50c878]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 text-center">
                  {/* Large number in sprout */}
                  <div className="text-6xl font-bold mb-3 text-[#50c878] transition-all duration-300 group-hover:scale-110 font-mono">
                    {metric.number}
                  </div>

                  {/* Label */}
                  <div className="text-lg font-semibold mb-2 text-white">
                    {metric.label}
                  </div>

                  {/* Detail text */}
                  <div className="text-sm text-gray-200 group-hover:text-white transition-colors duration-300">
                    {metric.detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Metrics;
