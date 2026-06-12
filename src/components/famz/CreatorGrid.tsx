import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Star, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFamz } from '../../contexts/FamzContext';
import { CreatorProfile, CreatorPresence, ViewName } from '../../types';

interface CreatorGridProps {
  onNavigate: (view: ViewName) => void;
  onSelectCreator: (creator: CreatorProfile) => void;
}

interface CreatorWithPresence extends CreatorProfile {
  presence?: CreatorPresence;
  isTapped: boolean;
}

export function CreatorGrid({ onNavigate, onSelectCreator }: CreatorGridProps) {
  const { famzProfile, creatorTaps, tapCreator, untapCreator, refreshTaps } = useFamz();
  const [creators, setCreators] = useState<CreatorWithPresence[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, []);

  async function loadCreators() {
    setLoading(true);

    // Get all creator profiles
    const { data: profiles } = await supabase
      .from('creator_profile')
      .select('*')
      .order('name');

    // Get all presence data
    const { data: presences } = await supabase
      .from('creator_presence')
      .select('*');

    const presenceMap = new Map((presences ?? []).map(p => [p.creator_id, p]));

    const tappedCreatorIds = new Set(creatorTaps.map(t => t.creator_id));

    const creatorsWithPresence: CreatorWithPresence[] = (profiles ?? []).map(p => ({
      ...p,
      presence: presenceMap.get(p.id),
      isTapped: tappedCreatorIds.has(p.id),
    }));

    // Sort: tapped first, then by name
    creatorsWithPresence.sort((a, b) => {
      if (a.isTapped && !b.isTapped) return -1;
      if (!a.isTapped && b.isTapped) return 1;
      return a.name.localeCompare(b.name);
    });

    setCreators(creatorsWithPresence);
    setLoading(false);
  }

  async function handleTapCreator(creator: CreatorWithPresence) {
    if (!famzProfile) return;

    if (creator.isTapped) {
      await untapCreator(creator.id);
    } else {
      await tapCreator(creator.id);
    }
    await loadCreators();
  }

  const filtered = search.trim()
    ? creators.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : creators;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
      >
        <button
          onClick={() => onNavigate('home')}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">Creator Grid</h2>
          <p className="text-white/40 text-xs">{creators.length} Places</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Search size={16} className="text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Circle size={48} className="text-white/10 mb-4" />
            <p className="text-white/30 text-sm">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(creator => (
              <CreatorTile
                key={creator.id}
                creator={creator}
                onSelect={() => onSelectCreator(creator)}
                onToggleTap={() => handleTapCreator(creator)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreatorTile({
  creator,
  onSelect,
  onToggleTap,
}: {
  creator: CreatorWithPresence;
  onSelect: () => void;
  onToggleTap: () => void;
}) {
  const accent = creator.accent_color ?? '#EC4899';
  const isActive = creator.presence?.is_active;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button onClick={onSelect} className="w-full text-left">
        {/* Avatar */}
        <div className="flex items-center justify-center pt-4 pb-2">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              border: `2px solid ${accent}`,
              boxShadow: creator.isTapped ? `0 0 12px ${accent}50` : 'none',
            }}
          >
            {creator.profile_image_url ? (
              <img src={creator.profile_image_url} className="w-full h-full object-cover" />
            ) : (
              <img src="/myplacelogo.png" className="w-10 h-10 object-contain" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pb-3 text-center">
          <p className="text-white font-semibold text-sm truncate">{creator.name}</p>
          {isActive && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accent, animation: 'pulse 2s infinite' }}
              />
              <span className="text-[10px]" style={{ color: accent }}>Active</span>
            </div>
          )}
          {creator.presence?.status_message && (
            <p className="text-white/30 text-[10px] truncate mt-0.5">
              {creator.presence.status_message}
            </p>
          )}
        </div>
      </button>

      {/* Tap indicator */}
      <button
        onClick={onToggleTap}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: creator.isTapped ? accent : 'rgba(255,255,255,0.1)',
        }}
      >
        <Star
          size={12}
          className={creator.isTapped ? 'text-black' : 'text-white/40'}
          fill={creator.isTapped ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  );
}
