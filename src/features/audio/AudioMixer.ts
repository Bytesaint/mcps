import { getAsset } from '../../storage/idb';

interface AudioTrack {
    id: string;
    assetId?: string; // stored blob id
    startOffsetMs: number;
    durationMs?: number;
    volume: number;
    loop: boolean;
    url?: string; // external url fallback
}

export class AudioMixer {
    private ctx: OfflineAudioContext;

    constructor(durationMs: number, sampleRate: number = 44100) {
        // Create context
        // length = sampleRate * durationSeconds
        const length = Math.ceil((durationMs / 1000) * sampleRate);
        this.ctx = new OfflineAudioContext(2, length, sampleRate);
    }

    async mix(tracks: AudioTrack[]): Promise<Blob> {
        await Promise.all(tracks.map(track => this.addTrack(track)));

        const renderedBuffer = await this.ctx.startRendering();
        return this.bufferToWave(renderedBuffer, renderedBuffer.length);
    }

    private async addTrack(track: AudioTrack) {
        try {
            let buffer: AudioBuffer | null = null;

            // Load audio data
            if (track.assetId) {
                const blob = await getAsset(track.assetId);
                if (blob) {
                    const arrayBuffer = await blob.arrayBuffer();
                    buffer = await this.ctx.decodeAudioData(arrayBuffer);
                }
            } else if (track.url) {
                const response = await fetch(track.url);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await this.ctx.decodeAudioData(arrayBuffer);
            }

            if (!buffer) return;

            // Create source
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = track.loop;

            // Create gain
            const gainNode = this.ctx.createGain();
            gainNode.gain.value = track.volume;

            // Connect
            source.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            // Schedule
            const startTime = track.startOffsetMs / 1000;
            source.start(startTime);

            // Handle explicit duration if set (stop)
            if (track.durationMs) {
                source.stop(startTime + (track.durationMs / 1000));
            }

        } catch (error) {
            console.error(`AudioMixer: Failed to mix track ${track.id}. Url: ${track.url}, AssetId: ${track.assetId}`, error);
        }
    }

    // Convert AudioBuffer to WAV Blob
    private bufferToWave(abuffer: AudioBuffer, len: number) {
        const numOfChan = abuffer.numberOfChannels;
        const length = len * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // Helper functions for writing data
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };

        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this implementation)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < len) {
            for (i = 0; i < numOfChan; i++) {
                // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([buffer], { type: "audio/wav" });
    }
}
