/**
 * LayersPanel.tsx
 *
 * Layers panel for the visual editor.
 * Shows elements ordered by zIndex (top → bottom).
 * Supports: select, lock/unlock, show/hide, move up/down, duplicate, delete.
 */

import { GripVertical, Eye, EyeOff, Lock, Unlock, Trash, Copy, ChevronUp, ChevronDown, Type, Image as ImageIcon, Box } from 'lucide-react';
import type { SceneElement } from '../../types/models';
import { cn } from '../../lib/utils';

interface LayersPanelProps {
    elements: SceneElement[];
    selectedElementId: string | null;
    onSelectElement: (id: string) => void;
    onUpdateElement: (id: string, updates: Partial<SceneElement>) => void;
    onDeleteElement: (id: string) => void;
    onDuplicateElement: (id: string) => void;
    onMoveElement: (id: string, direction: 'up' | 'down') => void;
}

function ElementIcon({ type }: { type: SceneElement['type'] }) {
    if (type === 'text') return <Type className="w-3 h-3 shrink-0" />;
    if (type === 'image') return <ImageIcon className="w-3 h-3 shrink-0" />;
    return <Box className="w-3 h-3 shrink-0" />;
}

export function LayersPanel({
    elements,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    onDuplicateElement,
    onMoveElement,
}: LayersPanelProps) {
    // Sort by zIndex descending (highest z = topmost layer shown first in panel)
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-700">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Layers ({elements.length})
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                {sortedElements.length === 0 ? (
                    <div className="text-[11px] text-slate-500 text-center py-6 italic px-3">
                        No layers yet. Add elements above.
                    </div>
                ) : (
                    sortedElements.map((el) => {
                        const isSelected = selectedElementId === el.id;

                        return (
                            <div
                                key={el.id}
                                className={cn(
                                    'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors',
                                    isSelected
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-slate-700 text-slate-300'
                                )}
                                onClick={() => onSelectElement(el.id)}
                            >
                                {/* Drag handle (cosmetic) */}
                                <GripVertical className={cn(
                                    'w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                                    isSelected ? 'text-blue-200' : 'text-slate-500'
                                )} />

                                {/* Type icon */}
                                <ElementIcon type={el.type} />

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <div className={cn(
                                        'text-[11px] font-medium truncate',
                                        isSelected ? 'text-white' : 'text-slate-300',
                                        el.hidden && 'opacity-40'
                                    )}>
                                        {el.name || el.type}
                                    </div>
                                </div>

                                {/* Action buttons – visible on hover or when selected */}
                                <div className={cn(
                                    'flex items-center gap-0.5 transition-opacity',
                                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                )}>
                                    {/* Move up */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onMoveElement(el.id, 'up'); }}
                                        className="p-0.5 rounded hover:bg-white/20 transition-colors"
                                        title="Move Up (↑ z-index)"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    {/* Move down */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onMoveElement(el.id, 'down'); }}
                                        className="p-0.5 rounded hover:bg-white/20 transition-colors"
                                        title="Move Down (↓ z-index)"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {/* Duplicate */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDuplicateElement(el.id); }}
                                        className="p-0.5 rounded hover:bg-white/20 transition-colors"
                                        title="Duplicate"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                    {/* Lock / Unlock */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { locked: !el.locked }); }}
                                        className={cn(
                                            'p-0.5 rounded hover:bg-white/20 transition-colors',
                                            el.locked ? 'text-red-300' : ''
                                        )}
                                        title={el.locked ? 'Unlock' : 'Lock'}
                                    >
                                        {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    </button>
                                    {/* Hide / Show */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { hidden: !el.hidden }); }}
                                        className="p-0.5 rounded hover:bg-white/20 transition-colors"
                                        title={el.hidden ? 'Show' : 'Hide'}
                                    >
                                        {el.hidden ? <EyeOff className="w-3 h-3 text-slate-500" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    {/* Delete */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                                        className="p-0.5 rounded hover:bg-red-500/30 text-red-300 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
