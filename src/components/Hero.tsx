import React, { useEffect, useRef } from 'react';

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

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={heroRef} className="relative flex items-center justify-center" style={{ minHeight: '700px' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(0, 217, 255, 0.08) 0%, rgba(0, 217, 255, 0.03) 30%, transparent 60%)'
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-[1000px] mx-auto text-center" style={{ marginTop: '120px' }}>
          {/* Technical headline */}
          <h1
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-100 font-extrabold text-white mb-6"
            style={{
              fontSize: 'clamp(42px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0, 217, 255, 0.2)'
            }}
          >
            Start clean. Stay clean. Ship fast.
          </h1>

          {/* Three-part subheadline */}
          <p
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-200 text-gray-100 max-w-[950px] mx-auto mb-8"
            style={{
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.5
            }}
          >
            Framework built for AI. Agents trained to build on it. Ship in days, not months.
          </p>

          {/* Code example */}
          <div
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-300 mb-10 max-w-[650px] mx-auto"
            style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'left',
              overflow: 'auto'
            }}
          >
            <pre
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#e0e0e0',
                margin: 0,
                whiteSpace: 'pre',
                overflowX: 'auto'
              }}
            >
              <code>
                <span style={{ color: '#00d9ff' }}>@CommandHandlerDecorator</span>(<span style={{ color: '#a0ff70' }}>CreateUserCommand</span>){'\n'}
                <span style={{ color: '#ff79c6' }}>export class</span> <span style={{ color: '#ffffff' }}>CreateUserHandler</span>{'\n'}
                {'  '}<span style={{ color: '#ff79c6' }}>extends</span> <span style={{ color: '#8be9fd' }}>CommandHandler</span>{'<CreateUserCommand, CreateUserResult> {'}{'\n'}
                {'\n'}
                {'  '}<span style={{ color: '#ff79c6' }}>async</span> <span style={{ color: '#50fa7b' }}>handle</span>(<span style={{ color: '#ffffff' }}>command</span>: <span style={{ color: '#8be9fd' }}>CreateUserCommand</span>) {'{'}{'\n'}
                {'    '}<span style={{ color: '#666666' }}>// Just business logic - that's it!</span>{'\n'}
                {'    '}<span style={{ color: '#ff79c6' }}>return</span> {'{'}{'\n'}
                {'      '}<span style={{ color: '#ffffff' }}>userId</span>: <span style={{ color: '#a0ff70' }}>`user-${'{'}</span><span style={{ color: '#ffffff' }}>Date.now()</span><span style={{ color: '#a0ff70' }}>{'}'}`</span>,{'\n'}
                {'      '}<span style={{ color: '#ffffff' }}>email</span>: <span style={{ color: '#ffffff' }}>command.email</span>,{'\n'}
                {'      '}<span style={{ color: '#ffffff' }}>createdAt</span>: <span style={{ color: '#ff79c6' }}>new</span> <span style={{ color: '#8be9fd' }}>Date</span>().toISOString(){'\n'}
                {'    }'};{'\n'}
                {'  }'}{'}'}{'\n'}
                {'}'}{'\n'}
                <span style={{ color: '#666666' }}>// Platform auto-generates REST + GraphQL APIs</span>
              </code>
            </pre>
          </div>

          {/* CTAs */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onEarlyAccess}
              className="group relative"
              style={{
                background: '#00d9ff',
                color: '#000000',
                padding: '16px 40px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px 0 rgba(0, 217, 255, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00c4e6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(0, 217, 255, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00d9ff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(0, 217, 255, 0.25)';
              }}
            >
              Join Early Access
            </button>

            <button
              onClick={scrollToDemo}
              className="group relative"
              style={{
                background: 'transparent',
                color: '#ffffff',
                padding: '14px 40px',
                border: '2px solid #252525',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00d9ff';
                e.currentTarget.style.color = '#00d9ff';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#252525';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              See It In Action
            </button>
          </div>

          {/* Social proof */}
          <p
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-500"
            style={{
              fontSize: '14px',
              color: '#666666'
            }}
          >
            Serving 30,000+ users in production
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;