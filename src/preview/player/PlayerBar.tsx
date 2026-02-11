import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown } from 'lucide-react';
import { ACTIONS } from '../../actionMap';
import { cn } from '../../lib/utils';

interface PlayerBarProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    progressPercent: number;
    onSeek: (percent: number) => void;
    overallElapsedMs: number;
    totalDurationMs: number;
    speed: number;
    onSpeedChange: (speed: number) => void;
    disabled?: boolean;
}

export function PlayerBar({
    isPlaying,
    onTogglePlay,
    onNext,
    onPrev,
    progressPercent,
    onSeek,
    overallElapsedMs,
    totalDurationMs,
    speed,
    onSpeedChange,
    disabled = false
}: PlayerBarProps) {
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSeek(parseFloat(e.target.value));
    };

    return (
        <div className={cn(
            "bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-3 shadow-2xl transition-opacity",
            disabled && "opacity-50 pointer-events-none"
        )}>
            {/* Progress Slider */}
            <div className="px-2">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progressPercent}
                    onChange={handleProgressChange}
                    data-action={ACTIONS.MPCS_PLAYER_SEEK}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                />
            </div>

            <div className="flex items-center justify-between px-2">
                {/* Left: Time Display */}
                <div className="text-[11px] font-mono text-white/50 w-24">
                    <span className="text-white font-bold">{formatTime(overallElapsedMs)}</span>
                    <span className="mx-1">/</span>
                    <span>{formatTime(totalDurationMs)}</span>
                </div>

                {/* Center: Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onPrev}
                        data-action={ACTIONS.MPCS_PLAYER_PREV}
                        className="text-white/70 hover:text-white transition-colors p-1"
                        title="Previous Scene"
                    >
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>

                    <button
                        onClick={onTogglePlay}
                        data-action={ACTIONS.MPCS_PLAYER_PLAY_PAUSE}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <button
                        onClick={onNext}
                        data-action={ACTIONS.MPCS_PLAYER_NEXT}
                        className="text-white/70 hover:text-white transition-colors p-1"
                        title="Next Scene"
                    >
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                </div>

                {/* Right: Speed Control */}
                <div className="relative group w-24 flex justify-end">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group-hover:border-white/20">
                        <span className="text-[10px] font-black text-white/80">{speed}x</span>
                        <ChevronDown className="w-3 h-3 text-white/40" />
                    </div>

                    {/* Speed Popover */}
                    <div className="absolute bottom-full right-0 mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="bg-slate-800 border border-white/10 rounded-lg py-1 shadow-xl min-w-[70px]">
                            {[0.75, 1, 1.25, 1.5].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onSpeedChange(s)}
                                    data-action={ACTIONS.MPCS_PLAYER_SPEED_CHANGE}
                                    className={cn(
                                        "w-full text-left px-3 py-1.5 text-[10px] font-bold transition-colors",
                                        speed === s ? "text-blue-400 bg-blue-400/10" : "text-white/70 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
