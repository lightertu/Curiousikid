'use client';

import { useRef, useEffect, useState } from 'react';
import { usePlayback } from './playback-context'; // Assuming this context now has NowPlaying states
import { PanelRightOpen } from 'lucide-react'; // Example icon for a toggle button

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function NowPlaying() {
  const {
    isNowPlayingOpen,
    // toggleNowPlaying, // Removed as per user request (no close button)
    nowPlayingWidth,
    setNowPlayingWidth,
    currentTrack, // To display track info
    setActivePanel,
  } = usePlayback();

  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null); // This ref is for the main div to get its offsetWidth

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      e.preventDefault();
      setIsResizing(true);
      setInitialMouseX(e.clientX);
      // Capture the width from the sidebarRef (which gets its width from context state)
      setInitialWidth(sidebarRef.current.offsetWidth);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // We need initialWidth to be from the state set on mousedown
      const currentInitialWidth = initialWidth;
      const deltaX = e.clientX - initialMouseX;
      const newWidth = currentInitialWidth - deltaX;
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

    // Add/remove document listeners based on isResizing state
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
    // Dependencies now correctly include initialWidth and initialMouseX which are used in handleMouseMove
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
