import { getAudioAssets, getAudioSettings } from "./audioStore";

let backgroundMusic: HTMLAudioElement | null = null;
let lastSfxTime = 0;
const SFX_DEBOUNCE = 100;

export const loadAudioFromDataUrl = (dataUrl: string): HTMLAudioElement => {
    const audio = new Audio(dataUrl);
    return audio;
};

export const playSfx = (type: "good" | "bad") => {
    const settings = getAudioSettings();
    if (!settings.enabled) return;

    const now = Date.now();
    if (now - lastSfxTime < SFX_DEBOUNCE) return;
    lastSfxTime = now;

    const assets = getAudioAssets();
    const asset = assets[type];
    if (asset?.dataUrl) {
        const audio = loadAudioFromDataUrl(asset.dataUrl);
        audio.volume = settings.volume;
        audio.play().catch(e => console.error("SFX playback failed", e));
    }
};

export const playMusic = () => {
    const settings = getAudioSettings();
    const assets = getAudioAssets();

    if (!assets.music?.dataUrl) return;

    if (!backgroundMusic) {
        backgroundMusic = loadAudioFromDataUrl(assets.music.dataUrl);
    }

    backgroundMusic.volume = settings.musicVolume;
    backgroundMusic.loop = settings.musicLoop;

    backgroundMusic.play().catch(e => console.error("Music playback failed", e));
};

export const stopMusic = () => {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
};

export const setMusicVolume = (vol: number) => {
    if (backgroundMusic) {
        backgroundMusic.volume = vol;
    }
};

export const stopAll = () => {
    stopMusic();
    backgroundMusic = null;
};
