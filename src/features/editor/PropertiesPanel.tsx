import { SceneElement } from '../../types/models';
import { cn } from '../../lib/utils';

interface PropertiesPanelProps {
    element: SceneElement | null;
    onUpdate: (updates: Partial<SceneElement>) => void;
}

export function PropertiesPanel({ element, onUpdate }: PropertiesPanelProps) {
    if (!element) {
        return (
            <div className="p-6 text-center">
                <p className="text-xs text-slate-500 italic">
                    Select an element on the stage or layers panel to edit its properties.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-800 border-l border-slate-700 overflow-y-auto">
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Properties</h3>
                <div className="text-sm font-medium text-white truncate">{element.name}</div>
                <div className="text-[10px] text-blue-400 font-mono">{element.type}</div>
            </div>

            <div className="p-4 space-y-6">
                {/* Position & Size */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase">Layout</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">X Position</label>
                            <input
                                type="number"
                                value={Math.round(element.x)}
                                onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">Y Position</label>
                            <input
                                type="number"
                                value={Math.round(element.y)}
                                onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">Width</label>
                            <input
                                type="number"
                                value={Math.round(element.width)}
                                onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">Height</label>
                            <input
                                type="number"
                                value={Math.round(element.height)}
                                onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase">Appearance</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-300">Opacity</label>
                            <span className="text-xs text-slate-500">{Math.round((element.opacity || 1) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={element.opacity ?? 1}
                            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                {/* Text Specific */}
                {element.type === 'text' && (
                    <div className="space-y-3 pt-3 border-t border-slate-700/50">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase">Text Style</h4>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400">Content</label>
                                <textarea
                                    value={element.content}
                                    onChange={(e) => onUpdate({ content: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Size</label>
                                    <input
                                        type="number"
                                        value={element.fontSize}
                                        onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Color</label>
                                    <div className="flex gap-2 h-[26px]">
                                        <input
                                            type="color"
                                            value={element.color}
                                            onChange={(e) => onUpdate({ color: e.target.value })}
                                            className="w-full h-full rounded cursor-pointer bg-transparent border-none p-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
