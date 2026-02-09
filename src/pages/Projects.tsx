import { useState } from 'react';
import { FolderOpen, Eye, Trash2, Download, Calendar, Maximize2 } from 'lucide-react';
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

export function Projects() {
    const { state, deleteProject } = useAppStore();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

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

                <Card className="p-0 overflow-hidden bg-white border border-slate-200 rounded-lg shadow-sm">
                    {state.projects.length === 0 ? (
                        <EmptyState
                            icon={FolderOpen}
                            title="No projects saved"
                            description="Generate your first comparison project to see it here"
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
                                        <Button size="sm" variant="secondary" action={ACTIONS.MPCS_PROJECTS_EXPORT} disabled title="Coming in Phase 2">
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
        </div>
    );
}
