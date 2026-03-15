import type { AspectRatio } from './aspectRatio';
import type { AnimationSettings } from '../preview/animations';

export interface PhoneSpec {
    id: string;
    key: string;
    label: string;
    value: string;
}

export interface Phone {
    id: string;
    name: string;
    brand?: string;
    specs: PhoneSpec[];
    image?: { name: string; dataUrl: string }; // store as base64 data URL
}

export interface Rule {
    id: string;
    specKey: string;
    ruleType: 'higher_wins' | 'lower_wins' | 'manual' | 'alphanumeric' | 'ranking';
    options?: {
        // for alphanumeric rules:
        alphaMode?: 'high_number_wins' | 'low_number_wins'; // default high_number_wins
        // for ranking rules:
        rankingList?: string[]; // ordered from lowest -> highest
        rankingDirection?: 'ascending' | 'descending'; // default ascending
    };
    notes?: string;
    updatedAt: string; // ISO string
}

export interface TemplateSections {
    intro: string;
    subintro: string;
    body: string;
    camera: string;
    score: string;
}

export interface TemplatePage {
    id: string;
    baseType: 'intro' | 'subintro' | 'body' | 'camera' | 'score';
    label: string;
    duplicateGroupId: string;
    duplicateIndex: number;
    dataBind: {
        mode: 'none' | 'rowIndex';
        rowIndex?: number;
    };
    layout: SceneLayout;
    timing: SceneTiming;
}

export interface Template {
    id: string;
    name: string;
    aspectRatio?: AspectRatio;
    useAspectRatioOverride?: boolean;
    placeholders: string[];
    sections: TemplateSections; // Legacy compat
    pages?: TemplatePage[]; // Phase 3
    updatedAt: string; // ISO string
}

// Scene Editor Types
export type SceneType = "intro" | "subintro" | "body" | "camera" | "score";
export type SceneElementType = 'text' | 'image' | 'box' | 'icon';

// IMPORTANT: x, y, width, height are all stored as PERCENTAGES (0–100)
// relative to the stage dimensions. This makes layouts resolution-independent.
export interface SceneElementCommon {
    id: string;
    type: SceneElementType;
    name: string;
    x: number;      // 0–100 % of stage width
    y: number;      // 0–100 % of stage height
    width: number;  // 0–100 % of stage width
    height: number; // 0–100 % of stage height
    rotation?: number; // degrees
    opacity?: number;  // 0–1
    zIndex: number;
    locked?: boolean;
    hidden?: boolean;
}

export interface SceneTextElement extends SceneElementCommon {
    type: 'text';
    content: string; // literal text or placeholder like "{{phoneA.name}}"
    fontSize: number; // relative units (will be scaled at render time)
    fontFamily?: string;
    fontWeight?: string | number;
    fontStyle?: string;
    textAlign?: 'left' | 'center' | 'right';
    color: string;
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
}

export interface SceneImageElement extends SceneElementCommon {
    type: 'image';
    sourceType: 'phoneA' | 'phoneB' | 'custom';
    customImageId?: string; // key for IDB
    fit: 'contain' | 'cover' | 'fill';
    // Crop as zoom+pan (simpler to control than bbox)
    crop?: {
        zoom: number;  // 1.0 = no zoom, 2.0 = 2x zoom
        panX: number;  // -1 to 1 (left to right)
        panY: number;  // -1 to 1 (top to bottom)
    };
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

// Per-scene timing configuration (stored in SceneOverride)
export interface SceneTiming {
    durationMs: number;
    transition: {
        type: 'none' | 'fade' | 'slide';
        durationMs: number;
    };
}

// Export payload sent to the Remotion render server
export interface ExportAsset {
    mimeType: string;
    base64: string;
}

export interface ExportPhoneData {
    id: string;
    name: string;
    imageBase64?: string; // base64 encoded image
    imageMimeType?: string;
}

export interface ProjectExportPayload {
    project: {
        id: string;
        name: string;
    };
    scenes: Array<{
        id: string;
        type: SceneType;
        label: string;
        auto: SceneAutoData;
        override?: SceneOverride;
        timing?: SceneTiming;
    }>;
    phones: {
        a: ExportPhoneData;
        b: ExportPhoneData;
    };
    assets: Record<string, ExportAsset>; // keyed by assetKey (customImageId, trackId, etc.)
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

export interface KenBurnsEffect {
    enabled: boolean;
    start: { scale: number; x: number; y: number };
    end: { scale: number; x: number; y: number };
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface SceneLayout {
    elements: SceneElement[];
    backgroundColor?: string;
    backgroundImageId?: string; // key for IDB
}

// ... existing types ...

export interface SceneOverride {
    enabled?: boolean;              // allow disabling a scene from playback
    durationMs?: number;            // per-scene timing override
    transition?: { type: "none" | "fade" | "slide"; durationMs?: number }; // optional per-scene override
    text?: Record<string, string>;  // key-value overrides for text placeholders
    media?: {
        phoneAImageSrc?: string | null;  // override image (defaults to phoneA image)
        phoneBImageSrc?: string | null;
        bgMusicEnabled?: boolean;        // per-scene music enable/disable (future)
        sfxEnabled?: boolean;            // per-scene sfx enable/disable (future)
    };
    winnerOverride?: "A" | "B" | "TIE" | null; // for body scenes (spec winner)

    // Phase 3: Visual Editor
    layout?: SceneLayout;
    timing?: SceneTiming; // Phase 3 template building integration
    motion?: {
        type: "none" | "kenburns";
        kenburns?: KenBurnsEffect;
    };
}

export interface SceneAutoData {
    placeholders?: Record<string, string>;
    specKey?: string;
    specLabel?: string;
    specA?: string;
    specB?: string;
    winner?: "A" | "B" | "TIE" | null;
    scoreA?: number;
    scoreB?: number;
    description?: string; // Fallback text context
}

export interface Scene {
    id: string;
    type: SceneType;
    label: string;
    auto: SceneAutoData;
    override?: SceneOverride;
    timing?: SceneTiming; // Optional global timing (Phase 3 mostly relies on this)
    templatePageId?: string; // Phase 3
}

export interface ProjectScene extends Scene {
    // ProjectScene is now fully compatible with Scene, but we keep the name for compatibility if needed
}

export interface PreviewSettings {
    animation: AnimationSettings;
    audioEnabled: boolean;
    audioVolume: number;
    musicEnabled?: boolean;
    musicVolume?: number;
    musicLoop?: boolean;
}

// Phase 3: Project Settings
export interface ProjectAudioSettings {
    enabled: boolean;
    volume: number;
    trackId?: string; // key for IDB
    loop?: boolean;
}

export interface ProjectExportSettings {
    resolution: '720p' | '1080p';
    fps: 30 | 60;
    format: 'webm' | 'mp4';
}

export interface Project {
    id: string;
    name: string;
    templateId: string;
    phoneAId: string;
    phoneBId: string;
    aspectRatioOverride?: AspectRatio;
    previewSettings?: PreviewSettings;
    scenes?: ProjectScene[]; // For scene inspector overrides
    totals?: {
        scoreA: number;
        scoreB: number;
        overallWinner: 'A' | 'B' | 'TIE';
    };

    // Phase 3: New Settings
    audio?: ProjectAudioSettings;
    export?: ProjectExportSettings;

    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}
