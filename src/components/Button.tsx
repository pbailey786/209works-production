import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

const baseStyles =
  'px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
const variants = {
  primary: 'bg-[#2d4a3e] text-white hover:bg-[#1d3a2e] focus:ring-[#2d4a3e] shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
  secondary: 'bg-[#9fdf9f] text-[#2d4a3e] hover:bg-[#8fd48f] focus:ring-[#9fdf9f] shadow-md hover:shadow-lg',
  outline:
    'border-2 border-[#2d4a3e] text-[#2d4a3e] bg-white hover:bg-[#2d4a3e] hover:text-white focus:ring-[#2d4a3e] transition-all duration-200',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
