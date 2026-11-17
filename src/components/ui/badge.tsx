import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[20px] px-2.5 py-0.5 text-[11.5px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#dbeafe] text-[#1d4ed8]',
        secondary: 'bg-[#f3f4f6] text-[#4b5563]',
        outline: 'border border-[#e5e7eb] bg-white text-[#6b7280]',
        success: 'bg-[#d1fae5] text-[#065f46]',
        warning: 'bg-[#fef3c7] text-[#92400e]',
        danger: 'bg-[#fee2e2] text-[#991b1b]',
        info: 'bg-[#dbeafe] text-[#1d4ed8]',
        purple: 'bg-[#ede9fe] text-[#5b21b6]',
        cyan: 'bg-[#cffafe] text-[#155e75]',
        orange: 'bg-[#ffedd5] text-[#c2410c]',
        pink: 'bg-[#fce7f3] text-[#9d174d]',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
