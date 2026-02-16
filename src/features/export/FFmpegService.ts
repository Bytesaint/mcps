import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

class FFmpegService {
    private ffmpeg: FFmpeg | null = null;
    private loadingPromise: Promise<FFmpeg> | null = null;

    public async getInstance(): Promise<FFmpeg> {
        if (this.ffmpeg) return this.ffmpeg;

        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            const ffmpeg = new FFmpeg();
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            this.ffmpeg = ffmpeg;
            return ffmpeg;
        })();

        return this.loadingPromise;
    }

    public isLoaded(): boolean {
        return !!this.ffmpeg;
    }
}

export const ffmpegService = new FFmpegService();
