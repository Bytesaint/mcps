import { Phone, Rule, Template, Scene } from '../types/models';
import { cn } from '../lib/utils';
import { Trophy, AlertTriangle } from 'lucide-react';
import { compareSpecs } from '../engine/compareAdvanced';
import PhoneCutout from '../preview/components/PhoneCutout';
import { getEffectiveScene } from '../preview/sceneMerge';

interface PreviewContentProps {
    sceneKey: string;
    // We now support passing the full Scene object
    scene?: Scene;
    template?: Template;
    phoneA?: Phone;
    phoneB?: Phone;
    rules: Rule[];
    captionOverride?: string;
}

export default function PreviewContent({
    sceneKey,
    scene,
    template,
    phoneA,
    phoneB,
    rules,
    captionOverride
}: PreviewContentProps) {
    if (!template || !phoneA || !phoneB) return (
        <div className="flex w-full h-full items-center justify-center text-slate-500 font-bold uppercase tracking-widest bg-slate-950/20">
            Preview Unavailable
        </div>
    );

    // Determine winner if it's a body scene
    let winner: 'A' | 'B' | 'TIE' | null = null;
    let reason = "";

    // If we have a Scene object, use its effective values for overrides
    const effectiveScene = scene ? getEffectiveScene(scene) : null;
    const effectiveWinner = effectiveScene?.effective.winner;

    // Detect scene types
    const isIntro = sceneKey === 'intro';
    const isSubintro = sceneKey === 'subintro';
    const isScore = sceneKey === 'score';
    const isCameraScene = sceneKey.toLowerCase().includes('camera');
    const isBodyScene = !isIntro && !isSubintro && !isScore;

    if (isBodyScene) {
        // If override is set, use it
        if (effectiveWinner !== undefined && effectiveWinner !== null) {
            winner = effectiveWinner;
            reason = "Manual Override";
        } else {
            // Otherwise calculate
            const rule = rules.find(r => r.id === sceneKey || r.specKey === sceneKey);
            const specA = phoneA.specs.find(s => s.key === rule?.specKey || s.key === sceneKey)?.value || "";
            const specB = phoneB.specs.find(s => s.key === rule?.specKey || s.key === sceneKey)?.value || "";

            if (rule) {
                const result = compareSpecs(specA, specB, rule);
                winner = result.winner;
                reason = result.reason;
            }
        }
    }

    // Determine phone size variant based on scene type
    let phoneVariant: "large" | "medium" | "small" = "large";
    if (isIntro || isSubintro) {
        phoneVariant = "large";
    } else if (isCameraScene) {
        phoneVariant = "medium";
    } else if (isBodyScene) {
        phoneVariant = "small";
    } else if (isScore) {
        // Score scene: winner large, loser medium (handled per phone below)
        phoneVariant = "large";
    }

    const renderPhoneCard = (phone: Phone, side: 'A' | 'B') => {
        const isWinner = winner === side;
        const isLoser = winner !== side && winner !== 'TIE' && winner !== null;

        // Special sizing for score scene
        let currentVariant = phoneVariant;
        if (isScore && isLoser) {
            currentVariant = "medium";
        }

        return (
            <div className={cn(
                "flex flex-col items-center gap-6 transition-all duration-500 min-w-0",
                side === 'A' ? "animate-in slide-in-from-left-8 duration-700" : "animate-in slide-in-from-right-8 duration-700",
                isLoser && isScore ? "opacity-70 grayscale-[0.2]" : isLoser ? "opacity-40 scale-90 grayscale" : "opacity-100 scale-100",
                isCameraScene && isWinner ? "scale-[1.03]" : ""
            )}>
                {/* Phone cutout with premium styling */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <PhoneCutout
                        src={(side === 'A' ? effectiveScene?.effective.media?.phoneAImageSrc : effectiveScene?.effective.media?.phoneBImageSrc) ?? phone.image?.dataUrl ?? null}
                        alt={phone.name}
                        variant={currentVariant}
                    />

                    {/* Winner trophy overlay */}
                    {isWinner && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="bg-green-500 text-white p-2 rounded-full transform -rotate-12 shadow-lg scale-150">
                                <Trophy className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Phone name */}
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white drop-shadow-lg">
                        {phone.name}
                    </h1>
                    {isWinner && <p className="text-green-400 text-xs font-bold uppercase tracking-widest mt-1">WINNER</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="flex w-full h-full items-center justify-around px-8 bg-slate-950/20 relative">
            {renderPhoneCard(phoneA, 'A')}
            <div className="flex flex-col items-center gap-4 z-20">
                <div className="text-4xl font-black text-blue-500 italic drop-shadow-xl">VS</div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-[0.2em]">
                    {sceneKey}
                </div>
                {winner === 'TIE' && (
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <AlertTriangle className="w-3 h-3" /> TIE
                    </div>
                )}
            </div>
            {renderPhoneCard(phoneB, 'B')}

            {(reason || captionOverride || effectiveScene?.effective.text?.caption) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 text-white/60 text-[10px] font-medium max-w-[80%] text-center truncate">
                    {effectiveScene?.effective.text?.caption || captionOverride || reason}
                </div>
            )}
        </div>
    );
}
