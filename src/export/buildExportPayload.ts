/**
 * buildExportPayload.ts
 *
 * Collects all data required by the Remotion render server into a self-contained
 * ProjectExportPayload object. All binary assets are converted to base64 strings
 * so the payload can be sent as JSON.
 */

import { getAsset } from '../storage/idb';
import type {
    Project,
    Phone,
    ProjectExportPayload,
    ExportAsset,
    ExportPhoneData,
    SceneImageElement,
} from '../types/models';
import { getAudioAssets, getAudioSettings } from '../audio/audioStore';

export interface ExportBuildOptions {
    fps: 30 | 60;
    resolution: '720p' | '1080p';
    format: 'mp4' | 'webm';
}

function resolutionToDimensions(res: '720p' | '1080p'): { width: number; height: number } {
    // Defaults to 9:16 (portrait / Shorts format)
    if (res === '1080p') return { width: 1080, height: 1920 };
    return { width: 720, height: 1280 };
}

/** Convert a Blob to a base64 data string (without the data URL prefix) */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the "data:<mime>;base64," prefix
            const base64 = result.split(',')[1] ?? result;
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
    });
}

/** Convert a data URL string (from phone.image.dataUrl) to base64 + mimeType */
function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
        return { mimeType: match[1], base64: match[2] };
    }
    // Plain base64 fallback
    return { mimeType: 'image/jpeg', base64: dataUrl };
}

/** Collect all IDB asset keys referenced in the project scenes */
function collectAssetKeys(project: Project): Set<string> {
    const keys = new Set<string>();

    for (const scene of project.scenes ?? []) {
        const elements = scene.override?.layout?.elements ?? [];
        for (const el of elements) {
            if (el.type === 'image') {
                const imgEl = el as SceneImageElement;
                if (imgEl.sourceType === 'custom' && imgEl.customImageId) {
                    keys.add(imgEl.customImageId);
                }
            }
        }
        // Background image
        if (scene.override?.layout?.backgroundImageId) {
            keys.add(scene.override.layout.backgroundImageId);
        }
    }

    // Audio track
    if (project.audio?.trackId) {
        keys.add(project.audio.trackId);
    }

    return keys;
}

/** Build an ExportPhoneData from a Phone record */
async function buildPhoneData(phone: Phone): Promise<ExportPhoneData> {
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (phone.image?.dataUrl) {
        const parsed = dataUrlToBase64(phone.image.dataUrl);
        imageBase64 = parsed.base64;
        imageMimeType = parsed.mimeType;
    }

    return {
        id: phone.id,
        name: phone.name,
        imageBase64,
        imageMimeType,
    };
}

/**
 * Build the full self-contained export payload.
 *
 * @param project The project to export
 * @param phoneA  Phone A record
 * @param phoneB  Phone B record
 * @param options Export settings (fps, resolution, format)
 * @returns A JSON-serializable ProjectExportPayload
 */
export async function buildExportPayload(
    project: Project,
    phoneA: Phone,
    phoneB: Phone,
    options: ExportBuildOptions
): Promise<ProjectExportPayload> {
    const dims = resolutionToDimensions(options.resolution);

    // 1. Collect IDB asset keys
    const assetKeys = collectAssetKeys(project);

    // 2. Load all assets from IDB and convert to base64
    const assets: Record<string, ExportAsset> = {};
    for (const key of assetKeys) {
        const blob = await getAsset(key);
        if (blob) {
            const base64 = await blobToBase64(blob);
            assets[key] = {
                mimeType: blob.type || 'application/octet-stream',
                base64,
            };
        }
    }

    // 3. Build phone data (images are stored as dataUrl in the Phone object)
    const phones = {
        a: await buildPhoneData(phoneA),
        b: await buildPhoneData(phoneB),
    };

    // 4. Build audio data
    const audioAssetsRaw = getAudioAssets();
    const audioSettingsRaw = getAudioSettings();

    const audioAssets: ProjectExportPayload['audioAssets'] = {
        good: audioAssetsRaw.good?.dataUrl ? dataUrlToBase64(audioAssetsRaw.good.dataUrl).base64 : undefined,
        bad: audioAssetsRaw.bad?.dataUrl ? dataUrlToBase64(audioAssetsRaw.bad.dataUrl).base64 : undefined,
        music: audioAssetsRaw.music?.dataUrl ? dataUrlToBase64(audioAssetsRaw.music.dataUrl).base64 : undefined,
    };

    const audioSettings: ProjectExportPayload['audioSettings'] = {
        enabled: audioSettingsRaw.enabled,
        volume: audioSettingsRaw.volume,
        musicVolume: audioSettingsRaw.musicVolume,
        musicLoop: audioSettingsRaw.musicLoop,
    };

    // 5. Build scene list
    const scenes: ProjectExportPayload['scenes'] = (project.scenes ?? []).map((scene) => ({
        id: scene.id,
        type: scene.type,
        label: scene.label,
        auto: scene.auto,
        override: scene.override,
        timing: scene.override?.durationMs != null
            ? {
                durationMs: scene.override.durationMs,
                transition: {
                    type: scene.override.transition?.type ?? 'none',
                    durationMs: scene.override.transition?.durationMs ?? 500,
                },
            }
            : {
                durationMs: 3000,
                transition: { type: 'none', durationMs: 500 },
            },
    }));

    return {
        project: { id: project.id, name: project.name },
        scenes,
        phones,
        assets,
        audioAssets,
        audioSettings,
        exportSettings: {
            fps: options.fps,
            resolution: options.resolution,
            format: options.format,
            width: dims.width,
            height: dims.height,
        },
    };
}
