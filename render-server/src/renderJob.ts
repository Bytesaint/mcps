/**
 * renderJob.ts
 *
 * Manages the in-memory job state and drives the Remotion render pipeline.
 * On each render: bundle → renderMedia → write output → update job state.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { RenderJob, ProjectExportPayload } from './types';

// In-memory job store (no DB needed; files have short lifetime)
const jobs = new Map<string, RenderJob>();

const RENDERS_DIR = path.join(os.tmpdir(), 'mpcs-renders');

// Ensure output directory exists
if (!fs.existsSync(RENDERS_DIR)) {
    fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

// Bundle cache — we only bundle once per server run
let bundleCache: string | null = null;

async function getBundledRoot(): Promise<string> {
    if (bundleCache) return bundleCache;
    console.log('[render-server] Bundling Remotion project (first time, may take ~30s)...');
    const bundled = await bundle({
        entryPoint: path.join(__dirname, '../compositions/index.tsx'),
        // Use webpack without CSS overrides — standard Remotion setup
    });
    bundleCache = bundled;
    console.log('[render-server] Bundle ready at:', bundled);
    return bundled;
}

export function getJob(id: string): RenderJob | undefined {
    return jobs.get(id);
}

export function getAllJobs(): RenderJob[] {
    return Array.from(jobs.values());
}

export async function startRenderJob(
    id: string,
    payload: ProjectExportPayload
): Promise<void> {
    const job: RenderJob = {
        id,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
    };
    jobs.set(id, job);

    // Run asynchronously
    runRender(job, payload).catch((err) => {
        console.error(`[render-server] Job ${id} failed:`, err);
        job.status = 'error';
        job.errorMessage = err?.message || String(err);
    });
}

async function runRender(job: RenderJob, payload: ProjectExportPayload): Promise<void> {
    const { exportSettings } = payload;
    const outputFile = path.join(RENDERS_DIR, `${job.id}.${exportSettings.format}`);

    try {
        // 1. Bundle
        job.status = 'rendering';
        job.progress = 5;
        const bundledRoot = await getBundledRoot();

        // 2. Calculate total duration in frames
        const totalMs = payload.scenes.reduce((sum, s) => sum + s.timing.durationMs, 0);
        const totalFrames = Math.ceil((totalMs / 1000) * exportSettings.fps);

        // 3. Select the composition
        const { fps, width, height } = exportSettings;
        const composition = await selectComposition({
            serveUrl: bundledRoot,
            id: 'MpcsVideo',
            inputProps: { payload },
        });

        // Override duration/fps/size with export payload values
        const compositionWithOverrides = {
            ...composition,
            durationInFrames: Math.max(1, totalFrames),
            fps,
            width,
            height,
        };

        // 4. Render
        job.progress = 10;
        await renderMedia({
            composition: compositionWithOverrides,
            serveUrl: bundledRoot,
            codec: exportSettings.format === 'mp4' ? 'h264' : 'vp8',
            outputLocation: outputFile,
            inputProps: { payload },
            onProgress: ({ progress }) => {
                job.progress = Math.round(10 + progress * 88); // 10→98%
            },
        });

        // 5. Done
        job.outputPath = outputFile;
        job.status = 'done';
        job.progress = 100;
        console.log(`[render-server] Job ${job.id} done: ${outputFile}`);

        // 6. Cleanup job after 10 minutes
        setTimeout(() => {
            jobs.delete(job.id);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        }, 10 * 60 * 1000);

    } catch (err: any) {
        job.status = 'error';
        job.errorMessage = err?.message || 'Unknown error';
        throw err;
    }
}
