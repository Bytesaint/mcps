import React from "react";
import type { AspectRatio } from "../types/aspectRatio";
import { getRatioValue } from "../types/aspectRatio";

interface PreviewStageProps {
    aspectRatio: AspectRatio;
    title?: string;
    children?: React.ReactNode;
    showGrid?: boolean;
    showSafeArea?: boolean;
}

export default function PreviewStage({
    aspectRatio,
    title,
    children,
    showGrid = false,
    showSafeArea = false,
}: PreviewStageProps) {
    const ratio = getRatioValue(aspectRatio);

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
            )}
            <div className="w-full max-w-4xl mx-auto">
                <div
                    className="relative bg-gray-900 rounded-lg shadow-lg border-2 border-blue-500 overflow-hidden"
                    style={{
                        aspectRatio: `${ratio}`,
                    }}
                >
                    {/* Grid overlay */}
                    {showGrid && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                                backgroundSize: "10% 10%",
                            }}
                        />
                    )}

                    {/* Safe area overlay */}
                    {showSafeArea && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 m-[10%] border-2 border-dashed border-yellow-400 opacity-50" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {children || (
                            <div className="text-gray-400 text-center p-4">
                                <div className="text-6xl mb-2">📱</div>
                                <p className="text-sm">Preview Area</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
