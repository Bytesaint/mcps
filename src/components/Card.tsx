import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6", className)}
            {...props}
        >
            {children}
        </div>
    );
}
