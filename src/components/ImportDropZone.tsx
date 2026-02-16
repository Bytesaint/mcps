import { useState, useRef, DragEvent } from 'react';
import { Upload, FileJson, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';
import { ACTIONS } from '../actionMap';

interface ImportDropZoneProps {
    onFileSelected: (file: File) => void;
    isLoading?: boolean;
}

export function ImportDropZone({ onFileSelected, isLoading }: ImportDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSelect(e.target.files[0]);
        }
    };

    const validateAndSelect = (file: File) => {
        // Basic client-side checks
        if (!file.name.toLowerCase().endsWith('.json')) {
            setError("Only .json files are supported.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            setError("File is too large (max 5MB).");
            return;
        }

        setError(null);
        onFileSelected(file);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative rounded-xl border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center text-center",
                isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300",
                error ? "border-red-300 bg-red-50" : ""
            )}
            data-action={ACTIONS.MPCS_PROJECTS_IMPORT_DROP}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileInput}
            />

            {error ? (
                <div className="flex flex-col items-center gap-2 text-red-600 animate-in fade-in slide-in-from-bottom-2">
                    <AlertCircle className="w-8 h-8" />
                    <p className="font-medium">{error}</p>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 mt-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            setError(null);
                        }}
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <>
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                        isDragging ? "bg-blue-100 text-blue-600" : "bg-white text-slate-400 shadow-sm"
                    )}>
                        <Upload className="w-6 h-6" />
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-1">Import Project</h3>
                    <p className="text-sm text-slate-500 mb-4 max-w-xs">
                        Drag & drop your .json project file here, or click to browse.
                    </p>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        action={ACTIONS.MPCS_PROJECTS_IMPORT_FILE_PICK}
                    >
                        <FileJson className="w-4 h-4 mr-2" />
                        Choose JSON File
                    </Button>
                </>
            )}

            {isLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl cursor-wait">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
