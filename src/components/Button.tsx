import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-semibold rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 focus-visible:ring-slate-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-500',
  };
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm min-h-[40px]',
    md: 'py-3 px-6 min-h-[48px]',
    lg: 'py-4 px-8 text-lg min-h-[56px]',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
} 
