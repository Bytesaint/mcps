/**
 * browserExport.ts
 *
 * Implements a browser-only video export pipeline for MPCS using Canvas captureStream
 * and MediaRecorder. Removes the need for a local node render server.
 */

import { Project, ProjectScene } from '../types/models';
import { AspectRatioPreset } from '../types/aspectRatio';
import { renderSceneToCanvas } from '../features/renderer/renderSceneToCanvas';

export interface BrowserExportOptions {
    project: Project;
    scenes: ProjectScene[];
    fps?: number; // default 30
    resolution?: '720p' | '1080p'; // default 720p
    aspectRatio?: AspectRatioPreset;
    includeAudio?: boolean;
    /** Data URL (e.g. from FileReader) for the background music to bake into the export */
    musicDataUrl?: string;
    onProgress?: (info: { currentTime: number; totalDurationMs: number; percent: number }) => void;
    signal?: AbortSignal;
}

function getExportDimensions(resolution: '720p' | '1080p', aspectRatio: AspectRatioPreset = '16:9') {
    const baseHeight = resolution === '1080p' ? 1080 : 720;

    switch (aspectRatio) {
        case '16:9':
            return { width: Math.round(baseHeight * (16 / 9)), height: baseHeight };
        case '9:16':
            return { width: Math.round(baseHeight * (9 / 16)), height: baseHeight };
        case '1:1':
            return { width: baseHeight, height: baseHeight };
        case '4:5':
            return { width: Math.round(baseHeight * (4 / 5)), height: baseHeight };
        case '3:4':
            return { width: Math.round(baseHeight * (3 / 4)), height: baseHeight };
        case 'custom':
            // Fallback to 16:9 if custom isn't fully defined via overrides
            return { width: Math.round(baseHeight * (16 / 9)), height: baseHeight };
        default:
            return { width: 1280, height: 720 };
    }
}

export async function exportProjectWebM(options: BrowserExportOptions): Promise<{ blob: Blob; mimeType: string }> {
    const {
        project,
        scenes,
        fps = 30,
        resolution = '720p',
        aspectRatio = '16:9',
        includeAudio = false,
        musicDataUrl,
        onProgress,
        signal
    } = options;

    // 1. Setup Canvas
    const canvas = document.createElement('canvas');
    const dims = getExportDimensions(resolution, aspectRatio);
    canvas.width = dims.width;
    canvas.height = dims.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Calculate total duration
    const totalDurationMs = scenes.reduce((acc, s) => acc + (s.override?.durationMs || 3000), 0);
    const totalFrames = Math.ceil((totalDurationMs / 1000) * fps);
    const msPerFrame = 1000 / fps;

    // 2. Setup Audio (if included)
    let audioCtx: AudioContext | null = null;
    let destNode: MediaStreamAudioDestinationNode | null = null;

    // Resolve the audio source: prefer explicit musicDataUrl, then fall back to IDB assetId on project
    const audioSource: { dataUrl?: string; assetId?: string; volume: number; loop: boolean } | null =
        includeAudio && musicDataUrl
            ? { dataUrl: musicDataUrl, volume: 0.8, loop: true }
            : includeAudio && project.audio?.enabled && project.audio.trackId
                ? { assetId: project.audio.trackId, volume: project.audio.volume ?? 0.5, loop: project.audio.loop ?? true }
                : null;

    if (audioSource) {
        try {
            const { AudioMixer } = await import('../features/audio/AudioMixer').catch(() => ({ AudioMixer: null }));
            if (AudioMixer) {
                const mixer = new AudioMixer(totalDurationMs);
                const audioMixedBlob = await mixer.mix([{
                    id: 'main',
                    assetId: audioSource.assetId,
                    url: audioSource.dataUrl,
                    volume: audioSource.volume,
                    loop: audioSource.loop,
                    startOffsetMs: 0
                }]);

                // Create audio context and destination node to embed into our capture stream
                if (audioMixedBlob) {
                    audioCtx = new AudioContext();
                    destNode = audioCtx.createMediaStreamDestination();

                    const arrayBuffer = await audioMixedBlob.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const source = audioCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(destNode);
                    source.start(0);
                }
            }
        } catch (audioErr) {
            console.warn('Audio mixing failed, exporting without audio:', audioErr);
        }
    }

    // 3. Prepare Stream via Canvas Capture Stream
    const stream = canvas.captureStream(fps);

    // Merge audio if we created a destination node
    if (destNode) {
        destNode.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
        });
    }

    // Determine supported mimeType with VP9 bias
    const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
    ];
    let selectedMimeType = 'video/webm';
    for (const mt of mimeTypes) {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(mt)) {
            selectedMimeType = mt;
            break;
        }
    }

    const bps = resolution === '1080p' ? 8000000 : 5000000; // 8 mbps or 5 mbps
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: bps,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    const recordingPromise = new Promise<{ blob: Blob; mimeType: string }>((resolve, reject) => {
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: selectedMimeType });
            if (audioCtx) {
                audioCtx.close().catch(console.error);
            }
            resolve({ blob, mimeType: selectedMimeType });
        };
        mediaRecorder.onerror = (e) => {
            if (audioCtx) {
                audioCtx.close().catch(console.error);
            }
            reject(e);
        };
    });

    mediaRecorder.start();

    // 4. Render Loop
    let currentSceneIndex = 0;
    let sceneStartTime = 0;

    for (let i = 0; i < totalFrames; i++) {
        if (signal?.aborted) {
            mediaRecorder.stop();
            throw new Error('Export cancelled');
        }

        const currentTime = i * msPerFrame;
        let timeInScene = currentTime - sceneStartTime;
        let scene = scenes[currentSceneIndex];

        // Advance scene if needed
        while (scene && timeInScene >= (scene.override?.durationMs || 3000)) {
            sceneStartTime += (scene.override?.durationMs || 3000);
            timeInScene = currentTime - sceneStartTime;
            currentSceneIndex++;
            scene = scenes[currentSceneIndex];
        }

        if (!scene) break;

        await renderSceneToCanvas({
            ctx,
            width: dims.width,
            height: dims.height,
            project,
            scene,
            timeMs: timeInScene,
            fps
        });

        // Notify progress
        if (i % 5 === 0 && onProgress) {
            onProgress({
                currentTime,
                totalDurationMs,
                percent: Math.min(100, Math.round((currentTime / totalDurationMs) * 100))
            });
        }

        // Yield occasionally so UI remains responsive
        if (i % 5 === 0) {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    // Stop recorder to finalize chunks
    mediaRecorder.stop();

    return recordingPromise;
}
