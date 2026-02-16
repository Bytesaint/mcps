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

export interface Template {
    id: string;
    name: string;
    aspectRatio?: AspectRatio;
    useAspectRatioOverride?: boolean;
    placeholders: string[];
    sections: TemplateSections;
    updatedAt: string; // ISO string
}

// Scene Editor Types
export type SceneType = "intro" | "subintro" | "body" | "camera" | "score";
export type SceneElementType = 'text' | 'image' | 'box' | 'icon';

export interface SceneElementCommon {
    id: string;
    type: SceneElementType;
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
    content: string; // can be a placeholder string like "{{phoneA.name}}"
    fontSize: number;
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
    crop?: {
        x: number;
        y: number;
        width: number;
        height: number;
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
