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
import { Settings as SettingsIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { getEffectivePages, duplicatePage, createDefaultPages } from '../lib/templatePages';

export function Templates() {
    const { state, addTemplate, updateTemplate, deleteTemplate } = useAppStore();
    const { templates } = state;
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDeleteId, setTemplateToDeleteId] = useState<string | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');

    // Aspect Ratio State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatioSetting());

    useEffect(() => {
        if (selectedTemplate) {
            if (selectedTemplate.useAspectRatioOverride && selectedTemplate.aspectRatio) {
                setAspectRatio(selectedTemplate.aspectRatio);
            } else {
                setAspectRatio(getDefaultAspectRatioSetting());
            }
        }
    }, [selectedTemplateId, templates]);

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const templateToDelete = templates.find(t => t.id === (templateToDeleteId || selectedTemplateId));

    const handleCreate = () => {
        if (!newTemplateName) return;
        const newTemplate = {
            id: Math.random().toString(36).substring(2, 11),
            name: newTemplateName,
            placeholders: ['{PHONE_A}', '{PHONE_B}', '{WINNER}', '{SPEC}'],
            sections: { // Keeping for legacy compat, maybe we should remove it eventually
                intro: '',
                subintro: '',
                body: '',
                camera: '',
                score: ''
            },
            pages: createDefaultPages(),
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

    const confirmDelete = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setTemplateToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        const id = templateToDeleteId || selectedTemplateId;
        if (id) {
            deleteTemplate(id);
            if (selectedTemplateId === id) {
                setSelectedTemplateId(null);
            }
            setTemplateToDeleteId(null);
            setIsDeleteModalOpen(false);
            toast("Template deleted", "info");
        }
    };

    const handleDuplicatePage = (pageId: string) => {
        if (!selectedTemplate) return;
        const currentPages = getEffectivePages(selectedTemplate);
        const sourcePage = currentPages.find(p => p.id === pageId);
        if (!sourcePage) return;

        const newPage = duplicatePage(sourcePage, currentPages);
        
        // Insert right after the source page
        const sourceIndex = currentPages.findIndex(p => p.id === pageId);
        const newPages = [
            ...currentPages.slice(0, sourceIndex + 1),
            newPage,
            ...currentPages.slice(sourceIndex + 1)
        ];

        updateTemplate({ ...selectedTemplate, pages: newPages, updatedAt: new Date().toISOString() });
    };

    const handleDeletePage = (pageId: string) => {
        if (!selectedTemplate) return;
        const currentPages = getEffectivePages(selectedTemplate);
        const newPages = currentPages.filter(p => p.id !== pageId);
        updateTemplate({ ...selectedTemplate, pages: newPages, updatedAt: new Date().toISOString() });
    };

    const handleReorderPage = (pageId: string, direction: 'up' | 'down') => {
        if (!selectedTemplate) return;
        const currentPages = getEffectivePages(selectedTemplate);
        const idx = currentPages.findIndex(p => p.id === pageId);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === currentPages.length - 1) return;

        const delta = direction === 'up' ? -1 : 1;
        const newPages = [...currentPages];
        const temp = newPages[idx];
        newPages[idx] = newPages[idx + delta];
        newPages[idx + delta] = temp;

        updateTemplate({ ...selectedTemplate, pages: newPages, updatedAt: new Date().toISOString() });
    };
    
    const handleBindModeChange = (pageId: string, mode: 'none' | 'rowIndex') => {
        if (!selectedTemplate) return;
        const currentPages = getEffectivePages(selectedTemplate);
        const newPages = currentPages.map(p => 
            p.id === pageId ? { ...p, dataBind: { ...p.dataBind, mode } } : p
        );
        updateTemplate({ ...selectedTemplate, pages: newPages, updatedAt: new Date().toISOString() });
    };

    const handleBindRowChange = (pageId: string, rowIndex: number) => {
        if (!selectedTemplate) return;
        const currentPages = getEffectivePages(selectedTemplate);
        const newPages = currentPages.map(p => 
            p.id === pageId ? { ...p, dataBind: { ...p.dataBind, rowIndex } } : p
        );
        updateTemplate({ ...selectedTemplate, pages: newPages, updatedAt: new Date().toISOString() });
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8 overflow-y-auto lg:overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 lg:h-full min-h-0">
                {/* List Panel */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 min-h-[400px] lg:min-h-0 text-left">
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
                                    "p-3 rounded-md cursor-pointer transition-all flex items-center gap-3 border group",
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
                                    <p className="text-xs text-slate-500">{template.pages?.length || Object.keys(template.sections).length} pages</p>
                                </div>
                                <button
                                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => confirmDelete(template.id, e)}
                                    title="Delete template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
                                            <Badge variant="secondary">{getEffectivePages(selectedTemplate).length} Pages</Badge>
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
                                <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <SettingsIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Preview Configuration</span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTemplate.useAspectRatioOverride || false}
                                                onChange={(e) => {
                                                    updateTemplate({
                                                        ...selectedTemplate,
                                                        useAspectRatioOverride: e.target.checked
                                                    });
                                                }}
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                                data-action={ACTIONS.MPCS_TEMPLATE_ASPECT_OVERRIDE_TOGGLE}
                                            />
                                            <span className="text-sm font-medium text-slate-700">Override for this template</span>
                                        </label>
                                    </div>

                                    {selectedTemplate.useAspectRatioOverride && (
                                        <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                                            <label className="text-sm font-medium text-slate-700 text-nowrap">Template Ratio:</label>
                                            <select
                                                value={selectedTemplate.aspectRatio?.preset || '16:9'}
                                                onChange={(e) => {
                                                    updateTemplate({
                                                        ...selectedTemplate,
                                                        aspectRatio: { preset: e.target.value as AspectRatioPreset }
                                                    });
                                                }}
                                                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                                data-action={ACTIONS.MPCS_TEMPLATE_ASPECT_OVERRIDE_CHANGE}
                                            >
                                                <option value="16:9">16:9 (Landscape)</option>
                                                <option value="9:16">9:16 (Portrait)</option>
                                                <option value="1:1">1:1 (Square)</option>
                                                <option value="4:5">4:5 (Instagram Portrait)</option>
                                                <option value="3:4">3:4 (Classic Portrait)</option>
                                            </select>
                                        </div>
                                    )}
                                    {!selectedTemplate.useAspectRatioOverride && (
                                        <p className="text-xs text-slate-500 italic">Currently following global app default: {formatAspectRatio(getDefaultAspectRatioSetting())}</p>
                                    )}
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
                                        <Button variant="secondary" size="sm" action={ACTIONS.MPCS_TEMPLATE_OPEN_BUILDER} onClick={() => navigate(`/templates/${selectedTemplate.id}/builder`)}>
                                            Open Visual Builder
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {getEffectivePages(selectedTemplate).map((page, idx, allPages) => {
                                            const groupCount = allPages.filter(p => p.duplicateGroupId === page.duplicateGroupId).length;
                                            return (
                                            <div key={page.id} className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-100 gap-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-medium mr-4 shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-700 capitalize">{page.label}</p>
                                                                {page.duplicateIndex > 0 && <Badge variant="outline" className="text-[10px] bg-slate-100">Duplicate</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{page.baseType}</span>
                                                                <span className="text-[10px] text-slate-400">•</span>
                                                                <span className="text-[10px] text-slate-400">{page.timing.durationMs}ms</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button 
                                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                                                            onClick={() => handleReorderPage(page.id, 'up')}
                                                            disabled={idx === 0}
                                                            title="Move Up"
                                                            data-action={ACTIONS.MPCS_TEMPLATE_PAGE_REORDER_UP}
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                                                            onClick={() => handleReorderPage(page.id, 'down')}
                                                            disabled={idx === allPages.length - 1}
                                                            title="Move Down"
                                                            data-action={ACTIONS.MPCS_TEMPLATE_PAGE_REORDER_DOWN}
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                                        <Button variant="secondary" size="sm" onClick={() => handleDuplicatePage(page.id)} data-action={ACTIONS.MPCS_TEMPLATE_PAGE_DUPLICATE}>
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </Button>
                                                        {page.duplicateIndex > 0 && (
                                                            <Button variant="danger" size="sm" onClick={() => handleDeletePage(page.id)} data-action={ACTIONS.MPCS_TEMPLATE_PAGE_DELETE_DUPLICATE}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}
                                                        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                                        <Button variant="primary" size="sm" onClick={() => navigate(`/templates/${selectedTemplate.id}/builder/${page.id}`)} data-action={ACTIONS.MPCS_TEMPLATE_BUILDER_PAGE_SELECT}>
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                {/* Duplicate / Data Bind Controls */}
                                                {(page.duplicateIndex > 0 || groupCount > 1) && (
                                                    <div className="mt-2 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-slate-600">Data Row Binding:</span>
                                                            <select 
                                                                className="px-2 py-1 rounded border border-slate-300 bg-white"
                                                                value={page.dataBind.mode}
                                                                onChange={(e) => handleBindModeChange(page.id, e.target.value as 'none' | 'rowIndex')}
                                                                data-action={ACTIONS.MPCS_TEMPLATE_PAGE_BIND_MODE_CHANGE}
                                                            >
                                                                <option value="none">None</option>
                                                                <option value="rowIndex">Specific Row</option>
                                                            </select>
                                                            
                                                            {page.dataBind.mode === 'rowIndex' && (
                                                                <div className="flex items-center gap-2">
                                                                    <span>Row #</span>
                                                                    <input 
                                                                        type="number" 
                                                                        min="0"
                                                                        className="w-16 px-2 py-1 rounded border border-slate-300 bg-white"
                                                                        value={page.dataBind.rowIndex ?? ''}
                                                                        onChange={(e) => handleBindRowChange(page.id, parseInt(e.target.value) || 0)}
                                                                        data-action={ACTIONS.MPCS_TEMPLATE_PAGE_BIND_ROW_CHANGE}
                                                                    />
                                                                    <span className="text-slate-400 italic flex items-center gap-1">
                                                                        (0-based offset)
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {page.dataBind.mode === 'rowIndex' && page.baseType === 'body' && (
                                                                <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 ml-2">
                                                                    Body Spec Match
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-center">
                                <Button action={ACTIONS.MPCS_TEMPLATE_OPEN_BUILDER} onClick={() => navigate(`/templates/${selectedTemplate.id}/builder`)} className="w-full md:w-auto">
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
                <p className="text-slate-600 text-left">Are you sure you want to delete <span className="font-bold">{templateToDelete?.name}</span>? This action cannot be undone.</p>
            </Modal>
        </div>
    );
}
