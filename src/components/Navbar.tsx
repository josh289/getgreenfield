import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Button from './ui/Button';
import logo from '../assets/greenfield-logo.png';

interface NavbarProps {
  onEarlyAccess: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onEarlyAccess }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-md py-1 border-b border-gray-800/50' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={logo.src || logo}
            alt="Greenfield Platform"
            className={`transition-all duration-300 object-contain ${
              isScrolled ? 'h-24 w-auto' : 'h-32 w-auto'
            }`}
            style={{ maxWidth: '600px' }}
          />
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <nav>
            <ul className="flex space-x-8">
              {[
                { name: 'The Breakthrough', href: '#breakthrough' },
                { name: 'Platform', href: '#how-it-works' },
                { name: 'Use Cases', href: '#use-cases' },
                { name: 'Get Started', href: '#cta' }
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-100 hover:text-cyan-400 transition-colors duration-300 font-medium"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button onClick={onEarlyAccess}>Experience Greenfield</Button>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white hover:text-cyan-400 transition-colors duration-300"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/98 backdrop-blur-md border-b border-gray-800/50 shadow-2xl">
          <nav className="container mx-auto px-4 py-6">
            <ul className="flex flex-col space-y-4">
              {[
                { name: 'The Breakthrough', href: '#breakthrough' },
                { name: 'Platform', href: '#how-it-works' },
                { name: 'Use Cases', href: '#use-cases' },
                { name: 'Get Started', href: '#cta' }
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="block text-gray-100 hover:text-cyan-400 transition-colors duration-300 py-2 font-medium hover:pl-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
              <li className="pt-4">
                <Button fullWidth onClick={onEarlyAccess}>Experience Greenfield</Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;