import { useState, useRef } from 'react';
import { Project, ProjectScene } from '../../types/models';
import { useToast } from '../../components/Toast';
import { exportProjectWebM } from '../../export/browserExport';

export interface ExportOptions {
    resolution: '720p' | '1080p';
    fps: 24 | 30 | 60;
    includeAudio: boolean;
    /** Data URL of the background music track to bake into the export */
    musicDataUrl?: string;
}

export function useVideoExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [statusText, setStatusText] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();

    const exportProject = async (project: Project, scenes: ProjectScene[], options: ExportOptions) => {
        setIsExporting(true);
        setProgress(0);
        setStatusText('Initializing...');
        abortControllerRef.current = new AbortController();

        try {
            setStatusText('Rendering Frames...');
            const { blob } = await exportProjectWebM({
                project,
                scenes,
                fps: options.fps,
                resolution: options.resolution,
                aspectRatio: project.aspectRatioOverride?.preset || '16:9',
                includeAudio: options.includeAudio,
                musicDataUrl: options.musicDataUrl,
                onProgress: ({ percent }) => {
                    setProgress(percent);
                    if (percent === 100) setStatusText('Finalizing Video...');
                },
                signal: abortControllerRef.current.signal
            });

            // Date formatting: YYYYMMDD
            const d = new Date();
            const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
            const fileName = `MPCS_${project.name.replace(/\s+/g, '_')}_${dateStr}.webm`;

            downloadBlob(blob, fileName);
            toast("Export completed successfully!", "success");

        } catch (error: any) {
            console.error(error);
            if (error.message === 'Export cancelled') {
                toast("Export cancelled", "info");
            } else {
                toast("Export failed: " + error.message, "error");
            }
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
