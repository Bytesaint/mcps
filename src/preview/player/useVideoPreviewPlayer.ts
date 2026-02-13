import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// DEFAULT_SCENE_DURATIONS_MS removed as it is now used inside getEffectiveScene

import { Scene } from '../../types/models';
import { getEffectiveScene, isSceneDisabled } from '../sceneMerge';

interface UseVideoPreviewPlayerProps {
    scenes: Scene[];
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    speed?: number;
}

export function useVideoPreviewPlayer({
    scenes,
    currentIndex,
    setCurrentIndex,
    speed: initialSpeed = 1
}: UseVideoPreviewPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [sceneElapsedMs, setSceneElapsedMs] = useState(0);
    const [speed, setSpeed] = useState(initialSpeed);

    const requestRef = useRef<number>();
    const previousTimeRef = useRef<number>();

    // Calculate scene durations based on type and overrides
    const getSceneDuration = useCallback((sceneIndex: number) => {
        const scene = scenes[sceneIndex];
        if (!scene) return 0;

        // Skip disabled scenes (duration 0) unless it's the current one selected manually
        // But for playback calculation, we want to know the *play* duration.
        // If we are just calculating total time, disabled scenes should be 0.
        if (isSceneDisabled(scene)) return 0;

        const effective = getEffectiveScene(scene).effective;
        return effective.durationMs / speed;
    }, [scenes, speed]);

    const currentSceneDurationMs = getSceneDuration(currentIndex);

    const totalDurationMs = useMemo(() => {
        return scenes.reduce((acc, _, idx) => acc + getSceneDuration(idx), 0);
    }, [scenes, getSceneDuration]);

    const overallElapsedMs = useMemo(() => {
        let elapsed = 0;
        for (let i = 0; i < currentIndex; i++) {
            elapsed += getSceneDuration(i);
        }
        return elapsed + sceneElapsedMs;
    }, [currentIndex, sceneElapsedMs, getSceneDuration]);

    const progressPercent = totalDurationMs > 0 ? (overallElapsedMs / totalDurationMs) * 100 : 0;

    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);

    const next = useCallback(() => {
        let nextIndex = currentIndex + 1;

        // Find next enabled scene
        while (nextIndex < scenes.length && isSceneDisabled(scenes[nextIndex])) {
            nextIndex++;
        }

        if (nextIndex < scenes.length) {
            setCurrentIndex(nextIndex);
            setSceneElapsedMs(0);
        } else {
            setIsPlaying(false);
        }
    }, [currentIndex, scenes, setCurrentIndex]);

    const prev = useCallback(() => {
        let prevIndex = currentIndex - 1;

        // Find prev enabled scene
        while (prevIndex >= 0 && isSceneDisabled(scenes[prevIndex])) {
            prevIndex--;
        }

        if (prevIndex >= 0) {
            setCurrentIndex(prevIndex);
            setSceneElapsedMs(0);
        }
    }, [currentIndex, scenes, setCurrentIndex]);

    const seek = useCallback((percent: number) => {
        const targetMs = (percent / 100) * totalDurationMs;
        let accumulatedMs = 0;
        let foundScene = false;

        for (let i = 0; i < scenes.length; i++) {
            const duration = getSceneDuration(i);
            if (accumulatedMs + duration >= targetMs) {
                setCurrentIndex(i);
                setSceneElapsedMs(targetMs - accumulatedMs);
                foundScene = true;
                break;
            }
            accumulatedMs += duration;
        }

        if (!foundScene && scenes.length > 0) {
            setCurrentIndex(scenes.length - 1);
            setSceneElapsedMs(getSceneDuration(scenes.length - 1));
        }
    }, [scenes, totalDurationMs, getSceneDuration, setCurrentIndex]);

    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;

            setSceneElapsedMs(prev => {
                const newElapsed = prev + deltaTime;
                if (newElapsed >= currentSceneDurationMs) {
                    // Use a timeout or similar to avoid state update during render if needed, 
                    // but usually direct call is okay in RAF if handled carefully.
                    // However, we need to advance the scene.
                    return newElapsed;
                }
                return newElapsed;
            });
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [currentSceneDurationMs]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            previousTimeRef.current = undefined;
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    // Handle scene transition logic outside of RAF tick to avoid state sync issues
    useEffect(() => {
        // If current scene became disabled (e.g. while playing), skip it
        if (isPlaying && scenes[currentIndex] && isSceneDisabled(scenes[currentIndex])) {
            next();
            return;
        }

        if (isPlaying && sceneElapsedMs >= currentSceneDurationMs) {
            next();
        }
    }, [sceneElapsedMs, currentSceneDurationMs, currentIndex, scenes, isPlaying, next]);

    // Reset elapsed on manual index change
    const lastIndexRef = useRef(currentIndex);
    useEffect(() => {
        if (currentIndex !== lastIndexRef.current) {
            setSceneElapsedMs(0);
            lastIndexRef.current = currentIndex;
        }
    }, [currentIndex]);

    return {
        isPlaying,
        sceneElapsedMs,
        speed,
        setSpeed,
        play,
        pause,
        togglePlay,
        next,
        prev,
        seek,
        progressPercent,
        totalDurationMs,
        overallElapsedMs,
        currentSceneDurationMs
    };
}
