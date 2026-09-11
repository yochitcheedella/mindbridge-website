import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-panel p-4 md:p-6", className)} {...props}>
      {children}
    </div>
  );
}
