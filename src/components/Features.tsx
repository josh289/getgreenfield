import React, { useEffect, useRef, useState } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Box, Zap, Library, Settings, Bot, Clock } from 'lucide-react';

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
      description: "Self-contained domains under 1,000 lines. Perfect for AI understanding.",
      longDescription: "",
      iconColor: "text-[#00d9ff]"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Event-Driven Architecture",
      description: "Clean event choreography. Zero coupling.",
      longDescription: "",
      iconColor: "text-[#00d9ff]"
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Pattern Library",
      description: "200+ production patterns. Auth, payments, data. Battle-tested.",
      longDescription: "",
      iconColor: "text-[#00d9ff]"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Zero Infrastructure",
      description: "Just write handler functions. Platform handles everything else.",
      longDescription: "",
      iconColor: "text-[#00d9ff]"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Perfect AI Integration",
      description: "Perfectly readable by Claude, Cursor, and any AI tool.",
      longDescription: "",
      iconColor: "text-[#00d9ff]"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Instant Onboarding",
      description: "Clean boundaries mean immediate understanding. No week-long ramp-ups.",
      longDescription: "",
      iconColor: "text-[#00d9ff]"
    }
  ];

  return (
    <Section>
      <div id="features" className="scroll-mt-20">
        <div ref={featuresRef} className="max-w-6xl mx-auto py-24">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="The Toolkit for Modern Development"
              subtitle="Everything you need to build production software with AI"
             align="center"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
            {features.map((feature, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 group"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative overflow-hidden rounded-xl p-8 border transition-all duration-300 h-full bg-black/40 border-[#252525] hover:border-[#00d9ff] hover:shadow-[0_0_30px_rgba(0,217,255,0.15)] hover:-translate-y-1">

                  {/* Subtle cyan glow overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00d9ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    {/* Icon container - simple background with cyan on hover */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300 ${
                      hoveredIndex === index
                        ? 'bg-[#00d9ff]/10 shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                        : 'bg-black/50 border border-[#252525]'
                    }`}>
                      <div className={`transition-colors duration-300 ${feature.iconColor}`}>
                        {feature.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3 text-white transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-[#a0a0a0] group-hover:text-gray-100 transition-all duration-300">
                      {feature.description}
                    </p>
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