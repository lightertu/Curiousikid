'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
    isPlayingIntent,
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
        {isPlayingIntent ? (
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

export function ProgressBar({ onSeek }: { onSeek: (time: number) => void }) {
  let { currentTime, duration } = usePlayback();
  let progressBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [showThumb, setShowThumb] = useState(false);

  let formatTime = (time: number) => {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateNewTime = (clientX: number) => {
    if (progressBarRef.current && duration > 0) {
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
    if (newTime !== null) {
      onSeek(newTime);
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
      if (newTime !== null) {
        onSeek(newTime);
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDraggingThumb) {
        setIsDraggingThumb(false);
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
  }, [isDraggingThumb, duration, onSeek]);

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

export function Volume({
  initialVolumePercent = 100,
  onVolumeChange,
  onMuteToggle,
}: {
  initialVolumePercent?: number;
  onVolumeChange: (volumePercent: number) => void;
  onMuteToggle: (isMuted: boolean, newVolumePercent?: number) => void;
}) {
  const [localVolumePercent, setLocalVolumePercent] = useState(initialVolumePercent);
  const [isLocallyMuted, setIsLocallyMuted] = useState(initialVolumePercent === 0);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingVolumeThumb, setIsDraggingVolumeThumb] = useState(false);
  const [showVolumeThumb, setShowVolumeThumb] = useState(false);
  const lastVolumeBeforeMuteRef = useRef(initialVolumePercent > 0 ? initialVolumePercent : FADE_MAX_VOLUME * 100);

  useEffect(() => {
    if (isLocallyMuted) {
      onVolumeChange(0);
    } else {
      onVolumeChange(localVolumePercent);
    }
  }, [localVolumePercent, isLocallyMuted, onVolumeChange]);

  const handleToggleLocalMute = () => {
    const newMuteState = !isLocallyMuted;
    setIsLocallyMuted(newMuteState);
    if (newMuteState) {
      lastVolumeBeforeMuteRef.current = localVolumePercent > 0 ? localVolumePercent : FADE_MAX_VOLUME * 100;
      onMuteToggle(true);
    } else {
      setLocalVolumePercent(lastVolumeBeforeMuteRef.current);
      onMuteToggle(false, lastVolumeBeforeMuteRef.current);
    }
  };

  const calculateNewVolumePercent = (clientX: number) => {
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

  const updateVolume = (newVolumePercent: number) => {
    setLocalVolumePercent(newVolumePercent);
    if (isLocallyMuted && newVolumePercent > 0) {
      setIsLocallyMuted(false);
      onMuteToggle(false, newVolumePercent);
    } else if (newVolumePercent === 0 && !isLocallyMuted) {
      setIsLocallyMuted(true);
      onMuteToggle(true);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newVolumePercent = calculateNewVolumePercent(e.clientX);
    if (newVolumePercent !== null) updateVolume(newVolumePercent);
  };

  const handleVolumeThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingVolumeThumb(true);
  };

  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!isDraggingVolumeThumb) return;
      const newVolumePercent = calculateNewVolumePercent(e.clientX);
      if (newVolumePercent !== null) updateVolume(newVolumePercent);
    };
    const handleDocumentMouseUp = () => {
      if (isDraggingVolumeThumb) setIsDraggingVolumeThumb(false);
    };
    if (isDraggingVolumeThumb) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingVolumeThumb, calculateNewVolumePercent]);

  const displayVolumePercent = isLocallyMuted ? 0 : localVolumePercent;

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={handleToggleLocalMute}
      >
        {isLocallyMuted ? (
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
          style={{ width: `${displayVolumePercent}%` }}
        ></div>
        {(showVolumeThumb || isDraggingVolumeThumb) && (
          <div
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow -top-1 transform -translate-x-1/2 cursor-grab"
            style={{ left: `${displayVolumePercent}%` }}
            onMouseDown={handleVolumeThumbMouseDown}
          />
        )}
      </div>
    </div>
  );
}

// Local fade constants - these were in playback-context, now local or passed if needed
const FADE_DURATION = 500; // Generic fade duration
const FADE_MIN_VOLUME = 0.001; // Target almost silent for fades to avoid clicks
const FADE_MAX_VOLUME = 1.0;

// Helper to get audio source URL (similar to what was in playback-context)
const getAudioSrc = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('file://')) {
    const filename = url.split('/').pop();
    return `/api/audio/${encodeURIComponent(filename || '')}`;
  }
  return url;
};

export function PlaybackControls() {
  const {
    currentTrack,
    isPlayingIntent,
    setCurrentTime,
    setDuration,
    playPreviousTrack,
    playNextTrack,
  } = usePlayback();

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isAudioEngineSetupRef = useRef(false);
  const isActuallyPlayingRef = useRef(false);
  const isFadingRef = useRef(false);
  const currentTrackIdRef = useRef<string | null | undefined>(null);
  const lastKnownVolumePercentBeforeMuteRef = useRef(FADE_MAX_VOLUME * 100);

  const handlePlayWithFade = useCallback(async () => {
    if (!audioContextRef.current || !localAudioRef.current || !gainNodeRef.current || !localAudioRef.current.src) return;
    if (isActuallyPlayingRef.current || isFadingRef.current) return;
    isFadingRef.current = true;
    if (audioContextRef.current.state === 'suspended') {
      try { await audioContextRef.current.resume(); }
      catch (e) { console.error("Error resuming AC", e); isFadingRef.current = false; return; }
    }
    try {
      await localAudioRef.current.play();
      isActuallyPlayingRef.current = true;
      const gain = gainNodeRef.current.gain;
      const targetVolume = gainNodeRef.current.gain.value < FADE_MIN_VOLUME * 2 ? lastKnownVolumePercentBeforeMuteRef.current / 100 : FADE_MAX_VOLUME;
      gain.setValueAtTime(gain.value, audioContextRef.current.currentTime);
      gain.linearRampToValueAtTime(targetVolume, audioContextRef.current.currentTime + FADE_DURATION / 1000);
    } catch (error) {
      console.error("Error in handlePlayWithFade:", error);
      isActuallyPlayingRef.current = false;
    }
    setTimeout(() => { isFadingRef.current = false; }, FADE_DURATION);
  }, []);

  const handlePauseWithFade = useCallback(async () => {
    if (!audioContextRef.current || !gainNodeRef.current || !isActuallyPlayingRef.current || isFadingRef.current) return;
    isFadingRef.current = true;
    const gain = gainNodeRef.current.gain;
    const acTime = audioContextRef.current.currentTime;
    if (gain.value > FADE_MIN_VOLUME) {
      lastKnownVolumePercentBeforeMuteRef.current = gain.value * 100;
    }
    gain.setValueAtTime(gain.value, acTime);
    gain.linearRampToValueAtTime(FADE_MIN_VOLUME, acTime + FADE_DURATION / 1000);
    setTimeout(() => {
      if (localAudioRef.current) localAudioRef.current.pause();
      isActuallyPlayingRef.current = false;
      isFadingRef.current = false;
    }, FADE_DURATION);
  }, []);

  useEffect(() => {
    if (!localAudioRef.current || isAudioEngineSetupRef.current) return;
    const context = new AudioContext();
    audioContextRef.current = context;
    const gainNode = context.createGain();
    gainNodeRef.current = gainNode;
    gainNode.gain.setValueAtTime(lastKnownVolumePercentBeforeMuteRef.current / 100, context.currentTime);

    try {
      const source = context.createMediaElementSource(localAudioRef.current);
      mediaElementSourceRef.current = source;
      source.connect(gainNode);
      gainNode.connect(context.destination);
      isAudioEngineSetupRef.current = true;
    } catch (error) {
      console.error("Error creating MediaElementSource", error);
      context.close().catch(e => { });
      audioContextRef.current = null; gainNodeRef.current = null;
      return;
    }
    const resumeContextOnPlay = () => { if (context.state === 'suspended') context.resume(); };
    localAudioRef.current?.addEventListener('play', resumeContextOnPlay);
    return () => {
      localAudioRef.current?.removeEventListener('play', resumeContextOnPlay);
      mediaElementSourceRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => { });
      }
      isAudioEngineSetupRef.current = false;
      audioContextRef.current = null; mediaElementSourceRef.current = null; gainNodeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!localAudioRef.current || !currentTrack) {
      if (isActuallyPlayingRef.current) handlePauseWithFade();
      if (localAudioRef.current) localAudioRef.current.src = '';
      currentTrackIdRef.current = null;
      setDuration(0); setCurrentTime(0);
      return;
    }
    if (currentTrack.id !== currentTrackIdRef.current) {
      localAudioRef.current.src = getAudioSrc(currentTrack.audioUrl);
      localAudioRef.current.load();
      isActuallyPlayingRef.current = false;
      currentTrackIdRef.current = currentTrack.id;
      if (isPlayingIntent && isAudioEngineSetupRef.current) {
        handlePlayWithFade();
      }
    }
  }, [currentTrack, isPlayingIntent, handlePlayWithFade, handlePauseWithFade, setCurrentTime, setDuration]);

  useEffect(() => {
    if (!isAudioEngineSetupRef.current || !currentTrack || currentTrack.id !== currentTrackIdRef.current) return;
    if (isPlayingIntent && !isActuallyPlayingRef.current) {
      handlePlayWithFade();
    } else if (!isPlayingIntent && isActuallyPlayingRef.current) {
      handlePauseWithFade();
    }
  }, [isPlayingIntent, currentTrack, handlePlayWithFade, handlePauseWithFade]);

  useEffect(() => {
    const audio = localAudioRef.current;
    if (!audio || !isAudioEngineSetupRef.current) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => { playNextTrack(); };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration);
    if (audio.currentTime && !isNaN(audio.currentTime)) setCurrentTime(audio.currentTime);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, playNextTrack]);

  const handleSeek = useCallback((time: number) => {
    if (localAudioRef.current && isAudioEngineSetupRef.current && typeof time === 'number' && isFinite(time)) {
      localAudioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [setCurrentTime]);

  const handleVolumeChange = useCallback((newVolumePercent: number) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const newGain = Math.max(0, Math.min(1, newVolumePercent / 100));
      gainNodeRef.current.gain.setValueAtTime(newGain, audioContextRef.current.currentTime);
    }
  }, []);

  const handleMuteToggle = useCallback((isNowMuted: boolean, newVolumeAfterUnmute?: number) => {
    if (gainNodeRef.current && audioContextRef.current) {
      if (isNowMuted) {
        if (gainNodeRef.current.gain.value > FADE_MIN_VOLUME) {
          lastKnownVolumePercentBeforeMuteRef.current = gainNodeRef.current.gain.value * 100;
        }
        gainNodeRef.current.gain.setValueAtTime(FADE_MIN_VOLUME, audioContextRef.current.currentTime);
      } else {
        const targetVolPercent = newVolumeAfterUnmute ?? lastKnownVolumePercentBeforeMuteRef.current;
        const targetGain = Math.max(0, Math.min(1, targetVolPercent / 100));
        gainNodeRef.current.gain.setValueAtTime(targetGain, audioContextRef.current.currentTime);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artist || undefined,
      album: currentTrack.album || undefined,
      artwork: currentTrack.imageUrl ? [{ src: currentTrack.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
    });
    const playAction = () => handlePlayWithFade();
    const pauseAction = () => handlePauseWithFade();
    const previousTrackAction = () => playPreviousTrack();
    const nextTrackAction = () => playNextTrack();
    const seekToAction = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined && details.seekTime !== null) handleSeek(details.seekTime);
    };
    navigator.mediaSession.setActionHandler('play', playAction);
    navigator.mediaSession.setActionHandler('pause', pauseAction);
    navigator.mediaSession.setActionHandler('previoustrack', previousTrackAction);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrackAction);
    navigator.mediaSession.setActionHandler('seekto', seekToAction);
    const updatePositionState = () => {
      if (localAudioRef.current && audioContextRef.current && !isNaN(localAudioRef.current.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: localAudioRef.current.duration,
            playbackRate: localAudioRef.current.playbackRate,
            position: localAudioRef.current.currentTime,
          });
        } catch (error) { /* console.warn('Error media session pos state') */ }
      }
    };
    updatePositionState();
    localAudioRef.current?.addEventListener('timeupdate', updatePositionState);
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      localAudioRef.current?.removeEventListener('timeupdate', updatePositionState);
    };
  }, [currentTrack, handlePlayWithFade, handlePauseWithFade, playPreviousTrack, playNextTrack, handleSeek]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#181818] border-t border-[#282828] z-50">
      <audio ref={localAudioRef} crossOrigin="anonymous" />
      <TrackInfo />
      <div className="flex flex-col items-center w-1/3">
        <PlaybackButtons />
        <ProgressBar onSeek={handleSeek} />
      </div>
      <div className="flex items-center justify-end space-x-2 w-1/3 pr-10">
        <Volume
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          initialVolumePercent={gainNodeRef.current ? gainNodeRef.current.gain.value * 100 : FADE_MAX_VOLUME * 100}
        />
      </div>
    </div>
  );
}
