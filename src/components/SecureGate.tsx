import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming utils exists

interface SecureGateProps {
    onUnlock: () => void;
}

const PIN = "2965";

export function SecureGate({ onUnlock }: SecureGateProps) {
    const [input, setInput] = useState("");
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const handleInput = (char: string) => {
        if (input.length < 4) {
            setInput(prev => prev + char);
            setError(false);
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError(false);
    };

    const contentSubmit = () => {
        if (input === PIN) {
            onUnlock();
        } else {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setInput("");
        }
    };

    useEffect(() => {
        if (input.length === 4) {
            contentSubmit();
        }
    }, [input]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <div className={cn(
                "bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full transition-transform",
                shake ? "animate-shake" : ""
            )}>
                <div className="flex flex-col items-center mb-8">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                        error ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    )}>
                        {error ? <Lock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Visual Editor Access</h2>
                    <p className="text-sm text-slate-500 mt-2 text-center">
                        Please enter the 4-digit security PIN to access the Phase 3 Editor.
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all duration-300",
                                i < input.length
                                    ? "bg-slate-800 border-slate-800 scale-110"
                                    : "bg-transparent border-slate-300"
                            )}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-red-500 text-xs text-center mb-4 font-medium animate-pulse">
                        Incorrect PIN. Please try again.
                    </p>
                )}

                <div className="grid grid-cols-3 gap-4 w-full max-w-[240px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleInput(num.toString())}
                            className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xl transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleInput("0")}
                        className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xl transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-16 h-16 rounded-full bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center focus:outline-none"
                    >
                        ←
                    </button>
                </div>
            </div>
        </div>
    );
}
