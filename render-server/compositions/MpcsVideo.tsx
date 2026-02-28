/**
 * MpcsVideo.tsx
 *
 * Remotion composition that renders the full MPCS comparison video.
 * Each scene gets a segment based on its durationMs.
 * Transitions (fade/slide) are applied between segments.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio } from 'remotion';
import type { ProjectExportPayload, ExportScene, SceneElement, SceneTextElement, SceneImageElement, SceneBoxElement } from '../src/types';

// ─── Placeholder resolver ────────────────────────────────────────────────────

function resolvePlaceholders(text: string, map: Record<string, string> = {}): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_m, key) => map[key.trim()] ?? `{{${key}}}`);
}

// ─── Element renderers ───────────────────────────────────────────────────────

function TextEl({ el, stageW, map }: { el: SceneTextElement; stageW: number; map: Record<string, string> }) {
    const scale = stageW / 360;
    const text = resolvePlaceholders(el.content, map);
    return (
        <div style={{
            position: 'absolute',
            left: `${el.x}%`, top: `${el.y}%`,
            width: `${el.width}%`, height: `${el.height}%`,
            opacity: el.opacity ?? 1, zIndex: el.zIndex,
            fontSize: `${(el.fontSize || 24) * scale}px`,
            fontFamily: el.fontFamily || 'Inter, sans-serif',
            fontWeight: el.fontWeight || 'normal',
            color: el.color || '#ffffff',
            textAlign: el.textAlign || 'center',
            backgroundColor: el.backgroundColor,
            padding: el.padding ? `${el.padding * scale}px` : undefined,
            borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
            display: 'flex', alignItems: 'center',
            justifyContent: el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center',
            overflow: 'hidden',
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            visibility: el.hidden ? 'hidden' : 'visible',
            boxSizing: 'border-box',
        }}>
            {text}
        </div>
    );
}

function ImageEl({ el, dataUrl, assetMap }: { el: SceneImageElement; dataUrl?: string; assetMap: Record<string, string> }) {
    let src = dataUrl;
    if (!src && el.sourceType === 'custom' && el.customImageId) {
        src = assetMap[el.customImageId];
    }

    const zoom = el.crop?.zoom ?? 1;
    const panX = el.crop?.panX ?? 0;
    const panY = el.crop?.panY ?? 0;
    const txPct = panX * (1 - 1 / zoom) * 50;
    const tyPct = panY * (1 - 1 / zoom) * 50;

    return (
        <div style={{
            position: 'absolute',
            left: `${el.x}%`, top: `${el.y}%`,
            width: `${el.width}%`, height: `${el.height}%`,
            opacity: el.opacity ?? 1, zIndex: el.zIndex,
            overflow: 'hidden',
            borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
            borderWidth: el.borderWidth, borderColor: el.borderColor,
            borderStyle: el.borderWidth ? 'solid' : undefined,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            visibility: el.hidden ? 'hidden' : 'visible',
            backgroundColor: '#1e293b',
        }}>
            {src ? (
                <img src={`data:image/jpeg;base64,${src.includes(',') ? src.split(',')[1] : src}`}
                    style={{
                        width: '100%', height: '100%',
                        objectFit: el.fit || 'cover',
                        transform: `scale(${zoom}) translate(${txPct}%, ${tyPct}%)`,
                        transformOrigin: 'center center',
                        display: 'block',
                    }} />
            ) : (
                <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                    {el.sourceType === 'phoneA' ? 'Phone A' : el.sourceType === 'phoneB' ? 'Phone B' : 'Image'}
                </div>
            )}
        </div>
    );
}

function BoxEl({ el }: { el: SceneBoxElement }) {
    return (
        <div style={{
            position: 'absolute',
            left: `${el.x}%`, top: `${el.y}%`,
            width: `${el.width}%`, height: `${el.height}%`,
            opacity: el.opacity ?? 1, zIndex: el.zIndex,
            backgroundColor: el.backgroundColor,
            borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
            borderWidth: el.borderWidth, borderColor: el.borderColor,
            borderStyle: el.borderWidth ? 'solid' : undefined,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            visibility: el.hidden ? 'hidden' : 'visible',
        }} />
    );
}

// ─── Single scene renderer ───────────────────────────────────────────────────

interface SceneCompositionProps {
    scene: ExportScene;
    phones: { aDataUrl?: string; bDataUrl?: string };
    assetDataUrls: Record<string, string>; // assetKey → base64 data URL
    width: number;
    height: number;
}

function SceneFrame({ scene, phones, assetDataUrls, width }: SceneCompositionProps) {
    const layout = scene.override?.layout;
    const elements = [...(layout?.elements || [])].sort((a, b) => a.zIndex - b.zIndex);
    const bgColor = layout?.backgroundColor || '#000000';
    const placeholders = scene.auto?.placeholders || {};

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: bgColor, position: 'relative', overflow: 'hidden' }}>
            {elements.map((el) => {
                if (el.hidden) return null;
                if (el.type === 'text') {
                    return <TextEl key={el.id} el={el as SceneTextElement} stageW={width} map={placeholders} />;
                }
                if (el.type === 'image') {
                    const imgEl = el as SceneImageElement;
                    const dataUrl = imgEl.sourceType === 'phoneA'
                        ? phones.aDataUrl
                        : imgEl.sourceType === 'phoneB'
                            ? phones.bDataUrl
                            : undefined;
                    return <ImageEl key={el.id} el={imgEl} dataUrl={dataUrl} assetMap={assetDataUrls} />;
                }
                if (el.type === 'box') {
                    return <BoxEl key={el.id} el={el as SceneBoxElement} />;
                }
                return null;
            })}
        </div>
    );
}

// ─── Transition overlay ──────────────────────────────────────────────────────

function TransitionOverlay({ type, progress }: { type: 'fade' | 'slide'; progress: number }) {
    if (type === 'fade') {
        // Progress 0→1: fade in (outgoing fades out)
        return (
            <AbsoluteFill style={{ backgroundColor: '#000', opacity: progress > 0.5 ? (1 - progress) * 2 : progress * 2 }} />
        );
    }
    if (type === 'slide') {
        const tx = (1 - progress) * 100;
        return (
            <AbsoluteFill style={{ transform: `translateX(${tx}%)`, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />
            </AbsoluteFill>
        );
    }
    return null;
}

// ─── Main MpcsVideo composition ──────────────────────────────────────────────

export const MpcsVideoComposition: React.FC<{ payload: ProjectExportPayload }> = ({ payload }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const { scenes, phones, assets } = payload;

    // Pre-compute base64 data URLs for assets
    const assetDataUrls: Record<string, string> = {};
    for (const [key, asset] of Object.entries(assets)) {
        assetDataUrls[key] = asset.base64;
    }

    const phoneADataUrl = phones.a.imageBase64;
    const phoneBDataUrl = phones.b.imageBase64;

    // Compute per-scene frame ranges
    interface SceneRange {
        scene: ExportScene;
        startFrame: number;
        endFrame: number;
        transitionFrames: number;
    }

    const ranges: SceneRange[] = [];
    let cursor = 0;
    for (const scene of scenes) {
        const durationFrames = Math.round((scene.timing.durationMs / 1000) * fps);
        const transitionFrames = Math.round(((scene.timing.transition.durationMs || 500) / 1000) * fps);
        ranges.push({
            scene,
            startFrame: cursor,
            endFrame: cursor + durationFrames,
            transitionFrames,
        });
        cursor += durationFrames;
    }

    // Find current + next scene
    let currentRange: SceneRange | null = null;
    let nextRange: SceneRange | null = null;

    for (let i = 0; i < ranges.length; i++) {
        const r = ranges[i];
        if (frame >= r.startFrame && frame < r.endFrame) {
            currentRange = r;
            nextRange = ranges[i + 1] ?? null;
            break;
        }
    }

    if (!currentRange) {
        return <AbsoluteFill style={{ backgroundColor: '#000' }} />;
    }

    // Transition progress (0→1) during the last N frames of the current scene
    let transitionProgress = 0;
    if (nextRange && currentRange.transitionFrames > 0) {
        const transStart = currentRange.endFrame - currentRange.transitionFrames;
        if (frame >= transStart) {
            transitionProgress = (frame - transStart) / currentRange.transitionFrames;
        }
    }

    const phoneUrls = { aDataUrl: phoneADataUrl, bDataUrl: phoneBDataUrl };

    return (
        <AbsoluteFill>
            {/* Current scene */}
            <AbsoluteFill>
                <SceneFrame
                    scene={currentRange.scene}
                    phones={phoneUrls}
                    assetDataUrls={assetDataUrls}
                    width={width}
                    height={height}
                />
            </AbsoluteFill>

            {/* Transition overlay */}
            {transitionProgress > 0 && currentRange.scene.timing.transition.type !== 'none' && (
                <AbsoluteFill>
                    {nextRange && (
                        <SceneFrame
                            scene={nextRange.scene}
                            phones={phoneUrls}
                            assetDataUrls={assetDataUrls}
                            width={width}
                            height={height}
                        />
                    )}
                    <TransitionOverlay
                        type={currentRange.scene.timing.transition.type as 'fade' | 'slide'}
                        progress={transitionProgress}
                    />
                </AbsoluteFill>
            )}

            {/* Audio: Background Music */}
            {payload.audioSettings?.enabled && payload.audioAssets?.music && (
                <Audio
                    src={payload.audioAssets.music.startsWith('data:') ? payload.audioAssets.music : `data:audio/mp3;base64,${payload.audioAssets.music}`}
                    volume={(f) => payload.audioSettings.musicVolume ?? 0.5}
                    loop={payload.audioSettings.musicLoop ?? true}
                />
            )}

            {/* Audio: Scene Sound Effects */}
            {payload.audioSettings?.enabled && ranges.map((r, i) => {
                // Determine if this scene should play a sound
                let sfxBase64: string | undefined;

                if (r.scene.type === 'score' && r.scene.auto?.winner) {
                    if (r.scene.auto.winner !== 'TIE') {
                        sfxBase64 = payload.audioAssets?.good;
                    } else {
                        // Tie sound if we had one, else nothing or 'bad'
                    }
                } else if (r.scene.type === 'camera' && r.scene.auto?.winner === 'B') { // example heuristic for an inferior spec
                    // sfxBase64 = payload.audioAssets?.bad;
                }

                if (!sfxBase64) return null;

                // Play the audio exactly when this scene's frame range is active
                // Remotion <Audio> starts playing when it mounts, or you can use `startFrom` / sequence wrapping.
                // The easiest way is to calculate when it should start relative to the whole video.
                // But since <Audio> in Remotion is absolute by default, we just delay its start.
                return (
                    <Audio
                        key={`sfx-${i}`}
                        src={sfxBase64.startsWith('data:') ? sfxBase64 : `data:audio/mp3;base64,${sfxBase64}`}
                        volume={(f) => payload.audioSettings.volume ?? 0.8}
                        startFrom={r.startFrame} // This starts the audio file from frame X (trimming the start off the audio file). We actually want it to wait until frame X to play.
                    />
                )
            })}
        </AbsoluteFill>
    );
};
