import { cn } from '../lib/utils';

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="relative w-full overflow-auto rounded-lg border border-slate-200 shadow-sm">
            <table className={cn("w-full caption-bottom text-sm text-left", className)} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn("bg-slate-50 border-b border-slate-200", className)} {...props}>{children}</thead>;
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn("border-b border-slate-100 transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-100", className)} {...props}>{children}</tr>;
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("h-10 px-4 align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0", className)} {...props}>{children}</th>;
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props}>{children}</td>;
}
