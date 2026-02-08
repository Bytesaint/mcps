import React from 'react';
import { cn } from '../lib/utils';
import { ActionId } from '../actionMap';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    action?: ActionId;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    action,
    className,
    children,
    ...props
}: ButtonProps) {
    const sizeStyles = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 text-base"
    };

    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    };

    return (
        <button
            data-action={action}
            className={cn(baseStyles, sizeStyles[size], variants[variant], className)}
            {...props}
        >
            {children}
        </button>
    );
}
