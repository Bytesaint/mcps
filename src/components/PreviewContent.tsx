import { Phone, Rule, Template } from '../types/models';
import { cn } from '../lib/utils';
import { Trophy, AlertTriangle } from 'lucide-react';
import { compareSpecs } from '../engine/compareAdvanced';

interface PreviewContentProps {
    sceneKey: string;
    template?: Template;
    phoneA?: Phone;
    phoneB?: Phone;
    rules: Rule[];
    captionOverride?: string;
}

export default function PreviewContent({
    sceneKey,
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

    const isBodyScene = sceneKey !== 'intro' && sceneKey !== 'subintro' && sceneKey !== 'score';

    if (isBodyScene) {
        const rule = rules.find(r => r.id === sceneKey || r.specKey === sceneKey);
        const specA = phoneA.specs.find(s => s.key === rule?.specKey || s.key === sceneKey)?.value || "";
        const specB = phoneB.specs.find(s => s.key === rule?.specKey || s.key === sceneKey)?.value || "";

        if (rule) {
            const result = compareSpecs(specA, specB, rule);
            winner = result.winner;
            reason = result.reason;
        }
    }

    const renderPhoneCard = (phone: Phone, side: 'A' | 'B') => {
        const isWinner = winner === side;
        const isLoser = winner !== side && winner !== 'TIE' && winner !== null;

        return (
            <div className={cn(
                "flex flex-col items-center gap-6 transition-all duration-500 w-full h-full",
                side === 'A' ? "animate-in slide-in-from-left-8 duration-700" : "animate-in slide-in-from-right-8 duration-700",
                isLoser ? "opacity-40 scale-90 grayscale" : "opacity-100 scale-100"
            )}>
                <div className={cn(
                    "w-full h-full rounded-[2rem] border-[6px] shadow-2xl relative overflow-hidden flex items-center justify-center transition-all duration-500",
                    isWinner ? "border-green-500 ring-4 ring-green-500/30" : "border-slate-700",
                    "bg-gradient-to-b from-slate-800 to-black"
                )}>
                    {phone.image ? (
                        <img
                            src={phone.image.dataUrl}
                            alt={phone.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="bg-slate-900 w-full h-full flex items-center justify-center text-slate-700 font-bold text-xs uppercase tracking-widest">NO IMAGE</div>
                    )}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-700 rounded-full" />

                    {isWinner && (
                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center pointer-events-none">
                            <div className="bg-green-500 text-white p-2 rounded-full transform -rotate-12 shadow-lg scale-150">
                                <Trophy className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                </div>
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
        <div className="w-full h-full p-6 bg-slate-950/20 relative overflow-hidden flex items-center justify-center">
            <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-8 max-w-6xl mx-auto">
                {/* Side A */}
                <div className="flex justify-center min-w-0 h-full items-center">
                    <div className="w-full max-w-[220px] sm:max-w-[260px] md:max-w-[320px] aspect-[9/16]">
                        {renderPhoneCard(phoneA, 'A')}
                    </div>
                </div>

                {/* VS Center */}
                <div className="flex flex-col items-center gap-4 z-20 shrink-0">
                    <div className="text-4xl font-black text-blue-500 italic drop-shadow-xl">VS</div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                        {sceneKey}
                    </div>
                    {winner === 'TIE' && (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <AlertTriangle className="w-3 h-3" /> TIE
                        </div>
                    )}
                </div>

                {/* Side B */}
                <div className="flex justify-center min-w-0 h-full items-center">
                    <div className="w-full max-w-[220px] sm:max-w-[260px] md:max-w-[320px] aspect-[9/16]">
                        {renderPhoneCard(phoneB, 'B')}
                    </div>
                </div>
            </div>

            {(reason || captionOverride) && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-white/70 text-[11px] font-medium max-w-[70%] text-center shadow-xl">
                    {captionOverride || reason}
                </div>
            )}
        </div>
    );
}
