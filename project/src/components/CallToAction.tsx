import React, { useEffect, useRef, useState } from 'react';
import Section from './ui/Section';
import Button from './ui/Button';
import Modal from './ui/Modal';
import EarlyAccessForm from './ui/EarlyAccessForm';
import { Toaster } from 'react-hot-toast';

const CallToAction: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

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

    const elements = ctaRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Section id="cta">
        <div ref={ctaRef} className="max-w-5xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-50"></div>
            <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
            
            <div className="relative p-8 md:p-12 lg:p-16 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Join the Future of Context Engineering
              </h2>
              
              <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed">
                Be among the first to experience a new paradigm in human-AI collaboration. 
                contextl is opening for early access soon.
              </p>
              
              <Button size="lg" onClick={() => setIsModalOpen(true)}>
                Request Early Access
              </Button>
              
              <div className="mt-10 text-sm text-slate-300">
                Limited spots available. We're onboarding teams on a rolling basis.
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Early Access"
      >
        <EarlyAccessForm onClose={() => setIsModalOpen(false)} />
      </Modal>

      <Toaster position="bottom-center" />
    </>
  );
};

export default CallToAction;