import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export default function SectionTitle({ title, subtitle, align = 'left', className = '' }: SectionTitleProps) {
  const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={`mb-12 ${alignmentClass} ${className}`}>
      <h2 className="mb-4 text-3xl font-bold md:text-4xl text-white">{title}</h2>
      {subtitle && (
        <p className="mx-auto max-w-2xl text-lg text-gray-300">{subtitle}</p>
      )}
    </div>
  );
}