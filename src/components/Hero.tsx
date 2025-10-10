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
    <div ref={heroRef} className="relative flex items-center justify-center" style={{ minHeight: '900px' }}>
      {/* Radial gradient glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.08) 30%, transparent 60%)'
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-[1100px] mx-auto text-center" style={{ marginTop: '250px' }}>
          {/* Massive headline with text shadow */}
          <h1
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-100 font-extrabold text-white mb-8"
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 30px rgba(255, 107, 53, 0.3)'
            }}
          >
            Unlock AI's Full Potential<br />
            for Software Development
          </h1>

          {/* Simplified subheadline */}
          <p
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-200 text-[#a0a0a0] max-w-[600px] mx-auto"
            style={{
              fontSize: '22px',
              fontWeight: 400,
              marginBottom: '60px'
            }}
          >
            Bounded contexts prevent hallucinations.
          </p>

          {/* Two CTAs side by side */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-[180px]">
            {/* Primary CTA - Cyan background, black text */}
            <button
              onClick={onEarlyAccess}
              className="group relative"
              style={{
                background: '#00d9ff',
                color: '#000000',
                padding: '20px 48px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
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

            {/* Secondary CTA - Transparent with white border */}
            <button
              onClick={scrollToDemo}
              className="group relative"
              style={{
                background: 'transparent',
                color: '#ffffff',
                padding: '18px 48px',
                border: '2px solid #252525',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
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
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-800 delay-400 text-center"
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