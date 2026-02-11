import { Palette, Database, Shield, Moon, Sun, ArrowRight, Save, Maximize2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ACTIONS } from '../actionMap';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useState, useEffect } from 'react';
import type { AspectRatio, AspectRatioPreset } from '../types/aspectRatio';
import { formatAspectRatio, isValidCustomRatio } from '../types/aspectRatio';
import {
    getDefaultAspectRatioSetting,
    saveDefaultAspectRatio,
    getAppearanceSetting,
    saveAppearanceSetting,
    Appearance
} from '../store/settingsStore';
import { applyTheme } from '../lib/theme';
import {
    Volume2, Music, Trash2, Play, Check, AlertCircle, Headphones,
    Upload, Settings as SettingsIcon, FileJson
} from 'lucide-react';
import {
    getAudioAssets, saveAudioAssets,
    getAudioSettings, saveAudioSettings,
    AudioAssets, AudioSettings as AudioSettingsType
} from '../audio/audioStore';
import { playSfx, playMusic, stopMusic, setMusicVolume } from '../audio/player';


export function Settings() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Aspect Ratio State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatioSetting());
    const [customW, setCustomW] = useState<string>(aspectRatio.customW?.toString() || '16');
    const [customH, setCustomH] = useState<string>(aspectRatio.customH?.toString() || '9');

    // Appearance State
    const [appearance, setAppearance] = useState<Appearance>(() => getAppearanceSetting());

    // Audio settings state
    const [audioSettings, setAudioSettings] = useState<AudioSettingsType>(() => getAudioSettings());
    const [audioAssets, setAudioAssets] = useState<AudioAssets>(() => getAudioAssets());

    useEffect(() => {
        const loaded = getDefaultAspectRatioSetting();
        setAspectRatio(loaded);
        if (loaded.preset === 'custom' && loaded.customW && loaded.customH) {
            setCustomW(loaded.customW.toString());
            setCustomH(loaded.customH.toString());
        }
    }, []);

    const handleSave = () => {
        saveAudioSettings(audioSettings);
        saveAppearanceSetting(appearance);
        applyTheme(appearance);
        toast("Settings saved successfully", "success");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: keyof AudioAssets) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit warning
            toast("File size over 2MB. Preview may be slow.", "info");
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const newAssets = { ...audioAssets, [type]: { name: file.name, dataUrl } };
            setAudioAssets(newAssets);
            saveAudioAssets(newAssets);
            toast(`${type.toUpperCase()} audio uploaded`, "success");
        };
        reader.readAsDataURL(file);
    };

    const removeAsset = (type: keyof AudioAssets) => {
        const newAssets = { ...audioAssets };
        delete newAssets[type];
        setAudioAssets(newAssets);
        saveAudioAssets(newAssets);
        if (type === 'music') stopMusic();
        toast(`${type.toUpperCase()} removed`, "success");
    };

    const toggleMusicPlayback = () => {
        playMusic();
    };

    const handleExport = () => {
        const data = {
            phones: localStorage.getItem('mpcs_phones_v1'),
            rules: localStorage.getItem('mpcs_rules_v1'),
            templates: localStorage.getItem('mpcs_templates_v1'),
            projects: localStorage.getItem('mpcs_projects_v1'),
            audioAssets: localStorage.getItem('mpcs_audio_assets_v1'),
            audioSettings: localStorage.getItem('mpcs_audio_settings_v1'),
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mpcs_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast("Configuration exported successfully", "success");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (!data.phones || !data.rules) throw new Error("Invalid format");

                // Merge / Overwrite logic: for Phase 2B we'll overwrite for simplicity as requested "merge logic"
                // but actually the prompt says "validation and merge logic". 
                // Let's do simple validation and then safe merge (don't overwrite if ID exists, or just overwrite all)
                // User said "merge logic", so I'll merge based on ID.

                const merge = (key: string, newData: string | null) => {
                    if (!newData) return;
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    const incoming = JSON.parse(newData);

                    if (Array.isArray(existing)) {
                        const merged = [...existing];
                        incoming.forEach((item: any) => {
                            const idx = merged.findIndex((m: any) => m.id === item.id);
                            if (idx > -1) merged[idx] = item;
                            else merged.push(item);
                        });
                        localStorage.setItem(key, JSON.stringify(merged));
                    } else {
                        localStorage.setItem(key, newData);
                    }
                };

                merge('mpcs_phones_v1', data.phones);
                merge('mpcs_rules_v1', data.rules);
                merge('mpcs_templates_v1', data.templates);
                merge('mpcs_projects_v1', data.projects);

                toast("Data imported and merged", "success");
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                toast("Failed to import: Invalid JSON", "error");
            }
        };
        reader.readAsText(file);
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
                                    <div
                                        onClick={() => setAppearance('light')}
                                        className={cn(
                                            "border-2 rounded-lg p-4 w-32 cursor-pointer transition-all",
                                            appearance === 'light' ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                        )}
                                        data-action={ACTIONS.MPCS_SETTINGS_APPEARANCE_CHANGE}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sun className={cn("w-4 h-4", appearance === 'light' ? "text-blue-600" : "text-slate-400")} />
                                            <span className={cn("font-medium", appearance === 'light' ? "text-slate-900 dark:text-white" : "text-slate-500")}>Light</span>
                                        </div>
                                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    </div>
                                    <div
                                        onClick={() => setAppearance('dark')}
                                        className={cn(
                                            "border-2 rounded-lg p-4 w-32 cursor-pointer transition-all",
                                            appearance === 'dark' ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                        )}
                                        data-action={ACTIONS.MPCS_SETTINGS_APPEARANCE_CHANGE}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Moon className={cn("w-4 h-4", appearance === 'dark' ? "text-blue-600" : "text-slate-400")} />
                                            <span className={cn("font-medium", appearance === 'dark' ? "text-slate-900 dark:text-white" : "text-slate-500")}>Dark</span>
                                        </div>
                                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    </div>
                                    <div
                                        onClick={() => setAppearance('system')}
                                        className={cn(
                                            "border-2 rounded-lg p-4 w-32 cursor-pointer transition-all",
                                            appearance === 'system' ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                        )}
                                        data-action={ACTIONS.MPCS_SETTINGS_APPEARANCE_CHANGE}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <SettingsIcon className={cn("w-4 h-4", appearance === 'system' ? "text-blue-600" : "text-slate-400")} />
                                            <span className={cn("font-medium", appearance === 'system' ? "text-slate-900 dark:text-white" : "text-slate-500")}>System</span>
                                        </div>
                                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
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
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Default Preview Aspect Ratio (App)</h3>
                                <p className="text-sm text-slate-500 mb-4">Set the fallback aspect ratio for all projects and templates.</p>

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

                    {/* Audio & Music (Preview Only) */}
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                                <Headphones className="w-6 h-6" />
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Audio & Music (Preview Only)</h3>
                                    <p className="text-sm text-slate-500 mb-4 italic">Note: These sounds are for browser preview only and won't be in the final video export.</p>
                                </div>

                                {/* General Audio Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <Volume2 className="w-5 h-5 text-slate-600" />
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">Enable Preview Audio</p>
                                            <p className="text-xs text-slate-500">Master toggle for SFX and Music</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAudioSettings(s => ({ ...s, enabled: !s.enabled }))}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-colors relative flex items-center px-1",
                                            audioSettings.enabled ? "bg-blue-500" : "bg-slate-300"
                                        )}
                                        data-action={ACTIONS.MPCS_AUDIO_TOGGLE}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                                            audioSettings.enabled ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>

                                {/* SFX Section */}
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        Scoring SFX (Good / Bad)
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* GOOD SFX */}
                                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-3">
                                            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-green-500" />
                                                    "Winner" SFX
                                                </div>
                                                {audioAssets.good && (
                                                    <button onClick={() => removeAsset('good')} className="text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {audioAssets.good ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => playSfx('good')}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 hover:bg-green-100 transition-colors"
                                                        data-action={ACTIONS.MPCS_AUDIO_TEST_GOOD}
                                                    >
                                                        <Play className="w-3 h-3 fill-current" />
                                                        Test SFX
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload .mp3</span>
                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'good')} data-action={ACTIONS.MPCS_AUDIO_UPLOAD_GOOD} />
                                                </label>
                                            )}
                                        </div>

                                        {/* BAD SFX */}
                                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-3">
                                            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <X className="w-4 h-4 text-red-500" />
                                                    "Loser" SFX
                                                </div>
                                                {audioAssets.bad && (
                                                    <button onClick={() => removeAsset('bad')} className="text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {audioAssets.bad ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => playSfx('bad')}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors"
                                                        data-action={ACTIONS.MPCS_AUDIO_TEST_BAD}
                                                    >
                                                        <Play className="w-3 h-3 fill-current" />
                                                        Test SFX
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload .mp3</span>
                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'bad')} data-action={ACTIONS.MPCS_AUDIO_UPLOAD_BAD} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            <span>SFX Volume</span>
                                            <span>{Math.round(audioSettings.volume * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={audioSettings.volume}
                                            onChange={(e) => setAudioSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))}
                                            data-action={ACTIONS.MPCS_AUDIO_VOLUME_CHANGE}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>
                                </div>

                                {/* Music Section */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Music className="w-3 h-3" />
                                        Background Music
                                    </label>

                                    {audioAssets.music ? (
                                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-lg border border-blue-100 flex items-center justify-center text-blue-500 shadow-sm">
                                                    <Music className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{audioAssets.music.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Preview Background</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={toggleMusicPlayback}
                                                    className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                                    data-action={ACTIONS.MPCS_MUSIC_PLAY_PAUSE}
                                                >
                                                    <Play className="w-4 h-4 fill-current" />
                                                </button>
                                                <button
                                                    onClick={() => stopMusic()}
                                                    className="p-2 bg-white text-slate-400 rounded-lg hover:text-red-500 transition-all shadow-sm border border-slate-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeAsset('music')}
                                                    className="p-2 bg-white text-slate-400 rounded-lg hover:text-red-500 transition-all shadow-sm border border-slate-100"
                                                    data-action={ACTIONS.MPCS_MUSIC_REMOVE}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                                                <Music className="w-6 h-6" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Upload Music</p>
                                                <p className="text-xs text-slate-400">MP3 or WAV files supported</p>
                                            </div>
                                            <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'music')} data-action={ACTIONS.MPCS_MUSIC_UPLOAD} />
                                        </label>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                <span>Music Volume</span>
                                                <span>{Math.round(audioSettings.musicVolume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={audioSettings.musicVolume}
                                                onChange={(e) => {
                                                    const vol = parseFloat(e.target.value);
                                                    setAudioSettings(s => ({ ...s, musicVolume: vol }));
                                                    setMusicVolume(vol);
                                                }}
                                                data-action={ACTIONS.MPCS_MUSIC_VOLUME_CHANGE}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Loop Music</span>
                                            </div>
                                            <button
                                                onClick={() => setAudioSettings(s => ({ ...s, musicLoop: !s.musicLoop }))}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                    audioSettings.musicLoop ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                                                )}
                                                data-action={ACTIONS.MPCS_MUSIC_LOOP_TOGGLE}
                                            >
                                                {audioSettings.musicLoop ? "ON" : "OFF"}
                                            </button>
                                        </div>
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
                                    <label className="flex-1">
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-slate-200">
                                            <Upload className="w-4 h-4" /> Import JSON
                                        </div>
                                        <input type="file" accept=".json" className="hidden" onChange={handleImport} data-action={ACTIONS.MPCS_SETTINGS_DATA_IMPORT} />
                                    </label>
                                    <Button variant="secondary" action={ACTIONS.MPCS_SETTINGS_DATA_EXPORT} onClick={handleExport}>
                                        <FileJson className="w-4 h-4 mr-2" /> Export JSON
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
