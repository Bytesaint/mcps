import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SecureGate } from '../../components/SecureGate';
import { Button } from '../../components/Button';
import { ArrowLeft, Type, Image as ImageIcon, Box, MonitorPlay, Download, Save } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Project, SceneElement, SceneElementType } from '../../types/models';
import { SceneStage } from './SceneStage';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { Timeline } from './Timeline';
import { useToast } from '../../components/Toast';
import { ExportModal } from '../export/ExportModal';

export function EditorLayout() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { state, dispatch } = useAppStore();
    const { toast } = useToast();

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Load Project
    useEffect(() => {
        if (projectId && state.projects) {
            const found = state.projects.find(p => p.id === projectId);
            if (found) {
                setProject(found);
                // Select first scene by default if none selected
                if (!selectedSceneId && found.scenes && found.scenes.length > 0) {
                    setSelectedSceneId(found.scenes[0].id);
                }
            }
        }
    }, [projectId, state.projects, selectedSceneId]);

    const currentScene = project?.scenes?.find(s => s.id === selectedSceneId);

    const handleSelectScene = (id: string) => {
        setSelectedSceneId(id);
        setSelectedElementId(null);
    };

    const handleSelectElement = (id: string | null) => {
        setSelectedElementId(id);
    };

    const handleUpdateElement = (id: string, updates: Partial<SceneElement>) => {
        if (!project || !currentScene) return;

        const elements = [...(currentScene.override?.layout?.elements || [])];
        const index = elements.findIndex(e => e.id === id);

        if (index !== -1) {
            elements[index] = { ...elements[index], ...updates };

            const updatedScenes = project.scenes?.map(s =>
                s.id === currentScene.id
                    ? {
                        ...s,
                        override: {
                            ...(s.override || {}),
                            layout: {
                                ...(s.override?.layout || { elements: [] }),
                                elements
                            }
                        }
                    }
                    : s
            );

            const updatedProject = { ...project, scenes: updatedScenes };
            setProject(updatedProject); // Local optimistic update
            dispatch({
                type: 'MPCS_PROJECTS_EDIT',
                payload: updatedProject
            });
        }
    };

    const handleAddElement = (type: SceneElementType) => {
        if (!project || !currentScene) return;

        const newElement: SceneElement = {
            id: crypto.randomUUID(),
            type: type as any,
            name: `${type} ${((currentScene.override?.layout?.elements?.length || 0) + 1)}`,
            x: 50,
            y: 50,
            width: type === 'text' ? 200 : 100,
            height: type === 'text' ? 50 : 100,
            zIndex: (currentScene.override?.layout?.elements?.length || 0) + 1,
            opacity: 1,
            locked: false,
            hidden: false,
            ...(type === 'text' ? {
                content: 'New Text',
                fontSize: 24,
                color: '#000000',
                textAlign: 'center'
            } : {}),
            ...(type === 'box' ? {
                backgroundColor: '#3b82f6',
                borderRadius: 0,
                borderWidth: 0,
            } : {}),
            ...(type === 'image' ? {
                sourceType: 'custom',
                fit: 'cover'
            } : {})
        } as SceneElement;

        const elements = [...(currentScene.override?.layout?.elements || []), newElement];

        const updatedScenes = project.scenes?.map(s =>
            s.id === currentScene.id
                ? {
                    ...s,
                    override: {
                        ...(s.override || {}),
                        layout: {
                            ...(s.override?.layout || { elements: [] }),
                            elements
                        }
                    }
                }
                : s
        );

        const updatedProject = { ...project, scenes: updatedScenes };
        setProject(updatedProject);
        dispatch({
            type: 'MPCS_PROJECTS_EDIT',
            payload: updatedProject
        });

        setSelectedElementId(newElement.id);
    };

    if (!isUnlocked) return <SecureGate onUnlock={() => setIsUnlocked(true)} />;
    if (!project) return null;

    const currentElements = currentScene?.override?.layout?.elements || [];
    const selectedElement = currentElements.find(e => e.id === selectedElementId) || null;

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-900 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/projects')} className="hover:bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-bold text-lg truncate max-w-[200px]">{project.name}</h1>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-900 text-blue-200 font-medium border border-blue-700">BETA</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white shadow-sm flex items-center gap-2">
                            <MonitorPlay className="w-3 h-3" /> Editor
                        </button>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white flex items-center gap-2 transition-colors hover:bg-slate-700"
                        >
                            <Download className="w-3 h-3" /> Export
                        </button>
                    </div>
                    <Button size="sm" variant="primary" onClick={() => toast("Project Saved", "success")}>
                        <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Assets & Layers */}
                <div className="w-16 md:w-64 border-r border-slate-700 bg-slate-800 flex flex-col shrink-0">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 shrink-0">
                            <h2 className="text-xs font-bold uppercase text-slate-500 mb-3">Add Elements</h2>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleAddElement('text')} className="flex flex-col items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors gap-1 group">
                                    <Type className="w-4 h-4 text-slate-300 group-hover:text-white" />
                                    <span className="text-[10px] text-slate-400 group-hover:text-white">Text</span>
                                </button>
                                <button onClick={() => handleAddElement('image')} className="flex flex-col items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors gap-1 group">
                                    <ImageIcon className="w-4 h-4 text-slate-300 group-hover:text-white" />
                                    <span className="text-[10px] text-slate-400 group-hover:text-white">Image</span>
                                </button>
                                <button onClick={() => handleAddElement('box')} className="flex flex-col items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors gap-1 group">
                                    <Box className="w-4 h-4 text-slate-300 group-hover:text-white" />
                                    <span className="text-[10px] text-slate-400 group-hover:text-white">Box</span>
                                </button>
                            </div>
                        </div>

                        <LayersPanel
                            elements={currentElements}
                            selectedElementId={selectedElementId}
                            onSelectElement={handleSelectElement}
                            onUpdateElement={handleUpdateElement}
                            onReorderElement={() => { }}
                        />
                    </div>
                </div>

                {/* Center: Stage */}
                <div className="flex-1 bg-black/90 relative flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                        {currentScene ? (
                            <SceneStage
                                scene={currentScene}
                                zoom={zoom}
                                onUpdateElement={handleUpdateElement}
                                onSelectElement={handleSelectElement}
                                selectedElementId={selectedElementId}
                            />
                        ) : (
                            <div className="text-slate-500">No scene selected</div>
                        )}
                    </div>

                    {/* Bottom: Timeline */}
                    <div className="h-48 shrink-0">
                        <Timeline
                            scenes={project.scenes || []}
                            currentSceneId={selectedSceneId}
                            isPlaying={isPlaying}
                            onSelectScene={handleSelectScene}
                            onPlayPause={() => setIsPlaying(!isPlaying)}
                        />
                    </div>
                </div>

                {/* Right Sidebar: Properties */}
                <div className="w-64 border-l border-slate-700 bg-slate-800 hidden lg:block shrink-0">
                    <PropertiesPanel
                        element={selectedElement}
                        onUpdate={(updates) => selectedElementId && handleUpdateElement(selectedElementId, updates)}
                    />
                </div>
            </div>

            {/* Modals */}
            <ExportModal
                project={project}
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    );
}
