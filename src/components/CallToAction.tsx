import React from 'react';
import { ArrowRight } from 'lucide-react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import Button from './ui/Button';

interface CallToActionProps {
  onJoinWaitlist: () => void;
}

export default function CallToAction({ onJoinWaitlist }: CallToActionProps) {
  return (
    <Section className="relative overflow-hidden">
      {/* Dramatic gradient glow background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-[#00d9ff]/20 via-transparent to-transparent blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center py-32">
        {/* Main headline */}
        <div className="mb-12">
          <SectionTitle>
            Ready to Transform Your Development?
          </SectionTitle>
        </div>

        {/* Subheadline */}
        <p className="text-xl text-white mb-16 max-w-2xl mx-auto font-medium">
          Join early access and build production software 1000x faster
        </p>

        {/* Benefits grid - more compact and dramatic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-start md:justify-end space-x-4 text-white group">
            <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(0,217,255,0.6)] group-hover:shadow-[0_0_12px_rgba(0,217,255,0.8)] transition-all duration-300"></div>
            <span className="text-base font-medium">Start building in 60 seconds</span>
          </div>
          <div className="flex items-center justify-start space-x-4 text-white group">
            <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(0,217,255,0.6)] group-hover:shadow-[0_0_12px_rgba(0,217,255,0.8)] transition-all duration-300"></div>
            <span className="text-base font-medium">200+ production patterns</span>
          </div>
          <div className="flex items-center justify-start md:justify-end space-x-4 text-white group">
            <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(255,107,53,0.6)] group-hover:shadow-[0_0_12px_rgba(255,107,53,0.8)] transition-all duration-300"></div>
            <span className="text-base font-medium">Zero infrastructure setup</span>
          </div>
          <div className="flex items-center justify-start space-x-4 text-white group">
            <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(255,107,53,0.6)] group-hover:shadow-[0_0_12px_rgba(255,107,53,0.8)] transition-all duration-300"></div>
            <span className="text-base font-medium">AI-native from day one</span>
          </div>
        </div>

        {/* Primary CTA - large and dramatic */}
        <div className="mb-8">
          <Button size="lg" onClick={onJoinWaitlist} className="text-lg px-16 py-6">
            Join Early Access
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>

        {/* Supporting text with special offer */}
        <div className="space-y-2">
          <p className="text-sm text-cyan-400 font-semibold tracking-wide uppercase">
            Limited spots available
          </p>
          <p className="text-sm text-gray-100">
            50% lifetime discount for early members
          </p>
        </div>
      </div>
    </Section>
  );
}