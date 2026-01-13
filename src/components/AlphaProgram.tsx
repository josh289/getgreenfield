import React, { useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import Button from './ui/Button';
import { CheckCircle, Users, MessageSquare, Zap, Clock } from 'lucide-react';

interface AlphaProgramProps {
  onJoinWaitlist: () => void;
}

const AlphaProgram: React.FC<AlphaProgramProps> = ({ onJoinWaitlist }) => {
  const alphaProgramRef = useRef<HTMLDivElement>(null);

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

    const elements = alphaProgramRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const benefits = [
    "Priority access to Greenfield Platform",
    "Direct access to founders",
    "Shape the platform's future",
    "50% lifetime discount"
  ];

  const perfectFor = [
    "Development teams facing cognitive overload",
    "Organizations using AI tools already",
    "Teams wanting seamless human + AI collaboration",
    "Early adopters ready to shape the future"
  ];

  const commitment = [
    "Use Greenfield Platform for real projects",
    "Bi-weekly feedback sessions",
    "Share insights and suggestions"
  ];

  return (
    <Section id="early-access" className="bg-[#1a2520]">
      <div ref={alphaProgramRef} className="max-w-6xl mx-auto py-24">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Join the Early Access Program"
            subtitle="Be among the first to experience Greenfield Platform and help shape the future of cognitive-aware development"
            align="center"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-24">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <div className="bg-[#0f1612]/50 backdrop-blur-sm rounded-xl p-8 border border-[#243b2f] h-full hover:border-[#50c878] hover:shadow-[0_10px_40px_rgba(80,200,120,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-[#50c878] mr-2" />
                <h3 className="text-xl font-semibold text-white">Early Access Benefits</h3>
              </div>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-[#50c878] mr-2 mt-1 flex-shrink-0" />
                    <span className="text-[#c5d9cd]">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div className="bg-[#0f1612]/50 backdrop-blur-sm rounded-xl p-8 border border-[#243b2f] h-full hover:border-[#50c878] hover:shadow-[0_10px_40px_rgba(80,200,120,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-[#50c878] mr-2" />
                <h3 className="text-xl font-semibold text-white">Perfect For</h3>
              </div>
              <ul className="space-y-3">
                {perfectFor.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-[#50c878] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-[#c5d9cd]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <div className="bg-[#0f1612]/50 backdrop-blur-sm rounded-xl p-8 border border-[#243b2f] h-full hover:border-[#50c878] hover:shadow-[0_10px_40px_rgba(80,200,120,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#50c878] mr-2" />
                <h3 className="text-xl font-semibold text-white">Your Commitment</h3>
              </div>
              <ul className="space-y-3">
                {commitment.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-[#50c878] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-[#c5d9cd]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-400 mt-24">
          <div className="rounded-xl bg-gradient-to-r from-[#0f1612] to-[#1a2520] border border-[#243b2f] p-10 text-center relative overflow-hidden hover:border-[#50c878] hover:shadow-[0_10px_40px_rgba(80,200,120,0.2)] hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl opacity-10">
              <div className="absolute top-0 -right-12 w-full h-full bg-gradient-to-br from-[#50c878]/30 to-[#f4d03f]/20"></div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-[#f4d03f] mr-3" />
                <span className="text-[#f4d03f] font-medium">Limited Spots Available</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Development Process?</h3>
              <p className="text-[#c5d9cd] mb-6">
                Early access begins Q1 2025. Limited spots available. Join the waitlist to secure your place in the cognitive revolution.
              </p>
              <Button size="lg" onClick={onJoinWaitlist}>
                <Zap className="mr-2 h-5 w-5" />
                Join the Waitlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AlphaProgram;