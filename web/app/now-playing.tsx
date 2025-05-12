'use client';

import { useRef, useEffect, useState } from 'react';
import { usePlayback } from './playback-context'; // Assuming this context now has NowPlaying states
import { PanelRightOpen } from 'lucide-react'; // Example icon for a toggle button

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function NowPlaying() {
  const {
    isNowPlayingOpen,
    toggleNowPlaying, // To close the panel, e.g., with a button inside it
    nowPlayingWidth,
    setNowPlayingWidth,
    currentTrack, // To display track info
    setActivePanel,
  } = usePlayback();

  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update internal width state if context width changes (e.g. on first load)
    if (sidebarRef.current && sidebarRef.current.offsetWidth !== nowPlayingWidth) {
      // This direct DOM manipulation for width is okay for resizable sidebar controlled by state
    }
  }, [nowPlayingWidth]);

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
      if (!isResizing || !sidebarRef.current) return;
      const deltaX = e.clientX - initialMouseX;
      const newWidth = initialWidth - deltaX; // Resizing from left edge
      const constrainedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setNowPlayingWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const currentResizeHandle = resizeHandleRef.current;
    if (currentResizeHandle) {
      currentResizeHandle.addEventListener('mousedown', handleMouseDown);
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
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
  }, [isResizing, initialMouseX, initialWidth, setNowPlayingWidth]);

  if (!isNowPlayingOpen) {
    return null; // Don't render if panel is closed
  }

  return (
    <div
      ref={sidebarRef}
      className="fixed right-0 bg-neutral-700 border-l border-[#282828] flex flex-col z-30 shadow-xl"
      style={{
        width: `${nowPlayingWidth}px`,
        top: '64px',
        height: 'calc(100vh - 136px)',
      }}
      onClick={() => setActivePanel('nowPlaying')}
    >
      {/* Resize Handle (on the left) */}
      <div
        ref={resizeHandleRef}
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize group z-10"
      >
        <div className="w-[3px] h-10 bg-gray-600 rounded-full absolute top-1/2 -translate-y-1/2 left-[calc(50%-1.5px)] group-hover:bg-blue-400" />
      </div>

      {/* Panel Content */}
      <div className="flex-grow p-4 overflow-y-auto">
        {currentTrack ? (
          <div>
            <img src={currentTrack.imageUrl || '/placeholder.svg'} alt={currentTrack.name} className="w-full aspect-square object-cover rounded-md mb-4" />
            <h3 className="text-lg font-medium text-white">{currentTrack.name}</h3>
            <p className="text-sm text-gray-400">{currentTrack.artist}</p>
            {/* Add more details or lyrics component here */}
          </div>
        ) : (
          <p className="text-gray-500">No track playing.</p>
        )}

        {/* Placeholder for more content to test scrollability */}
        <div className="mt-8 space-y-2">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-10 bg-neutral-700 rounded flex items-center justify-center text-neutral-500 text-xs">
              Scrollable Content {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
