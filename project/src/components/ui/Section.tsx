import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}

const Section: React.FC<SectionProps> = ({ children, className = '', id, dark = false }) => {
  return (
    <section
      id={id}
      className={`py-16 md:py-24 px-4 overflow-hidden ${
        dark ? 'bg-slate-950' : 'bg-slate-900'
      } ${className}`}
    >
      <div className="container mx-auto">
        {children}
      </div>
    </section>
  );
};

export default Section;