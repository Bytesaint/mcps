import { useState } from 'react';
import { Button } from '../../components/Button';
import { Project } from '../../types/models';
import { useVideoExport, ExportOptions } from './useVideoExport';
import { Download, X } from 'lucide-react';

interface ExportModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
}

export function ExportModal({ project, isOpen, onClose }: ExportModalProps) {
    const { exportProject, isExporting, progress, statusText } = useVideoExport();
    const [settings, setSettings] = useState<ExportOptions>({
        resolution: '480p',
        fps: 30,
        format: 'webm'
    });

    if (!isOpen) return null;

    const handleExport = () => {
        exportProject(project, settings);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Export Video</h3>
                    {!isExporting && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {isExporting ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {progress}%
                                </div>
                            </div>
                            <p className="text-slate-600 font-medium animate-pulse">{statusText}</p>
                            <p className="text-xs text-slate-400 text-center max-w-[200px]">
                                Please keep this tab open while rendering.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Resolution */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Resolution</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['480p', '720p', '1080p'].map((res) => (
                                        <button
                                            key={res}
                                            onClick={() => setSettings(s => ({ ...s, resolution: res as any }))}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.resolution === res
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* FPS */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Frame Rate</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[30, 60].map((fps) => (
                                        <button
                                            key={fps}
                                            onClick={() => setSettings(s => ({ ...s, fps: fps as any }))}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.fps === fps
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            {fps} FPS
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Format */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Format</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'webm', label: 'WebM (Fast)' },
                                        { id: 'mp4', label: 'MP4 (Compatible)' }
                                    ].map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            onClick={() => setSettings(s => ({ ...s, format: fmt.id as any }))}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${settings.format === fmt.id
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>
                                {settings.format === 'mp4' && (
                                    <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded">
                                        Note: MP4 export uses FFmpeg in the browser and may be slow for long videos.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isExporting && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleExport} className="w-32">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
