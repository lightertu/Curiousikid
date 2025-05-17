'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import VoiceConsole from '../components/ui/voice-animation';
import useVapi from '@/components/hooks/use-vapi';
import TranscriptionDisplay from '../components/ui/transcription-display';
import { usePlayback } from '@/app/playback-context';
import { Button } from '@/components/ui/button';

const MIN_WIDTH = 350;
const MAX_WIDTH = 500;

export function NowPlaying() {
  const isNowPlayingOpen = useAppStore((state) => state.isNowPlayingOpen);
  const nowPlayingWidth = useAppStore((state) => state.nowPlayingWidth);
  const setNowPlayingWidth = useAppStore((state) => state.setNowPlayingWidth);
  const attemptCollapseNowPlaying = useAppStore((state) => state.attemptCollapseNowPlaying);

  const {
    volumeLevel,
    userVolumeLevel,
    isSessionActive,
    isConnecting,
    conversation,
    toggleCall: vapiToggleCall,
  } = useVapi();

  const {
    pausePlayback,
  } = usePlayback();

  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      e.preventDefault();
      setIsResizing(true);
      setInitialMouseX(e.clientX);
      setInitialWidth(sidebarRef.current.offsetWidth);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const currentInitialWidth = initialWidth;
      const deltaX = e.clientX - initialMouseX;
      const newWidth = currentInitialWidth - deltaX;
      attemptCollapseNowPlaying(newWidth);
      const storeState = useAppStore.getState();
      if (storeState.isNowPlayingOpen) {
        const constrainedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
        setNowPlayingWidth(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const currentWidth = sidebarRef.current?.offsetWidth ?? nowPlayingWidth;
      attemptCollapseNowPlaying(currentWidth);
    };

    const currentResizeHandle = resizeHandleRef.current;
    if (currentResizeHandle) {
      currentResizeHandle.addEventListener('mousedown', handleMouseDown);
    }
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
  }, [isResizing, initialMouseX, initialWidth, setNowPlayingWidth, attemptCollapseNowPlaying]);

  const handleToggleCall = useCallback(async () => {
    if (!isSessionActive) {
      pausePlayback();
    }
    await vapiToggleCall();
  }, [isSessionActive, pausePlayback, vapiToggleCall]);

  const showTranscription = isConnecting || isSessionActive;

  if (!isNowPlayingOpen) {
    return null;
  }

  return (
    <div
      ref={sidebarRef}
      className="fixed right-0 bg-[#181818] border-l border-[#282828] flex flex-col z-30 shadow-xl"
      style={{
        width: `${nowPlayingWidth}px`,
        top: '64px',
        height: 'calc(100vh - 136px)',
      }}
    >
      <div
        ref={resizeHandleRef}
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize group z-10"
      >
        <div className="w-[3px] h-10 bg-gray-600 rounded-full absolute top-1/2 -translate-y-1/2 left-[calc(50%-1.5px)] group-hover:bg-blue-400" />
      </div>

      <div className="flex flex-col h-full p-3 pt-1 overflow-hidden">
        {showTranscription && (
          <div className="flex-[2_2_0%] overflow-y-auto mb-3 p-3 custom-scrollbar">
            <TranscriptionDisplay conversation={conversation} />
          </div>
        )}

        <div className={`flex flex-col justify-center items-center pt-2 ${showTranscription ? 'flex-[1_1_0%]' : 'flex-grow'}`}>
          <VoiceConsole
            theme="ios9"
            volumeLevel={volumeLevel}
            userVolumeLevel={userVolumeLevel}
            isSessionActive={isSessionActive}
            isConnecting={isConnecting}
            toggleCall={handleToggleCall}
          />
        </div>
      </div>
    </div>
  );
}
