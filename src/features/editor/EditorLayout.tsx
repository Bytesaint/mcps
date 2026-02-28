/**
 * EditorLayout.tsx
 *
 * Main visual editor layout. Phase 3 features:
 * - Scene sidebar list
 * - Undo/redo history stack (Ctrl+Z / Ctrl+Y)
 * - Phone image resolution from store
 * - Background color picker
 * - Full PropertiesPanel integration with scene timing
 * - Duplicate & move layer actions
 * - Export modal integration
 * - Phase 3 feature flag check
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import {
    ArrowLeft, Type, Image as ImageIcon, Box, MonitorPlay,
    Download, Save, Palette, Undo, Redo,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type {
    Project, SceneElement, SceneElementType, SceneLayout, SceneOverride, Phone,
} from '../../types/models';
import { SceneStage } from './SceneStage';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { Timeline } from './Timeline';
import { useToast } from '../../components/Toast';
import { ExportModal } from '../export/ExportModal';
import { getPhase3Enabled } from '../../store/settingsStore';

const HISTORY_LIMIT = 50;

interface LayoutHistory {
    past: SceneLayout[];
    present: SceneLayout;
    future: SceneLayout[];
}

function makeDefaultLayout(): SceneLayout {
    return { elements: [], backgroundColor: '#000000' };
}

function cloneLayout(l: SceneLayout): SceneLayout {
    return JSON.parse(JSON.stringify(l));
}

// ─── Phone image URL resolver ────────────────────────────────────────────────

async function resolvePhoneUrls(phone: Phone | undefined): Promise<string | undefined> {
    if (!phone) return undefined;
    // Phone images are stored as base64 dataUrls in phone.image.dataUrl
    if (phone.image?.dataUrl) return phone.image.dataUrl;
    // Future: could also be stored in IDB
    return undefined;
}

// ─── EditorLayout ────────────────────────────────────────────────────────────

export function EditorLayout() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { state, updateProject } = useAppStore();
    const { toast } = useToast();

    const phase3Enabled = getPhase3Enabled();

    const [project, setProject] = useState<Project | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [phones, setPhones] = useState<{ a?: string; b?: string }>({});

    // History per scene keyed by sceneId
    const historyRef = useRef<Record<string, LayoutHistory>>({});

    // ─── Load project ────────────────────────────────────────────────────

    useEffect(() => {
        if (!projectId || !state.projects) return;
        const found = state.projects.find((p) => p.id === projectId);
        if (!found) return;
        setProject(found);
        if (!selectedSceneId && found.scenes?.length) {
            setSelectedSceneId(found.scenes[0].id);
        }
    }, [projectId, state.projects, selectedSceneId]);

    // ─── Resolve phone URLs ──────────────────────────────────────────────

    useEffect(() => {
        if (!project) return;
        const phoneA = state.phones.find((p) => p.id === project.phoneAId);
        const phoneB = state.phones.find((p) => p.id === project.phoneBId);

        Promise.all([resolvePhoneUrls(phoneA), resolvePhoneUrls(phoneB)]).then(
            ([a, b]) => setPhones({ a, b })
        );
    }, [project, state.phones]);

    // ─── Current scene helpers ────────────────────────────────────────────

    const currentScene = project?.scenes?.find((s) => s.id === selectedSceneId) ?? null;

    const getCurrentLayout = useCallback((): SceneLayout => {
        if (!currentScene?.override?.layout) return makeDefaultLayout();
        return currentScene.override.layout;
    }, [currentScene]);

    // ─── History helpers ─────────────────────────────────────────────────

    const getHistory = useCallback((): LayoutHistory => {
        const id = selectedSceneId;
        if (!id) return { past: [], present: makeDefaultLayout(), future: [] };
        if (!historyRef.current[id]) {
            historyRef.current[id] = {
                past: [],
                present: cloneLayout(getCurrentLayout()),
                future: [],
            };
        }
        return historyRef.current[id];
    }, [selectedSceneId, getCurrentLayout]);

    const pushHistory = useCallback(
        (newLayout: SceneLayout) => {
            const id = selectedSceneId;
            if (!id) return;
            const h = getHistory();
            historyRef.current[id] = {
                past: [...h.past.slice(-HISTORY_LIMIT + 1), cloneLayout(h.present)],
                present: cloneLayout(newLayout),
                future: [],
            };
        },
        [selectedSceneId, getHistory]
    );

    const canUndo = getHistory().past.length > 0;
    const canRedo = getHistory().future.length > 0;

    const handleUndo = useCallback(() => {
        const id = selectedSceneId;
        if (!id) return;
        const h = getHistory();
        if (!h.past.length) return;
        const previous = h.past[h.past.length - 1];
        historyRef.current[id] = {
            past: h.past.slice(0, -1),
            present: previous,
            future: [cloneLayout(h.present), ...h.future],
        };
        applyLayout(id, previous);
    }, [selectedSceneId, getHistory]);

    const handleRedo = useCallback(() => {
        const id = selectedSceneId;
        if (!id) return;
        const h = getHistory();
        if (!h.future.length) return;
        const next = h.future[0];
        historyRef.current[id] = {
            past: [...h.past, cloneLayout(h.present)],
            present: next,
            future: h.future.slice(1),
        };
        applyLayout(id, next);
    }, [selectedSceneId, getHistory]);

    // ─── Keyboard shortcuts ───────────────────────────────────────────────

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndo, handleRedo]);

    // ─── Core layout mutation ─────────────────────────────────────────────

    const applyLayout = useCallback(
        (sceneId: string, layout: SceneLayout, saveToStore = true) => {
            setProject((prev) => {
                if (!prev) return prev;
                const updatedScenes = prev.scenes?.map((s) =>
                    s.id === sceneId
                        ? { ...s, override: { ...(s.override || {}), layout } }
                        : s
                );
                const updated = { ...prev, scenes: updatedScenes };
                if (saveToStore) updateProject(updated);
                return updated;
            });
        },
        [updateProject]
    );

    const mutateLayout = useCallback(
        (mutator: (layout: SceneLayout) => SceneLayout) => {
            if (!selectedSceneId) return;
            const newLayout = mutator(cloneLayout(getCurrentLayout()));
            pushHistory(newLayout);
            applyLayout(selectedSceneId, newLayout);
        },
        [selectedSceneId, getCurrentLayout, pushHistory, applyLayout]
    );

    // ─── Override mutations (timing, transition) ─────────────────────────

    const handleUpdateOverride = useCallback(
        (updates: Partial<SceneOverride>) => {
            if (!project || !selectedSceneId) return;
            const updatedScenes = project.scenes?.map((s) =>
                s.id === selectedSceneId
                    ? { ...s, override: { ...(s.override || {}), ...updates } }
                    : s
            );
            const updated = { ...project, scenes: updatedScenes };
            setProject(updated);
            updateProject(updated);
        },
        [project, selectedSceneId, updateProject]
    );

    // ─── Element actions ──────────────────────────────────────────────────

    const handleAddElement = (type: SceneElementType) => {
        mutateLayout((layout) => {
            const maxZ = layout.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
            const base: SceneElement = {
                id: crypto.randomUUID(),
                type: type as SceneElement['type'],
                name: `${type} ${layout.elements.length + 1}`,
                x: 10,
                y: 10,
                width: type === 'text' ? 50 : 30,
                height: type === 'text' ? 15 : 30,
                zIndex: maxZ + 1,
                opacity: 1,
                locked: false,
                hidden: false,
            } as SceneElement;

            const extra: Partial<SceneElement> =
                type === 'text'
                    ? { content: 'New Text', fontSize: 24, color: '#ffffff', textAlign: 'center' } as Partial<SceneElement>
                    : type === 'box'
                        ? { backgroundColor: '#3b82f6', borderRadius: 8 } as Partial<SceneElement>
                        : { sourceType: 'custom', fit: 'cover' } as Partial<SceneElement>;

            const newEl = { ...base, ...extra } as SceneElement;
            setSelectedElementId(newEl.id);
            return { ...layout, elements: [...layout.elements, newEl] };
        });
    };

    const handleAddPhoneImage = (sourceType: 'phoneA' | 'phoneB') => {
        mutateLayout((layout) => {
            const maxZ = layout.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
            const newEl: SceneElement = {
                id: crypto.randomUUID(),
                type: 'image',
                name: sourceType === 'phoneA' ? 'Phone A' : 'Phone B',
                x: sourceType === 'phoneA' ? 5 : 55,
                y: 15,
                width: 40,
                height: 55,
                zIndex: maxZ + 1,
                opacity: 1,
                locked: false,
                hidden: false,
                sourceType,
                fit: 'contain',
            } as SceneElement;
            setSelectedElementId(newEl.id);
            return { ...layout, elements: [...layout.elements, newEl] };
        });
    };

    const handleUpdateElement = useCallback(
        (id: string, updates: Partial<SceneElement>) => {
            mutateLayout((layout) => ({
                ...layout,
                elements: layout.elements.map((e) =>
                    e.id === id ? ({ ...e, ...updates } as SceneElement) : e
                ),
            }));
        },
        [mutateLayout]
    );

    const handleDeleteElement = useCallback(
        (id: string) => {
            mutateLayout((layout) => ({
                ...layout,
                elements: layout.elements.filter((e) => e.id !== id),
            }));
            if (selectedElementId === id) setSelectedElementId(null);
        },
        [mutateLayout, selectedElementId]
    );

    const handleDuplicateElement = useCallback(
        (id: string) => {
            mutateLayout((layout) => {
                const source = layout.elements.find((e) => e.id === id);
                if (!source) return layout;
                const maxZ = layout.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
                const copy: SceneElement = {
                    ...cloneLayout({ elements: [source], backgroundColor: '' }).elements[0],
                    id: crypto.randomUUID(),
                    name: `${source.name} copy`,
                    x: Math.min(90, source.x + 3),
                    y: Math.min(90, source.y + 3),
                    zIndex: maxZ + 1,
                } as SceneElement;
                setSelectedElementId(copy.id);
                return { ...layout, elements: [...layout.elements, copy] };
            });
        },
        [mutateLayout]
    );

    const handleMoveElement = useCallback(
        (id: string, direction: 'up' | 'down') => {
            mutateLayout((layout) => {
                const el = layout.elements.find((e) => e.id === id);
                if (!el) return layout;
                const delta = direction === 'up' ? 1 : -1;
                return {
                    ...layout,
                    elements: layout.elements.map((e) =>
                        e.id === id ? { ...e, zIndex: e.zIndex + delta } : e
                    ),
                };
            });
        },
        [mutateLayout]
    );

    const handleBackgroundColor = (color: string) => {
        mutateLayout((layout) => ({ ...layout, backgroundColor: color }));
    };

    // ─── Scene selection ──────────────────────────────────────────────────

    const handleSelectScene = (id: string) => {
        setSelectedSceneId(id);
        setSelectedElementId(null);
        // Seed history for newly selected scene
        setTimeout(() => {
            const h = historyRef.current[id];
            if (!h) {
                const scene = project?.scenes?.find((s) => s.id === id);
                historyRef.current[id] = {
                    past: [],
                    present: cloneLayout(scene?.override?.layout ?? makeDefaultLayout()),
                    future: [],
                };
            }
        }, 0);
    };

    const handleSave = () => {
        if (project) {
            updateProject({ ...project, updatedAt: new Date().toISOString() });
            toast('Project saved', 'success');
        }
    };

    // ─── Derived values ───────────────────────────────────────────────────

    if (!project) return null;

    const currentElements = getCurrentLayout().elements;
    const selectedElement = currentElements.find((e) => e.id === selectedElementId) ?? null;
    const currentLayout = getCurrentLayout();
    const bgColor = currentLayout.backgroundColor || '#000000';

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* ── Header ────────────────────────────────────────────────── */}
            <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-900 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/projects')}
                        className="hover:bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-bold text-base truncate max-w-[180px]">{project.name}</h1>
                    {!phase3Enabled && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-900 text-amber-200 font-medium border border-amber-700">
                            Phase 3 Disabled
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Undo / Redo */}
                    <div className="flex gap-1">
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="p-2 rounded-lg disabled:opacity-30 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="p-2 rounded-lg disabled:opacity-30 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-700" />

                    {/* Background color */}
                    <div className="flex items-center gap-1 text-slate-400">
                        <Palette className="w-4 h-4" />
                        <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => handleBackgroundColor(e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-600 p-0.5"
                            title="Scene Background Color"
                        />
                    </div>

                    <div className="w-px h-6 bg-slate-700" />

                    {/* Mode tabs */}
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white shadow-sm flex items-center gap-1.5">
                            <MonitorPlay className="w-3 h-3" /> Editor
                        </button>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors hover:bg-slate-700"
                        >
                            <Download className="w-3 h-3" /> Export
                        </button>
                    </div>

                    <Button size="sm" variant="primary" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-1.5" /> Save
                    </Button>
                </div>
            </header>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left panel: elements + layers */}
                <div className="w-56 border-r border-slate-700 bg-slate-800 flex flex-col shrink-0 overflow-hidden">

                    {/* Add Elements */}
                    <div className="p-3 border-b border-slate-700 shrink-0">
                        <h2 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wide">Add Elements</h2>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { label: 'Text', icon: <Type className="w-3.5 h-3.5" />, action: () => handleAddElement('text') },
                                { label: 'Box', icon: <Box className="w-3.5 h-3.5" />, action: () => handleAddElement('box') },
                                { label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, action: () => handleAddElement('image') },
                            ].map(({ label, icon, action }) => (
                                <button
                                    key={label}
                                    onClick={action}
                                    className="flex flex-col items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors gap-1 group"
                                >
                                    <span className="text-slate-300 group-hover:text-white">{icon}</span>
                                    <span className="text-[9px] text-slate-400 group-hover:text-white">{label}</span>
                                </button>
                            ))}
                        </div>
                        {/* Phone shortcuts */}
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                            <button
                                onClick={() => handleAddPhoneImage('phoneA')}
                                className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-blue-700 rounded-lg transition-colors text-[9px] text-slate-300 hover:text-white"
                            >
                                📱 A
                            </button>
                            <button
                                onClick={() => handleAddPhoneImage('phoneB')}
                                className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-blue-700 rounded-lg transition-colors text-[9px] text-slate-300 hover:text-white"
                            >
                                📱 B
                            </button>
                        </div>
                    </div>

                    {/* Layers panel */}
                    <LayersPanel
                        elements={currentElements}
                        selectedElementId={selectedElementId}
                        onSelectElement={setSelectedElementId}
                        onUpdateElement={handleUpdateElement}
                        onDeleteElement={handleDeleteElement}
                        onDuplicateElement={handleDuplicateElement}
                        onMoveElement={handleMoveElement}
                    />
                </div>

                {/* Center: Stage + Timeline */}
                <div className="flex-1 bg-black/90 flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                        {currentScene ? (
                            <SceneStage
                                scene={currentScene}
                                zoom={zoom}
                                phones={phones}
                                onUpdateElement={handleUpdateElement}
                                onSelectElement={setSelectedElementId}
                                selectedElementId={selectedElementId}
                            />
                        ) : (
                            <div className="text-slate-500 text-sm">Select a scene to edit</div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="h-44 shrink-0 border-t border-slate-700">
                        <Timeline
                            scenes={project.scenes ?? []}
                            currentSceneId={selectedSceneId}
                            isPlaying={isPlaying}
                            onSelectScene={handleSelectScene}
                            onPlayPause={() => setIsPlaying((p) => !p)}
                        />
                    </div>
                </div>

                {/* Right panel: Properties */}
                <div className="w-64 border-l border-slate-700 bg-slate-800 shrink-0 hidden lg:block overflow-hidden">
                    <PropertiesPanel
                        element={selectedElement}
                        sceneOverride={currentScene?.override}
                        onUpdate={(updates) =>
                            selectedElementId && handleUpdateElement(selectedElementId, updates)
                        }
                        onUpdateOverride={handleUpdateOverride}
                    />
                </div>
            </div>

            {/* Scene list sidebar (right of properties on xl+, or bottom on smaller) */}
            {/* Embedded in the Timeline component for now */}

            {/* Export Modal */}
            <ExportModal
                project={project}
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    );
}
