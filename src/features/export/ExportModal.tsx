/**
 * ExportModal.tsx (Phase 3)
 *
 * Browser-only video export using Canvas captureStream and MediaRecorder.
 */

import { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import type { Project, ProjectScene } from '../../types/models';
import { useVideoExport, ExportOptions } from './useVideoExport';
import { Download, X, Film } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { ACTIONS } from '../../actionMap';
import { generateScenes } from '../../engine/projectLogic';

interface ExportModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
}

export function ExportModal({ project, isOpen, onClose }: ExportModalProps) {
    const { state } = useAppStore();
    const { exportProject, cancelExport, isExporting, progress, statusText } = useVideoExport();

    const [settings, setSettings] = useState<ExportOptions>({
        resolution: '720p',
        fps: 30,
        includeAudio: false
    });

    const [scenes, setScenes] = useState<ProjectScene[]>(project.scenes || []);

    useEffect(() => {
        if (isOpen && (!project.scenes || project.scenes.length === 0)) {
            const template = state.templates.find(t => t.id === project.templateId);
            const phoneA = state.phones.find(p => p.id === project.phoneAId);
            const phoneB = state.phones.find(p => p.id === project.phoneBId);
            if (template && phoneA && phoneB) {
                setScenes(generateScenes(template, phoneA, phoneB, state.rules));
            }
        } else if (isOpen && project.scenes) {
            setScenes(project.scenes);
        }
    }, [isOpen, project, state]);

    if (!isOpen) return null;

    const handleExport = () => {
        exportProject(project, scenes, settings);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" data-action={ACTIONS.MPCS_EXPORT_OPEN}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-slate-600" />
                        <h3 className="font-bold text-slate-800 text-lg">Export Video</h3>
                    </div>
                    {!isExporting && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {isExporting ? (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {progress}%
                                </div>
                            </div>
                            <p className="text-slate-600 font-medium animate-pulse">{statusText}</p>
                            <p className="text-xs text-slate-400 text-center max-w-[220px]">
                                Keep this tab open while rendering.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                                <Film className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    <strong>Browser Export (WebM)</strong><br />
                                    Fast, on-device rendering without the need for a server.
                                </p>
                            </div>

                            {/* Resolution */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Resolution</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['720p', '1080p'] as const).map((r) => (
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
                                    {([24, 30] as const).map((f) => (
                                        <button key={f}
                                            onClick={() => setSettings((s) => ({ ...s, fps: f }))}
                                            className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.fps === f ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                                            {f} FPS
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Audio */}
                            <div className="space-y-2 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={settings.includeAudio}
                                        onChange={(e) => setSettings(s => ({ ...s, includeAudio: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                        Include audio (experimental)
                                    </span>
                                </label>
                                <p className="text-xs text-slate-500 ml-6">
                                    Injects background music into the WebM stream. May not be supported on all browsers.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    {isExporting ? (
                        <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={cancelExport} data-action={ACTIONS.MPCS_EXPORT_CANCEL}>
                            Cancel Render
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onClose}>Close</Button>
                            <Button onClick={handleExport} data-action={ACTIONS.MPCS_EXPORT_START}>
                                <Download className="w-4 h-4 mr-2" />
                                Export WebM
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
