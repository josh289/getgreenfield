import React, { useEffect, useRef, useState } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { 
  FileText, Users, Bug, ArrowRight, User, Bot, Lightbulb, Target, Zap
} from 'lucide-react';

const UseCases: React.FC = () => {
  const useCasesRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('onboarding');

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

  const tabs = [
    { id: 'onboarding', label: 'Customer Onboarding', icon: <Users className="w-4 h-4" /> },
    { id: 'content', label: 'Content Creation', icon: <FileText className="w-4 h-4" /> },
    { id: 'development', label: 'Bug Resolution', icon: <Bug className="w-4 h-4" /> }
  ];

  const useCasesByTab = {
    content: [
      {
        icon: <FileText className="w-6 h-6" />,
        title: "Content Creation Relay",
        problem: "Content teams waste hours re-explaining brand voice, target audience, and style guidelines to AI tools for every single piece of content.",
        solution: "Create a relay that remembers your brand context and improves with each piece of content created.",
        steps: [
          { 
            name: "Research", 
            type: "AI", 
            description: "AI gathers relevant data using your brand guidelines, competitor analysis, and audience insights stored in the workspace"
          },
          { 
            name: "Outline", 
            type: "Human", 
            description: "Human reviews research and creates strategic outline, adding context about messaging priorities and business goals"
          },
          { 
            name: "Draft", 
            type: "AI", 
            description: "AI writes first draft using approved outline, brand voice, and previous successful content patterns"
          },
          { 
            name: "Edit", 
            type: "Human", 
            description: "Human refines content for strategy and nuance, with AI learning from each edit for future improvements"
          },
          { 
            name: "Publish", 
            type: "AI", 
            description: "AI handles formatting, SEO optimization, and distribution across channels using learned preferences"
          }
        ],
        outcome: "Context about brand voice, audience, and goals flows through every step. Each piece of content gets better because the AI learns your brand voice, successful patterns, and team preferences.",
        gradient: "from-blue-500/20 to-purple-500/20"
      }
    ],
    onboarding: [
      {
        icon: <Users className="w-6 h-6" />,
        title: "Customer Onboarding Relay",
        problem: "New customers get inconsistent onboarding experiences, support teams repeat the same setup steps, and valuable onboarding insights aren't captured for improvement.",
        solution: "Build a relay that ensures consistent, personalized onboarding while learning what makes customers successful.",
        steps: [
          { 
            name: "Info Gathering", 
            type: "Human", 
            description: "Customer success rep conducts discovery call, understanding customer goals, technical setup, and success criteria"
          },
          { 
            name: "Setup", 
            type: "AI", 
            description: "AI configures customer environment based on their specific needs and industry best practices from successful onboardings"
          },
          { 
            name: "Training Docs", 
            type: "AI", 
            description: "AI creates personalized training materials and documentation tailored to customer's use case and team structure"
          },
          { 
            name: "Check-in", 
            type: "Human", 
            description: "Rep conducts follow-up sessions, addresses questions, with AI tracking engagement and identifying success patterns"
          }
        ],
        outcome: "New customers get consistent, personalized onboarding. Your team builds knowledge about what makes customers successful and can replicate those patterns.",
        gradient: "from-purple-500/20 to-pink-500/20"
      }
    ],
    development: [
      {
        icon: <Bug className="w-6 h-6" />,
        title: "Bug Resolution Relay",
        problem: "Bug fixes take forever because context gets lost between reporting, reproduction, fixing, and testing. Teams repeat the same debugging steps and don't learn from past resolutions.",
        solution: "Create a relay that maintains full context throughout the bug lifecycle and learns from each resolution to prevent similar issues.",
        steps: [
          { 
            name: "Report Analysis", 
            type: "AI", 
            description: "AI analyzes bug report, checks against known issues, gathers relevant code context, and suggests initial troubleshooting steps"
          },
          { 
            name: "Reproduce", 
            type: "Human", 
            description: "Developer follows AI's reproduction steps, adds environment details, and confirms the issue with full context preserved"
          },
          { 
            name: "Fix", 
            type: "Human", 
            description: "Developer implements fix with AI providing code suggestions based on similar past issues and codebase patterns"
          },
          { 
            name: "Test", 
            type: "AI", 
            description: "AI runs comprehensive tests including edge cases learned from previous similar bugs, ensuring no regressions"
          },
          { 
            name: "Deploy", 
            type: "AI", 
            description: "AI handles deployment process, monitors for issues, and updates knowledge base with resolution patterns"
          }
        ],
        outcome: "AI understands codebase context and testing requirements. Bugs get resolved faster with fewer back-and-forth cycles, and your team builds institutional knowledge.",
        gradient: "from-teal-500/20 to-cyan-500/20"
      }
    ]
  };

  const StepCard = ({ step, index, isLast }: { step: any; index: number; isLast: boolean }) => (
    <div className="flex flex-col lg:flex-row items-start lg:items-center mb-6 last:mb-0">
      <div className="flex items-center mb-3 lg:mb-0 lg:mr-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 text-sm font-bold mr-3 flex-shrink-0">
          {index + 1}
        </div>
        <div className={`
          flex items-center justify-center min-w-[160px] h-12 rounded-lg border transition-all duration-300
          ${step.type === 'AI' 
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
            : 'bg-green-500/10 border-green-500/30 text-green-300'
          }
        `}>
          <div className="flex items-center space-x-2">
            {step.type === 'AI' ? (
              <Bot className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{step.name}</span>
            <span className="text-xs opacity-75">({step.type})</span>
          </div>
        </div>
        {!isLast && (
          <ArrowRight className="w-5 h-5 text-slate-500 ml-3 hidden lg:block flex-shrink-0" />
        )}
      </div>
      <div className="flex-1 lg:ml-4">
        <p className="text-slate-300 text-sm leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  );

  return (
    <Section>
      <div id="use-cases" className="scroll-mt-20">
        <div ref={useCasesRef} className="max-w-7xl mx-auto">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <SectionTitle
              title="Relays in Action"
              subtitle="See how teams use RelayMCP to create intelligent workflows where humans and AI collaborate seamlessly"
              align="center"
            />
          </div>

          {/* What Makes Relays Different */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mb-16">
            <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
              <div className="text-center mb-8">
                <Lightbulb className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">What Makes Relays Different?</h3>
                <p className="text-slate-300 text-lg max-w-3xl mx-auto">
                  Unlike traditional task management, Relays maintain context throughout the entire workflow. 
                  Each step builds on the previous one, and the system gets smarter with every project.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Target className="w-6 h-6 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Context Flows</h4>
                  <p className="text-slate-400 text-sm">Information and decisions flow seamlessly between human and AI team members</p>
                </div>
                <div className="text-center">
                  <Zap className="w-6 h-6 text-purple-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Gets Smarter</h4>
                  <p className="text-slate-400 text-sm">Each project teaches the system, improving outcomes for future work</p>
                </div>
                <div className="text-center">
                  <Users className="w-6 h-6 text-teal-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">True Collaboration</h4>
                  <p className="text-slate-400 text-sm">AI agents are team members with roles, not just tools you prompt</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mb-12">
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Use Cases for Active Tab */}
          <div className="space-y-12">
            {useCasesByTab[activeTab]?.map((useCase, index) => (
              <div
                key={`${activeTab}-${index}`}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`
                  relative overflow-hidden rounded-2xl border border-slate-700/50 
                  bg-gradient-to-br ${useCase.gradient} backdrop-blur-sm
                `}>
                  <div className="absolute inset-0 bg-slate-900/70"></div>
                  
                  <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                      <div className="bg-slate-800/50 rounded-xl p-3 mr-4">
                        {useCase.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {useCase.title}
                        </h3>
                        <p className="text-slate-400">
                          How teams currently struggle → How RelayMCP solves it
                        </p>
                      </div>
                    </div>

                    {/* Problem & Solution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <h4 className="text-red-400 font-semibold mb-2 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          The Problem
                        </h4>
                        <p className="text-slate-300 text-sm">
                          {useCase.problem}
                        </p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          RelayMCP Solution
                        </h4>
                        <p className="text-slate-300 text-sm">
                          {useCase.solution}
                        </p>
                      </div>
                    </div>

                    {/* Workflow Steps */}
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <ArrowRight className="w-5 h-5 mr-2 text-blue-500" />
                        How the Relay Works
                      </h4>
                      <div className="bg-slate-800/30 rounded-lg p-6">
                        {useCase.steps.map((step, stepIndex) => (
                          <StepCard 
                            key={stepIndex} 
                            step={step} 
                            index={stepIndex}
                            isLast={stepIndex === useCase.steps.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Outcome */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        The Result
                      </h4>
                      <p className="text-slate-300 text-sm">
                        {useCase.outcome}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend and CTA */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-16">
            <div className="text-center bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold mb-4 text-white">Ready to Build Your First Relay?</h3>
                <p className="text-slate-300 text-lg mb-6">
                  These are just examples. RelayMCP adapts to any workflow where humans and AI need to collaborate with shared context.
                </p>
                <div className="flex items-center justify-center space-x-8 text-sm mb-6">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-300">AI Agent</span>
                    <span className="text-slate-500">- Handles data, automation, analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-400" />
                    <span className="text-green-300">Human</span>
                    <span className="text-slate-500">- Provides strategy, creativity, judgment</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">
                  Every relay you build becomes a reusable process that gets smarter with each use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default UseCases;