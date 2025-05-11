'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useActionState } from 'react';
import { PencilIcon, Loader2, CheckIcon, GripVertical } from 'lucide-react';
import { updateTrackAction, updateTrackImageAction } from './actions';
import { usePlayback } from './playback-context';
import { songs } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export function NowPlaying() {
  const { currentTrack } = usePlayback();
  const [imageState, imageFormAction, imagePending] = useActionState(
    updateTrackImageAction,
    {
      success: false,
      imageUrl: '',
    } as any // Cast to any to resolve type mismatch with useActionState
  );
  const [showPencil, setShowPencil] = useState(false);
  const [width, setWidth] = useState(400); // Default width (w-56 = 224px)
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Calculate font sizes based on sidebar width
  const fontSizes = useMemo(() => {
    const baseWidth = 224; // Corresponds to initial w-56
    const scaleFactor = width / baseWidth;

    // Define base font sizes in rem
    const baseHeadingRem = 0.875; // text-sm (14px)
    const baseLabelRem = 0.75;    // text-xs (12px)
    const baseTextRem = 0.75;     // text-xs (12px)

    // Calculate scaled font sizes, with min/max limits
    const headingSize = Math.max(0.75, Math.min(1.25, baseHeadingRem * scaleFactor));
    const labelSize = Math.max(0.6, Math.min(1, baseLabelRem * scaleFactor));
    const textSize = Math.max(0.65, Math.min(1.1, baseTextRem * scaleFactor));

    return {
      heading: `${headingSize}rem`,
      label: `${labelSize}rem`,
      text: `${textSize}rem`,
    };
  }, [width]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!imagePending) {
      timer = setTimeout(() => setShowPencil(true), 300);
    } else {
      setShowPencil(false);
    }
    return () => clearTimeout(timer);
  }, [imagePending]);

  useEffect(() => {
    const MIN_WIDTH = 180;
    const MAX_WIDTH = 400;

    const handleMouseDown = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      setIsResizing(true);
      setInitialMouseX(e.clientX);
      setInitialWidth(sidebarRef.current.offsetWidth);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const deltaX = e.clientX - initialMouseX;
      // For a right-hand sidebar, resizing from the left means initialWidth - deltaX
      const newWidth = initialWidth - deltaX;
      const constrainedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const currentResizeHandle = resizeHandleRef.current;
    if (currentResizeHandle) {
      currentResizeHandle.addEventListener('mousedown', handleMouseDown);
      // Add mousemove and mouseup to document to capture outside the handle
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }

    return () => {
      if (currentResizeHandle) {
        currentResizeHandle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, initialMouseX, initialWidth]);

  if (!currentTrack) {
    return null;
  }

  const currentImageUrl = (imageState as any)?.success
    ? (imageState as any).imageUrl
    : currentTrack.imageUrl;

  return (
    <div
      ref={sidebarRef}
      className="relative hidden md:flex flex-col p-4 bg-[#121212] overflow-auto shrink-0" // shrink-0 is important for flex layouts
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize group z-10"
      >
        <div className="w-[3px] h-10 bg-gray-600 rounded-full absolute top-1/2 -translate-y-1/2 left-[calc(50%-1.5px)] group-hover:bg-blue-400 transition-colors" />
      </div>

      <h2
        className="mb-3 font-semibold text-gray-200"
        style={{ fontSize: fontSizes.heading }}
      >
        Now Playing
      </h2>
      <div className="relative w-full aspect-square mb-3 group">
        <img
          src={currentImageUrl || '/placeholder.svg'}
          alt={currentTrack.name}
          className="w-full h-full object-cover"
        />
        <form action={imageFormAction} className="absolute inset-0">
          <input type="hidden" name="trackId" value={currentTrack.id} />
          <label
            htmlFor="imageUpload"
            className="absolute inset-0 cursor-pointer flex items-center justify-center"
          >
            <input
              id="imageUpload"
              type="file"
              name="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size <= 5 * 1024 * 1024) {
                    e.target.form?.requestSubmit();
                  } else {
                    alert('File size exceeds 5MB limit');
                    e.target.value = '';
                  }
                }
              }}
            />
            <div
              className={cn(
                'group-hover:bg-black group-hover:bg-opacity-50 rounded-full p-2 transition-colors',
                imagePending && 'bg-black bg-opacity-50'
              )}
            >
              {imagePending ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                showPencil && (
                  <PencilIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )
              )}
            </div>
          </label>
        </form>
      </div>
      <div className="w-full space-y-1">
        <EditableInput
          initialValue={currentTrack.name}
          trackId={currentTrack.id}
          field="name"
          label="Title"
          fontSize={fontSizes.text}
          labelSize={fontSizes.label}
        />
        <EditableInput
          initialValue={currentTrack.artist}
          trackId={currentTrack.id}
          field="artist"
          label="Artist"
          fontSize={fontSizes.text}
          labelSize={fontSizes.label}
        />
        <EditableInput
          initialValue={currentTrack.genre || ''}
          trackId={currentTrack.id}
          field="genre"
          label="Genre"
          fontSize={fontSizes.text}
          labelSize={fontSizes.label}
        />
        <EditableInput
          initialValue={currentTrack.album || ''}
          trackId={currentTrack.id}
          field="album"
          label="Album"
          fontSize={fontSizes.text}
          labelSize={fontSizes.label}
        />
        <EditableInput
          initialValue={currentTrack.bpm?.toString() || ''}
          trackId={currentTrack.id}
          field="bpm"
          label="BPM"
          fontSize={fontSizes.text}
          labelSize={fontSizes.label}
        />
        <EditableInput
          initialValue={currentTrack.key || ''}
          trackId={currentTrack.id}
          field="key"
          label="Key"
          fontSize={fontSizes.text}
          labelSize={fontSizes.label}
        />
      </div>
    </div>
  );
}

interface EditableInputProps {
  initialValue: string;
  trackId: string;
  field: keyof typeof songs.$inferInsert;
  label: string;
  fontSize: string;
  labelSize: string;
}

export function EditableInput({
  initialValue,
  trackId,
  field,
  label,
  fontSize,
  labelSize,
}: EditableInputProps) {
  let [isEditing, setIsEditing] = useState(false);
  let [value, setValue] = useState(initialValue);
  let [showCheck, setShowCheck] = useState(false);
  let inputRef = useRef<HTMLInputElement>(null);
  let formRef = useRef<HTMLFormElement>(null);
  let [state, formAction, pending] = useActionState(updateTrackAction, {
    success: false,
    error: '',
  } as any // Cast to any to resolve type mismatch with useActionState
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(initialValue);
    setIsEditing(false);
    setShowCheck(false);
  }, [initialValue, trackId]);

  useEffect(() => {
    if ((state as any).success) {
      setShowCheck(true);
      const timer = setTimeout(() => {
        setShowCheck(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  function handleSubmit() {
    if (value.trim() === '' || value === initialValue) {
      setIsEditing(false);
      return;
    }
    formRef.current?.requestSubmit();
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(initialValue);
    }
  }

  const fieldAsString = String(field);

  return (
    <div className="space-y-1 group">
      <label
        htmlFor={`${fieldAsString}-input`}
        className="text-muted-foreground"
        style={{ fontSize: labelSize }}
      >
        {label}
      </label>
      <div
        className="flex items-center justify-between w-full border-b border-transparent focus-within:border-white transition-colors"
        style={{
          fontSize: fontSize,
          // Adjust height based on font size for better visual balance
          height: `calc(${fontSize} + 0.8rem)`
        }}
      >
        {isEditing ? (
          <form ref={formRef} action={formAction} className="w-full">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="field" value={fieldAsString} />
            <input
              ref={inputRef}
              id={`${fieldAsString}-input`}
              type="text"
              name={fieldAsString}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className={cn(
                'bg-transparent w-full focus:outline-none p-0',
                (state as any).error && 'text-red-500'
              )}
              style={{ fontSize: fontSize }}
              aria-invalid={(state as any).error ? 'true' : 'false'}
              aria-describedby={(state as any).error ? `${fieldAsString}-error` : undefined}
            />
          </form>
        ) : (
          <div
            className="w-full cursor-pointer truncate block"
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsEditing(true);
              }
            }}
            aria-label={`Edit ${label}`}
            style={{ fontSize: fontSize }}
          >
            <span className={cn(value ? '' : 'text-muted-foreground')}>
              {value || '-'}
            </span>
          </div>
        )}
        <div className="flex items-center ml-2">
          {pending ? (
            <Loader2 style={{ width: fontSize, height: fontSize }} className="animate-spin" />
          ) : showCheck ? (
            <CheckIcon style={{ width: fontSize, height: fontSize }} className="text-green-500" />
          ) : (
            !isEditing && (
              <PencilIcon style={{ width: fontSize, height: fontSize }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            )
          )}
        </div>
      </div>
      {(state as any).error && (
        <p id={`${fieldAsString}-error`} className="text-xs text-red-500" style={{ fontSize: labelSize }}>
          {(state as any).error}
        </p>
      )}
    </div>
  );
}
