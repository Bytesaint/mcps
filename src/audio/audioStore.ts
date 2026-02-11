export interface AudioAssets {
    good?: { name: string; dataUrl: string };
    bad?: { name: string; dataUrl: string };
    music?: { name: string; dataUrl: string };
}

export interface AudioSettings {
    enabled: boolean;
    volume: number;
    musicVolume: number;
    musicLoop: boolean;
}

const ASSETS_KEY = "mpcs_audio_assets_v1";
const SETTINGS_KEY = "mpcs_audio_settings_v1";

export const getAudioAssets = (): AudioAssets => {
    const saved = localStorage.getItem(ASSETS_KEY);
    return saved ? JSON.parse(saved) : {};
};

export const saveAudioAssets = (assets: AudioAssets) => {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
};

export const getAudioSettings = (): AudioSettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {
        enabled: true,
        volume: 0.8,
        musicVolume: 0.5,
        musicLoop: true
    };
};

export const saveAudioSettings = (settings: AudioSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
