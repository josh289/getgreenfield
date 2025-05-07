import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  accent?: 'blue' | 'teal' | 'purple';
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  align = 'left',
  accent = 'blue',
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };
  
  const accentColors = {
    blue: 'from-blue-500 to-blue-600',
    teal: 'from-teal-500 to-teal-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`max-w-3xl mb-12 ${alignClasses[align]}`}>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
        {title}
        <div 
          className={`h-1 w-16 mt-2 rounded bg-gradient-to-r ${accentColors[accent]} ${
            align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''
          }`}
        ></div>
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-slate-300 mt-4 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;