import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';
import logo from '../assets/greenfield-logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-gray-800/50 py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <img
                src={logo.src || logo}
                alt="Greenfield Platform"
                className="h-24 w-auto object-contain"
                style={{ maxWidth: '500px' }}
              />
            </div>
            <p className="text-gray-300 mb-8 max-w-md leading-relaxed">
              The AI-native workspace where every project builds organizational intelligence.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'The Breakthrough', href: '#breakthrough' },
                { name: 'Platform Architecture', href: '#how-it-works' },
                { name: 'Documentation', href: '#' },
                { name: 'Pattern Library', href: '#' }
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider mb-4">
              Solutions
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'New Projects', href: '#use-cases' },
                { name: 'Legacy Transformation', href: '#use-cases' },
                { name: 'Team Productivity', href: '#use-cases' },
                { name: 'Enterprise Scale', href: '#use-cases' }
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Greenfield Platform. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center space-x-6">
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;