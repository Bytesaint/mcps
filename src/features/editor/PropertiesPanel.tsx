/**
 * PropertiesPanel.tsx
 *
 * Full-featured properties inspector for the visual editor.
 * Shows different fields based on element type: text | image | box
 * Also shows Scene Timing section when no element is selected.
 */

import type {
    SceneElement,
    SceneTextElement,
    SceneImageElement,
    SceneBoxElement,
    SceneOverride,
} from '../../types/models';

// ─── Shared Sub-components ──────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide block">{label}</label>
            {children}
        </div>
    );
}

function TextInput({
    value,
    onChange,
    type = 'text',
    min,
    max,
    step,
}: {
    value: string | number;
    onChange: (v: string) => void;
    type?: 'text' | 'number';
    min?: number;
    max?: number;
    step?: number;
}) {
    return (
        <input
            type={type}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
        />
    );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-6 rounded cursor-pointer bg-transparent border border-slate-600 p-0"
            />
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-blue-500 outline-none"
            />
        </div>
    );
}

function SelectInput({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function SliderInput({
    value,
    onChange,
    min,
    max,
    step,
    label,
}: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    label?: string;
}) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between">
                {label && <span className="text-[10px] text-slate-400">{label}</span>}
                <span className="text-[10px] text-slate-500 ml-auto">{value.toFixed(step < 1 ? 2 : 0)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1">{title}</h4>
    );
}

function Divider() {
    return <div className="border-t border-slate-700/50" />;
}

// ─── Section: Common (position, size, opacity, z-index) ────────────────────

function CommonSection({
    element,
    onUpdate,
}: {
    element: SceneElement;
    onUpdate: (u: Partial<SceneElement>) => void;
}) {
    return (
        <div className="space-y-3">
            <SectionHeader title="Layout" />
            <div className="grid grid-cols-2 gap-2">
                <Row label="X (%)">
                    <TextInput
                        type="number"
                        value={Math.round(element.x * 10) / 10}
                        min={0} max={100} step={0.1}
                        onChange={(v) => onUpdate({ x: parseFloat(v) || 0 })}
                    />
                </Row>
                <Row label="Y (%)">
                    <TextInput
                        type="number"
                        value={Math.round(element.y * 10) / 10}
                        min={0} max={100} step={0.1}
                        onChange={(v) => onUpdate({ y: parseFloat(v) || 0 })}
                    />
                </Row>
                <Row label="W (%)">
                    <TextInput
                        type="number"
                        value={Math.round(element.width * 10) / 10}
                        min={0} max={100} step={0.1}
                        onChange={(v) => onUpdate({ width: parseFloat(v) || 1 })}
                    />
                </Row>
                <Row label="H (%)">
                    <TextInput
                        type="number"
                        value={Math.round(element.height * 10) / 10}
                        min={0} max={100} step={0.1}
                        onChange={(v) => onUpdate({ height: parseFloat(v) || 1 })}
                    />
                </Row>
            </div>

            <Row label="Rotation (°)">
                <TextInput
                    type="number"
                    value={element.rotation ?? 0}
                    min={-360} max={360} step={1}
                    onChange={(v) => onUpdate({ rotation: parseFloat(v) || 0 })}
                />
            </Row>

            <Divider />
            <SectionHeader title="Appearance" />

            <SliderInput
                label="Opacity"
                value={element.opacity ?? 1}
                onChange={(v) => onUpdate({ opacity: v })}
                min={0} max={1} step={0.05}
            />

            <Row label="Z-Index">
                <TextInput
                    type="number"
                    value={element.zIndex}
                    min={0} max={999}
                    onChange={(v) => onUpdate({ zIndex: parseInt(v) || 0 })}
                />
            </Row>

            <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!element.locked}
                        onChange={(e) => onUpdate({ locked: e.target.checked })}
                        className="accent-blue-500"
                    />
                    <span className="text-xs text-slate-300">Locked</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!element.hidden}
                        onChange={(e) => onUpdate({ hidden: e.target.checked })}
                        className="accent-blue-500"
                    />
                    <span className="text-xs text-slate-300">Hidden</span>
                </label>
            </div>
        </div>
    );
}

// ─── Section: Text ────────────────────────────────────────────────────────

function TextSection({
    element,
    onUpdate,
}: {
    element: SceneTextElement;
    onUpdate: (u: Partial<SceneTextElement>) => void;
}) {
    return (
        <div className="space-y-3">
            <SectionHeader title="Text" />
            <Row label="Content">
                <textarea
                    value={element.content}
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    rows={3}
                    placeholder="Enter text or {{placeholder}}"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none resize-none"
                />
            </Row>
            <div className="grid grid-cols-2 gap-2">
                <Row label="Font Size">
                    <TextInput
                        type="number"
                        value={element.fontSize}
                        min={6} max={200} step={1}
                        onChange={(v) => onUpdate({ fontSize: parseInt(v) || 14 })}
                    />
                </Row>
                <Row label="Weight">
                    <SelectInput
                        value={String(element.fontWeight || 'normal')}
                        onChange={(v) => onUpdate({ fontWeight: v })}
                        options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'bold', label: 'Bold' },
                            { value: '300', label: 'Light' },
                            { value: '600', label: 'Semi-Bold' },
                            { value: '800', label: 'Extra-Bold' },
                        ]}
                    />
                </Row>
            </div>
            <Row label="Font Family">
                <SelectInput
                    value={element.fontFamily || 'Inter, sans-serif'}
                    onChange={(v) => onUpdate({ fontFamily: v })}
                    options={[
                        { value: 'Inter, sans-serif', label: 'Inter' },
                        { value: 'Roboto, sans-serif', label: 'Roboto' },
                        { value: 'Outfit, sans-serif', label: 'Outfit' },
                        { value: 'Georgia, serif', label: 'Georgia' },
                        { value: 'monospace', label: 'Monospace' },
                    ]}
                />
            </Row>
            <Row label="Align">
                <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                            key={a}
                            onClick={() => onUpdate({ textAlign: a })}
                            className={`flex-1 py-1 text-xs rounded transition-colors ${element.textAlign === a
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {a === 'left' ? '◀' : a === 'center' ? '▐▐' : '▶'}
                        </button>
                    ))}
                </div>
            </Row>
            <Row label="Text Color">
                <ColorInput value={element.color} onChange={(v) => onUpdate({ color: v })} />
            </Row>
            <Row label="Background Color">
                <ColorInput
                    value={element.backgroundColor || ''}
                    onChange={(v) => onUpdate({ backgroundColor: v || undefined })}
                />
            </Row>
            <div className="grid grid-cols-2 gap-2">
                <Row label="Padding">
                    <TextInput
                        type="number"
                        value={element.padding ?? 0}
                        min={0} max={100}
                        onChange={(v) => onUpdate({ padding: parseInt(v) || 0 })}
                    />
                </Row>
                <Row label="Radius">
                    <TextInput
                        type="number"
                        value={element.borderRadius ?? 0}
                        min={0} max={100}
                        onChange={(v) => onUpdate({ borderRadius: parseInt(v) || 0 })}
                    />
                </Row>
            </div>
        </div>
    );
}

// ─── Section: Image ──────────────────────────────────────────────────────

function ImageSection({
    element,
    onUpdate,
}: {
    element: SceneImageElement;
    onUpdate: (u: Partial<SceneImageElement>) => void;
}) {
    const crop = element.crop ?? { zoom: 1, panX: 0, panY: 0 };

    return (
        <div className="space-y-3">
            <SectionHeader title="Image" />
            <Row label="Source">
                <SelectInput
                    value={element.sourceType}
                    onChange={(v) => onUpdate({ sourceType: v as SceneImageElement['sourceType'] })}
                    options={[
                        { value: 'phoneA', label: '📱 Phone A' },
                        { value: 'phoneB', label: '📱 Phone B' },
                        { value: 'custom', label: '🖼 Custom Upload' },
                    ]}
                />
            </Row>
            <Row label="Fit">
                <SelectInput
                    value={element.fit || 'cover'}
                    onChange={(v) => onUpdate({ fit: v as SceneImageElement['fit'] })}
                    options={[
                        { value: 'cover', label: 'Cover (fill)' },
                        { value: 'contain', label: 'Contain (letterbox)' },
                        { value: 'fill', label: 'Stretch' },
                    ]}
                />
            </Row>

            <Divider />
            <SectionHeader title="Crop" />
            <SliderInput
                label="Zoom"
                value={crop.zoom}
                onChange={(v) => onUpdate({ crop: { ...crop, zoom: v } })}
                min={1} max={4} step={0.05}
            />
            <SliderInput
                label="Pan X"
                value={crop.panX}
                onChange={(v) => onUpdate({ crop: { ...crop, panX: v } })}
                min={-1} max={1} step={0.05}
            />
            <SliderInput
                label="Pan Y"
                value={crop.panY}
                onChange={(v) => onUpdate({ crop: { ...crop, panY: v } })}
                min={-1} max={1} step={0.05}
            />
            <button
                onClick={() => onUpdate({ crop: { zoom: 1, panX: 0, panY: 0 } })}
                className="text-[10px] text-slate-400 hover:text-white transition-colors"
            >
                ↺ Reset Crop
            </button>

            <Divider />
            <SectionHeader title="Border" />
            <div className="grid grid-cols-2 gap-2">
                <Row label="Width">
                    <TextInput
                        type="number"
                        value={element.borderWidth ?? 0}
                        min={0} max={20}
                        onChange={(v) => onUpdate({ borderWidth: parseInt(v) || 0 })}
                    />
                </Row>
                <Row label="Radius">
                    <TextInput
                        type="number"
                        value={element.borderRadius ?? 0}
                        min={0} max={100}
                        onChange={(v) => onUpdate({ borderRadius: parseInt(v) || 0 })}
                    />
                </Row>
            </div>
            {(element.borderWidth ?? 0) > 0 && (
                <Row label="Border Color">
                    <ColorInput
                        value={element.borderColor || '#ffffff'}
                        onChange={(v) => onUpdate({ borderColor: v })}
                    />
                </Row>
            )}
        </div>
    );
}

// ─── Section: Box/Shape ──────────────────────────────────────────────────

function BoxSection({
    element,
    onUpdate,
}: {
    element: SceneBoxElement;
    onUpdate: (u: Partial<SceneBoxElement>) => void;
}) {
    return (
        <div className="space-y-3">
            <SectionHeader title="Shape" />
            <Row label="Fill Color">
                <ColorInput
                    value={element.backgroundColor}
                    onChange={(v) => onUpdate({ backgroundColor: v })}
                />
            </Row>
            <Row label="Border Radius">
                <TextInput
                    type="number"
                    value={element.borderRadius ?? 0}
                    min={0} max={200}
                    onChange={(v) => onUpdate({ borderRadius: parseInt(v) || 0 })}
                />
            </Row>
            <Divider />
            <SectionHeader title="Border" />
            <div className="grid grid-cols-2 gap-2">
                <Row label="Width">
                    <TextInput
                        type="number"
                        value={element.borderWidth ?? 0}
                        min={0} max={20}
                        onChange={(v) => onUpdate({ borderWidth: parseInt(v) || 0 })}
                    />
                </Row>
            </div>
            {(element.borderWidth ?? 0) > 0 && (
                <Row label="Color">
                    <ColorInput
                        value={element.borderColor || '#ffffff'}
                        onChange={(v) => onUpdate({ borderColor: v })}
                    />
                </Row>
            )}
        </div>
    );
}

// ─── Scene Timing (shown when no element is selected) ────────────────────

function SceneTimingSection({
    override,
    onUpdateOverride,
}: {
    override?: SceneOverride;
    onUpdateOverride: (u: Partial<SceneOverride>) => void;
}) {
    const durationMs = override?.durationMs ?? 3000;
    const transType = override?.transition?.type ?? 'none';
    const transDuration = override?.transition?.durationMs ?? 500;

    return (
        <div className="space-y-3">
            <SectionHeader title="⏱ Scene Timing" />
            <Row label="Duration (ms)">
                <TextInput
                    type="number"
                    value={durationMs}
                    min={500} max={30000} step={100}
                    onChange={(v) => onUpdateOverride({ durationMs: parseInt(v) || 3000 })}
                />
            </Row>
            <Row label="Transition">
                <SelectInput
                    value={transType}
                    onChange={(v) =>
                        onUpdateOverride({
                            transition: {
                                type: v as SceneOverride['transition'] extends { type: infer T } ? T : never,
                                durationMs: transDuration,
                            },
                        })
                    }
                    options={[
                        { value: 'none', label: 'None (cut)' },
                        { value: 'fade', label: 'Fade' },
                        { value: 'slide', label: 'Slide' },
                    ]}
                />
            </Row>
            {transType !== 'none' && (
                <Row label="Transition Duration (ms)">
                    <TextInput
                        type="number"
                        value={transDuration}
                        min={100} max={3000} step={50}
                        onChange={(v) =>
                            onUpdateOverride({
                                transition: {
                                    type: transType,
                                    durationMs: parseInt(v) || 500,
                                },
                            })
                        }
                    />
                </Row>
            )}
        </div>
    );
}

// ─── Main PropertiesPanel ─────────────────────────────────────────────────

interface PropertiesPanelProps {
    element: SceneElement | null;
    sceneOverride?: SceneOverride;
    onUpdate: (updates: Partial<SceneElement>) => void;
    onUpdateOverride: (updates: Partial<SceneOverride>) => void;
}

export function PropertiesPanel({
    element,
    sceneOverride,
    onUpdate,
    onUpdateOverride,
}: PropertiesPanelProps) {
    return (
        <div className="h-full bg-slate-800 overflow-y-auto">
            {element ? (
                <>
                    {/* Element header */}
                    <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Properties</div>
                        <div className="text-sm font-semibold text-white truncate">{element.name}</div>
                        <div className="text-[10px] text-blue-400 font-mono">{element.type}</div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Common layout/appearance */}
                        <CommonSection element={element} onUpdate={onUpdate} />

                        <Divider />

                        {/* Type-specific sections */}
                        {element.type === 'text' && (
                            <TextSection
                                element={element as SceneTextElement}
                                onUpdate={(u) => onUpdate(u as Partial<SceneElement>)}
                            />
                        )}
                        {element.type === 'image' && (
                            <ImageSection
                                element={element as SceneImageElement}
                                onUpdate={(u) => onUpdate(u as Partial<SceneElement>)}
                            />
                        )}
                        {element.type === 'box' && (
                            <BoxSection
                                element={element as SceneBoxElement}
                                onUpdate={(u) => onUpdate(u as Partial<SceneElement>)}
                            />
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="p-4 border-b border-slate-700">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Scene Properties</div>
                    </div>
                    <div className="p-4 space-y-4">
                        <SceneTimingSection
                            override={sceneOverride}
                            onUpdateOverride={onUpdateOverride}
                        />
                        <p className="text-[10px] text-slate-600 italic text-center pt-2">
                            Select an element on the stage to edit its properties.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
