import { useState } from 'react';
import { FolderOpen, Eye, Trash2, Download, Calendar, Maximize2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useAppStore } from '../store/appStore';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';
import { useNavigate } from 'react-router-dom';
import { formatAspectRatio } from '../types/aspectRatio';
import { ImportDropZone } from '../components/ImportDropZone';
import { readJsonFile } from '../utils/readJsonFile';
import { validateProjectJson } from '../utils/validateProjectJson';
import type { Project } from '../types/models';

export function Projects() {
    const { state, deleteProject, addProject, updateProject } = useAppStore();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

    // Import Modal State
    const [importCandidate, setImportCandidate] = useState<Project | null>(null);
    const [isImportConflictModalOpen, setIsImportConflictModalOpen] = useState(false);
    const [isImportLoading, setIsImportLoading] = useState(false);

    const confirmDelete = (id: string) => {
        setDeleteProjectId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (deleteProjectId) {
            deleteProject(deleteProjectId);
            setDeleteProjectId(null);
            setIsDeleteModalOpen(false);
            toast("Project deleted", "info");
        }
    };

    const handleExport = (project: Project) => {
        const dataStr = JSON.stringify(project, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const exportFileDefaultName = `MPCS_${sanitizedName}_${dateStr}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        toast("Project exported successfully", "success");
    };

    const handleFileImport = async (file: File) => {
        setIsImportLoading(true);
        try {
            const json = await readJsonFile(file);
            const validation = validateProjectJson(json);

            if (!validation.isValid || !validation.project) {
                toast(validation.error || "Invalid project file", "error");
                setIsImportLoading(false);
                return;
            }

            const project = validation.project;
            const existing = state.projects.find(p => p.id === project.id);

            if (existing) {
                setImportCandidate(project);
                setIsImportConflictModalOpen(true);
            } else {
                finalizeImport(project);
            }
        } catch (error) {
            toast("Failed to parse project file", "error");
        } finally {
            setIsImportLoading(false);
        }
    };

    const finalizeImport = (project: Project, mode: 'overwrite' | 'duplicate' = 'overwrite') => {
        if (mode === 'duplicate') {
            const newProject = {
                ...project,
                id: Math.random().toString(36).substring(2, 11),
                name: `${project.name} (Imported)`,
                updatedAt: new Date().toISOString()
            };
            addProject(newProject);
            toast("Project imported as copy", "success");
        } else {
            // Overwrite or fresh import
            const existing = state.projects.find(p => p.id === project.id);
            if (existing) {
                updateProject(project);
                toast("Project overwritten successfully", "success");
            } else {
                addProject(project);
                toast("Project imported successfully", "success");
            }
        }

        setIsImportConflictModalOpen(false);
        setImportCandidate(null);
    };

    const getPhoneName = (id: string) => state.phones.find(p => p.id === id)?.name || 'Unknown';
    const getTemplateName = (id: string) => state.templates.find(t => t.id === id)?.name || 'Unknown';

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto text-left">
            <div className="max-w-5xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
                    <Button action={ACTIONS.MPCS_NAV_GENERATE} onClick={() => navigate('/generate')}>
                        Create New Project
                    </Button>
                </div>

                {/* Import Drop Zone */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <ImportDropZone
                        onFileSelected={handleFileImport}
                        isLoading={isImportLoading}
                    />
                </div>

                <Card className="p-0 overflow-hidden bg-white border border-slate-200 rounded-lg shadow-sm">
                    {state.projects.length === 0 ? (
                        <EmptyState
                            icon={FolderOpen}
                            title="No projects saved"
                            description="Generate your first comparison project or import one to see it here"
                            actionLabel="Create Project"
                            actionId={ACTIONS.MPCS_NAV_GENERATE}
                            onAction={() => navigate('/generate')}
                        />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {state.projects.map((project) => (
                                <div key={project.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-100/50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <FolderOpen className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                                            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{getTemplateName(project.templateId)}</Badge>
                                            {project.aspectRatioOverride && (
                                                <Badge variant="success" className="text-[10px] hidden sm:inline-flex">
                                                    <Maximize2 className="w-3 h-3 mr-1" />
                                                    {formatAspectRatio(project.aspectRatioOverride)}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <span className="font-medium text-slate-700">{getPhoneName(project.phoneAId)}</span>
                                                <span className="text-slate-400">vs</span>
                                                <span className="font-medium text-slate-700">{getPhoneName(project.phoneBId)}</span>
                                            </span>
                                            <span className="flex items-center gap-1 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(project.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="secondary" action={ACTIONS.MPCS_PROJECTS_OPEN} onClick={() => navigate(`/projects/${project.id}`)}>
                                            <Eye className="w-4 h-4 mr-2" /> Open
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            action={ACTIONS.MPCS_PROJECTS_EXPORT}
                                            onClick={() => handleExport(project)}
                                            title="Export JSON"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="danger" action={ACTIONS.MPCS_PROJECTS_DELETE} onClick={() => confirmDelete(project.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Project"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_PROJECTS_DELETE} onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" action={ACTIONS.MPCS_PROJECTS_DELETE} onClick={handleDelete}>Delete Project</Button>
                    </>
                }
            >
                <p className="text-slate-600 text-left">Are you sure you want to delete this project? This cannot be undone.</p>
            </Modal>

            {/* Import Conflict Modal */}
            <Modal
                isOpen={isImportConflictModalOpen}
                onClose={() => {
                    setIsImportConflictModalOpen(false);
                    setImportCandidate(null);
                }}
                title="Project Already Exists"
                size="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            action={ACTIONS.MPCS_PROJECTS_IMPORT_CANCEL}
                            onClick={() => {
                                setIsImportConflictModalOpen(false);
                                setImportCandidate(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            action={ACTIONS.MPCS_PROJECTS_IMPORT_CONFIRM_DUPLICATE}
                            onClick={() => importCandidate && finalizeImport(importCandidate, 'duplicate')}
                        >
                            Duplicate as New
                        </Button>
                        <Button
                            variant="danger"
                            action={ACTIONS.MPCS_PROJECTS_IMPORT_CONFIRM_OVERWRITE}
                            onClick={() => importCandidate && finalizeImport(importCandidate, 'overwrite')}
                        >
                            Overwrite Existing
                        </Button>
                    </>
                }
            >
                <div className="text-left space-y-4">
                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">ID Collision Detected</p>
                            <p className="text-sm mt-1">
                                A project with the ID <strong>{importCandidate?.id}</strong> already exists in your local storage.
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-600">
                        You can choose to <strong>Overwrite</strong> the existing project (destructive) or <strong>Duplicate</strong> it as a new project with a new ID (recommended).
                    </p>
                </div>
            </Modal>
        </div>
    );
}
