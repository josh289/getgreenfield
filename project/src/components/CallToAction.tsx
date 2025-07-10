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
    <Section className="text-center">
      <div className="max-w-3xl mx-auto space-y-8">
        <SectionTitle>
          Ready to Give Your Team Superpowers?
        </SectionTitle>
        
        <p className="text-lg text-slate-300">
          Join the waitlist and help build the future of human + AI collaboration.
        </p>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={onJoinWaitlist}>
            Join the Waitlist
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </Section>
  );
}