import { useState, useRef } from 'react';
import { Project } from '../../types/models';
import { renderSceneToCanvas } from '../renderer/renderSceneToCanvas';
import { ffmpegService } from './FFmpegService';
import { useToast } from '../../components/Toast';

export interface ExportOptions {
    resolution: '480p' | '720p' | '1080p';
    fps: 30 | 60;
    format: 'webm' | 'mp4';
}

export function useVideoExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [statusText, setStatusText] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();

    const exportProject = async (project: Project, options: ExportOptions) => {
        setIsExporting(true);
        setProgress(0);
        setStatusText('Initializing...');
        abortControllerRef.current = new AbortController();

        try {
            // 1. Setup Canvas
            const canvas = document.createElement('canvas');
            let width = 854; // 480p default (854x480)
            let height = 480;

            if (options.resolution === '720p') { width = 1280; height = 720; }
            if (options.resolution === '1080p') { width = 1920; height = 1080; }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // 2. Prepare Stream for WebM (Fastest) via MediaRecorder
            const stream = canvas.captureStream(options.fps);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000 // 5 Mbps
            });

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.start();

            // 3. Render Loop
            // Calculate total duration
            const totalDurationMs = (project.scenes || []).reduce((acc, s) => acc + (s.override?.durationMs || 3000), 0);
            const totalFrames = Math.ceil((totalDurationMs / 1000) * options.fps);
            const msPerFrame = 1000 / options.fps;

            setStatusText('Rendering...');

            let currentSceneIndex = 0;
            let sceneStartTime = 0; // Cumulative time when this scene started

            // Setup FFmpeg
            const ffmpeg = await ffmpegService.getInstance();
            await ffmpeg.writeFile('file_list.txt', ''); // Init

            // Render loop
            for (let i = 0; i < totalFrames; i++) {
                if (abortControllerRef.current?.signal.aborted) break;

                const currentTime = i * msPerFrame;

                // Find current scene
                let timeInScene = currentTime - sceneStartTime;
                let scene = project.scenes?.[currentSceneIndex];

                // Advance scene if needed
                while (scene && timeInScene > (scene.override?.durationMs || 3000)) {
                    sceneStartTime += (scene.override?.durationMs || 3000);
                    timeInScene = currentTime - sceneStartTime;
                    currentSceneIndex++;
                    scene = project.scenes?.[currentSceneIndex];
                }

                if (!scene) break; // End of project

                // Draw
                await renderSceneToCanvas({
                    ctx,
                    width,
                    height,
                    project,
                    scene,
                    timeMs: timeInScene,
                    fps: options.fps
                });

                // Capture Frame for MP4
                if (options.format === 'mp4') {
                    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.8));
                    if (blob) {
                        const buff = await blob.arrayBuffer();
                        const fname = `frame_${i.toString().padStart(6, '0')}.jpg`;
                        await ffmpeg.writeFile(fname, new Uint8Array(buff));
                    }
                }

                // Update Progress
                if (i % 15 === 0) setProgress(Math.round((i / totalFrames) * 90)); // 90% render, 10% encode
            }

            // 4. Mix Audio
            setStatusText('Mixing Audio...');
            let audioBlob: Blob | null = null;

            // Check if project has a main audio track
            if (project.audio?.enabled && project.audio.trackId) {
                const { AudioMixer } = await import('../audio/AudioMixer');
                const mixer = new AudioMixer(totalDurationMs);
                audioBlob = await mixer.mix([{
                    id: 'main',
                    assetId: project.audio.trackId,
                    volume: project.audio.volume ?? 0.5,
                    loop: project.audio.loop ?? true,
                    startOffsetMs: 0
                }]);
            }

            // 5. Finalize
            if (options.format === 'webm') {
                // WebM Export
                mediaRecorder.stop();
                await new Promise(r => mediaRecorder.onstop = r);
                let videoBlob = new Blob(chunks, { type: 'video/webm' });

                if (audioBlob) {
                    setStatusText('Muxing Audio (WebM)...');
                    await ffmpeg.writeFile('video_only.webm', new Uint8Array(await videoBlob.arrayBuffer()));
                    await ffmpeg.writeFile('audio.wav', new Uint8Array(await audioBlob.arrayBuffer()));

                    await ffmpeg.exec([
                        '-i', 'video_only.webm',
                        '-i', 'audio.wav',
                        '-c:v', 'copy',
                        '-c:a', 'libvorbis',
                        'output_muxed.webm'
                    ]);

                    const data = await ffmpeg.readFile('output_muxed.webm');
                    videoBlob = new Blob([data], { type: 'video/webm' });
                }

                downloadBlob(videoBlob, `${project.name}.webm`);
            } else {
                // MP4 Export
                setStatusText('Encoding MP4...');

                // Inputs
                const inputs = ['-framerate', options.fps.toString(), '-i', 'frame_%06d.jpg'];
                if (audioBlob) {
                    await ffmpeg.writeFile('audio.wav', new Uint8Array(await audioBlob.arrayBuffer()));
                    inputs.push('-i', 'audio.wav');
                }

                // Encode command
                const cmd = [
                    ...inputs,
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    // If audio exists, map it
                    ...(audioBlob ? ['-c:a', 'aac', '-shortest'] : []),
                    'output.mp4'
                ];

                await ffmpeg.exec(cmd);

                const data = await ffmpeg.readFile('output.mp4');
                const blob = new Blob([data], { type: 'video/mp4' });
                downloadBlob(blob, `${project.name}.mp4`);

                // Cleanup if needed (skipping for now)
            }

            toast("Export completed successfully!", "success");

        } catch (error) {
            console.error(error);
            toast("Export failed: " + (error as any).message, "error");
        } finally {
            setIsExporting(false);
            setProgress(0);
            setStatusText('');
        }
    };

    const cancelExport = () => {
        abortControllerRef.current?.abort();
        setIsExporting(false);
    };

    return {
        exportProject,
        cancelExport,
        isExporting,
        progress,
        statusText
    };
}

function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
