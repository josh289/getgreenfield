import React, { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import Button from './ui/Button';
import logo from '../assets/logo.png';

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
        isScrolled ? 'bg-slate-900/90 backdrop-blur-md py-1 shadow-lg' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                  <div className="flex items-center">
            <img 
              src={logo.src || logo} 
              alt="RelayMCP Logo" 
              className={`transition-all duration-300 ${
                isScrolled ? 'h-24 w-auto' : 'h-32 w-auto'
              }`} 
            />
          </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <nav>
            <ul className="flex space-x-8">
              {[
                { name: 'How it works', href: '#how-it-works' },
                { name: 'Use cases', href: '#use-cases' },
                { name: 'Features', href: '#features' }
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-slate-300 hover:text-white transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button onClick={onEarlyAccess}>Join the Waitlist</Button>
        </div>
        
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
          <Box className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md shadow-lg py-4">
          <nav className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              {[
                { name: 'How it works', href: '#how-it-works' },
                { name: 'Use cases', href: '#use-cases' },
                { name: 'Features', href: '#features' }
              ].map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="block text-slate-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <Button fullWidth onClick={onEarlyAccess}>Join the Waitlist</Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;