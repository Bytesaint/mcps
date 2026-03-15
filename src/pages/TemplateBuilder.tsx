import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import {
    ArrowLeft, Type, Image as ImageIcon, Box, Save, Palette, Undo, Redo
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type {
    Template, SceneElement, SceneElementType, SceneLayout, SceneOverride, Scene
} from '../types/models';
import { SceneStage } from '../features/editor/SceneStage';
import { LayersPanel } from '../features/editor/LayersPanel';
import { PropertiesPanel } from '../features/editor/PropertiesPanel';
import { getEffectivePages } from '../lib/templatePages';
import { useToast } from '../components/Toast';

const HISTORY_LIMIT = 50;

interface LayoutHistory {
    past: SceneLayout[];
    present: SceneLayout;
    future: SceneLayout[];
}

function cloneLayout(l: SceneLayout): SceneLayout {
    return JSON.parse(JSON.stringify(l));
}

function makeDefaultLayout(): SceneLayout {
    return { elements: [], backgroundColor: '#000000' };
}

export function TemplateBuilder() {
    const { templateId, pageId } = useParams<{ templateId: string; pageId?: string }>();
    const navigate = useNavigate();
    const { state, updateTemplate } = useAppStore();
    const { toast } = useToast();

    const [template, setTemplate] = useState<Template | null>(null);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(pageId || null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    
    // Default zoom
    const [zoom] = useState(1);
    
    // History per page keyed by pageId
    const historyRef = useRef<Record<string, LayoutHistory>>({});

    // ─── Load template ───────────────────────────────────────────────────

    useEffect(() => {
        if (!templateId || !state.templates) return;
        const found = state.templates.find((t) => t.id === templateId);
        if (!found) return;
        setTemplate(found);
        
        const pages = getEffectivePages(found);
        if (!selectedPageId && pages.length > 0) {
            setSelectedPageId(pages[0].id);
        } else if (selectedPageId && !pages.find(p => p.id === selectedPageId)) {
            // If URL pageId is invalid, fallback to first
            if (pages.length > 0) setSelectedPageId(pages[0].id);
        }
    }, [templateId, state.templates, selectedPageId]);

    // ─── Current page helpers ─────────────────────────────────────────────

    const effectivePages = template ? getEffectivePages(template) : [];
    const currentPage = effectivePages.find((p) => p.id === selectedPageId) ?? null;

    const getCurrentLayout = useCallback((): SceneLayout => {
        if (!currentPage?.layout) return makeDefaultLayout();
        return currentPage.layout;
    }, [currentPage]);

    // ─── History helpers ─────────────────────────────────────────────────

    const getHistory = useCallback((): LayoutHistory => {
        const id = selectedPageId;
        if (!id) return { past: [], present: makeDefaultLayout(), future: [] };
        if (!historyRef.current[id]) {
            historyRef.current[id] = {
                past: [],
                present: cloneLayout(getCurrentLayout()),
                future: [],
            };
        }
        return historyRef.current[id];
    }, [selectedPageId, getCurrentLayout]);

    const pushHistory = useCallback(
        (newLayout: SceneLayout) => {
            const id = selectedPageId;
            if (!id) return;
            const h = getHistory();
            historyRef.current[id] = {
                past: [...h.past.slice(-HISTORY_LIMIT + 1), cloneLayout(h.present)],
                present: cloneLayout(newLayout),
                future: [],
            };
        },
        [selectedPageId, getHistory]
    );

    const canUndo = getHistory().past.length > 0;
    const canRedo = getHistory().future.length > 0;

    const handleUndo = useCallback(() => {
        const id = selectedPageId;
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
    }, [selectedPageId, getHistory]);

    const handleRedo = useCallback(() => {
        const id = selectedPageId;
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
    }, [selectedPageId, getHistory]);

    // Keyboard shortcuts
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
        (pageId: string, layout: SceneLayout, saveToStore = true) => {
            setTemplate((prev) => {
                if (!prev) return prev;
                const pages = getEffectivePages(prev);
                const updatedPages = pages.map((p) =>
                    p.id === pageId ? { ...p, layout } : p
                );
                const updated = { ...prev, pages: updatedPages };
                if (saveToStore) updateTemplate(updated);
                return updated;
            });
        },
        [updateTemplate]
    );

    const mutateLayout = useCallback(
        (mutator: (layout: SceneLayout) => SceneLayout) => {
            if (!selectedPageId) return;
            const newLayout = mutator(cloneLayout(getCurrentLayout()));
            pushHistory(newLayout);
            applyLayout(selectedPageId, newLayout);
        },
        [selectedPageId, getCurrentLayout, pushHistory, applyLayout]
    );

    const handleUpdateTiming = useCallback(
        (updates: Partial<SceneOverride>) => {
            if (!template || !selectedPageId || !currentPage) return;
            if (updates.timing) {
                const updatedPages = effectivePages.map((p) =>
                    p.id === selectedPageId
                        ? { ...p, timing: { ...p.timing, ...updates.timing! } }
                        : p
                );
                const updated = { ...template, pages: updatedPages };
                setTemplate(updated);
                updateTemplate(updated);
            }
        },
        [template, selectedPageId, currentPage, effectivePages, updateTemplate]
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
    
    const handleAddPlaceholder = (placeholderKey: string) => {
        mutateLayout((layout) => {
            const maxZ = layout.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
            const newEl: SceneElement = {
                id: crypto.randomUUID(),
                type: 'text',
                name: `${placeholderKey} Text`,
                x: 25,
                y: 40,
                width: 50,
                height: 20,
                zIndex: maxZ + 1,
                opacity: 1,
                locked: false,
                hidden: false,
                content: `{${placeholderKey}}`,
                fontSize: 32,
                color: '#ffffff',
                textAlign: 'center',
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

    // ─── Page selection ──────────────────────────────────────────────────

    const handleSelectPage = (id: string) => {
        navigate(`/templates/${templateId}/builder/${id}`, { replace: true });
        setSelectedPageId(id);
        setSelectedElementId(null);
        // Seed history for newly selected page
        setTimeout(() => {
            const h = historyRef.current[id];
            if (!h) {
                const page = effectivePages.find((p) => p.id === id);
                historyRef.current[id] = {
                    past: [],
                    present: cloneLayout(page?.layout ?? makeDefaultLayout()),
                    future: [],
                };
            }
        }, 0);
    };

    const handleSave = () => {
        if (template) {
            updateTemplate({ ...template, updatedAt: new Date().toISOString() });
            toast('Template saved', 'success');
        }
    };

    // ─── Derived values ───────────────────────────────────────────────────

    if (!template) return null;

    const currentElements = getCurrentLayout().elements;
    const selectedElement = currentElements.find((e) => e.id === selectedElementId) ?? null;
    const currentLayout = getCurrentLayout();
    const bgColor = currentLayout.backgroundColor || '#000000';

    // Create a mock Scene for the SceneStage backwards compatibility
    const mockScene: Scene | null = currentPage ? {
        id: currentPage.id,
        type: currentPage.baseType as any,
        label: currentPage.label,
        auto: { description: '', scoreA: 0, scoreB: 0, winner: null },
        override: {
            layout: currentPage.layout,
            timing: currentPage.timing
        },
        timing: currentPage.timing
    } : null;

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* ── Header ────────────────────────────────────────────────── */}
            <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-900 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/templates')}
                        className="hover:bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-bold text-base truncate max-w-[180px]">Edit Template: {template.name}</h1>
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
                            title="Background Color"
                        />
                    </div>

                    <div className="w-px h-6 bg-slate-700" />

                    <Button size="sm" variant="primary" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-1.5" /> Save
                    </Button>
                </div>
            </header>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left panel: Page List + Layers */}
                <div className="w-64 border-r border-slate-700 bg-slate-800 flex flex-col shrink-0 overflow-hidden">
                    {/* Page List */}
                    <div className="p-3 border-b border-slate-700 shrink-0 max-h-[40%] overflow-y-auto">
                        <h2 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wide">Pages</h2>
                        <div className="space-y-1">
                            {effectivePages.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectPage(p.id)}
                                    className={`w-full text-left px-3 py-2 flex items-center justify-between rounded text-sm transition-colors ${
                                        selectedPageId === p.id 
                                            ? 'bg-blue-600 font-medium text-white' 
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                            selectedPageId === p.id ? 'bg-blue-500' : 'bg-slate-600'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="truncate">{p.label}</span>
                                    </div>
                                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                                        selectedPageId === p.id ? 'bg-blue-700' : 'bg-slate-900 border border-slate-700 text-slate-400'
                                    }`}>
                                        {p.baseType}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Add Elements toolbar */}
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
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                            <button
                                onClick={() => handleAddPhoneImage('phoneA')}
                                className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-blue-700 rounded-lg transition-colors text-[9px] text-slate-300 hover:text-white"
                            >
                                📱 Phone A
                            </button>
                            <button
                                onClick={() => handleAddPhoneImage('phoneB')}
                                className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-blue-700 rounded-lg transition-colors text-[9px] text-slate-300 hover:text-white"
                            >
                                📱 Phone B
                            </button>
                        </div>
                        <div className="mt-2">
                             <select
                                className="w-full bg-slate-700 border border-slate-600 text-[10px] rounded p-1.5 text-slate-300 outline-none"
                                onChange={(e) => {
                                    if(e.target.value) {
                                        handleAddPlaceholder(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            >
                                <option value="">+ Add Placeholder Text...</option>
                                <option value="PHONE_A">Phone A Name</option>
                                <option value="PHONE_B">Phone B Name</option>
                                <option value="SPEC_NAME">Spec Name</option>
                                <option value="SPEC_A">Spec A Value</option>
                                <option value="SPEC_B">Spec B Value</option>
                                <option value="WINNER">Winner Label</option>
                                <option value="SCORE_A_TOTAL">Score A Total</option>
                                <option value="SCORE_B_TOTAL">Score B Total</option>
                            </select>
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

                {/* Center: Stage */}
                <div className="flex-1 bg-black/90 flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                        {mockScene ? (
                            <SceneStage
                                scene={mockScene}
                                zoom={zoom}
                                phones={{}} // Generic phones context for template building 
                                onUpdateElement={handleUpdateElement}
                                onSelectElement={setSelectedElementId}
                                selectedElementId={selectedElementId}
                            />
                        ) : (
                            <div className="text-slate-500 text-sm">Select a page to edit</div>
                        )}
                    </div>
                </div>

                {/* Right panel: Properties & Timing */}
                <div className="w-64 border-l border-slate-700 bg-slate-800 shrink-0 hidden lg:block overflow-hidden">
                    <PropertiesPanel
                        element={selectedElement}
                        sceneOverride={mockScene?.override}
                        onUpdate={(updates) =>
                            selectedElementId && handleUpdateElement(selectedElementId, updates)
                        }
                        onUpdateOverride={handleUpdateTiming}
                    />
                </div>
            </div>
        </div>
    );
}
