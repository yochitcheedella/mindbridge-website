import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background";
  
  const variants = {
    primary: "bg-primary text-text hover:bg-primary-hover focus:ring-primary",
    secondary: "bg-transparent border border-border-strong text-text hover:bg-surface-bright focus:ring-border-strong",
    ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-bright focus:ring-surface-bright",
    danger: "bg-error text-background hover:bg-error/90 focus:ring-error",
  };
  
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
