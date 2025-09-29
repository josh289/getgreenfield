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
          Experience the Breakthrough Yourself
        </SectionTitle>

        <p className="text-lg text-slate-300 mb-6">
          See how Greenfield transforms software development in minutes, not months
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>60-second quickstart for new projects</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Legacy system assessment tool</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Live examples across all use cases</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Free tier - see results immediately</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={onJoinWaitlist}>
            Start Building 1000x Faster
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-slate-400 mt-6">
          No setup required. See the transformation in real-time.
        </p>
      </div>
    </Section>
  );
}