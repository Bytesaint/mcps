import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Smartphone, LayoutTemplate, Maximize2, Edit2, Music2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAppStore } from '../store/appStore';
import { ACTIONS } from '../actionMap';
import { formatAspectRatio, getDefaultAspectRatio } from '../types/aspectRatio';
import PreviewStage from '../components/PreviewStage';
import PreviewContent from '../components/PreviewContent';
import { useState, useEffect } from 'react';
import { playSfx, playMusic, stopMusic } from '../audio/player';
import { cn } from '../lib/utils';
import { useVideoPreviewPlayer } from '../preview/player/useVideoPreviewPlayer';
import { PlayerBar } from '../preview/player/PlayerBar';

export function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state } = useAppStore();

    const project = state.projects.find(p => p.id === id);
    const template = project ? state.templates.find(t => t.id === project.templateId) : null;
    const phoneA = project ? state.phones.find(p => p.id === project.phoneAId) : null;
    const phoneB = project ? state.phones.find(p => p.id === project.phoneBId) : null;

    // Interactive Preview State
    const [activeSceneKey, setActiveSceneKey] = useState<string>('intro');
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const scenes = template ? Object.keys(template.sections).map(key => ({ type: key })) : [];
    const activeSceneIndex = scenes.findIndex(s => s.type === activeSceneKey);

    const {
        isPlaying,
        togglePlay,
        next,
        prev,
        seek,
        progressPercent,
        speed,
        setSpeed,
        overallElapsedMs,
        totalDurationMs
    } = useVideoPreviewPlayer({
        scenes: scenes,
        currentIndex: activeSceneIndex >= 0 ? activeSceneIndex : 0,
        setCurrentIndex: (idx) => {
            if (scenes[idx]) setActiveSceneKey(scenes[idx].type);
        }
    });

    // Initial scene
    useEffect(() => {
        if (template && !template.sections[activeSceneKey as keyof typeof template.sections]) {
            setActiveSceneKey(Object.keys(template.sections)[0]);
        }
    }, [template]);

    // Audio triggers
    useEffect(() => {
        if (!activeSceneKey || activeSceneKey === 'intro' || activeSceneKey === 'subintro') return;
        const timer = setTimeout(() => playSfx('good'), 100);
        return () => clearTimeout(timer);
    }, [activeSceneKey]);

    const handleMusicToggle = () => {
        if (isMusicPlaying) {
            stopMusic();
            setIsMusicPlaying(false);
        } else {
            playMusic();
            setIsMusicPlaying(true);
        }
    };

    useEffect(() => {
        return () => stopMusic();
    }, []);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Project Not Found</h2>
                <p className="text-slate-500 mb-6">The project you're looking for doesn't exist.</p>
                <Button onClick={() => navigate('/projects')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
                </Button>
            </div>
        );
    }

    const aspectRatio = project.aspectRatioOverride || getDefaultAspectRatio();

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto text-left">
            <div className="max-w-5xl mx-auto w-full space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/projects')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                <Calendar className="w-4 h-4" />
                                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            action={ACTIONS.MPCS_PROJECTS_EDIT}
                            disabled
                            title="Coming in Phase 3"
                        >
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            action={ACTIONS.MPCS_PROJECTS_EXPORT}
                            disabled
                            title="Coming in Phase 3"
                        >
                            Export
                        </Button>
                    </div>
                </div>

                {/* Project Details */}
                <Card>
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                                Project Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <LayoutTemplate className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Template</p>
                                        <p className="font-semibold text-slate-900">
                                            {template?.name || 'Unknown Template'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Phones</p>
                                        <p className="font-semibold text-slate-900">
                                            {phoneA?.name || 'Unknown'} vs {phoneB?.name || 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                {project.aspectRatioOverride && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                            <Maximize2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Aspect Ratio</p>
                                            <p className="font-semibold text-slate-900">
                                                {formatAspectRatio(project.aspectRatioOverride)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                                Interactive Preview
                            </h3>
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Slides List */}
                                <div className="w-56 flex-shrink-0 bg-slate-50 rounded-lg border border-slate-200 overflow-y-auto max-h-[400px]">
                                    <div className="p-3 border-b border-slate-200 font-medium text-xs text-slate-500 sticky top-0 bg-slate-50 uppercase tracking-widest">
                                        Sequence
                                    </div>
                                    <div className="p-2 space-y-1.5">
                                        {template && Object.entries(template.sections).map(([key], idx) => (
                                            <div
                                                key={key}
                                                onClick={() => setActiveSceneKey(key)}
                                                className={cn(
                                                    "p-2 rounded border text-xs flex items-center gap-2 cursor-pointer transition-all",
                                                    activeSceneKey === key
                                                        ? "border-blue-500 bg-blue-50 text-blue-700 font-bold"
                                                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                                                    activeSceneKey === key ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"
                                                )}>{idx + 1}</span>
                                                <span className="capitalize">{key}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="relative">
                                        <PreviewStage
                                            aspectRatio={aspectRatio}
                                            animation={project.previewSettings?.animation}
                                            activeSceneId={activeSceneKey}
                                        >
                                            <PreviewContent
                                                sceneKey={activeSceneKey}
                                                template={template || undefined}
                                                phoneA={phoneA || undefined}
                                                phoneB={phoneB || undefined}
                                                rules={state.rules}
                                            />

                                            {/* Music Widget */}
                                            <div className="absolute bottom-4 right-4 z-30">
                                                <button
                                                    onClick={handleMusicToggle}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all flex items-center gap-2 backdrop-blur-md text-[10px] font-black uppercase tracking-widest",
                                                        isMusicPlaying
                                                            ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                                                    )}
                                                >
                                                    <Music2 className="w-4 h-4" />
                                                    {isMusicPlaying ? "Music ON" : "Music OFF"}
                                                </button>
                                            </div>
                                        </PreviewStage>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                        <PlayerBar
                                            isPlaying={isPlaying}
                                            onTogglePlay={togglePlay}
                                            onNext={next}
                                            onPrev={prev}
                                            progressPercent={progressPercent}
                                            onSeek={seek}
                                            overallElapsedMs={overallElapsedMs}
                                            totalDurationMs={totalDurationMs}
                                            speed={speed}
                                            onSpeedChange={setSpeed}
                                            disabled={!template}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
