import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, LayoutTemplate, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Stepper } from '../components/Stepper';
import { useMock, Project } from '../mock/MockContext';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';
import { cn } from '../lib/utils';

const STEPS = ['Select Template', 'Select Phones', 'Preview & Save'];

export function Generate() {
    const navigate = useNavigate();
    const { templates, phones, addProject } = useMock();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);

    // Form State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [phoneAId, setPhoneAId] = useState<string>('');
    const [phoneBId, setPhoneBId] = useState<string>('');
    const [projectName, setProjectName] = useState('');

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

        const project: Project = {
            id: Math.random().toString(36).substr(2, 9),
            name: projectName || `Compare ${phones.find(p => p.id === phoneAId)?.name} vs ${phones.find(p => p.id === phoneBId)?.name}`,
            templateId: selectedTemplateId,
            phoneAId,
            phoneBId,
            dateCreated: new Date().toISOString().split('T')[0]
        };

        addProject(project);
        toast("Project generated successfully", "success");
        navigate('/projects');
    };

    const renderStep1 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
                <div
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
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
                    <p className="text-sm text-slate-500">{t.sections.length} Scenes</p>
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
                    >
                        <option value="">Select Phone...</option>
                        {phones.map(p => (
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
                    >
                        <option value="">Select Phone...</option>
                        {phones.filter(p => p.id !== phoneAId).map(p => (
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
        const template = templates.find(t => t.id === selectedTemplateId);

        return (
            <div className="flex flex-col lg:flex-row gap-8 h-[500px]">
                {/* Slides List */}
                <div className="w-64 flex-shrink-0 bg-slate-50 rounded-lg border border-slate-200 overflow-y-auto">
                    <div className="p-3 border-b border-slate-200 font-medium text-sm text-slate-500 sticky top-0 bg-slate-50">
                        Slides Sequence
                    </div>
                    <div className="p-2 space-y-2">
                        {template?.sections.map((section, idx) => (
                            <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-sm flex items-center gap-2 cursor-pointer hover:border-blue-300">
                                <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500">{idx + 1}</span>
                                {section}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Box */}
                <div className="flex-1 bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950"></div>
                    <div className="relative z-10 text-center text-white">
                        <h1 className="text-4xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {phones.find(p => p.id === phoneAId)?.name}
                        </h1>
                        <p className="text-2xl text-slate-400 mb-8">VS</p>
                        <h1 className="text-4xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            {phones.find(p => p.id === phoneBId)?.name}
                        </h1>
                    </div>

                    <div className="absolute bottom-6 flex gap-4">
                        <Button variant="secondary" size="sm" className="bg-white/10 text-white border-transparent hover:bg-white/20">Previous</Button>
                        <Button variant="secondary" size="sm" className="bg-white/10 text-white border-transparent hover:bg-white/20">Next</Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Project</h2>
                <div className="mt-6 px-12">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                </div>
            </div>

            <Card className="min-h-[400px] flex flex-col">
                <div className="flex-1 p-4">
                    {currentStep === 0 && renderStep1()}
                    {currentStep === 1 && renderStep2()}
                    {currentStep === 2 && renderStep3()}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between">
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
                            action={ACTIONS.MPCS_GENERATE_SAVE}
                            onClick={handleSave}
                            className="w-48 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> Save Project
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
