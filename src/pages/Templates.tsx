import { useState, useEffect } from 'react';
import { LayoutTemplate, Plus, Copy, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useAppStore } from '../store/appStore';
import type { Template } from '../types/models';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { AspectRatio, AspectRatioPreset } from '../types/aspectRatio';
import { formatAspectRatio } from '../types/aspectRatio';
import { getDefaultAspectRatioSetting } from '../store/settingsStore';
import PreviewStage from '../components/PreviewStage';

export function Templates() {
    const { state, addTemplate, deleteTemplate } = useAppStore();
    const { templates } = state;
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    // Aspect Ratio State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatioSetting());

    useEffect(() => {
        setAspectRatio(getDefaultAspectRatioSetting());
    }, []);

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    const handleCreate = () => {
        if (!newTemplateName) return;
        const newTemplate = {
            id: Math.random().toString(36).substring(2, 11),
            name: newTemplateName,
            placeholders: ['{PHONE_A}', '{PHONE_B}', '{WINNER}', '{SPEC}'],
            sections: {
                intro: '',
                subintro: '',
                body: '',
                camera: '',
                score: ''
            },
            updatedAt: new Date().toISOString()
        };
        addTemplate(newTemplate);
        setNewTemplateName('');
        setIsCreateModalOpen(false);
        toast("Template created", "success");
        setSelectedTemplateId(newTemplate.id);
    };

    const handleDuplicate = () => {
        if (!selectedTemplate) return;
        const newTemplate: Template = {
            ...selectedTemplate,
            id: Math.random().toString(36).substring(2, 11),
            name: `${selectedTemplate.name} (Copy)`,
            updatedAt: new Date().toISOString()
        };
        addTemplate(newTemplate);
        toast("Template duplicated", "success");
    };

    const handleDelete = () => {
        if (selectedTemplateId) {
            deleteTemplate(selectedTemplateId);
            setSelectedTemplateId(null);
            setIsDeleteModalOpen(false);
            toast("Template deleted", "info");
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8 overflow-y-auto lg:overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 lg:h-full min-h-0">
                {/* List Panel */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 min-h-[400px] lg:min-h-0">
                    <div className="flex items-center justify-between shrink-0">
                        <h2 className="text-lg font-semibold text-slate-800">My Templates</h2>
                        <Button size="sm" action={ACTIONS.MPCS_TEMPLATE_CREATE} onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> New
                        </Button>
                    </div>

                    <div className="flex-1 lg:overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm p-2 space-y-2">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplateId(template.id)}
                                className={cn(
                                    "p-3 rounded-md cursor-pointer transition-all flex items-center gap-3 border",
                                    selectedTemplateId === template.id
                                        ? "bg-purple-50 border-purple-200 shadow-sm"
                                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                    selectedTemplateId === template.id ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"
                                )}>
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("font-medium truncate", selectedTemplateId === template.id ? "text-purple-900" : "text-slate-700")}>
                                        {template.name}
                                    </p>
                                    <p className="text-xs text-slate-500">{Object.keys(template.sections).length} sections</p>
                                </div>
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <EmptyState
                                icon={LayoutTemplate}
                                title="No templates"
                                description="Create a template to start generating videos"
                            />
                        )}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden">
                    {selectedTemplate ? (
                        <>
                            <div className="p-6 border-b border-slate-100 shrink-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-slate-900 truncate">{selectedTemplate.name}</h2>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="outline">{formatAspectRatio(aspectRatio)}</Badge>
                                            <Badge variant="secondary">{Object.keys(selectedTemplate.sections).length} Scenes</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="secondary" action={ACTIONS.MPCS_TEMPLATE_DUPLICATE} onClick={handleDuplicate}>
                                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                                        </Button>
                                        <Button variant="danger" action={ACTIONS.MPCS_TEMPLATE_DELETE} onClick={() => setIsDeleteModalOpen(true)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Aspect Ratio Selector */}
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-slate-700 text-nowrap">Preview Ratio:</label>
                                    <select
                                        value={aspectRatio.preset}
                                        onChange={(e) => setAspectRatio({ preset: e.target.value as AspectRatioPreset })}
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                        data-action={ACTIONS.MPCS_GENERATE_ASPECT_RATIO_CHANGE}
                                    >
                                        <option value="16:9">16:9 (Landscape)</option>
                                        <option value="9:16">9:16 (Portrait)</option>
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="4:5">4:5 (Instagram Portrait)</option>
                                        <option value="3:4">3:4 (Classic Portrait)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-8 min-h-0">
                                {/* Preview Area */}
                                <div className="flex justify-center">
                                    <PreviewStage aspectRatio={aspectRatio} showGrid={false}>
                                        <div className="text-center p-8">
                                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Comparison Preview</h3>
                                            <div className="flex gap-2 justify-center flex-wrap opacity-60">
                                                <span className="bg-white/10 px-2 py-1 rounded text-xs text-white">{'{PHONE_A}'}</span>
                                                <span className="text-slate-500">vs</span>
                                                <span className="bg-white/10 px-2 py-1 rounded text-xs text-white">{'{PHONE_B}'}</span>
                                            </div>
                                            <div className="mt-6">
                                                <Button size="sm" variant="secondary" action={ACTIONS.MPCS_TEMPLATE_OPEN_BUILDER} onClick={() => navigate('/templates/builder')}>
                                                    <ExternalLink className="w-3 h-3 mr-2" /> Open Builder
                                                </Button>
                                            </div>
                                        </div>
                                    </PreviewStage>
                                </div>

                                {/* Sections List */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Timeline Structure</h3>
                                        <Button variant="secondary" size="sm" action={ACTIONS.MPCS_TEMPLATE_OPEN_BUILDER} onClick={() => navigate('/templates/builder')}>
                                            Edit Structure
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {Object.entries(selectedTemplate.sections).map(([name, content], idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center p-4 bg-slate-50 rounded-lg border border-slate-100 gap-3">
                                                <div className="flex items-center">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-medium mr-4 shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-700 capitalize">{name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500 truncate">{content || '(Empty content)'}</p>
                                                </div>
                                                <div className="flex gap-2 shrink-0 sm:justify-end">
                                                    {['intro', 'score'].includes(name.toLowerCase()) ? (
                                                        <Badge variant="warning" className="text-[10px]">Static</Badge>
                                                    ) : (
                                                        <div className="flex gap-1">
                                                            <Badge variant="secondary" className="text-[10px]">{'{PHONE_A}'}</Badge>
                                                            <Badge variant="secondary" className="text-[10px]">{'{PHONE_B}'}</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-center">
                                <Button action={ACTIONS.MPCS_TEMPLATE_OPEN_BUILDER} onClick={() => navigate('/templates/builder')} className="w-full md:w-auto">
                                    Open Visual Editor
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState
                                icon={LayoutTemplate}
                                title="Select a template"
                                description="View details and manage template structure"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Template"
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_TEMPLATE_CREATE} onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button action={ACTIONS.MPCS_TEMPLATE_CREATE} onClick={handleCreate}>Create Template</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                        <Input
                            value={newTemplateName}
                            onChange={e => setNewTemplateName(e.target.value)}
                            placeholder="e.g. TikTok Vertical Comparison"
                            autoFocus
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Template"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_TEMPLATE_DELETE} onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" action={ACTIONS.MPCS_TEMPLATE_DELETE} onClick={handleDelete}>Delete</Button>
                    </>
                }
            >
                <p className="text-slate-600">Are you sure you want to delete <span className="font-bold">{selectedTemplate?.name}</span>?</p>
            </Modal>
        </div>
    );
}
