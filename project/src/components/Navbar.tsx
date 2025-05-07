import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Button from './ui/Button';
import logo from '../../assets/logo.png';

const Navbar: React.FC = () => {
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
        isScrolled ? 'bg-slate-900/90 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <img src={logo} alt="Relay OS Logo" className="h-28 w-auto" />
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <nav>
            <ul className="flex space-x-8">
              {['How it works', 'Features', 'Philosophy'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-slate-300 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button>Request Early Access</Button>
        </div>
        
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md shadow-lg py-4">
          <nav className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              {['How it works', 'Features', 'Philosophy'].map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="block text-slate-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <Button fullWidth>Request Early Access</Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;