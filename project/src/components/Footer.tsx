import React from 'react';
import { Box, Twitter, Linkedin, Github } from 'lucide-react';
import logo from '../assets/greenfield-logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img src={logo.src || logo} alt="Greenfield Platform" className="h-24 w-auto object-contain" style={{ maxWidth: '500px' }} />
              </div>
            <p className="text-slate-400 mb-6 max-w-md">
              The AI-native workspace where every project builds organizational intelligence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { name: 'The Breakthrough', href: '#breakthrough' },
                { name: 'Platform Architecture', href: '#how-it-works' },
                { name: 'Documentation', href: '#' },
                { name: 'Pattern Library', href: '#' }
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-slate-400 hover:text-white transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-3">
              {[
                { name: 'New Projects', href: '#use-cases' },
                { name: 'Legacy Transformation', href: '#use-cases' },
                { name: 'Team Productivity', href: '#use-cases' },
                { name: 'Enterprise Scale', href: '#use-cases' }
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-slate-400 hover:text-white transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Greenfield Platform. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <span className="mx-3 text-slate-700">•</span>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;