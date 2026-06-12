import { useEffect, useState } from 'react';
import { ArrowLeft, Gift, Check, ExternalLink, Music, Newspaper, Play, Star, Lock } from 'lucide-react';
import { useFamz } from '../../contexts/FamzContext';
import { DailyDrop, ViewName } from '../../types';

interface DailyDropScreenProps {
  onNavigate: (view: ViewName) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  music: Music,
  video: Play,
  exclusive: Star,
  merch: Lock,
};

export function DailyDropScreen({ onNavigate }: DailyDropScreenProps) {
  const { dailyDrop, todayClaim, claimDailyDrop, loadDailyDrop, famzProfile } = useFamz();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    loadDailyDrop();
  }, []);

  async function handleClaim() {
    if (!dailyDrop || claiming) return;
    setClaiming(true);
    setError('');
    const { error: err, reward } = await claimDailyDrop();
    setClaiming(false);
    if (err) {
      setError(err);
    } else if (reward) {
      setClaimed(true);
    }
  }

  const accent = '#EC4899';

  if (!dailyDrop && !todayClaim) {
    return (
      <div className="flex flex-col h-full bg-black">
        <Header onBack={() => onNavigate('home')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}
          >
            <Gift size={28} style={{ color: accent }} />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No Drop Today</h3>
          <p className="text-white/40 text-sm text-center">
            Check back later for a new daily drop from your favorite creators.
          </p>
        </div>
      </div>
    );
  }

  if (todayClaim || claimed) {
    return (
      <div className="flex flex-col h-full bg-black">
        <Header onBack={() => onNavigate('home')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(34, 197, 94, 0.15)', border: '2px solid rgba(34, 197, 94, 0.4)' }}
          >
            <Check size={28} className="text-green-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Already Claimed</h3>
          <p className="text-white/40 text-sm text-center mb-4">
            You've claimed your daily drop. Come back tomorrow!
          </p>
          {dailyDrop?.source_url && (
            <a
              href={dailyDrop.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: accent, color: '#000' }}
            >
              <ExternalLink size={16} />
              View Source Content
            </a>
          )}
        </div>
      </div>
    );
  }

  const IconComp = TYPE_ICONS[dailyDrop?.content_type ?? 'music'] ?? Gift;

  return (
    <div className="flex flex-col h-full bg-black">
      <Header onBack={() => onNavigate('home')} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}
          >
            <Gift size={24} style={{ color: accent }} />
          </div>
          <h2 className="text-white font-bold text-xl">Daily Drop</h2>
          <p className="text-white/40 text-xs mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Drop card */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {dailyDrop?.cover_url && (
            <img
              src={dailyDrop.cover_url}
              alt={dailyDrop.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconComp size={14} style={{ color: accent }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
                {dailyDrop?.content_type ?? 'Drop'}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{dailyDrop?.title}</h3>
            {dailyDrop?.description && (
              <p className="text-white/50 text-sm">{dailyDrop.description}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
          style={{ background: accent, color: '#000' }}
        >
          {claiming ? 'Claiming...' : 'Claim Daily Drop'}
        </button>
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
    >
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
      >
        <ArrowLeft size={18} className="text-white" />
      </button>
      <h2 className="text-white font-bold text-lg">Daily Drop</h2>
    </div>
  );
}
