import { useEffect, useState } from 'react';
import { Search, Globe, User, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CreatorProfile, CreatorPresence, ViewName } from '../../types';

interface AdminPlacesProps {
  onNavigate: (view: ViewName) => void;
}

interface CreatorWithPresence extends CreatorProfile {
  presence?: CreatorPresence;
}

export function AdminPlaces({ onNavigate }: AdminPlacesProps) {
  const [creators, setCreators] = useState<CreatorWithPresence[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, []);

  async function loadCreators() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('creator_profile')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: presences } = await supabase
      .from('creator_presence')
      .select('*');

    const presenceMap = new Map((presences ?? []).map(p => [p.creator_id, p]));

    const withPresence: CreatorWithPresence[] = (profiles ?? []).map(p => ({
      ...p,
      presence: presenceMap.get(p.id),
    }));

    setCreators(withPresence);
    setLoading(false);
  }

  const filtered = search.trim()
    ? creators.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.user_id?.toLowerCase().includes(search.toLowerCase()))
      )
    : creators;

  return (
    <div className="pb-10">
      <div className="px-4 py-3">
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

      <div className="px-4 flex items-center gap-2 text-white/30 text-xs mb-2">
        <Globe size={12} />
        <span>{creators.length} Place{creators.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(creator => (
            <div
              key={creator.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: `2px solid ${creator.accent_color}` }}
              >
                {creator.profile_image_url ? (
                  <img src={creator.profile_image_url} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `${creator.accent_color}20` }}
                  >
                    <User size={16} style={{ color: creator.accent_color }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{creator.name}</p>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  {creator.presence?.is_active && (
                    <span style={{ color: creator.accent_color }}>Active</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(creator.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="text-white/20" />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">No creators found</p>
          )}
        </div>
      )}
    </div>
  );
}
