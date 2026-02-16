import { useRef } from 'react';
import { Rnd } from 'react-rnd';
import { Scene, SceneElement } from '../../types/models';
import { cn } from '../../lib/utils'; // Assuming utils exists

interface SceneStageProps {
    scene: Scene;
    zoom: number;
    onUpdateElement: (elementId: string, updates: Partial<SceneElement>) => void;
    onSelectElement: (elementId: string | null) => void;
    selectedElementId: string | null;
}

export function SceneStage({ scene, zoom, onUpdateElement, onSelectElement, selectedElementId }: SceneStageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // Safe fallback for elements
    const elements = scene.override?.layout?.elements || [];

    // Base dimensions (9:16 aspect ratio reference, e.g., 1080x1920)
    // We render at a scaled down size but valid coordinates
    const STAGE_WIDTH = 360; // 1080 / 3
    const STAGE_HEIGHT = 640; // 1920 / 3

    return (
        <div
            ref={containerRef}
            className="bg-white shadow-2xl relative overflow-hidden transition-transform origin-center"
            style={{
                width: STAGE_WIDTH,
                height: STAGE_HEIGHT,
                transform: `scale(${zoom})`
            }}
            onClick={() => onSelectElement(null)}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-slate-50 border border-slate-100 pointer-events-none" />

            {/* Elements */}
            {elements.map((el) => (
                <Rnd
                    key={el.id}
                    size={{ width: el.width, height: el.height }}
                    position={{ x: el.x, y: el.y }}
                    onDragStop={(_e, d) => {
                        onUpdateElement(el.id, { x: d.x, y: d.y });
                    }}
                    onResizeStop={(_e, _direction, ref, _delta, position) => {
                        onUpdateElement(el.id, {
                            width: parseInt(ref.style.width),
                            height: parseInt(ref.style.height),
                            ...position,
                        });
                    }}
                    bounds="parent"
                    lockAspectRatio={el.type === 'image'}
                    disableDragging={el.locked}
                    enableResizing={!el.locked}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onSelectElement(el.id);
                    }}
                    className={cn(
                        "group border-2 transition-colors",
                        selectedElementId === el.id ? "border-blue-500 z-50" : "border-transparent hover:border-blue-300",
                        el.locked ? "border-red-500 border-dashed opacity-80" : ""
                    )}
                    style={{
                        zIndex: el.zIndex
                    }}
                >
                    {/* Render Element Content */}
                    <div className="w-full h-full overflow-hidden relative">
                        {el.type === 'text' && (
                            <div
                                style={{
                                    fontSize: el.fontSize,
                                    color: el.color,
                                    backgroundColor: el.backgroundColor,
                                    textAlign: el.textAlign,
                                    fontFamily: el.fontFamily,
                                    padding: el.padding,
                                    borderRadius: el.borderRadius,
                                }}
                                className="w-full h-full flex items-center justify-center p-2"
                            >
                                {el.content}
                            </div>
                        )}
                        {el.type === 'image' && (
                            <img
                                src={el.sourceType === 'custom' && el.customImageId ? `blob:${el.customImageId}` : undefined} // Placeholder for Blob URL
                                className="w-full h-full object-cover pointer-events-none select-none"
                                alt={el.name}
                            />
                        )}
                        {el.type === 'box' && (
                            <div
                                style={{
                                    backgroundColor: el.backgroundColor,
                                    borderColor: el.borderColor,
                                    borderWidth: el.borderWidth,
                                    borderRadius: el.borderRadius
                                }}
                                className="w-full h-full"
                            />
                        )}
                    </div>

                    {/* Label Overlay on Hover/Select */}
                    {(selectedElementId === el.id) && (
                        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-50">
                            {el.name} {el.locked && '(Locked)'}
                        </div>
                    )}
                </Rnd>
            ))}
        </div>
    );
}
