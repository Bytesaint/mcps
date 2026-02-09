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
                        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-12 h-12 text-slate-400" />
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
                        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-12 h-12 text-slate-400" />
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
                    <div className="flex-1">
                        <PreviewStage aspectRatio={aspectRatio} showGrid={false}>
                            <div className="text-center text-white">
                                <h1 className="text-4xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {state.phones.find((p) => p.id === phoneAId)?.name}
                                </h1>
                                <p className="text-2xl text-slate-400 mb-8">VS</p>
                                <h1 className="text-4xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                    {state.phones.find((p) => p.id === phoneBId)?.name}
                                </h1>
                            </div>
                        </PreviewStage>
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
