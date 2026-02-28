/**
 * index.ts - Remotion Composition Entry Point
 * Registers the MpcsVideo composition for the Remotion bundler.
 */

import React from 'react';
import { Composition } from 'remotion';
import { MpcsVideoComposition } from './MpcsVideo';
import type { ProjectExportPayload } from '../src/types';

// Default stub payload (used for Remotion Studio preview only)
const DEFAULT_PAYLOAD: ProjectExportPayload = {
    project: { id: 'preview', name: 'Preview' },
    scenes: [
        {
            id: 'intro',
            type: 'intro',
            label: 'Intro',
            auto: {},
            timing: { durationMs: 3000, transition: { type: 'fade', durationMs: 500 } },
        },
    ],
    phones: {
        a: { id: 'a', name: 'Phone A' },
        b: { id: 'b', name: 'Phone B' },
    },
    assets: {},
    exportSettings: {
        fps: 30,
        resolution: '720p',
        format: 'mp4',
        width: 720,
        height: 1280,
    },
};

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MpcsVideo"
                component={MpcsVideoComposition}
                durationInFrames={90} // Will be overridden per-render
                fps={30}
                width={720}
                height={1280}
                defaultProps={{ payload: DEFAULT_PAYLOAD }}
            />
        </>
    );
};
