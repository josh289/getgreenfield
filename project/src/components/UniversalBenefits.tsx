import React, { useEffect, useRef } from 'react';

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface BenefitCategory {
  title: string;
  subtitle: string;
  icon: string;
  benefits: Benefit[];
  gradient: string;
}

const benefitCategories: BenefitCategory[] = [
  {
    title: 'Individual Developers',
    subtitle: 'Amplify your capabilities',
    icon: '👨‍💻',
    gradient: 'from-blue-600 to-cyan-600',
    benefits: [
      {
        icon: '🎯',
        title: 'Focus on What Matters',
        description: 'Skip boilerplate and infrastructure setup. Jump straight to building features that users love.'
      },
      {
        icon: '📈',
        title: 'Accelerated Learning',
        description: 'Work with best practices built-in. Learn advanced patterns while building production applications.'
      },
      {
        icon: '🔧',
        title: 'Full-Stack Confidence',
        description: 'Build complete applications without being an expert in every technology. The platform handles complexity.'
      },
      {
        icon: '⚡',
        title: 'Instant Productivity',
        description: 'Get from idea to working prototype in hours, not weeks. Validate concepts faster than ever.'
      }
    ]
  },
  {
    title: 'Startups & Growing Companies',
    subtitle: 'Scale without the pain',
    icon: '🚀',
    gradient: 'from-purple-600 to-pink-600',
    benefits: [
      {
        icon: '💰',
        title: 'Reduce Development Costs',
        description: 'Cut development time by 90%. Get to market faster with smaller, more efficient teams.'
      },
      {
        icon: '🎨',
        title: 'MVP to Enterprise',
        description: 'Start lean and scale seamlessly. The same platform that builds your MVP supports enterprise growth.'
      },
      {
        icon: '🔄',
        title: 'Rapid Iteration',
        description: 'Deploy changes instantly. Test new features with real users and iterate based on feedback.'
      },
      {
        icon: '🛡️',
        title: 'Production-Ready from Day 1',
        description: 'Security, scalability, and monitoring built-in. No technical debt accumulation.'
      }
    ]
  },
  {
    title: 'Enterprise Teams',
    subtitle: 'Transform legacy into advantage',
    icon: '🏢',
    gradient: 'from-green-600 to-teal-600',
    benefits: [
      {
        icon: '🔗',
        title: 'Legacy Integration',
        description: 'Connect existing systems seamlessly. Modernize incrementally without big-bang rewrites.'
      },
      {
        icon: '👥',
        title: 'Team Standardization',
        description: 'Consistent patterns across all projects. Onboard new developers in days, not months.'
      },
      {
        icon: '📊',
        title: 'Governance & Compliance',
        description: 'Built-in security, audit trails, and compliance features. Meet enterprise requirements out of the box.'
      },
      {
        icon: '📈',
        title: 'Measurable ROI',
        description: 'Track productivity gains and cost savings. Demonstrate clear business value from technology investments.'
      }
    ]
  }
];

const UniversalBenefits: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categories = entry.target.querySelectorAll('.benefit-category');
            categories.forEach((category, index) => {
              setTimeout(() => {
                category.classList.add('opacity-100', 'translate-y-0');
                category.classList.remove('opacity-0', 'translate-y-12');

                const benefits = category.querySelectorAll('.benefit-item');
                benefits.forEach((benefit, benefitIndex) => {
                  setTimeout(() => {
                    benefit.classList.add('opacity-100', 'translate-x-0');
                    benefit.classList.remove('opacity-0', 'translate-x-8');
                  }, benefitIndex * 100);
                });
              }, index * 200);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="universal-benefits" className="py-20 bg-slate-950/50">
      <div className="container mx-auto px-4 md:px-6">
        <div ref={sectionRef} className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Everyone</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              From individual developers to enterprise teams, Greenfield Platform adapts to your needs and scales with your ambitions.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {benefitCategories.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="benefit-category opacity-0 translate-y-12 transition-all duration-700 ease-out"
              >
                <div className="h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all duration-300">
                  {/* Category Header */}
                  <div className="text-center mb-8">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {category.title}
                    </h3>
                    <p className={`text-transparent bg-clip-text bg-gradient-to-r ${category.gradient} font-semibold`}>
                      {category.subtitle}
                    </p>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-6">
                    {category.benefits.map((benefit, benefitIndex) => (
                      <div
                        key={benefitIndex}
                        className="benefit-item opacity-0 translate-x-8 transition-all duration-500 ease-out group"
                      >
                        <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-300">
                          <div className="flex-shrink-0 text-2xl group-hover:scale-110 transition-transform duration-300">
                            {benefit.icon}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors duration-300">
                              {benefit.title}
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Category Footer */}
                  <div className="mt-8 pt-6 border-t border-slate-800">
                    <div className={`h-1 w-full bg-gradient-to-r ${category.gradient} rounded-full opacity-50`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-2xl border border-blue-800/50">
              <span className="text-slate-300 text-lg font-medium">
                Ready to 10x your development speed?
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniversalBenefits;