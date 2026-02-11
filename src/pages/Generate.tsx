import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, LayoutTemplate, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
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
import { Music, Play, Volume2, FileJson } from 'lucide-react';

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

    // Aspect Ratio State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatioSetting());
    const [useProjectOverride, setUseProjectOverride] = useState(false);

    useEffect(() => {
        if (!useProjectOverride) {
            setAspectRatio(getDefaultAspectRatioSetting());
        }
    }, [useProjectOverride]);

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

        const project: Project = {
            id: Math.random().toString(36).substring(2, 11),
            name: projectName || `${phoneA?.name || 'Phone A'} vs ${phoneB?.name || 'Phone B'}`,
            templateId: selectedTemplateId,
            phoneAId,
            phoneBId,
            createdAt: now,
            updatedAt: now,
            aspectRatioOverride: useProjectOverride ? aspectRatio : undefined
        };

        addProject(project);
        toast("Project generated successfully", "success");
        navigate('/projects');
    };

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
                {/* Phone A */}
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

                {/* VS Badge */}
                <div className="flex flex-col items-center justify-center pt-6">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg">VS</div>
                </div>

                {/* Phone B */}
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
        const template = state.templates.find((t) => t.id === selectedTemplateId);

        return (
            <div className="space-y-6">
                {/* Aspect Ratio Controls */}
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
                    {/* Slides List */}
                    <div className="w-64 flex-shrink-0 bg-slate-50 rounded-lg border border-slate-200 overflow-y-auto max-h-[500px]">
                        <div className="p-3 border-b border-slate-200 font-medium text-sm text-slate-500 sticky top-0 bg-slate-50">
                            Slides Sequence
                        </div>
                        <div className="p-2 space-y-2">
                            {template && Object.entries(template.sections).map(([key], idx) => (
                                <div key={key} className="p-2 bg-white rounded border border-slate-200 text-sm flex items-center gap-2 cursor-pointer hover:border-blue-300">
                                    <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500">{idx + 1}</span>
                                    {key}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview Stage */}
                    <div className="flex-1 space-y-6">
                        <PreviewStage aspectRatio={aspectRatio} showGrid={false}>
                            <div className="flex w-full h-full items-center justify-around px-8">
                                {/* Phone A Preview Card */}
                                <div className="flex flex-col items-center gap-6 animate-in slide-in-from-left-8 duration-700">
                                    <div className="w-48 h-80 bg-gradient-to-b from-slate-800 to-black rounded-[2rem] border-[6px] border-slate-700 shadow-2xl relative overflow-hidden flex items-center justify-center">
                                        {state.phones.find(p => p.id === phoneAId)?.image ? (
                                            <img
                                                src={state.phones.find(p => p.id === phoneAId)?.image?.dataUrl || ''}
                                                alt="Phone A"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="bg-slate-900 w-full h-full flex items-center justify-center text-slate-700 font-bold text-xs uppercase tracking-widest">NO IMAGE</div>
                                        )}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-700 rounded-full" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white drop-shadow-lg text-center">
                                        {state.phones.find((p) => p.id === phoneAId)?.name}
                                    </h1>
                                </div>

                                <div className="text-4xl font-black text-blue-500 italic drop-shadow-xl z-20">VS</div>

                                {/* Phone B Preview Card */}
                                <div className="flex flex-col items-center gap-6 animate-in slide-in-from-right-8 duration-700">
                                    <div className="w-48 h-80 bg-gradient-to-b from-slate-800 to-black rounded-[2rem] border-[6px] border-slate-700 shadow-2xl relative overflow-hidden flex items-center justify-center">
                                        {state.phones.find(p => p.id === phoneBId)?.image ? (
                                            <img
                                                src={state.phones.find(p => p.id === phoneBId)?.image?.dataUrl || ''}
                                                alt="Phone B"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="bg-slate-900 w-full h-full flex items-center justify-center text-slate-700 font-bold text-xs uppercase tracking-widest">NO IMAGE</div>
                                        )}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-700 rounded-full" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white drop-shadow-lg text-center">
                                        {state.phones.find((p) => p.id === phoneBId)?.name}
                                    </h1>
                                </div>
                            </div>
                        </PreviewStage>

                        {/* Phase 2B Placeholders Section */}
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-2">
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded uppercase tracking-widest">Phase 2B Preview</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Advanced Generation Settings</h4>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Animations */}
                                <div className="group opacity-50 cursor-not-allowed" title="Available after Phase 2 balance">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Play className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-semibold text-slate-300">Animations</span>
                                    </div>
                                    <div className="w-full h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center px-3 justify-between">
                                        <span className="text-xs text-slate-500">None</span>
                                        <div className="w-8 h-4 bg-slate-700 rounded-full relative">
                                            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-slate-600 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Audio Scoring */}
                                <div className="group opacity-50 cursor-not-allowed" title="Available after Phase 2 balance">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Volume2 className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-semibold text-slate-300">Audio Scoring</span>
                                    </div>
                                    <div className="w-full h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center px-3 justify-between">
                                        <span className="text-xs text-slate-500">Disabled</span>
                                        <div className="w-8 h-4 bg-slate-700 rounded-full relative">
                                            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-slate-600 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Background Music */}
                                <div className="group opacity-50 cursor-not-allowed" title="Available after Phase 2 balance">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Music className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-semibold text-slate-300">Music</span>
                                    </div>
                                    <div className="w-full h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center px-3 justify-between">
                                        <span className="text-xs text-slate-500 text-truncate">Default Beat</span>
                                    </div>
                                </div>

                                {/* JSON Export */}
                                <div className="group opacity-50 cursor-not-allowed" title="Available after Phase 2 balance">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileJson className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-semibold text-slate-300">JSON Project</span>
                                    </div>
                                    <div className="w-full h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center px-3 justify-center gap-2">
                                        <span className="text-xs text-slate-500">Import/Export</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-600 mt-6 italic text-center border-t border-slate-800 pt-4">
                                These features are locked. Please complete Phase 2 balance to enable advanced kinetic rendering and audio integration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full space-y-8">
                <div className="mb-8 text-left">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Project</h2>
                    <div className="mt-6">
                        <Stepper steps={STEPS} currentStep={currentStep} />
                    </div>
                </div>

                <Card className="min-h-[400px] flex flex-col text-left">
                    <div className="flex-1 p-4">
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
