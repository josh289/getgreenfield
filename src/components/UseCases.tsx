import { useEffect, useRef, useState } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import {
  Rocket, RefreshCw, TrendingUp, Building, ArrowRight, ExternalLink
} from 'lucide-react';

const UseCases = () => {
  const useCasesRef = useRef<HTMLDivElement>(null);
  const [activeUseCase, setActiveUseCase] = useState<number>(0);

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

    const elements = useCasesRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const useCases = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'New Projects',
      subtitle: 'Start with production-ready architecture',
      description: 'Skip months of infrastructure setup and architectural decisions. Begin with battle-tested patterns that scale.',
      benefits: [
        'Production-ready from day one',
        'Enterprise-grade security built-in',
        'Scalable architecture patterns',
        'Integrated DevOps pipeline'
      ],
      outcomes: [
        'MVP to market in 1 week instead of 6 months',
        'Zero technical debt from the start',
        '99.9% uptime from deployment'
      ],
      link: '/solutions/new',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: <RefreshCw className="w-8 h-8" />,
      title: 'Legacy Systems',
      subtitle: 'Transform any codebase into greenfield experience',
      description: 'Modernize decades-old systems without rewrites. Gradually transform legacy code while maintaining business continuity.',
      benefits: [
        'Incremental modernization strategy',
        'Zero-downtime transformation',
        'Automated code migration',
        'Legacy integration bridges'
      ],
      outcomes: [
        '20-year-old systems feel like new projects',
        '90% reduction in maintenance overhead',
        'Modern developer experience on legacy code'
      ],
      link: '/solutions/legacy',
      gradient: 'from-cyan-500 to-orange-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Growing Teams',
      subtitle: 'Scale team productivity linearly',
      description: 'Add developers without complexity overhead. New team members become productive immediately, regardless of experience level.',
      benefits: [
        'Instant onboarding for new developers',
        'Consistent code quality across team',
        'Automated knowledge transfer',
        'Mentorship built into the platform'
      ],
      outcomes: [
        'Junior developers ship like seniors',
        '1-day onboarding instead of 3 months',
        'Linear productivity scaling with team size'
      ],
      link: '/solutions/teams',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: 'Enterprise Systems',
      subtitle: 'Modernize 20-year-old systems safely',
      description: 'Enterprise-grade transformation with zero business risk. Maintain compliance while achieving startup-like agility.',
      benefits: [
        'Compliance-first modernization',
        'Risk-free transformation process',
        'Enterprise security standards',
        'Audit trail for all changes'
      ],
      outcomes: [
        'Enterprise agility without enterprise complexity',
        'Regulatory compliance maintained throughout',
        'Cost reduction of 70% on infrastructure'
      ],
      link: '/solutions/enterprise',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const UseCaseCard = ({ useCase, index, isActive }: { useCase: any; index: number; isActive: boolean }) => (
    <div
      className={`
        relative cursor-pointer transition-all duration-500 transform
        ${isActive ? 'scale-105 z-10' : 'scale-100 hover:scale-102'}
      `}
      onClick={() => setActiveUseCase(index)}
    >
      <div className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isActive
          ? 'border-cyan-500/50 bg-gray-800/50'
          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
        }
      `}>
        {/* Background Gradient */}
        <div className={`
          absolute inset-0 opacity-10 bg-gradient-to-br ${useCase.gradient}
          ${isActive ? 'opacity-20' : ''}
        `}></div>

        <div className="relative z-10 p-6">
          {/* Icon and Title */}
          <div className="flex items-center mb-4">
            <div className={`
              p-3 rounded-xl bg-gradient-to-br ${useCase.gradient} mr-4
              ${isActive ? 'shadow-lg' : ''}
            `}>
              <div className="text-white">
                {useCase.icon}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{useCase.title}</h3>
              <p className="text-cyan-400 text-sm font-medium">{useCase.subtitle}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-100 mb-6 leading-relaxed">{useCase.description}</p>

          {/* Benefits or Outcomes based on active state */}
          {isActive ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Key Benefits
                </h4>
                <ul className="space-y-1 text-sm text-gray-100">
                  {useCase.benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-center">
                      <ArrowRight className="w-3 h-3 mr-2 text-cyan-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Proven Outcomes
                </h4>
                <ul className="space-y-1 text-sm text-gray-100">
                  {useCase.outcomes.map((outcome: string, i: number) => (
                    <li key={i} className="flex items-center">
                      <ArrowRight className="w-3 h-3 mr-2 text-orange-400" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <a
                  href={useCase.link}
                  className={`
                    inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300
                    bg-gradient-to-r ${useCase.gradient} text-white hover:shadow-lg
                  `}
                >
                  Learn More
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {useCase.benefits.slice(0, 2).map((benefit: string, i: number) => (
                <div key={i} className="flex items-center text-sm text-gray-300">
                  <ArrowRight className="w-3 h-3 mr-2 text-cyan-500" />
                  {benefit}
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">Click to see more details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Section>
      <div id="use-cases" className="scroll-mt-20">
        <div ref={useCasesRef} className="max-w-7xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="The same breakthrough, applied everywhere"
              subtitle="Greenfield transforms every aspect of software development, from greenfield projects to legacy modernization"
              align="center"
            />
          </div>

          {/* Use Cases Grid */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {useCases.map((useCase, index) => (
                <UseCaseCard
                  key={index}
                  useCase={useCase}
                  index={index}
                  isActive={activeUseCase === index}
                />
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <div className="text-center bg-gradient-to-r from-cyan-500/10 to-orange-500/10 rounded-2xl p-8 border border-cyan-500/20">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold mb-4 text-white">
                  One platform.
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white"> Every use case.</span>
                </h3>
                <p className="text-lg text-gray-100 mb-8 leading-relaxed">
                  Whether you're building the next unicorn startup or modernizing a Fortune 500 enterprise system,
                  Greenfield provides the same breakthrough development experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-black/30 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-white mb-3">For Startups</h4>
                    <p className="text-gray-100 text-sm mb-3">
                      Build production-ready products in weeks, not months.
                      Compete with enterprise resources using a small team.
                    </p>
                    <div className="text-cyan-400 text-sm font-medium">
                      → MVP to market in 1 week
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-white mb-3">For Enterprise</h4>
                    <p className="text-gray-100 text-sm mb-3">
                      Transform legacy systems without business risk.
                      Achieve startup agility at enterprise scale.
                    </p>
                    <div className="text-orange-400 text-sm font-medium">
                      → 20-year systems feel new
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default UseCases;