import { useState, useRef, useEffect } from "react";
import type { AspectRatio } from "../types/aspectRatio";
import { getRatioValue } from "../types/aspectRatio";
import { ZoomIn, ZoomOut, Maximize, Minimize, X } from "lucide-react";
import { ACTIONS } from "../actionMap";
import { cn } from "../lib/utils";
import type { AnimationSettings } from "../preview/animations";
import DEFAULT_ANIMATION_SETTINGS from "../preview/animations";

interface PreviewStageProps {
    aspectRatio: AspectRatio;
    title?: string;
    children?: React.ReactNode;
    showGrid?: boolean;
    showSafeArea?: boolean;
    animation?: AnimationSettings;
    activeSceneId?: string;
}

export default function PreviewStage({
    aspectRatio,
    title,
    children,
    showGrid = false,
    showSafeArea = false,
    animation = DEFAULT_ANIMATION_SETTINGS,
    activeSceneId,
}: PreviewStageProps) {
    const ratio = getRatioValue(aspectRatio);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                {title && (
                    <h3 className="text-sm font-medium text-slate-700">{title}</h3>
                )}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm ml-auto">
                    <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        data-action={ACTIONS.MPCS_PREVIEW_ZOOM_OUT}
                        className="p-1.5 hover:bg-white rounded-md text-slate-600 disabled:opacity-50 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleResetZoom}
                        data-action={ACTIONS.MPCS_PREVIEW_ZOOM_RESET}
                        className="px-2 py-1 hover:bg-white rounded-md text-[10px] font-bold text-slate-600 transition-colors"
                        title="Reset Zoom"
                    >
                        {Math.round(zoom * 100)}%
                    </button>
                    <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 2}
                        data-action={ACTIONS.MPCS_PREVIEW_ZOOM_IN}
                        className="p-1.5 hover:bg-white rounded-md text-slate-600 disabled:opacity-50 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                    <button
                        onClick={toggleFullscreen}
                        data-action={ACTIONS.MPCS_PREVIEW_FULLSCREEN_TOGGLE}
                        className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className={cn(
                    "w-full max-w-4xl mx-auto overflow-auto custom-scrollbar flex items-center justify-center p-4 transition-colors",
                    isFullscreen ? "bg-black h-screen max-w-none" : "bg-slate-50 rounded-xl border border-slate-200 min-h-[400px]"
                )}
            >
                <div
                    className="relative bg-black shadow-2xl border-2 border-blue-500/50 overflow-hidden shrink-0 origin-center transition-transform duration-200"
                    style={{
                        aspectRatio: `${ratio}`,
                        width: isFullscreen ? "auto" : "100%",
                        height: isFullscreen ? "90vh" : "auto",
                        maxHeight: isFullscreen ? "none" : "70vh",
                        transform: `scale(${zoom})`,
                    }}
                >
                    {/* Grid overlay */}
                    {showGrid && (
                        <div
                            className="absolute inset-0 pointer-events-none z-10"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                                `,
                                backgroundSize: "10% 10%",
                            }}
                        />
                    )}

                    {/* Safe area overlay */}
                    {showSafeArea && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="absolute inset-0 m-[10%] border border-dashed border-yellow-400/40" />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        key={activeSceneId}
                        className={cn(
                            "relative w-full h-full flex items-center justify-center overflow-hidden",
                            animation.type === 'fade' && "anim-fade",
                            animation.type === 'slide' && "anim-slide"
                        )}
                        style={{
                            "--anim-duration": `${animation.durationMs}ms`
                        } as React.CSSProperties}
                    >
                        {children || (
                            <div className="text-slate-700 text-center p-4">
                                <div className="text-6xl mb-4 grayscale opacity-20">📱</div>
                                <p className="text-sm font-medium tracking-tight">PREVIEW RENDER</p>
                            </div>
                        )}
                    </div>
                </div>

                {isFullscreen && (
                    <div className="fixed top-6 right-6 z-[100]">
                        <button
                            onClick={toggleFullscreen}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
