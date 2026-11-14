import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 shadow-xs',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-xs',
        outline:
          'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80',
        ghost: 'hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-8 rounded-md px-2.5 text-xs',
        lg: 'h-10 rounded-md px-5',
        icon: 'h-8 w-8',
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
