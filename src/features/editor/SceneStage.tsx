/**
 * SceneStage.tsx
 *
 * The central canvas area in the visual editor.
 * Uses react-rnd for drag/resize and stores coordinates as PERCENTAGES (0–100).
 *
 * The stage renders at a fixed pixel size (STAGE_W × STAGE_H) but all
 * element positions are stored as % so they scale correctly on export.
 */

import { useRef } from 'react';
import { Rnd } from 'react-rnd';
import { cn } from '../../lib/utils';
import type { Scene, SceneElement, SceneLayout } from '../../types/models';
import { SceneComposition } from '../../render/SceneComposition';

// Fixed stage pixel dimensions in the editor.
// All stored coordinates are in % of these.
const STAGE_W = 360;
const STAGE_H = 640;

interface SceneStageProps {
    scene: Scene;
    zoom: number;
    /** Resolved phone image URLs */
    phones?: { a?: string; b?: string };
    onUpdateElement: (elementId: string, updates: Partial<SceneElement>) => void;
    onSelectElement: (elementId: string | null) => void;
    selectedElementId: string | null;
}

/** Convert a pixel position/size on the stage to a percentage */
function pxToPct(px: number, stageSize: number): number {
    return Math.max(0, Math.min(100, (px / stageSize) * 100));
}

/** Convert a percentage to pixel position/size on the stage */
function pctToPx(pct: number, stageSize: number): number {
    return (pct / 100) * stageSize;
}

export function SceneStage({
    scene,
    zoom,
    phones,
    onUpdateElement,
    onSelectElement,
    selectedElementId,
}: SceneStageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const elements = scene.override?.layout?.elements || [];
    const layout = scene.override?.layout as SceneLayout | undefined ?? null;

    // Build a version of the layout excluding the selected element (we'll render it with react-rnd on top)
    const bgColor = layout?.backgroundColor || '#000000';

    return (
        <div
            ref={containerRef}
            style={{
                width: STAGE_W,
                height: STAGE_H,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                position: 'relative',
                flexShrink: 0,
                backgroundColor: bgColor,
                overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 25px 60px rgba(0,0,0,0.6)',
            }}
            onClick={() => onSelectElement(null)}
        >
            {/* Background composition (non-interactive elements via SceneComposition) */}
            <SceneComposition
                layout={layout}
                phones={phones}
                width={STAGE_W}
                height={STAGE_H}
                resolvedPlaceholders={scene.auto?.placeholders ?? {}}
            />

            {/* Drag/resize handles rendered on top via react-rnd  */}
            {elements.map((el) => {
                if (el.hidden) return null;

                const x = pctToPx(el.x, STAGE_W);
                const y = pctToPx(el.y, STAGE_H);
                const w = pctToPx(el.width, STAGE_W);
                const h = pctToPx(el.height, STAGE_H);
                const isSelected = selectedElementId === el.id;

                return (
                    <Rnd
                        key={el.id}
                        size={{ width: w, height: h }}
                        position={{ x, y }}
                        onDragStop={(_e, d) => {
                            onUpdateElement(el.id, {
                                x: pxToPct(d.x, STAGE_W),
                                y: pxToPct(d.y, STAGE_H),
                            });
                        }}
                        onResizeStop={(_e, _dir, ref, _delta, position) => {
                            onUpdateElement(el.id, {
                                width: pxToPct(parseInt(ref.style.width), STAGE_W),
                                height: pxToPct(parseInt(ref.style.height), STAGE_H),
                                x: pxToPct(position.x, STAGE_W),
                                y: pxToPct(position.y, STAGE_H),
                            });
                        }}
                        bounds="parent"
                        disableDragging={el.locked}
                        enableResizing={!el.locked ? {
                            top: true, right: true, bottom: true, left: true,
                            topRight: true, topLeft: true, bottomRight: true, bottomLeft: true,
                        } : false}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            onSelectElement(el.id);
                        }}
                        style={{ zIndex: el.zIndex + 100 /* above SceneComposition */ }}
                        className={cn(
                            'group border-2 transition-colors',
                            isSelected
                                ? 'border-blue-500'
                                : 'border-transparent hover:border-blue-300/60',
                            el.locked ? 'border-red-500 border-dashed' : ''
                        )}
                    >
                        {/* Transparent overlay so drops land in the right element */}
                        <div
                            className="w-full h-full"
                            style={{ opacity: 0, position: 'absolute', inset: 0 }}
                        />

                        {/* Selection label */}
                        {isSelected && (
                            <div
                                className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-50 pointer-events-none"
                            >
                                {el.name} {el.locked && '(Locked)'}
                            </div>
                        )}
                    </Rnd>
                );
            })}

            {/* Safe-area guide lines (optional cosmetic) */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
                <div className="absolute left-[5%] right-[5%] top-[5%] bottom-[5%] border border-white/10 border-dashed rounded" />
            </div>
        </div>
    );
}
