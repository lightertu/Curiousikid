'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayback } from '@/app/playback-context';

export function TrackInfo() {
  let { currentTrack } = usePlayback();

  return (
    <div className="flex items-center space-x-3 w-1/3">
      {currentTrack && (
        <>
          <img
            src={currentTrack.imageUrl || '/placeholder.svg'}
            alt="Now playing"
            className="w-12 h-12 object-cover"
          />
          <div className="flex-shrink min-w-0">
            <div className="text-base font-medium truncate max-w-[120px] sm:max-w-[200px] text-gray-200">
              {currentTrack.name}
            </div>
            <div className="text-sm text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">
              {currentTrack.artist}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 hidden sm:flex"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
}

export function PlaybackButtons() {
  let {
    isPlaying,
    togglePlayPause,
    playPreviousTrack,
    playNextTrack,
    currentTrack,
  } = usePlayback();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={playPreviousTrack}
        disabled={!currentTrack}
      >
        <SkipBack className="w-5 h-5 stroke-[1.5]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={togglePlayPause}
        disabled={!currentTrack}
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 stroke-[1.5]" />
        ) : (
          <Play className="w-6 h-6 stroke-[1.5]" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={playNextTrack}
        disabled={!currentTrack}
      >
        <SkipForward className="w-5 h-5 stroke-[1.5]" />
      </Button>
    </div>
  );
}

export function ProgressBar() {
  let { currentTime, duration, audioRef, setCurrentTime } = usePlayback();
  let progressBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [showThumb, setShowThumb] = useState(false);

  let formatTime = (time: number) => {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateNewTime = (clientX: number) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const progressBarWidth = rect.width;
      let percentage = (x / progressBarWidth) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      return (percentage / 100) * duration;
    }
    return null;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newTime = calculateNewTime(e.clientX);
    if (newTime !== null && audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingThumb(true);
  };

  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!isDraggingThumb) return;
      const newTime = calculateNewTime(e.clientX);
      if (newTime !== null && audioRef.current) {
        setCurrentTime(newTime);
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDraggingThumb) {
        setIsDraggingThumb(false);
        if (audioRef.current) {
          audioRef.current.currentTime = currentTime;
        }
      }
    };

    if (isDraggingThumb) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingThumb, duration, audioRef, setCurrentTime, currentTime, calculateNewTime]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center w-full mt-1">
      <span className="text-sm tabular-nums text-gray-400">
        {formatTime(currentTime)}
      </span>
      <div
        ref={progressBarRef}
        className="flex-grow mx-2 h-1.5 bg-[#3E3E3E] rounded-full cursor-pointer relative group"
        onClick={handleProgressClick}
        onMouseEnter={() => setShowThumb(true)}
        onMouseLeave={() => {
          if (!isDraggingThumb) setShowThumb(false);
        }}
      >
        <div
          className="absolute top-0 left-0 h-full bg-white rounded-full"
          style={{
            width: `${progressPercentage}%`,
          }}
        ></div>
        {(showThumb || isDraggingThumb) && (
          <div
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow -top-1 transform -translate-x-1/2 cursor-grab"
            style={{ left: `${progressPercentage}%` }}
            onMouseDown={handleThumbMouseDown}
          />
        )}
      </div>
      <span className="text-sm tabular-nums text-gray-400">
        {formatTime(duration)}
      </span>
    </div>
  );
}

export function Volume() {
  let { audioRef, currentTrack } = usePlayback();
  let [volume, setVolume] = useState(100);
  let [isMuted, setIsMuted] = useState(false);
  let volumeBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingVolumeThumb, setIsDraggingVolumeThumb] = useState(false);
  const [showVolumeThumb, setShowVolumeThumb] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, audioRef]);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const calculateNewVolume = (clientX: number) => {
    if (volumeBarRef.current) {
      const rect = volumeBarRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const volumeBarWidth = rect.width;
      let percentage = (x / volumeBarWidth) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      return percentage;
    }
    return null;
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newVolume = calculateNewVolume(e.clientX);
    if (newVolume !== null && audioRef.current) {
      setVolume(newVolume);
      audioRef.current.volume = newVolume / 100;
      setIsMuted(newVolume === 0);
    }
  };

  const handleVolumeThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingVolumeThumb(true);
  };

  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!isDraggingVolumeThumb) return;
      const newVolume = calculateNewVolume(e.clientX);
      if (newVolume !== null && audioRef.current) {
        setVolume(newVolume);
        audioRef.current.volume = newVolume / 100;
        setIsMuted(newVolume === 0);
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDraggingVolumeThumb) {
        setIsDraggingVolumeThumb(false);
      }
    };

    if (isDraggingVolumeThumb) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingVolumeThumb, audioRef, calculateNewVolume]);

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={toggleMute}
        disabled={!currentTrack}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-gray-400" />
        ) : (
          <Volume2 className="w-5 h-5 text-gray-400" />
        )}
      </Button>
      <div
        ref={volumeBarRef}
        className="w-28 h-1.5 bg-[#3E3E3E] rounded-full cursor-pointer relative group"
        onClick={handleVolumeClick}
        onMouseEnter={() => setShowVolumeThumb(true)}
        onMouseLeave={() => {
          if (!isDraggingVolumeThumb) setShowVolumeThumb(false);
        }}
      >
        <div
          className="absolute top-0 left-0 h-full bg-gray-500 group-hover:bg-white rounded-full transition-colors duration-150"
          style={{ width: `${isMuted ? 0 : volume}%` }}
        ></div>
        {(showVolumeThumb || isDraggingVolumeThumb) && (
          <div
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow -top-1 transform -translate-x-1/2 cursor-grab"
            style={{ left: `${isMuted ? 0 : volume}%` }}
            onMouseDown={handleVolumeThumbMouseDown}
          />
        )}
      </div>
    </div>
  );
}

export function PlaybackControls() {
  let {
    currentTrack,
    audioRef,
    setCurrentTime,
    setDuration,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
  } = usePlayback();

  useEffect(() => {
    let audio = audioRef.current;
    if (audio) {
      let updateTime = () => setCurrentTime(audio.currentTime);
      let updateDuration = () => setDuration(audio.duration);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, [audioRef, setCurrentTime, setDuration]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artist,
        album: currentTrack.album || undefined,
        artwork: [
          { src: currentTrack.imageUrl!, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler(
        'previoustrack',
        playPreviousTrack
      );
      navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });

      const updatePositionState = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audioRef.current.duration,
              playbackRate: audioRef.current.playbackRate,
              position: audioRef.current.currentTime,
            });
          } catch (error) {
            console.error('Error updating position state:', error);
          }
        }
      };

      const handleLoadedMetadata = () => {
        updatePositionState();
      };

      audioRef.current?.addEventListener('timeupdate', updatePositionState);
      audioRef.current?.addEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      return () => {
        audioRef.current?.removeEventListener(
          'timeupdate',
          updatePositionState
        );
        audioRef.current?.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata
        );
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      };
    }
  }, [
    currentTrack,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
    audioRef,
    setCurrentTime,
  ]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#181818] border-t border-[#282828] z-50">
      <audio ref={audioRef} />
      <TrackInfo />
      <div className="flex flex-col items-center w-1/3">
        <PlaybackButtons />
        <ProgressBar />
      </div>
      <div className="flex items-center justify-end space-x-2 w-1/3 pr-10">
        <Volume />
      </div>
    </div>
  );
}
