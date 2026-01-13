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
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#50c878]/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-[#50c878] text-black hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)]',
    secondary: 'bg-transparent border-2 border-[#50c878] text-white hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_0_20px_rgba(80,200,120,0.2)]',
    outline: 'bg-transparent border-2 border-[#50c878] text-white hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_0_20px_rgba(80,200,120,0.2)]'
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