import { Palette, Database, Shield, Moon, Sun, ArrowRight, Save, Maximize2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ACTIONS } from '../actionMap';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useState, useEffect } from 'react';
import type { AspectRatio, AspectRatioPreset } from '../types/aspectRatio';
import { formatAspectRatio, isValidCustomRatio } from '../types/aspectRatio';
import { getDefaultAspectRatioSetting, saveDefaultAspectRatio } from '../store/settingsStore';


export function Settings() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Aspect Ratio State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatioSetting());
    const [customW, setCustomW] = useState<string>(aspectRatio.customW?.toString() || '16');
    const [customH, setCustomH] = useState<string>(aspectRatio.customH?.toString() || '9');

    useEffect(() => {
        const loaded = getDefaultAspectRatioSetting();
        setAspectRatio(loaded);
        if (loaded.preset === 'custom' && loaded.customW && loaded.customH) {
            setCustomW(loaded.customW.toString());
            setCustomH(loaded.customH.toString());
        }
    }, []);

    const handleSave = () => {
        toast("Settings saved (Simulated)", "success");
    };

    const handleAspectRatioPresetChange = (preset: AspectRatioPreset) => {
        if (preset === 'custom') {
            const w = parseFloat(customW);
            const h = parseFloat(customH);
            if (isValidCustomRatio(w, h)) {
                setAspectRatio({ preset, customW: w, customH: h });
            } else {
                setAspectRatio({ preset, customW: 16, customH: 9 });
            }
        } else {
            setAspectRatio({ preset });
        }
    };

    const handleSaveAspectRatio = () => {
        let finalRatio = aspectRatio;
        if (aspectRatio.preset === 'custom') {
            const w = parseFloat(customW);
            const h = parseFloat(customH);
            if (isValidCustomRatio(w, h)) {
                finalRatio = { preset: 'custom', customW: w, customH: h };
            } else {
                toast("Invalid custom aspect ratio values", "error");
                return;
            }
        }
        saveDefaultAspectRatio(finalRatio);
        setAspectRatio(finalRatio);
        toast("Default aspect ratio saved", "success");
    };

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto text-left">
            <div className="max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                    <Button action={ACTIONS.MPCS_SETTINGS_THEME_TOGGLE} onClick={handleSave}>
                        < Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                </div>

                <div className="grid gap-6">
                    {/* Appearance */}
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                                <Palette className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Appearance</h3>
                                <p className="text-sm text-slate-500 mb-4">Customize the look and feel of the workspace.</p>

                                <div className="flex gap-4">
                                    <div className="border-2 border-blue-500 rounded-lg p-4 w-32 cursor-pointer bg-blue-50/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sun className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-slate-900">Light</span>
                                        </div>
                                        <div className="h-2 w-16 bg-blue-200 rounded-full"></div>
                                    </div>
                                    <div className="border border-slate-200 rounded-lg p-4 w-32 cursor-pointer hover:border-blue-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Moon className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium text-slate-500">Dark</span>
                                        </div>
                                        <div className="h-2 w-16 bg-slate-200 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Rules Admin */}
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Rules Administration</h3>
                                <p className="text-sm text-slate-500 mb-4">Manage global comparison rules and logic.</p>

                                <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_RULES_ADMIN} onClick={() => navigate('/rules')}>
                                    Configure Rule Map <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Aspect Ratio */}
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-green-50 text-green-600">
                                <Maximize2 className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Default Aspect Ratio</h3>
                                <p className="text-sm text-slate-500 mb-4">Set the default aspect ratio for new projects.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Preset
                                        </label>
                                        <select
                                            value={aspectRatio.preset}
                                            onChange={(e) => handleAspectRatioPresetChange(e.target.value as AspectRatioPreset)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            data-action={ACTIONS.MPCS_GENERATE_ASPECT_RATIO_CHANGE}
                                        >
                                            <option value="16:9">16:9 (Landscape)</option>
                                            <option value="9:16">9:16 (Portrait)</option>
                                            <option value="1:1">1:1 (Square)</option>
                                            <option value="4:5">4:5 (Instagram Portrait)</option>
                                            <option value="3:4">3:4 (Classic Portrait)</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>

                                    {aspectRatio.preset === 'custom' && (
                                        <div className="flex gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Width
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="0.1"
                                                    value={customW}
                                                    onChange={(e) => setCustomW(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="16"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Height
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="0.1"
                                                    value={customH}
                                                    onChange={(e) => setCustomH(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="9"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Button action={ACTIONS.MPCS_SETTINGS_SAVE_ASPECT_RATIO} onClick={handleSaveAspectRatio}>
                                            <Save className="w-4 h-4 mr-2" /> Save Aspect Ratio
                                        </Button>
                                        <span className="text-sm text-slate-500">
                                            Current: {formatAspectRatio(aspectRatio)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Data Management */}
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-slate-100 text-slate-600">
                                <Database className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Data Management</h3>
                                <p className="text-sm text-slate-500 mb-4">Import or export your phone database and templates.</p>

                                <div className="flex gap-3">
                                    <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_DATA_IMPORT} disabled>
                                        Import Data (Phase 2)
                                    </Button>
                                    <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_DATA_EXPORT} disabled>
                                        Export JSON
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
