import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { ProjectScene } from '../../types/models';
import { cn } from '../../lib/utils';

interface TimelineProps {
    scenes: ProjectScene[];
    currentSceneId: string | null;
    isPlaying: boolean;
    onSelectScene: (id: string) => void;
    onPlayPause: () => void;
}

export function Timeline({ scenes, currentSceneId, isPlaying, onSelectScene, onPlayPause }: TimelineProps) {
    return (
        <div className="flex flex-col h-48 bg-slate-900 border-t border-slate-700 select-none">
            {/* Controls Bar */}
            <div className="h-10 border-b border-slate-800 bg-slate-800/50 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                        <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onPlayPause}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                        <SkipForward className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-500 font-mono ml-4">
                        00:00 / 00:15
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Scale Slider Placeholder */}
                    <span className="text-[10px] text-slate-600">Zoom</span>
                </div>
            </div>

            {/* Tracks Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden relative p-4 custom-scrollbar">
                <div className="flex h-24 gap-1 min-w-max">
                    {scenes.map((scene, i) => {
                        const isSelected = currentSceneId === scene.id;
                        const duration = scene.override?.durationMs || 3000;
                        // Visual width proportional to duration (e.g. 1sec = 40px)
                        const width = Math.max(80, (duration / 1000) * 40);

                        return (
                            <div
                                key={scene.id || i}
                                onClick={() => onSelectScene(scene.id)}
                                className={cn(
                                    "relative h-full rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between p-2 shrink-0 group overflow-hidden bg-slate-800 hover:bg-slate-750",
                                    isSelected ? "border-blue-500 ring-2 ring-blue-500/20 bg-slate-750" : "border-slate-700 hover:border-slate-600"
                                )}
                                style={{ width }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold truncate px-1 rounded",
                                        isSelected ? "bg-blue-900/50 text-blue-200" : "bg-slate-900/50 text-slate-400"
                                    )}>
                                        {scene.label}
                                    </span>
                                </div>

                                {/* Placeholder Waveform/Thumbnail */}
                                <div className="absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-shimmer" />

                                <span className="self-end text-[9px] font-mono text-slate-500 bg-black/20 px-1 rounded">
                                    {(duration / 1000).toFixed(1)}s
                                </span>
                            </div>
                        );
                    })}

                    {/* Add Scene Button Placeholder */}
                    <div className="w-12 h-full border border-slate-800 border-dashed rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-600 cursor-pointer transition-colors">
                        <span className="text-xl">+</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
