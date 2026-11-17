import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-[36px] w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-1.5 text-[13px] text-[#111827] placeholder:text-[#9ca3af] transition-all focus:border-[#4361ee] focus:outline-none focus:ring-3 focus:ring-[rgba(67,97,238,0.1)] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
