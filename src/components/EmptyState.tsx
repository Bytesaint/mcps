import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { ActionId } from '../actionMap';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    actionId?: ActionId;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionId }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                <Icon className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>
            {actionLabel && actionId && (
                <Button variant="secondary" action={actionId} onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
