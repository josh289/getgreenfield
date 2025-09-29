import React, { useEffect, useRef, useState } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Box, Zap, Library, Settings, Bot, Clock, ArrowRight } from 'lucide-react';

const Features: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

    const elements = featuresRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Box className="w-8 h-8" />,
      title: "Bounded Contexts",
      description: "AI never loses focus or hallucinates",
      longDescription: "Perfect context boundaries keep AI accurate. Every piece is complete and isolated, eliminating hallucinations.",
      gradient: "from-blue-500 to-cyan-500",
      iconColor: "text-blue-400",
      bgGradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Event-Driven Architecture",
      description: "AI builds loosely coupled systems",
      longDescription: "AI automatically creates clean event flows between contexts. Perfect decoupling, zero dependencies.",
      gradient: "from-purple-500 to-pink-500",
      iconColor: "text-purple-400",
      bgGradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Pattern Library",
      description: "Reusable solutions that compound",
      longDescription: "Tap into battle-tested patterns for authentication, payments, data processing, and more.",
      gradient: "from-green-500 to-emerald-500",
      iconColor: "text-green-400",
      bgGradient: "from-green-500/10 to-emerald-500/10"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Zero Ceremony",
      description: "No infrastructure complexity",
      longDescription: "Skip the Docker files, build configs, and deployment scripts. Focus on what matters: your product.",
      gradient: "from-orange-500 to-red-500",
      iconColor: "text-orange-400",
      bgGradient: "from-orange-500/10 to-red-500/10"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Perfect AI Integration",
      description: "AI understands everything",
      longDescription: "Your bounded contexts are perfectly readable by Claude, Cursor, and any AI tool. Maximum productivity.",
      gradient: "from-teal-500 to-blue-500",
      iconColor: "text-teal-400",
      bgGradient: "from-teal-500/10 to-blue-500/10"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Instant Onboarding",
      description: "New developers productive in hours",
      longDescription: "Clean boundaries mean anyone can understand any part of your system immediately. No more week-long ramp-ups.",
      gradient: "from-yellow-500 to-orange-500",
      iconColor: "text-yellow-400",
      bgGradient: "from-yellow-500/10 to-orange-500/10"
    }
  ];

  return (
    <Section>
      <div id="features" className="scroll-mt-20">
        <div ref={featuresRef} className="max-w-6xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="Core Features That Actually Matter"
              subtitle="Greenfield delivers the fundamentals that make software development predictable, scalable, and AI-friendly"
             align="center"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 group"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className={`relative overflow-hidden backdrop-blur-sm rounded-xl p-6 border transition-all duration-500 h-full transform group-hover:scale-105 group-hover:-translate-y-1 ${
                  hoveredIndex === index
                    ? `bg-gradient-to-br ${feature.bgGradient} border-${feature.gradient.split(' ')[1].replace('to-', '')}/50 shadow-xl shadow-${feature.gradient.split(' ')[1].replace('to-', '')}/20`
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                }`}>

                  {/* Background gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  <div className="relative z-10">
                    {/* Icon with gradient background */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-500 ${
                      hoveredIndex === index
                        ? `bg-gradient-to-br ${feature.gradient} shadow-lg`
                        : 'bg-slate-900/50'
                    }`}>
                      <div className={`transition-colors duration-500 ${
                        hoveredIndex === index ? 'text-white' : feature.iconColor
                      }`}>
                        {feature.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-white transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className={`text-slate-300 group-hover:text-slate-100 transition-all duration-300 ${
                      hoveredIndex === index ? 'mb-4' : ''
                    }`}>
                      {feature.description}
                    </p>

                    {/* Extended description on hover */}
                    <div className={`overflow-hidden transition-all duration-500 ${
                      hoveredIndex === index ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <p className="text-slate-200 text-sm leading-relaxed">
                        {feature.longDescription}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className={`flex items-center mt-4 text-sm font-medium transition-all duration-300 ${
                      hoveredIndex === index
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2'
                    }`}>
                      <span className="text-white mr-2">Learn more</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Features;