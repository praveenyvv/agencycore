import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4361ee]/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-[#4361ee] text-white hover:bg-[#3451d1] shadow-[0_2px_6px_rgba(67,97,238,0.25)] border-transparent',
        destructive:
          'bg-[#fef2f2] text-[#ef4444] border border-[#fca5a5] hover:bg-[#fee2e2]',
        outline:
          'border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#4361ee] hover:text-[#4361ee] hover:bg-[rgba(67,97,238,0.08)]',
        secondary:
          'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]',
        ghost:
          'border border-transparent text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
        link:
          'text-[#4361ee] underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-[36px] px-4 py-2',
        sm: 'h-[30px] rounded-[7px] px-3 text-[12px]',
        lg: 'h-[40px] rounded-[8px] px-5',
        icon: 'h-[30px] w-[30px] rounded-[7px] p-0 border border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#4361ee] hover:text-[#4361ee] hover:bg-[rgba(67,97,238,0.08)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';
