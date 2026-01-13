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
          background: 'radial-gradient(circle at 50% 40%, rgba(80, 200, 120, 0.08) 0%, rgba(80, 200, 120, 0.03) 30%, transparent 60%)'
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
              textShadow: '0 2px 20px rgba(80, 200, 120, 0.2)'
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
              background: '#1a2520',
              border: '1px solid #243b2f',
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
                color: '#e8f4ed',
                margin: 0,
                whiteSpace: 'pre',
                overflowX: 'auto'
              }}
            >
              <code>
                <span style={{ color: '#50c878' }}>@CommandHandlerDecorator</span>(<span style={{ color: '#f4d03f' }}>CreateUserCommand</span>){'\n'}
                <span style={{ color: '#9b6dff' }}>export class</span> <span style={{ color: '#e8f4ed' }}>CreateUserHandler</span>{'\n'}
                {'  '}<span style={{ color: '#9b6dff' }}>extends</span> <span style={{ color: '#6eb8e0' }}>CommandHandler</span>{'<CreateUserCommand, CreateUserResult> {'}{'\n'}
                {'\n'}
                {'  '}<span style={{ color: '#9b6dff' }}>async</span> <span style={{ color: '#50c878' }}>handle</span>(<span style={{ color: '#e8f4ed' }}>command</span>: <span style={{ color: '#6eb8e0' }}>CreateUserCommand</span>) {'{'}{'\n'}
                {'    '}<span style={{ color: '#9db5a5' }}>// Just business logic - that's it!</span>{'\n'}
                {'    '}<span style={{ color: '#9b6dff' }}>return</span> {'{'}{'\n'}
                {'      '}<span style={{ color: '#e8f4ed' }}>userId</span>: <span style={{ color: '#f4d03f' }}>`user-${'{'}</span><span style={{ color: '#e8f4ed' }}>Date.now()</span><span style={{ color: '#f4d03f' }}>{'}'}`</span>,{'\n'}
                {'      '}<span style={{ color: '#e8f4ed' }}>email</span>: <span style={{ color: '#e8f4ed' }}>command.email</span>,{'\n'}
                {'      '}<span style={{ color: '#e8f4ed' }}>createdAt</span>: <span style={{ color: '#9b6dff' }}>new</span> <span style={{ color: '#6eb8e0' }}>Date</span>().toISOString(){'\n'}
                {'    }'};{'\n'}
                {'  }'}{'}'}{'\n'}
                {'}'}{'\n'}
                <span style={{ color: '#9db5a5' }}>// Platform auto-generates REST + GraphQL APIs</span>
              </code>
            </pre>
          </div>

          {/* CTAs */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onEarlyAccess}
              className="group relative"
              style={{
                background: '#50c878',
                color: '#0d1310',
                padding: '16px 40px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px 0 rgba(80, 200, 120, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3da861';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(80, 200, 120, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#50c878';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(80, 200, 120, 0.25)';
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
                border: '2px solid #2d4a3e',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#50c878';
                e.currentTarget.style.color = '#50c878';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(80, 200, 120, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2d4a3e';
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
              color: '#9db5a5'
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