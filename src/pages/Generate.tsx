import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, LayoutTemplate, ArrowRight, ArrowLeft, CheckCircle, Music2, Sparkles, Layers, Clock, Info, RotateCcw } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Stepper } from '../components/Stepper';
import { useAppStore } from '../store/appStore';
import type { Project } from '../types/models';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';
import { cn } from '../lib/utils';
import type { AspectRatio, AspectRatioPreset } from '../types/aspectRatio';
import { getDefaultAspectRatioSetting } from '../store/settingsStore';
import PreviewStage from '../components/PreviewStage';
import PreviewContent from '../components/PreviewContent';
import DEFAULT_ANIMATION_SETTINGS, { AnimationSettings } from '../preview/animations';
import { playSfx, playMusic, stopMusic } from '../audio/player';

const STEPS = ['Select Template', 'Select Phones', 'Preview & Save'];

export function Generate() {
    const navigate = useNavigate();
    const { state, addProject } = useAppStore();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);

    // Form State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [phoneAId, setPhoneAId] = useState<string>('');
    const [phoneBId, setPhoneBId] = useState<string>('');
    const [projectName, setProjectName] = useState('');

    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatioSetting());
    const [useProjectOverride, setUseProjectOverride] = useState(false);

    // Phase 2B Preview State
    const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(DEFAULT_ANIMATION_SETTINGS);
    const [activeSceneKey, setActiveSceneKey] = useState<string>('intro');
    const [sceneOverrides, setSceneOverrides] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!useProjectOverride) {
            const template = state.templates.find(t => t.id === selectedTemplateId);
            if (template?.useAspectRatioOverride && template.aspectRatio) {
                setAspectRatio(template.aspectRatio);
            } else {
                setAspectRatio(getDefaultAspectRatioSetting());
            }
        }
    }, [useProjectOverride, selectedTemplateId, state.templates]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSave = () => {
        if (!selectedTemplateId || !phoneAId || !phoneBId) return;

        const now = new Date().toISOString();
        const phoneA = state.phones.find(p => p.id === phoneAId);
        const phoneB = state.phones.find(p => p.id === phoneBId);

        const scenes = template ? Object.keys(template.sections).map(key => ({
            type: key as any,
            contextOverrides: sceneOverrides[key] ? { caption: sceneOverrides[key] } : undefined
        })) : [];

        const project: Project = {
            id: Math.random().toString(36).substring(2, 11),
            name: projectName || `${phoneA?.name || 'Phone A'} vs ${phoneB?.name || 'Phone B'}`,
            templateId: selectedTemplateId,
            phoneAId,
            phoneBId,
            createdAt: now,
            updatedAt: now,
            aspectRatioOverride: useProjectOverride ? aspectRatio : undefined,
            previewSettings: {
                animation: animationSettings,
                audioEnabled: true,
                audioVolume: 0.8,
            },
            scenes: scenes
        };

        addProject(project);
        toast("Project generated successfully", "success");
        navigate('/projects');
    };

    const template = state.templates.find(t => t.id === selectedTemplateId);

    // Audio Effect Logic
    useEffect(() => {
        if (!activeSceneKey || activeSceneKey === 'intro' || activeSceneKey === 'subintro') return;

        // Brief delay for audio playback to match transition
        const timer = setTimeout(() => {
            playSfx('good');
        }, 100);

        return () => clearTimeout(timer);
    }, [activeSceneKey]);

    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const handleMusicToggle = () => {
        if (isMusicPlaying) {
            stopMusic();
            setIsMusicPlaying(false);
        } else {
            playMusic();
            setIsMusicPlaying(true);
        }
    };

    // Stop music on unmount
    useEffect(() => {
        return () => stopMusic();
    }, []);

    const renderStep1 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.templates.map(t => (
                <div
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    data-action={ACTIONS.MPCS_GENERATE_SELECT_TEMPLATE}
                    className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                        selectedTemplateId === t.id
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-slate-200 bg-white hover:border-blue-200"
                    )}
                >
                    <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400">
                        <LayoutTemplate className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-sm text-slate-500">{Object.keys(t.sections).length} Sections</p>
                </div>
            ))}
        </div>
    );

    const renderStep2 = () => (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="grid grid-cols-2 gap-8 items-center">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Phone A (Left)</label>
                    <select
                        className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={phoneAId}
                        onChange={e => setPhoneAId(e.target.value)}
                        data-action={ACTIONS.MPCS_GENERATE_SELECT_PHONE_A}
                    >
                        <option value="">Select Phone...</option>
                        {state.phones.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {phoneAId && (
                        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-center border border-slate-200 shadow-inner min-h-[120px]">
                            {state.phones.find(p => p.id === phoneAId)?.image ? (
                                <img
                                    src={state.phones.find(p => p.id === phoneAId)?.image?.dataUrl || ''}
                                    className="w-full h-24 object-contain rounded"
                                    alt="Phone A"
                                />
                            ) : (
                                <Smartphone className="w-12 h-12 text-slate-300" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center pt-6">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg">VS</div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Phone B (Right)</label>
                    <select
                        className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={phoneBId}
                        onChange={e => setPhoneBId(e.target.value)}
                        data-action={ACTIONS.MPCS_GENERATE_SELECT_PHONE_B}
                    >
                        <option value="">Select Phone...</option>
                        {state.phones.filter((p) => p.id !== phoneAId).map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {phoneBId && (
                        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-center border border-slate-200 shadow-inner min-h-[120px]">
                            {state.phones.find(p => p.id === phoneBId)?.image ? (
                                <img
                                    src={state.phones.find(p => p.id === phoneBId)?.image?.dataUrl || ''}
                                    className="w-full h-24 object-contain rounded"
                                    alt="Phone B"
                                />
                            ) : (
                                <Smartphone className="w-12 h-12 text-slate-300" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name (Optional)</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Auto-generated if empty"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                />
            </div>
        </div>
    );

    const renderStep3 = () => {
        return (
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useProjectOverride}
                                onChange={(e) => setUseProjectOverride(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                data-action={ACTIONS.MPCS_GENERATE_ASPECT_RATIO_TOGGLE_OVERRIDE}
                            />
                            <span className="text-sm font-medium text-slate-700">Use project-specific aspect ratio</span>
                        </label>
                    </div>

                    {useProjectOverride && (
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-700">Aspect Ratio:</label>
                            <select
                                value={aspectRatio.preset}
                                onChange={(e) => setAspectRatio({ preset: e.target.value as AspectRatioPreset })}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-action={ACTIONS.MPCS_GENERATE_ASPECT_RATIO_CHANGE}
                            >
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Portrait)</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="4:5">4:5 (Instagram Portrait)</option>
                                <option value="3:4">3:4 (Classic Portrait)</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-64 flex-shrink-0 bg-slate-50 rounded-lg border border-slate-200 overflow-y-auto max-h-[500px]">
                        <div className="p-3 border-b border-slate-200 font-medium text-sm text-slate-500 sticky top-0 bg-slate-50">
                            Slides Sequence
                        </div>
                        <div className="p-2 space-y-2">
                            {template && Object.entries(template.sections).map(([key], idx) => (
                                <div
                                    key={key}
                                    onClick={() => setActiveSceneKey(key)}
                                    className={cn(
                                        "p-2 rounded border text-sm flex items-center gap-2 cursor-pointer transition-all",
                                        activeSceneKey === key
                                            ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                                    )}
                                >
                                    <span className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center text-xs",
                                        activeSceneKey === key ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                                    )}>{idx + 1}</span>
                                    <span className="capitalize">{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <PreviewStage
                            aspectRatio={aspectRatio}
                            showGrid={false}
                            animation={animationSettings}
                            activeSceneId={activeSceneKey}
                        >
                            <div className="flex w-full h-full items-center justify-around px-8">
                                <PreviewContent
                                    sceneKey={activeSceneKey}
                                    template={template}
                                    phoneA={state.phones.find(p => p.id === phoneAId)}
                                    phoneB={state.phones.find(p => p.id === phoneBId)}
                                    rules={state.rules}
                                    captionOverride={sceneOverrides[activeSceneKey]}
                                />
                            </div>

                            <div className="absolute bottom-6 right-6 z-30">
                                <button
                                    onClick={handleMusicToggle}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex items-center gap-3 backdrop-blur-md",
                                        isMusicPlaying
                                            ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                                    )}
                                    data-action={ACTIONS.MPCS_MUSIC_PLAY_PAUSE}
                                >
                                    {isMusicPlaying ? (
                                        <div className="flex items-end gap-0.5 h-4 mb-0.5">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="w-1 bg-blue-400 animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }} />
                                            ))}
                                        </div>
                                    ) : <Music2 className="w-5 h-5" />}
                                    <span className="text-xs font-black uppercase tracking-widest">{isMusicPlaying ? "Music ON" : "Music OFF"}</span>
                                </button>
                            </div>
                        </PreviewStage>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 font-semibold text-slate-800 border-b pb-2 mb-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                Preview Animations
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-3 h-3" />
                                        Transition Style
                                    </label>
                                    <div className="flex gap-2">
                                        {(['none', 'fade', 'slide'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setAnimationSettings(prev => ({ ...prev, type }))}
                                                data-action={ACTIONS.MPCS_ANIM_TYPE_CHANGE}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all capitalize",
                                                    animationSettings.type === type
                                                        ? "bg-blue-500 text-white border-blue-600 shadow-inner"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Duration ({animationSettings.durationMs}ms)
                                    </label>
                                    <input
                                        type="range"
                                        min="150"
                                        max="1000"
                                        step="50"
                                        value={animationSettings.durationMs}
                                        onChange={(e) => setAnimationSettings(prev => ({ ...prev, durationMs: parseInt(e.target.value) }))}
                                        data-action={ACTIONS.MPCS_ANIM_DURATION_CHANGE}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                                        <span>Fast (150ms)</span>
                                        <span>Normal</span>
                                        <span>Slow (1000ms)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scene Inspector */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider text-sm">
                                    <Info className="w-4 h-4 text-purple-500" />
                                    Scene Inspector: <span className="text-purple-600 font-black">{activeSceneKey}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        const newOverrides = { ...sceneOverrides };
                                        delete newOverrides[activeSceneKey];
                                        setSceneOverrides(newOverrides);
                                    }}
                                    disabled={!sceneOverrides[activeSceneKey]}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-500 disabled:opacity-0 transition-all uppercase tracking-widest"
                                    data-action={ACTIONS.MPCS_GENERATE_SCENE_RESET}
                                >
                                    <RotateCcw className="w-3 h-3" /> Reset to Auto
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Description</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 text-left">
                                        {activeSceneKey === 'intro' && "Opening slide showing both devices side-by-side with names."}
                                        {activeSceneKey === 'subintro' && "Quick overview or category context slide."}
                                        {activeSceneKey === 'score' && "Final result slide with total score or conclusion."}
                                        {activeSceneKey !== 'intro' && activeSceneKey !== 'subintro' && activeSceneKey !== 'score' &&
                                            `Comparison slide for "${activeSceneKey}". Displays specs, highlights the winner, and explains the reason.`}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        Caption / Logic Override
                                        {sceneOverrides[activeSceneKey] && <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[9px]">MANUAL</span>}
                                    </label>
                                    <textarea
                                        value={sceneOverrides[activeSceneKey] || ""}
                                        onChange={(e) => setSceneOverrides({ ...sceneOverrides, [activeSceneKey]: e.target.value })}
                                        placeholder="Enter manual text to override auto-generated content..."
                                        className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                        data-action={ACTIONS.MPCS_GENERATE_SCENE_TEXT_EDIT}
                                    />
                                    <p className="text-[10px] text-slate-400 italic">Leave blank to use engine auto-logic based on rules.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto min-h-0">
            <div className="max-w-5xl mx-auto w-full space-y-8">
                <div className="mb-8 text-left">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Project</h2>
                    <div className="mt-6">
                        <Stepper steps={STEPS} currentStep={currentStep} />
                    </div>
                </div>

                <Card className="min-h-[400px] flex flex-col text-left flex-1 min-h-0">
                    <div className="flex-1 p-4 overflow-y-auto min-h-0">
                        {currentStep === 0 && renderStep1()}
                        {currentStep === 1 && renderStep2()}
                        {currentStep === 2 && renderStep3()}
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-between shrink-0">
                        <Button
                            variant="secondary"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="w-32"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        {currentStep < 2 ? (
                            <Button
                                onClick={handleNext}
                                disabled={(currentStep === 0 && !selectedTemplateId) || (currentStep === 1 && (!phoneAId || !phoneBId))}
                                className="w-32"
                            >
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                action={ACTIONS.MPCS_GENERATE_SAVE_PROJECT}
                                onClick={handleSave}
                                className="w-48 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> Save Project
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
