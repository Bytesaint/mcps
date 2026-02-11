import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DEFAULT_SCENE_DURATIONS_MS } from './durations';

interface Scene {
    type: string;
    [key: string]: any;
}

interface UseVideoPreviewPlayerProps {
    scenes: Scene[];
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    durationsMs?: typeof DEFAULT_SCENE_DURATIONS_MS;
    speed?: number;
}

export function useVideoPreviewPlayer({
    scenes,
    currentIndex,
    setCurrentIndex,
    durationsMs = DEFAULT_SCENE_DURATIONS_MS,
    speed: initialSpeed = 1
}: UseVideoPreviewPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [sceneElapsedMs, setSceneElapsedMs] = useState(0);
    const [speed, setSpeed] = useState(initialSpeed);

    const requestRef = useRef<number>();
    const previousTimeRef = useRef<number>();

    // Calculate scene durations based on type
    const getSceneDuration = useCallback((sceneIndex: number) => {
        const scene = scenes[sceneIndex];
        if (!scene) return 0;
        const type = scene.type as keyof typeof DEFAULT_SCENE_DURATIONS_MS;
        return (durationsMs[type] || 2000) / speed;
    }, [scenes, durationsMs, speed]);

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
        if (currentIndex < scenes.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSceneElapsedMs(0);
        } else {
            setIsPlaying(false);
        }
    }, [currentIndex, scenes.length, setCurrentIndex]);

    const prev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSceneElapsedMs(0);
        }
    }, [currentIndex, setCurrentIndex]);

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
        if (isPlaying && sceneElapsedMs >= currentSceneDurationMs) {
            if (currentIndex < scenes.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSceneElapsedMs(0);
            } else {
                setIsPlaying(false);
                setSceneElapsedMs(currentSceneDurationMs);
            }
        }
    }, [sceneElapsedMs, currentSceneDurationMs, currentIndex, scenes.length, isPlaying, setCurrentIndex]);

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
