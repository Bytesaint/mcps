import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Smartphone, LayoutTemplate, Maximize2, Edit2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAppStore } from '../store/appStore';
import { ACTIONS } from '../actionMap';
import { formatAspectRatio, getDefaultAspectRatio } from '../types/aspectRatio';
import PreviewStage from '../components/PreviewStage';

export function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state } = useAppStore();

    const project = state.projects.find(p => p.id === id);
    const template = project ? state.templates.find(t => t.id === project.templateId) : null;
    const phoneA = project ? state.phones.find(p => p.id === project.phoneAId) : null;
    const phoneB = project ? state.phones.find(p => p.id === project.phoneBId) : null;

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
                                Preview
                            </h3>
                            <PreviewStage aspectRatio={aspectRatio}>
                                <div className="text-center text-white">
                                    <h1 className="text-4xl font-bold mb-4">
                                        {phoneA?.name || 'Phone A'}
                                    </h1>
                                    <p className="text-2xl text-slate-400 mb-8">VS</p>
                                    <h1 className="text-4xl font-bold">
                                        {phoneB?.name || 'Phone B'}
                                    </h1>
                                    <p className="mt-8 text-sm text-slate-400">
                                        Full comparison video generation coming in Phase 3
                                    </p>
                                </div>
                            </PreviewStage>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
