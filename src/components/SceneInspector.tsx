import { Scene } from '../types/models';
import { ACTIONS } from '../actionMap';
import { cn } from '../lib/utils';
import {
    Clock, Type, Trophy, Image as ImageIcon,
    RotateCcw, Eye, EyeOff, Upload, X
} from 'lucide-react';

interface SceneInspectorProps {
    scene: Scene;
    onUpdate: (sceneId: string, updates: Partial<Scene['override']>) => void;
    onReset: (sceneId: string) => void;
}

export function SceneInspector({ scene, onUpdate, onReset }: SceneInspectorProps) {
    const override = scene.override || {};

    // Helpers to update specific sections of the override
    const updateOverride = (updates: Partial<Scene['override']>) => {
        onUpdate(scene.id, updates);
    };

    const updateText = (key: string, value: string) => {
        const currentText = override.text || {};
        updateOverride({
            text: { ...currentText, [key]: value }
        });
    };

    const updateMedia = (updates: Partial<NonNullable<NonNullable<Scene['override']>['media']>>) => {
        const currentMedia = override.media || {};
        updateOverride({
            media: { ...currentMedia, ...updates }
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result && typeof event.target.result === 'string') {
                updateMedia({
                    [side === 'A' ? 'phoneAImageSrc' : 'phoneBImageSrc']: event.target.result
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const renderTextInputs = () => {
        const placeholders = scene.auto.placeholders || {};
        const overrides = override.text || {};

        return Object.entries(placeholders).map(([key, autoValue]) => (
            <div key={key} className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                    type="text"
                    value={overrides[key] ?? ""}
                    onChange={(e) => updateText(key, e.target.value)}
                    placeholder={autoValue}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    data-action={ACTIONS.MPCS_SCENE_TEXT_OVERRIDE_CHANGE}
                />
            </div>
        ));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        override.enabled === false ? "bg-slate-300" : "bg-blue-500"
                    )} />
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {scene.label}
                            {Object.keys(override).length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has overrides" />
                            )}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{scene.type}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => updateOverride({ enabled: !(override.enabled ?? true) })}
                        className={cn(
                            "p-1.5 rounded-md transition-colors",
                            override.enabled === false
                                ? "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        )}
                        title={override.enabled === false ? "Enable Scene" : "Disable Scene"}
                        data-action={ACTIONS.MPCS_SCENE_TOGGLE_ENABLED}
                    >
                        {override.enabled === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => onReset(scene.id)}
                        disabled={Object.keys(override).length === 0}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors disabled:opacity-30"
                        title="Reset to Auto"
                        data-action={ACTIONS.MPCS_SCENE_RESET_ONE}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content Scrolling Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* 1. Timing & Transition */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Timing
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Duration (ms)</label>
                            <input
                                type="number"
                                min="100"
                                step="100"
                                value={override.durationMs ?? ""}
                                placeholder="Auto"
                                onChange={(e) => updateOverride({ durationMs: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                                data-action={ACTIONS.MPCS_SCENE_DURATION_CHANGE}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Transition</label>
                            <select
                                value={override.transition?.type ?? "inherit"}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    updateOverride({
                                        transition: val === 'inherit' ? undefined : { type: val as any, durationMs: 350 }
                                    });
                                }}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                                data-action={ACTIONS.MPCS_SCENE_TRANSITION_CHANGE}
                            >
                                <option value="inherit">Auto</option>
                                <option value="none">None</option>
                                <option value="fade">Fade</option>
                                <option value="slide">Slide</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Text Overrides */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                        <Type className="w-3.5 h-3.5 text-slate-400" /> Text Content
                    </div>
                    <div className="space-y-3">
                        {renderTextInputs()}
                        {Object.keys(scene.auto.placeholders || {}).length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No editable text fields for this scene type.</p>
                        )}
                    </div>
                </div>

                {/* 3. Winner Override (Body Only) */}
                {scene.type === 'body' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                            <Trophy className="w-3.5 h-3.5 text-slate-400" /> Winner Result
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="flex gap-2">
                                {(['Auto', 'A', 'B', 'TIE'] as const).map((opt) => {
                                    const isSelected = opt === 'Auto'
                                        ? override.winnerOverride === undefined
                                        : override.winnerOverride === opt;

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => updateOverride({
                                                winnerOverride: opt === 'Auto' ? undefined : (opt as any)
                                            })}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-bold rounded shadow-sm transition-all border",
                                                isSelected
                                                    ? "bg-white border-blue-500 text-blue-600 ring-1 ring-blue-500/20"
                                                    : "bg-slate-100 border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
                                            )}
                                            data-action={ACTIONS.MPCS_SCENE_WINNER_OVERRIDE_CHANGE}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400">
                                Overriding the winner will automatically recalculate the final score.
                                Current Auto: <strong className="text-slate-600">{scene.auto.winner || 'None'}</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* 4. Media Overrides */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Media
                    </div>

                    {/* Phone A Image */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Phone A Image</label>
                            {override.media?.phoneAImageSrc && (
                                <button
                                    onClick={() => updateMedia({ phoneAImageSrc: undefined })}
                                    className="text-[9px] text-red-500 hover:underline flex items-center gap-1"
                                >
                                    <X className="w-2.5 h-2.5" /> Reset
                                </button>
                            )}
                        </div>

                        {!override.media?.phoneAImageSrc ? (
                            <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                                <span className="text-[10px] text-slate-500 group-hover:text-slate-700">Upload Custom Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'A')} data-action={ACTIONS.MPCS_SCENE_MEDIA_UPLOAD_A} />
                            </label>
                        ) : (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-20 flex items-center justify-center">
                                <img src={override.media.phoneAImageSrc} className="h-full object-contain" alt="Override A" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-[10px] text-white font-bold border border-white/40">
                                        Change
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'A')} />
                                    </label>
                                </div>
                            </div>
                        )}
                        <p className="text-[9px] text-slate-400">Best results: upload PNG with transparent background.</p>
                    </div>

                    {/* Phone B Image */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Phone B Image</label>
                            {override.media?.phoneBImageSrc && (
                                <button
                                    onClick={() => updateMedia({ phoneBImageSrc: undefined })}
                                    className="text-[9px] text-red-500 hover:underline flex items-center gap-1"
                                >
                                    <X className="w-2.5 h-2.5" /> Reset
                                </button>
                            )}
                        </div>

                        {!override.media?.phoneBImageSrc ? (
                            <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                                <span className="text-[10px] text-slate-500 group-hover:text-slate-700">Upload Custom Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'B')} data-action={ACTIONS.MPCS_SCENE_MEDIA_UPLOAD_B} />
                            </label>
                        ) : (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-20 flex items-center justify-center">
                                <img src={override.media.phoneBImageSrc} className="h-full object-contain" alt="Override B" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-[10px] text-white font-bold border border-white/40">
                                        Change
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'B')} />
                                    </label>
                                </div>
                            </div>
                        )}
                        <p className="text-[9px] text-slate-400">Best results: upload PNG with transparent background.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default SceneInspector;
