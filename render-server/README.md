# MPCS Render Server

A local Node.js server that uses Remotion to render real MP4 video exports for MPCS comparison projects.

---

## Prerequisites

- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **ffmpeg** accessible on `PATH`  
  - **Windows**: Download from [ffmpeg.org/download.html](https://ffmpeg.org/download.html), extract, and add the `bin/` folder to your system PATH.  
  - **macOS**: `brew install ffmpeg`  
  - **Linux**: `sudo apt install ffmpeg`

---

## Setup

```bash
# From the repo root
cd render-server
npm install
```

---

## Running the server

```bash
# Development (auto restarts on file change)
npm run dev

# Production
npm start
```

The server starts on **http://localhost:3001** by default.  
Set the `PORT` environment variable to change the port:

```bash
PORT=4000 npm start
```

---

## Configuring the MPCS frontend

1. Open the MPCS app → **Settings** → **Phase 3** section.
2. Toggle **"Enable Visual Editor & Remotion Export"** ON.
3. Set **Render Server URL** to `http://localhost:3001`.
4. Click **Test** to verify the connection (shows ✓ if server is running).

---

## API Reference

### `GET /health`
Returns `{ ok: true }` — used for connection testing.

### `POST /render`
Start a render job.

**Body**: `ProjectExportPayload` (JSON, sent by the frontend automatically).  
**Response**: `{ renderId: "uuid-..."}` (HTTP 202)

### `GET /render/:id/status`
Poll the job status.

**Response**:
```json
{
  "status": "pending" | "rendering" | "done" | "error",
  "progress": 0-100,
  "errorMessage": "..." 
}
```

### `GET /render/:id/download`
Downloads the rendered video file (only when `status === "done"`).

---

## Architecture

```
render-server/
├── compositions/
│   ├── index.tsx          # Remotion Root (registered compositions)
│   └── MpcsVideo.tsx      # Main video composition
├── src/
│   ├── server.ts          # Express HTTP server
│   ├── renderJob.ts       # Job manager + Remotion render pipeline
│   └── types.ts           # Shared types (mirrors frontend models)
├── package.json
└── tsconfig.json
```

**Render flow:**
1. Frontend calls `POST /render` with the full project payload (images as base64).
2. Server creates a job, starts async render.
3. Remotion bundles the composition (cached after first run — ~30s on first call).
4. `renderMedia()` renders all frames and encodes to MP4/WebM.
5. Frontend polls `GET /render/:id/status` every 2 seconds.
6. On `done`, frontend opens `GET /render/:id/download` to download the file.
7. Output file is automatically deleted after 10 minutes.

---

## Export Limitations

- **First render is slow** (~30s for Remotion bundle compilation). Subsequent renders are faster.
- **Performance**: Rendering 30fps at 1080p can take 2–10× real time depending on scene complexity and machine specs.
- **Memory**: Large projects with many HD images may use 1–2GB RAM during render. Close other apps if you experience crashes.
- **Windows path length**: If you encounter `ENAMETOOLONG` errors, place the project in a short path like `C:\mpcs\`.
- **FFmpeg codec**: MP4 uses H.264 (`h264` codec). Requires a full FFmpeg build with libx264.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ffmpeg not found` | Add ffmpeg to PATH; restart terminal. |
| Connection refused | Make sure `npm start` is running; check PORT matches frontend setting. |
| First render hangs at 5% | Remotion is bundling — wait up to 60s on first run. |
| Black video / no images | Assets failed to load; check browser console when building export payload. |
| `ts-node: command not found` | Run `npm install` inside `render-server/` again. |
