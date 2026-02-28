/**
 * server.ts
 *
 * MPCS Local Render Server
 * Express HTTP API for Remotion video rendering.
 *
 * Routes:
 *   GET  /health
 *   POST /render         → { renderId: string }
 *   GET  /render/:id/status   → { status, progress, errorMessage? }
 *   GET  /render/:id/download → streams the output file
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { startRenderJob, getJob } from './renderJob';
import type { ProjectExportPayload } from './types';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: '*' })); // Allow requests from Vite dev server
app.use(express.json({ limit: '500mb' })); // Large limit for base64 assets

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mpcs-render-server', version: '1.0.0' });
});

// ─── POST /render ─────────────────────────────────────────────────────────────

app.post('/render', async (req, res) => {
    try {
        const payload = req.body as ProjectExportPayload;

        // Basic validation
        if (!payload?.scenes || !Array.isArray(payload.scenes)) {
            return res.status(400).json({ error: 'Invalid payload: missing scenes array' });
        }
        if (!payload.exportSettings) {
            return res.status(400).json({ error: 'Invalid payload: missing exportSettings' });
        }

        const renderId = uuidv4();
        console.log(`[render-server] New render job: ${renderId} (${payload.project.name})`);
        console.log(`  scenes: ${payload.scenes.length}, fps: ${payload.exportSettings.fps}, res: ${payload.exportSettings.resolution}`);

        // Fire-and-forget
        startRenderJob(renderId, payload);

        return res.status(202).json({ renderId });
    } catch (err: any) {
        console.error('[render-server] POST /render error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// ─── GET /render/:id/status ───────────────────────────────────────────────────

app.get('/render/:id/status', (req, res) => {
    const job = getJob(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage,
    });
});

// ─── GET /render/:id/download ─────────────────────────────────────────────────

app.get('/render/:id/download', (req, res) => {
    const job = getJob(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    if (job.status !== 'done' || !job.outputPath) {
        return res.status(400).json({ error: `Job is not ready (status: ${job.status})` });
    }
    if (!fs.existsSync(job.outputPath)) {
        return res.status(410).json({ error: 'Output file no longer available (may have been cleaned up)' });
    }

    const ext = path.extname(job.outputPath).slice(1);
    const mimeType = ext === 'mp4' ? 'video/mp4' : 'video/webm';
    const filename = `mpcs-export.${ext}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(job.outputPath).pipe(res);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`\n🎬 MPCS Render Server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Press Ctrl+C to stop.\n`);
});
