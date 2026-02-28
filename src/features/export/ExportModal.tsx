/**
 * ExportModal.tsx (Phase 3)
 *
 * Two export paths:
 * 1. Quick Export (WebM) – uses the existing FFmpeg/canvas-based renderer (Phase 2, always available).
 * 2. Remotion Export (MP4) – sends a payload to the local render server (Phase 3, requires server).
 */

import { useState } from 'react';
import { Button } from '../../components/Button';
import type { Project } from '../../types/models';
import { useVideoExport, ExportOptions } from './useVideoExport';
import { Download, X, Server, Film, CheckCircle, AlertCircle, Clock, Loader } from 'lucide-react';
import { getPhase3Enabled, getRenderServerUrl } from '../../store/settingsStore';
import { buildExportPayload } from '../../export/buildExportPayload';
import { useAppStore } from '../../store/appStore';

interface ExportModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
}

// ─── Remotion Export Hook ─────────────────────────────────────────────────────

type RemotionJobStatus = 'idle' | 'building' | 'pending' | 'rendering' | 'done' | 'error';

function useRemotionExport(serverUrl: string) {
    const [status, setStatus] = useState<RemotionJobStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [renderId, setRenderId] = useState<string | null>(null);

    const reset = () => { setStatus('idle'); setProgress(0); setError(null); setRenderId(null); };

    const startExport = async (
        project: Project,
        phones: { a?: { id: string; name: string; image?: { dataUrl: string } }; b?: { id: string; name: string; image?: { dataUrl: string } } },
        options: { fps: 30 | 60; resolution: '720p' | '1080p'; format: 'mp4' | 'webm' }
    ) => {
        setStatus('building');
        setProgress(0);
        setError(null);

        try {
            // 1. Build payload
            const phoneARecord = phones.a ? {
                id: phones.a.id,
                name: phones.a.name,
                specs: [],
                image: phones.a.image,
            } : { id: '', name: '', specs: [] };

            const phoneBRecord = phones.b ? {
                id: phones.b.id,
                name: phones.b.name,
                specs: [],
                image: phones.b.image,
            } : { id: '', name: '', specs: [] };

            const payload = await buildExportPayload(
                project,
                phoneARecord as any,
                phoneBRecord as any,
                options
            );

            setStatus('pending');

            // 2. POST to render server
            const base = serverUrl.replace(/\/$/, '');
            const res = await fetch(`${base}/render`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Server error: ${txt || res.status}`);
            }

            const { renderId: id } = await res.json();
            setRenderId(id);
            setStatus('rendering');

            // 3. Poll status
            let done = false;
            while (!done) {
                await new Promise((r) => setTimeout(r, 2000));
                const statusRes = await fetch(`${base}/render/${id}/status`);
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setProgress(data.progress ?? 0);
                    if (data.status === 'done') {
                        done = true;
                        setStatus('done');
                        setProgress(100);
                        // Trigger download
                        window.open(`${base}/render/${id}/download`, '_blank');
                    } else if (data.status === 'error') {
                        throw new Error(data.errorMessage || 'Render failed');
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Export failed');
            setStatus('error');
        }
    };

    return { status, progress, error, renderId, startExport, reset };
}

// ─── ExportModal ───────────────────────────────────────────────────────────────

export function ExportModal({ project, isOpen, onClose }: ExportModalProps) {
    const { state } = useAppStore();
    const { exportProject, isExporting, progress: quickProgress, statusText } = useVideoExport();
    const phase3Enabled = getPhase3Enabled();
    const serverUrl = getRenderServerUrl();

    const remotion = useRemotionExport(serverUrl);

    const [activeTab, setActiveTab] = useState<'quick' | 'remotion'>(phase3Enabled ? 'remotion' : 'quick');
    const [settings, setSettings] = useState<ExportOptions>({ resolution: '720p', fps: 30, format: 'webm' });
    const [remotionSettings, setRemotionSettings] = useState<{ resolution: '720p' | '1080p'; fps: 30 | 60; format: 'mp4' | 'webm' }>({
        resolution: '720p', fps: 30, format: 'mp4',
    });

    if (!isOpen) return null;

    const isAnyBusy = isExporting || (remotion.status !== 'idle' && remotion.status !== 'done' && remotion.status !== 'error');

    const handleQuickExport = () => exportProject(project, settings);

    const handleRemotionExport = async () => {
        const phoneA = state.phones.find((p) => p.id === project.phoneAId);
        const phoneB = state.phones.find((p) => p.id === project.phoneBId);
        await remotion.startExport(
            project,
            { a: phoneA as any, b: phoneB as any },
            remotionSettings
        );
    };

    // ─── Remotion status badge ────────────────────────────────────────────
    function RemotionStatusBanner() {
        const { status, progress, error } = remotion;
        if (status === 'idle') return null;

        const statusMap: Record<RemotionJobStatus, { icon: React.ReactNode; text: string; color: string }> = {
            idle: { icon: null, text: '', color: '' },
            building: { icon: <Loader className="w-4 h-4 animate-spin" />, text: 'Building export payload…', color: 'text-blue-600' },
            pending: { icon: <Clock className="w-4 h-4" />, text: 'Waiting for render server…', color: 'text-amber-600' },
            rendering: { icon: <Loader className="w-4 h-4 animate-spin" />, text: `Rendering… ${progress}%`, color: 'text-blue-600' },
            done: { icon: <CheckCircle className="w-4 h-4" />, text: 'Done! Download started.', color: 'text-green-600' },
            error: { icon: <AlertCircle className="w-4 h-4" />, text: error || 'Export failed', color: 'text-red-600' },
        };
        const info = statusMap[status];

        return (
            <div className={`flex items-center gap-2 p-3 rounded-lg bg-slate-50 border ${status === 'error' ? 'border-red-200' : status === 'done' ? 'border-green-200' : 'border-blue-100'}`}>
                <span className={info.color}>{info.icon}</span>
                <span className={`text-sm font-medium ${info.color}`}>{info.text}</span>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-slate-600" />
                        <h3 className="font-bold text-slate-800 text-lg">Export Video</h3>
                    </div>
                    {!isAnyBusy && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('quick')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'quick' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Film className="w-4 h-4" />
                        Quick Export (WebM)
                    </button>
                    {phase3Enabled && (
                        <button
                            onClick={() => setActiveTab('remotion')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'remotion' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <Server className="w-4 h-4" />
                            Remotion Export (MP4)
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* ── QUICK EXPORT ─────────────────────────────────── */}
                    {activeTab === 'quick' && (
                        <>
                            {isExporting ? (
                                <div className="flex flex-col items-center py-8 space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {quickProgress}%
                                        </div>
                                    </div>
                                    <p className="text-slate-600 font-medium animate-pulse">{statusText}</p>
                                    <p className="text-xs text-slate-400 text-center max-w-[220px]">
                                        Keep this tab open while rendering.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <p className="text-sm text-slate-500">
                                        Fast browser-based export using canvas + FFmpeg. No server required.
                                    </p>

                                    {/* Resolution */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Resolution</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['480p', '720p', '1080p'] as const).map((r) => (
                                                <button key={r}
                                                    onClick={() => setSettings((s) => ({ ...s, resolution: r }))}
                                                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.resolution === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FPS */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Frame Rate</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([30, 60] as const).map((f) => (
                                                <button key={f}
                                                    onClick={() => setSettings((s) => ({ ...s, fps: f }))}
                                                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.fps === f ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                                                    {f} FPS
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Format */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Format</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[{ id: 'webm', label: 'WebM (Fast)' }, { id: 'mp4', label: 'MP4 (FFmpeg)' }].map((fmt) => (
                                                <button key={fmt.id}
                                                    onClick={() => setSettings((s) => ({ ...s, format: fmt.id as any }))}
                                                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.format === fmt.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                                                    {fmt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── REMOTION EXPORT ───────────────────────────────── */}
                    {activeTab === 'remotion' && phase3Enabled && (
                        <>
                            <RemotionStatusBanner />

                            {remotion.status === 'idle' || remotion.status === 'error' ? (
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                                        <Server className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-violet-800">
                                            <p className="font-semibold mb-0.5">Remotion Render Server</p>
                                            <p className="text-xs text-violet-600">Using: <code>{serverUrl}</code></p>
                                            <p className="text-xs text-violet-600 mt-1">
                                                Start server: <code className="bg-violet-100 px-1 rounded">cd render-server &amp;&amp; npm start</code>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Resolution */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Resolution</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['720p', '1080p'] as const).map((r) => (
                                                <button key={r}
                                                    onClick={() => setRemotionSettings((s) => ({ ...s, resolution: r }))}
                                                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${remotionSettings.resolution === r ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FPS */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Frame Rate</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([30, 60] as const).map((f) => (
                                                <button key={f}
                                                    onClick={() => setRemotionSettings((s) => ({ ...s, fps: f }))}
                                                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${remotionSettings.fps === f ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                                                    {f} FPS
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : remotion.status !== 'done' ? (
                                /* Progress indicator */
                                <div className="flex flex-col items-center py-6 gap-4">
                                    <div className="relative w-16 h-16">
                                        <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-violet-700">
                                            {remotion.progress}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-violet-500 h-2 rounded-full transition-all"
                                            style={{ width: `${remotion.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-800">Export complete!</p>
                                    <p className="text-sm text-slate-500">Your download should have started automatically.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isAnyBusy && remotion.status !== 'done' && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        {activeTab === 'quick' && (
                            <Button onClick={handleQuickExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Export WebM
                            </Button>
                        )}
                        {activeTab === 'remotion' && phase3Enabled && (
                            <Button
                                onClick={handleRemotionExport}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                <Server className="w-4 h-4 mr-2" />
                                Render MP4
                            </Button>
                        )}
                    </div>
                )}
                {(remotion.status === 'done' || remotion.status === 'error') && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => { remotion.reset(); }}>
                            {remotion.status === 'done' ? 'Close' : 'Try Again'}
                        </Button>
                        {remotion.status === 'done' && (
                            <Button onClick={onClose}>Done</Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
