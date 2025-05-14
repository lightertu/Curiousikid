'use client';

import { useRef, useEffect, useState } from 'react';
import { usePlayback } from './playback-context';
import { useAppStore } from '@/lib/store';
import { PanelRightClose } from 'lucide-react';
import VoiceConsole from '../components/ui/voice-animation';

const MIN_WIDTH = 250;
const MAX_WIDTH = 500;

export function NowPlaying() {
  const isNowPlayingOpen = useAppStore((state) => state.isNowPlayingOpen);
  const toggleNowPlaying = useAppStore((state) => state.toggleNowPlaying);
  const nowPlayingWidth = useAppStore((state) => state.nowPlayingWidth);
  const setNowPlayingWidth = useAppStore((state) => state.setNowPlayingWidth);
  const attemptCollapseNowPlaying = useAppStore((state) => state.attemptCollapseNowPlaying);

  const { currentTrack, setActivePanel } = usePlayback();

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
      onClick={() => setActivePanel('nowPlaying')}
    >
      <div
        ref={resizeHandleRef}
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize group z-10"
      >
        <div className="w-[3px] h-10 bg-gray-600 rounded-full absolute top-1/2 -translate-y-1/2 left-[calc(50%-1.5px)] group-hover:bg-blue-400" />
      </div>

      <div className="p-3 flex justify-between items-center flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent onClick from parent div if toggleNowPlaying is also an action
            toggleNowPlaying();
          }}
          className="p-1.5 hover:bg-neutral-600 rounded-md text-gray-300 hover:text-white"
          aria-label="Collapse Now Playing panel"
          title="Collapse Now Playing"
        >
          <PanelRightClose size={24} />
        </button>
        <h4 className="text-xl font-semibold text-white">Now Playing</h4>
      </div>

      <div className="flex-grow p-3 pt-0 overflow-y-auto flex flex-col">
        <div className="flex-shrink-0"> {/* Ensures this part doesn't grow excessively */}
          {currentTrack ? (
            <div className="mb-4">
              <img src={currentTrack.imageUrl || '/placeholder.svg'} alt={currentTrack.name} className="w-full aspect-square object-cover rounded-md mb-4" />
              <h3 className="text-lg font-medium text-white">{currentTrack.name}</h3>
              <p className="text-sm text-gray-400">{currentTrack.artist}</p>
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No track playing.</p>
          )}
        </div>

        <div className="flex-grow flex flex-col"> {/* This container fills space below track info */}
          <div className="flex-grow-[2]"></div> {/* Spacer above VoiceConsole (takes 2/3 of remaining flex space) */}
          <div className="flex-shrink-0 py-2">      {/* VoiceConsole container (does not grow, some vertical padding) */}
            <VoiceConsole theme="ios9" />
          </div>
          <div className="flex-grow-[1]"></div> {/* Spacer below VoiceConsole (takes 1/3 of remaining flex space) */}
        </div>
      </div>
    </div>
  );
}
