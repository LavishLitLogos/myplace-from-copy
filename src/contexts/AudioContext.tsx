import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { MusicTrack } from '../types';

interface AudioContextValue {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  play: (track: MusicTrack, queue?: MusicTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  clearQueue: () => void;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('durationchange', () => setDuration(audio.duration || 0));
    audio.addEventListener('ended', () => handleEnded());
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  function handleEnded() {
    setQueueIndex(prev => {
      const next = prev + 1;
      if (next < queue.length) {
        loadTrack(queue[next]);
        return next;
      }
      setIsPlaying(false);
      return prev;
    });
  }

  function loadTrack(track: MusicTrack) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = track.audio_url;
    audio.load();
    audio.play().catch(() => {});
    setCurrentTrack(track);
  }

  function play(track: MusicTrack, newQueue?: MusicTrack[]) {
    const q = newQueue ?? [track];
    const idx = q.findIndex(t => t.id === track.id);
    setQueue(q);
    setQueueIndex(idx >= 0 ? idx : 0);
    loadTrack(track);
  }

  function pause() {
    audioRef.current?.pause();
  }

  function resume() {
    audioRef.current?.play().catch(() => {});
  }

  function togglePlay() {
    if (isPlaying) pause();
    else resume();
  }

  function next() {
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      loadTrack(queue[nextIdx]);
    }
  }

  function prev() {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      loadTrack(queue[prevIdx]);
    }
  }

  function seek(time: number) {
    if (audioRef.current) audioRef.current.currentTime = time;
  }

  function setVolume(v: number) {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setIsMuted(false);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  }

  function clearQueue() {
    audioRef.current?.pause();
    setCurrentTrack(null);
    setQueue([]);
    setQueueIndex(0);
    setIsPlaying(false);
  }

  return (
    <AudioCtx.Provider value={{
      currentTrack, queue, isPlaying, currentTime, duration,
      volume, isMuted, play, pause, resume, togglePlay,
      next, prev, seek, setVolume, toggleMute, clearQueue,
    }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
