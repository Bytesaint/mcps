import { GripVertical, Eye, EyeOff, Lock, Unlock, Trasnsh2 } from 'lucide-react';
import { SceneElement } from '../../types/models';
import { cn } from '../../lib/utils';

interface LayersPanelProps {
    elements: SceneElement[];
    selectedElementId: string | null;
    onSelectElement: (id: string) => void;
    onUpdateElement: (id: string, updates: Partial<SceneElement>) => void;
    onReorderElement: (dragIndex: number, hoverIndex: number) => void; // Placeholder for future drag-sort
}

export function LayersPanel({ elements, selectedElementId, onSelectElement, onUpdateElement }: LayersPanelProps) {
    // Sort elements by zIndex descending (top layers first)
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

    return (
        <div className="flex flex-col h-full bg-slate-800 border-r border-slate-700">
            <div className="p-3 border-b border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Layers</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sortedElements.length === 0 && (
                    <div className="text-xs text-slate-500 text-center py-4 italic">
                        No layers
                    </div>
                )}
                {sortedElements.map((el) => (
                    <div
                        key={el.id}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer group",
                            selectedElementId === el.id ? "bg-blue-600 shadow-sm" : "hover:bg-slate-700"
                        )}
                        onClick={() => onSelectElement(el.id)}
                    >
                        <GripVertical className="w-4 h-4 text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex-1 min-w-0">
                            <div className={cn(
                                "text-xs font-medium truncate",
                                selectedElementId === el.id ? "text-white" : "text-slate-300"
                            )}>
                                {el.name || el.type}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateElement(el.id, { locked: !el.locked });
                                }}
                                className={cn("p-1 rounded hover:bg-slate-600", el.locked ? "text-red-400 opacity-100" : "text-slate-400")}
                                title={el.locked ? "Unlock" : "Lock"}
                            >
                                {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateElement(el.id, { hidden: !el.hidden });
                                }}
                                className={cn("p-1 rounded hover:bg-slate-600", el.hidden ? "text-slate-500" : "text-slate-400")}
                                title={el.hidden ? "Show" : "Hide"}
                            >
                                {el.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
