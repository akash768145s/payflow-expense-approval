import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-600/80',
        secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
        destructive: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-450',
        outline: 'text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800',
        // Custom status variants
        draft: 'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        submitted: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        approved: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400',
        rejected: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400',
        paid: 'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-300',
        revision: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
