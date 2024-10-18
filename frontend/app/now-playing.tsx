'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { PencilIcon, Loader2, CheckIcon } from 'lucide-react';
import { updateTrackAction } from './actions';
import { usePlayback } from './playback-context';
import { songs } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { VoiceConsole } from "@/components/livekit/VoiceConsole";

export function NowPlaying() {
  const {currentTrack} = usePlayback();
  if (!currentTrack) {
    return null;
  }

  return (
    <div className="hidden md:flex flex-col w-1/4 max-w-50vh p-4 bg-[#121212] overflow-auto">
      <div className="flex-grow-[1]">
        <h2 className="mb-3 text-sm font-semibold text-gray-200">Now Playing</h2>
        <div className="relative aspect-square mb-3 group">
          <img
            src={currentTrack.imageUrl as string}
            alt={currentTrack.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full space-y-1">
          <EditableInput
            initialValue={`${currentTrack.name} from ${currentTrack.artist}`}
            trackId={currentTrack.id}
            field="name"
            label="Title"
          />
        </div>
      </div>
      <div className="flex-grow-[1]">
        <VoiceConsole />
      </div>
    </div>
  );
}

  interface EditableInputProps {
    initialValue: string;
    trackId: string;
    field: keyof typeof songs.$inferInsert;
    label: string;
  }

    export function EditableInput({
    initialValue,
    trackId,
    field,
    label,
  }: EditableInputProps) {
    let [isEditing, setIsEditing] = useState(false);
    let [value, setValue] = useState(initialValue);
    let [showCheck, setShowCheck] = useState(false);
    let inputRef = useRef<HTMLInputElement>(null);
    let formRef = useRef<HTMLFormElement>(null);
    let [state, formAction, pending] = useActionState(updateTrackAction, {
    success: false,
    error: '',
  });

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
    if (state.success) {
    setShowCheck(true);
    const timer = setTimeout(() => {
    setShowCheck(false);
  }, 2000);
    return () => clearTimeout(timer);
  }
  }, [state.success]);

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

    return (
    <div className="space-y-1 group">
    <label
    htmlFor={`${field}-input`}
       className="text-xs text-muted-foreground"
  >
    {label}
  </label>
  <div
      className="flex items-center justify-between w-full text-xs h-3 border-b border-transparent focus-within:border-white transition-colors">
    {isEditing ? (
        <form ref={formRef} action={formAction} className="w-full">
          <input type="hidden" name="trackId" value={trackId}/>
          <input type="hidden" name="field" value={field}/>
          <input
              ref={inputRef}
              id={`${field}-input`}
              type="text"
              name={field}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className={cn(
                  'bg-transparent w-full focus:outline-none p-0',
                  state.error && 'text-red-500'
              )}
              aria-invalid={state.error ? 'true' : 'false'}
              aria-describedby={state.error ? `${field}-error` : undefined}
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
        >
            <span className={cn(value ? '' : 'text-muted-foreground')}>
              {value || '-'}
            </span>
        </div>
    )}
    <div className="flex items-center">
      {pending ? (
          <Loader2 className="size-3 animate-spin"/>
      ) : showCheck ? (
          <CheckIcon className="size-3 text-green-500"/>
      ) : (
          !isEditing && (
              <PencilIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
          )
      )}
    </div>
  </div>
{
  state.error && (
      <p id={`${field}-error`} className="text-xs text-red-500">
        {state.error}
      </p>
  )
}
</div>
)
  ;
}
