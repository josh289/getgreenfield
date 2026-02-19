import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:ring-offset-2 focus:ring-offset-ev-void disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-sprout text-ev-text-inverse hover:-translate-y-1 active:translate-y-0 shadow-md hover:shadow-lg',
    secondary: 'bg-transparent border-2 border-sprout text-ev-text hover:-translate-y-1 active:translate-y-0 hover:shadow-lg',
    outline: 'bg-transparent border-2 border-sprout text-ev-text hover:-translate-y-1 active:translate-y-0 hover:text-sprout-text hover:shadow-lg'
  };

  const sizeStyles = {
    sm: 'px-6 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-12 py-5 text-lg'
  };

  const fullWidthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;