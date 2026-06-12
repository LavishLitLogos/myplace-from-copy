import { useAudio } from '../contexts/AudioContext';
import { usePlace } from '../contexts/PlaceContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration } from '../types';
import { useState } from 'react';

export function AudioPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, volume, isMuted, togglePlay, next, prev, seek, setVolume, toggleMute } = useAudio();
  const { profile } = usePlace();
  const [expanded, setExpanded] = useState(false);

  if (!currentTrack) return null;

  const accent = profile?.accent_color ?? '#EC4899';
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 transition-all duration-300"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {expanded && (
        <div
          className="px-4 pb-3 pt-4 border-t border-white/5"
          style={{ background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)' }}
        >
          {/* Cover art + title */}
          <div className="flex items-center gap-3 mb-4">
            {currentTrack.cover_url ? (
              <img src={currentTrack.cover_url} alt={currentTrack.title} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}20` }}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: accent }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{currentTrack.title}</p>
              <p className="text-white/50 text-xs truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={e => seek(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: accent }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-white/30 text-[10px]">{formatDuration(Math.floor(currentTime))}</span>
              <span className="text-white/30 text-[10px]">{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 mb-3">
            <button onClick={toggleMute} className="text-white/40 hover:text-white/70 transition-colors">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: accent }}
            />
          </div>
        </div>
      )}

      {/* Mini bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 h-0.5 transition-all" style={{ width: `${progress * 100}%`, background: accent }} />

        {currentTrack.cover_url ? (
          <img src={currentTrack.cover_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `${accent}30` }} />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{currentTrack.title}</p>
          <p className="text-white/40 text-[10px] truncate">{currentTrack.artist}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={prev}
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: accent }}
          >
            {isPlaying ? <Pause size={16} className="text-white" fill="white" /> : <Play size={16} className="text-white" fill="white" style={{ marginLeft: 2 }} />}
          </button>
          <button
            onClick={next}
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <SkipForward size={16} />
          </button>
          <button
            onClick={() => setExpanded(p => !p)}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
