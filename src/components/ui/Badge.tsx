import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-bright text-text border-border",
    success: "bg-[#0f3b21] text-[#a1f3c3] border-[#1d6b3e]",
    warning: "bg-[#4a350d] text-[#f7d383] border-[#8a651a]",
    error: "bg-[#4a0d0d] text-[#f78383] border-[#8a1a1a]",
  };

  return (
    <div className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
