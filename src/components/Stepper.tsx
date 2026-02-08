import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface StepperProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <div className={cn("flex items-center w-full", className)}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <Fragment key={step}>
                        <div className="flex items-center relative z-10">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2",
                                isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                                    isCurrent ? "bg-white border-blue-600 text-blue-600" :
                                        "bg-white border-slate-300 text-slate-500"
                            )}>
                                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                            <span className={cn(
                                "ml-3 text-sm font-medium absolute -bottom-6 w-32 text-center -left-12",
                                isCurrent ? "text-blue-600" : isCompleted ? "text-slate-900" : "text-slate-400"
                            )}>
                                {step}
                            </span>
                        </div>

                        {index < steps.length - 1 && (
                            <div className={cn(
                                "flex-1 h-0.5 mx-4 transition-colors",
                                index < currentStep ? "bg-blue-600" : "bg-slate-200"
                            )} />
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
}
