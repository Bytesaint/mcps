import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning';
    className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: "bg-blue-100 text-blue-700 hover:bg-blue-200/80",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200/80",
        outline: "text-slate-900 border border-slate-200",
        success: "bg-green-100 text-green-700 hover:bg-green-200/80",
        warning: "bg-amber-100 text-amber-700 hover:bg-amber-200/80",
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
}
