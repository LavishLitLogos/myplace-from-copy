import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlace } from '../contexts/PlaceContext';
import { CreatorProfile, ViewName } from '../types';
import { User } from 'lucide-react';

interface FamzHomeProps {
  onNavigate: (view: ViewName) => void;
}

export function FamzHome({ onNavigate }: FamzHomeProps) {
  const { user } = useAuth();
  const { profile } = usePlace();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [famzIds, setFamzIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, []);

  async function loadCreators() {
    setLoading(true);
    const { data } = await supabase
      .from('creator_profile')
      .select('*')
      .eq('is_active', true)
      .order('presence_updated_at', { ascending: false, nullsFirst: 'last' });
    setCreators(data ?? []);

    if (user) {
      const { data: rels } = await supabase
        .from('famz_relationships')
        .select('creator_id')
        .eq('user_id', user.id);
      setFamzIds((rels ?? []).map(r => r.creator_id));
    }
    setLoading(false);
  }

  async function toggleFamz(creatorId: string) {
    if (!user) { onNavigate('auth'); return; }
    const isFamz = famzIds.includes(creatorId);
    if (isFamz) {
      await supabase.from('famz_relationships').delete()
        .eq('user_id', user.id).eq('creator_id', creatorId);
      setFamzIds(prev => prev.filter(id => id !== creatorId));
    } else {
      await supabase.from('famz_relationships').insert({
        user_id: user.id, creator_id: creatorId,
      });
      setFamzIds(prev => [...prev, creatorId]);
    }
  }

  const accent = '#EC4899';

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header with center logo */}
      <div className="flex flex-col items-center pt-12 pb-6 px-4">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3"
          style={{ border: `2px solid ${accent}`, boxShadow: `0 0 30px ${accent}40` }}>
          <img src="/myplacelogo.png" alt="MyPlace" className="w-full h-full object-contain p-3" />
        </div>
        <h1 className="text-white font-bold text-xl tracking-tight">MyPlace</h1>
        <p className="text-white/30 text-xs mt-1">Discover Creators</p>

        {user && (
          <button
            onClick={() => onNavigate('famz:profile')}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}
          >
            <User size={14} /> My Profile
          </button>
        )}
      </div>

      {/* Creator Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/25 text-sm">No active creators yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {creators.map(creator => {
              const isFamz = famzIds.includes(creator.id);
              const isActive = creator.is_active;
              const creatorAccent = creator.accent_color || accent;

              return (
                <button
                  key={creator.id}
                  onClick={() => {
                    onNavigate('famz:creator_place');
                  }}
                  className="relative rounded-2xl overflow-hidden text-left transition-all active:scale-95 group"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${creatorAccent}25`,
                  }}
                >
                  {/* Cover/Image */}
                  <div className="w-full aspect-square relative">
                    {creator.profile_image_url ? (
                      <img src={creator.profile_image_url} alt={creator.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: `${creatorAccent}15` }}>
                        <img src="/myplacelogo.png" alt="MyPlace" className="w-12 h-12 object-contain opacity-50" />
                      </div>
                    )}
                    {/* Active glow */}
                    {isActive && (
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full"
                        style={{ background: creatorAccent, boxShadow: `0 0 8px ${creatorAccent}`, animation: 'pulse 2s infinite' }} />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                  </div>
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm truncate">{creator.name}</p>
                    {creator.presence_status && (
                      <p className="text-white/40 text-[10px] truncate mt-0.5">{creator.presence_status}</p>
                    )}
                  </div>
                  {/* FAMZ badge */}
                  {isFamz && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider"
                      style={{ background: `${creatorAccent}90`, color: '#000' }}>
                      FAMZ
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
