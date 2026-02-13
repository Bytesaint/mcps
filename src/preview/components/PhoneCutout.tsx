import { cn } from '../../lib/utils';

interface PhoneCutoutProps {
    src: string | null;
    alt: string;
    variant?: "large" | "medium" | "small";
    align?: "left" | "center" | "right";
    showFallback?: boolean;
}

export default function PhoneCutout({
    src,
    alt,
    variant = "large",
    align = "center",
    showFallback = true
}: PhoneCutoutProps) {
    // Variant sizing
    const sizeClasses = {
        large: "h-[62%] w-[42%] md:w-[38%]",
        medium: "h-[52%] w-[34%]",
        small: "h-[42%] w-[28%]"
    };

    // Alignment
    const alignClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end"
    };

    // No image fallback
    if (!src && showFallback) {
        return (
            <div className={cn(
                "flex items-center",
                sizeClasses[variant],
                alignClasses[align]
            )}>
                <div className="w-[60%] h-[60%] border border-white/10 bg-white/5 rounded-xl flex items-center justify-center text-xs text-white/50 font-medium tracking-wide">
                    NO IMAGE
                </div>
            </div>
        );
    }

    if (!src) return null;

    return (
        <div className={cn(
            "relative flex items-center",
            sizeClasses[variant],
            alignClasses[align]
        )}>
            {/* Subtle glow behind image */}
            <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/10 opacity-60" />

            {/* Phone image cutout */}
            <img
                src={src}
                alt={alt}
                className={cn(
                    "relative max-h-full max-w-full object-contain object-center select-none pointer-events-none z-10",
                    "drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)]"
                )}
            />
        </div>
    );
}
