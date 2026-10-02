import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { CircleAlert, FileUp, ImagePlus } from 'lucide-react';
import { formatBytes, validateFile, type FileRule } from '@/lib/files';
import { cn } from '@/lib/utils';

interface Props {
    id?: string;
    /** Main line of text, e.g. "Add product photos". Also the input's accessible name. */
    label: string;
    rule: FileRule;
    onFiles: (files: File[]) => void;
    multiple?: boolean;
    disabled?: boolean;
    /** Error from the server (or parent) shown under the drop area. */
    error?: string | null;
    /** Extra hint line, e.g. recommended image size. */
    hint?: ReactNode;
    /** Smaller one-line version for tight spots (dialogs, rows). */
    compact?: boolean;
    className?: string;
}

/**
 * Big, obvious upload target: tap to pick from the phone's gallery/camera
 * or drag a file onto it on desktop. Checks type and size before anything
 * is sent and explains problems in plain words.
 */
export default function FileDropzone({
    id,
    label,
    rule,
    onFiles,
    multiple = false,
    disabled = false,
    error,
    hint,
    compact = false,
    className,
}: Props) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = `${inputId}-hint`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState<string[]>([]);

    const imagesOnly = rule.types.every((t) => t.startsWith('image/'));
    const noun = imagesOnly ? (multiple ? 'photos' : 'a photo') : 'a file';
    const Icon = imagesOnly ? ImagePlus : FileUp;

    function accept(list: FileList | null) {
        if (!list || list.length === 0) return;
        const picked = multiple ? Array.from(list) : [list[0]];
        const problems: string[] = [];
        const valid = picked.filter((file) => {
            const problem = validateFile(file, rule);
            if (problem) problems.push(problem);
            return problem === null;
        });
        setLocalErrors(problems);
        if (valid.length > 0) onFiles(valid);
        if (inputRef.current) inputRef.current.value = '';
    }

    function onDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setDragging(false);
        if (!disabled) accept(event.dataTransfer.files);
    }

    const errors = [...localErrors, ...(error ? [error] : [])];

    return (
        <div className={cn('space-y-2', className)}>
            <label
                htmlFor={inputId}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                    'flex cursor-pointer items-center rounded-xl border-2 border-dashed text-center transition-colors',
                    'has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                    compact ? 'min-h-14 gap-3 px-4 py-3 text-left' : 'flex-col justify-center gap-2 px-4 py-8',
                    dragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5',
                    errors.length > 0 && 'border-destructive/60',
                    disabled && 'pointer-events-none cursor-not-allowed opacity-50',
                )}
            >
                <span
                    className={cn(
                        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground',
                        compact ? 'size-9' : 'size-12',
                    )}
                >
                    <Icon className={compact ? 'size-4' : 'size-6'} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span id={hintId} className="block text-xs text-muted-foreground">
                        <span className="hidden sm:inline">Click to choose {noun}, or drag {multiple ? 'them' : 'it'} here. </span>
                        <span className="sm:hidden">Tap to choose {noun}. </span>
                        {rule.typeLabel} · up to {formatBytes(rule.maxBytes)}
                        {multiple && ' each'}
                    </span>
                    {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
                </span>
                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    accept={rule.types.join(',')}
                    multiple={multiple}
                    disabled={disabled}
                    aria-describedby={hintId}
                    aria-invalid={errors.length > 0}
                    onChange={(e) => accept(e.target.files)}
                    className="sr-only"
                />
            </label>

            {errors.length > 0 && (
                <ul className="space-y-1" role="alert">
                    {errors.map((message) => (
                        <li key={message} className="flex items-start gap-1.5 text-sm text-destructive">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {message}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
