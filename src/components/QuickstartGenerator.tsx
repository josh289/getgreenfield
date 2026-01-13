import React, { useState, useEffect, useRef } from 'react';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import { Copy, Terminal, Check, ChevronDown, Zap, Package, Code } from 'lucide-react';

const QuickstartGenerator: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [copiedCommands, setCopiedCommands] = useState<{[key: string]: boolean}>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const quickstartRef = useRef<HTMLDivElement>(null);

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

    const elements = quickstartRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const frameworks = {
    react: {
      name: 'React',
      icon: '⚛️',
      description: 'Modern React with TypeScript',
      color: 'from-[#50c878] to-[#3da85f]',
      commands: [
        {
          step: '1. Install Greenfield CLI',
          command: 'npm install -g @banyan/cli',
          description: 'Get the Greenfield command-line interface'
        },
        {
          step: '2. Create new project',
          command: 'banyan create my-app --template react-ts',
          description: 'Generate a new React project with Greenfield architecture'
        },
        {
          step: '3. Start development',
          command: 'cd my-app && banyan dev',
          description: 'Start the development server with hot reloading'
        },
        {
          step: '4. Add your first context',
          command: 'banyan generate context UserManagement',
          description: 'Create a bounded context for user management'
        }
      ]
    },
    vue: {
      name: 'Vue',
      icon: '🟢',
      description: 'Vue 3 with Composition API',
      color: 'from-[#f4d03f] to-[#d4b82f]',
      commands: [
        {
          step: '1. Install Greenfield CLI',
          command: 'npm install -g @banyan/cli',
          description: 'Get the Greenfield command-line interface'
        },
        {
          step: '2. Create new project',
          command: 'banyan create my-app --template vue3-ts',
          description: 'Generate a new Vue 3 project with Greenfield patterns'
        },
        {
          step: '3. Start development',
          command: 'cd my-app && banyan dev',
          description: 'Launch development server with context boundaries'
        },
        {
          step: '4. Add composable context',
          command: 'banyan generate context ProductCatalog --composables',
          description: 'Create a Vue composable-based bounded context'
        }
      ]
    },
    nodejs: {
      name: 'Node.js',
      icon: '🟩',
      description: 'Backend API with Express',
      color: 'from-[#50c878] to-[#f4d03f]',
      commands: [
        {
          step: '1. Install Greenfield CLI',
          command: 'npm install -g @banyan/cli',
          description: 'Get the Greenfield command-line interface'
        },
        {
          step: '2. Create API project',
          command: 'banyan create my-api --template node-api',
          description: 'Generate Node.js API with domain boundaries'
        },
        {
          step: '3. Start development',
          command: 'cd my-api && banyan dev',
          description: 'Run API server with auto-restart'
        },
        {
          step: '4. Add domain context',
          command: 'banyan generate context OrderProcessing --with-events',
          description: 'Create order processing context with event sourcing'
        }
      ]
    },
    python: {
      name: 'Python',
      icon: '🐍',
      description: 'FastAPI with async support',
      color: 'from-[#f4d03f] to-[#d4b82f]',
      commands: [
        {
          step: '1. Install Greenfield CLI',
          command: 'pip install banyan-cli',
          description: 'Install the Python Greenfield toolkit'
        },
        {
          step: '2. Create new project',
          command: 'banyan create my-service --template fastapi',
          description: 'Generate FastAPI service with bounded contexts'
        },
        {
          step: '3. Start development',
          command: 'cd my-service && banyan run dev',
          description: 'Start FastAPI with auto-reload'
        },
        {
          step: '4. Add context module',
          command: 'banyan generate context payment_processing',
          description: 'Create payment processing bounded context'
        }
      ]
    },
    nextjs: {
      name: 'Next.js',
      icon: '▲',
      description: 'Full-stack React framework',
      color: 'from-gray-700 to-black',
      commands: [
        {
          step: '1. Install Greenfield CLI',
          command: 'npm install -g @banyan/cli',
          description: 'Get the Greenfield command-line interface'
        },
        {
          step: '2. Create Next.js app',
          command: 'banyan create my-app --template nextjs-app',
          description: 'Generate Next.js app with Greenfield architecture'
        },
        {
          step: '3. Start development',
          command: 'cd my-app && banyan dev',
          description: 'Launch Next.js with bounded context routing'
        },
        {
          step: '4. Add API context',
          command: 'banyan generate context UserAuth --api-routes',
          description: 'Create authentication context with API routes'
        }
      ]
    },
    microservices: {
      name: 'Microservices',
      icon: '🔧',
      description: 'Multi-service architecture',
      color: 'from-[#50c878] to-[#f4d03f]',
      commands: [
        {
          step: '1. Install Greenfield CLI',
          command: 'npm install -g @banyan/cli',
          description: 'Get the Greenfield command-line interface'
        },
        {
          step: '2. Create workspace',
          command: 'banyan create my-platform --template microservices',
          description: 'Set up multi-service workspace'
        },
        {
          step: '3. Start all services',
          command: 'cd my-platform && banyan dev --all',
          description: 'Run all microservices with service mesh'
        },
        {
          step: '4. Add new service',
          command: 'banyan generate service notification-service',
          description: 'Add notification service as bounded context'
        }
      ]
    }
  };

  const handleCopy = async (command: string, key: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommands(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedCommands(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const currentFramework = frameworks[selectedFramework as keyof typeof frameworks];

  return (
    <Section>
      <div ref={quickstartRef} className="max-w-6xl mx-auto">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <SectionTitle
            title="Get Started in Minutes"
            subtitle="Choose your stack and get up and running with perfect bounded contexts"
            align="center"
          />
        </div>

        {/* Framework Selector */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full sm:w-auto mx-auto flex items-center gap-3 px-6 py-4 bg-gradient-to-r ${currentFramework.color} text-black rounded-lg font-semibold transition-all duration-300 hover:shadow-lg`}
            >
              <span className="text-2xl">{currentFramework.icon}</span>
              <div className="text-left">
                <div className="text-lg">{currentFramework.name}</div>
                <div className="text-sm opacity-90">{currentFramework.description}</div>
              </div>
              <ChevronDown className={`w-5 h-5 ml-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a2e1a] rounded-lg border border-gray-400 shadow-xl z-10 overflow-hidden">
                {Object.entries(frameworks).map(([key, framework]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedFramework(key);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-[#2d4a2d] transition-colors ${
                      selectedFramework === key ? 'bg-[#2d4a2d]' : ''
                    }`}
                  >
                    <span className="text-xl">{framework.icon}</span>
                    <div>
                      <div className="text-white font-medium">{framework.name}</div>
                      <div className="text-gray-200 text-sm">{framework.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-[#1a2e1a]/50 rounded-lg p-4 text-center border border-gray-400">
              <Zap className="w-6 h-6 text-[#f4d03f] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">2 min</div>
              <div className="text-gray-200 text-sm">Setup time</div>
            </div>
            <div className="bg-[#1a2e1a]/50 rounded-lg p-4 text-center border border-gray-400">
              <Package className="w-6 h-6 text-[#50c878] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-gray-200 text-sm">Config files</div>
            </div>
            <div className="bg-[#1a2e1a]/50 rounded-lg p-4 text-center border border-gray-400">
              <Code className="w-6 h-6 text-[#50c878] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-gray-200 text-sm">AI Ready</div>
            </div>
          </div>
        </div>

        {/* Commands */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="bg-[#1a2e1a]/50 backdrop-blur-sm rounded-xl border border-gray-400/80 overflow-hidden">
            <div className="bg-[#1a2e1a]/50 px-6 py-4 border-b border-gray-400/80">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-[#50c878]" />
                <h3 className="text-lg font-semibold text-white">
                  Quickstart Commands
                </h3>
                <span className="px-3 py-1 bg-[#50c878]/20 text-[#50c878] rounded-full text-sm">
                  {currentFramework.name}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {currentFramework.commands.map((cmd, index) => (
                <div key={index} className="group">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#50c878] rounded-full flex items-center justify-center text-black text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">{cmd.step}</h4>
                      <p className="text-gray-100 text-sm">{cmd.description}</p>
                    </div>
                  </div>

                  <div className="ml-12">
                    <div className="flex items-center gap-2 bg-[#1a2e1a]/50 rounded-lg p-4 border border-gray-400/80 group-hover:border-[#50c878]/30 transition-colors">
                      <div className="flex-1">
                        <code className="text-[#50c878] font-mono text-sm">
                          {cmd.command}
                        </code>
                      </div>
                      <button
                        onClick={() => handleCopy(cmd.command, `cmd-${index}`)}
                        className="p-2 text-gray-200 hover:text-white transition-colors rounded-md hover:bg-[#2d4a2d]/50"
                        title="Copy command"
                      >
                        {copiedCommands[`cmd-${index}`] ? (
                          <Check className="w-4 h-4 text-[#50c878]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12">
          <div className="bg-gradient-to-r from-[#50c878]/10 to-[#f4d03f]/10 rounded-xl p-8 border border-[#50c878]/20">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              What you get out of the box
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#50c878] rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Perfect Bounded Contexts</div>
                    <div className="text-gray-100 text-sm">Each feature is isolated and self-contained</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#50c878] rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Event-Driven Communication</div>
                    <div className="text-gray-100 text-sm">Contexts communicate through clean events</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#50c878] rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Pattern Library Integration</div>
                    <div className="text-gray-100 text-sm">Reusable patterns from day one</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#f4d03f] rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">AI-Optimized Structure</div>
                    <div className="text-gray-100 text-sm">Perfect for Claude, Cursor, and AI tools</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#f4d03f] rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Zero Configuration</div>
                    <div className="text-gray-100 text-sm">No complex setup or build configuration</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#f4d03f] rounded-full mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Instant Team Onboarding</div>
                    <div className="text-gray-100 text-sm">New developers productive in hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 mt-12 text-center">
          <p className="text-gray-100 mb-6">
            Ready to experience development without complexity?
          </p>
          <button className="px-8 py-4 bg-[#50c878] text-black font-semibold rounded-lg hover:bg-[#3da85f] transition-all duration-300">
            Get Early Access Now
          </button>
        </div>
      </div>
    </Section>
  );
};

export default QuickstartGenerator;