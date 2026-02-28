/**
 * types.ts
 * Shared types between the render server and compositions.
 * Matches the ProjectExportPayload type from the frontend src/types/models.ts.
 */

export interface ExportAsset {
    mimeType: string;
    base64: string;
}

export interface ExportPhoneData {
    id: string;
    name: string;
    imageBase64?: string;
    imageMimeType?: string;
}

export type SceneType = 'intro' | 'subintro' | 'body' | 'camera' | 'score';

export interface SceneAutoData {
    placeholders?: Record<string, string>;
    specKey?: string;
    specLabel?: string;
    specA?: string;
    specB?: string;
    winner?: 'A' | 'B' | 'TIE' | null;
    scoreA?: number;
    scoreB?: number;
    description?: string;
}

export interface SceneElementCommon {
    id: string;
    type: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    zIndex: number;
    locked?: boolean;
    hidden?: boolean;
}

export interface SceneTextElement extends SceneElementCommon {
    type: 'text';
    content: string;
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string | number;
    color: string;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
}

export interface SceneImageElement extends SceneElementCommon {
    type: 'image';
    sourceType: 'phoneA' | 'phoneB' | 'custom';
    customImageId?: string;
    fit: 'contain' | 'cover' | 'fill';
    crop?: { zoom: number; panX: number; panY: number };
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
}

export interface SceneBoxElement extends SceneElementCommon {
    type: 'box';
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
}

export type SceneElement = SceneTextElement | SceneImageElement | SceneBoxElement;

export interface SceneLayout {
    elements: SceneElement[];
    backgroundColor?: string;
    backgroundImageId?: string;
}

export interface SceneOverride {
    enabled?: boolean;
    durationMs?: number;
    transition?: { type: 'none' | 'fade' | 'slide'; durationMs?: number };
    text?: Record<string, string>;
    layout?: SceneLayout;
}

export interface SceneTiming {
    durationMs: number;
    transition: { type: 'none' | 'fade' | 'slide'; durationMs: number };
}

export interface ExportScene {
    id: string;
    type: SceneType;
    label: string;
    auto: SceneAutoData;
    override?: SceneOverride;
    timing: SceneTiming;
}

export interface ProjectExportPayload {
    project: { id: string; name: string };
    scenes: ExportScene[];
    phones: { a: ExportPhoneData; b: ExportPhoneData };
    assets: Record<string, ExportAsset>;
    audioAssets: {
        good?: string; // base64
        bad?: string;  // base64
        music?: string; // base64
    };
    audioSettings: {
        enabled: boolean;
        volume: number;
        musicVolume: number;
        musicLoop: boolean;
    };
    exportSettings: {
        fps: 30 | 60;
        resolution: '720p' | '1080p';
        format: 'mp4' | 'webm';
        width: number;
        height: number;
    };
}

export interface RenderJob {
    id: string;
    status: 'pending' | 'rendering' | 'done' | 'error';
    progress: number;
    errorMessage?: string;
    outputPath?: string;
    createdAt: Date;
}
