/**
 * SceneComposition.tsx
 *
 * Unified React scene renderer. Used in:
 * - The visual editor (SceneStage preview)
 * - The preview player overlay
 * - The Remotion composition (for MP4 export)
 *
 * All element coordinates are stored as PERCENTAGES (0–100 of stage W×H).
 * This component converts them to CSS % for browser rendering.
 */

import React from 'react';
import type {
    SceneLayout,
    SceneElement,
    SceneTextElement,
    SceneImageElement,
    SceneBoxElement,
} from '../types/models';

export interface SceneCompositionProps {
    /** The scene's visual layout (can be null → renders blank stage) */
    layout: SceneLayout | null;
    /**
     * Resolved values for placeholder keys like "{{specA}}", "{{phoneA.name}}", etc.
     * Any {{key}} in text content is replaced with resolvedPlaceholders[key] ?? key.
     */
    resolvedPlaceholders?: Record<string, string>;
    /**
     * Pre-resolved image URLs for phone images.
     * If the element is sourceType='phoneA'/'phoneB', these URLs are used.
     */
    phones?: { a?: string; b?: string };
    /** Stage width in pixels (used to scale fontSize) */
    width: number;
    /** Stage height in pixels */
    height: number;
    /** Optional click handler for stage background (deselect) */
    onClick?: () => void;
    /** Optional className for the outer container */
    className?: string;
    /** Optional children rendered on top (e.g. selection handles) */
    children?: React.ReactNode;
}

/** Replace {{key}} patterns in text using the provided map */
function resolvePlaceholders(text: string, map: Record<string, string>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_m, key) => map[key.trim()] ?? `{{${key}}}`);
}

function TextElement({
    el,
    stageW,
    resolvedPlaceholders = {},
}: {
    el: SceneTextElement;
    stageW: number;
    resolvedPlaceholders?: Record<string, string>;
}) {
    const left = `${el.x}%`;
    const top = `${el.y}%`;
    const width = `${el.width}%`;
    const height = `${el.height}%`;

    // Scale fontSize proportionally to stage width (designed at 360px reference)
    const fontScale = stageW / 360;
    const scaledFontSize = (el.fontSize || 24) * fontScale;

    const content = resolvePlaceholders(el.content, resolvedPlaceholders);

    return (
        <div
            style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                opacity: el.opacity ?? 1,
                zIndex: el.zIndex,
                fontSize: `${scaledFontSize}px`,
                fontFamily: el.fontFamily || 'Inter, sans-serif',
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle,
                color: el.color || '#ffffff',
                textAlign: el.textAlign || 'center',
                backgroundColor: el.backgroundColor,
                padding: el.padding != null ? `${el.padding * fontScale}px` : undefined,
                borderRadius: el.borderRadius != null ? `${el.borderRadius}px` : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                    el.textAlign === 'right'
                        ? 'flex-end'
                        : el.textAlign === 'left'
                            ? 'flex-start'
                            : 'center',
                overflow: 'hidden',
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                visibility: el.hidden ? 'hidden' : 'visible',
                boxSizing: 'border-box',
                pointerEvents: 'none',
            }}
        >
            {content}
        </div>
    );
}

/** Renders an image element with zoom/pan crop support */
function ImageElement({
    el,
    phones,
}: {
    el: SceneImageElement;
    phones?: { a?: string; b?: string };
}) {
    let src: string | undefined;
    if (el.sourceType === 'phoneA') src = phones?.a;
    else if (el.sourceType === 'phoneB') src = phones?.b;
    // Custom images from IDB — the URL should be pre-resolved and passed in via phones map
    // For simplicity use customImageId as a blob URL stored externally
    else if (el.sourceType === 'custom' && el.customImageId) {
        // The caller should resolve this and pass a URL. We fall back to nothing.
        src = undefined;
    }

    const zoom = el.crop?.zoom ?? 1;
    const panX = el.crop?.panX ?? 0;
    const panY = el.crop?.panY ?? 0;

    // Translate: panX/Y is -1 to 1, translate by (1-1/zoom)*50% * panX
    const txPct = panX * (1 - 1 / zoom) * 50;
    const tyPct = panY * (1 - 1 / zoom) * 50;

    return (
        <div
            style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                opacity: el.opacity ?? 1,
                zIndex: el.zIndex,
                overflow: 'hidden',
                borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                borderWidth: el.borderWidth,
                borderColor: el.borderColor,
                borderStyle: el.borderWidth ? 'solid' : undefined,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                visibility: el.hidden ? 'hidden' : 'visible',
                pointerEvents: 'none',
                backgroundColor: '#1e293b',
            }}
        >
            {src ? (
                <img
                    src={src}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: el.fit || 'cover',
                        transform: `scale(${zoom}) translate(${txPct}%, ${tyPct}%)`,
                        transformOrigin: 'center center',
                        display: 'block',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                />
            ) : (
                /* Placeholder: grey box with diagonal cross */
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                    }}
                >
                    {el.sourceType === 'phoneA' ? '📱 Phone A' : el.sourceType === 'phoneB' ? '📱 Phone B' : '🖼 Image'}
                </div>
            )}
        </div>
    );
}

/** Renders a box/shape element */
function BoxElement({ el }: { el: SceneBoxElement }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                opacity: el.opacity ?? 1,
                zIndex: el.zIndex,
                backgroundColor: el.backgroundColor,
                borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                borderWidth: el.borderWidth,
                borderColor: el.borderColor,
                borderStyle: el.borderWidth ? 'solid' : undefined,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                visibility: el.hidden ? 'hidden' : 'visible',
                pointerEvents: 'none',
            }}
        />
    );
}

function renderElement(
    el: SceneElement,
    stageW: number,
    _stageH: number,
    resolvedPlaceholders: Record<string, string>,
    phones?: { a?: string; b?: string }
) {
    if (el.type === 'text') {
        return (
            <TextElement
                key={el.id}
                el={el as SceneTextElement}
                stageW={stageW}
                resolvedPlaceholders={resolvedPlaceholders}
            />
        );
    }
    if (el.type === 'image') {
        return (
            <ImageElement
                key={el.id}
                el={el as SceneImageElement}
                phones={phones}
            />
        );
    }
    if (el.type === 'box') {
        return <BoxElement key={el.id} el={el as SceneBoxElement} />;
    }
    return null;
}

/**
 * SceneComposition: renders a scene layout as React DOM.
 * Works in the browser editor, preview player, and Remotion compositions.
 */
export function SceneComposition({
    layout,
    resolvedPlaceholders = {},
    phones,
    width,
    height,
    onClick,
    className,
    children,
}: SceneCompositionProps) {
    const sortedElements = layout
        ? [...layout.elements].sort((a, b) => a.zIndex - b.zIndex)
        : [];

    const bgColor = layout?.backgroundColor || '#000000';

    return (
        <div
            className={className}
            style={{
                position: 'relative',
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: bgColor,
                overflow: 'hidden',
                flexShrink: 0,
            }}
            onClick={onClick}
        >
            {sortedElements.map((el) =>
                renderElement(el, width, height, resolvedPlaceholders, phones)
            )}
            {children}
        </div>
    );
}
