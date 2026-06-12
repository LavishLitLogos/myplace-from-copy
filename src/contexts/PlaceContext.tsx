import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CreatorProfile, Room, DEFAULT_ROOMS } from '../types';
import { useAuth } from './AuthContext';

export const ADMIN_EMAILS = ['homerunroyce@gmail.com', 'thisbeatizbananaz@gmail.com'];

interface PlaceContextValue {
  profile: CreatorProfile | null;
  rooms: Room[];
  loading: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  viewingProfile: CreatorProfile | null;
  setViewingProfile: (p: CreatorProfile | null) => void;
  refreshProfile: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  updateProfile: (updates: Partial<CreatorProfile>) => Promise<{ error: string | null }>;
}

const PlaceCtx = createContext<PlaceContextValue | null>(null);

async function seedRooms(creatorId: string): Promise<Room[]> {
  for (const room of DEFAULT_ROOMS) {
    await supabase.from('rooms').insert({ ...room, creator_id: creatorId });
  }
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

async function ensureProfile(userId: string): Promise<CreatorProfile | null> {
  const { data: existing } = await supabase
    .from('creator_profile')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (!existing.user_id) {
      const { data: claimed } = await supabase
        .from('creator_profile')
        .update({ user_id: userId })
        .eq('id', existing.id)
        .select()
        .single();
      return claimed ?? existing;
    }
    return existing;
  }

  const { data: created, error } = await supabase
    .from('creator_profile')
    .insert({
      user_id: userId,
      name: 'My Place',
      welcome_message: 'Welcome to My Place',
      accent_color: '#EC4899',
      background_color: '#000000',
    })
    .select()
    .single();

  if (error || !created) return null;
  return created;
}

export function PlaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfile, setViewingProfile] = useState<CreatorProfile | null>(null);

  const isCreator = !!(user && profile);
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  const loadPlace = useCallback(async (userId?: string) => {
    setLoading(true);

    let prof: CreatorProfile | null = null;

    if (userId) {
      prof = await ensureProfile(userId);
    } else {
      const { data } = await supabase
        .from('creator_profile')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      prof = data ?? null;
    }

    setProfile(prof);

    if (prof) {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('creator_id', prof.id)
        .order('sort_order', { ascending: true });

      if (roomData && roomData.length > 0) {
        setRooms(roomData);
      } else if (userId) {
        const seeded = await seedRooms(prof.id);
        setRooms(seeded);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlace(user?.id);
  }, [user?.id, loadPlace]);

  const refreshProfile = useCallback(async () => {
    await loadPlace(user?.id);
  }, [user?.id, loadPlace]);

  const refreshRooms = useCallback(async () => {
    const prof = viewingProfile ?? profile;
    if (!prof) return;
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', prof.id)
      .order('sort_order', { ascending: true });
    setRooms(data ?? []);
  }, [profile?.id, viewingProfile?.id]);

  async function updateProfile(updates: Partial<CreatorProfile>) {
    if (!profile) return { error: 'No profile loaded' };
    const { error } = await supabase
      .from('creator_profile')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
    }
    return { error: error?.message ?? null };
  }

  return (
    <PlaceCtx.Provider value={{
      profile, rooms, loading, isCreator, isAdmin,
      viewingProfile, setViewingProfile,
      refreshProfile, refreshRooms, updateProfile,
    }}>
      {children}
    </PlaceCtx.Provider>
  );
}

export function usePlace() {
  const ctx = useContext(PlaceCtx);
  if (!ctx) throw new Error('usePlace must be used within PlaceProvider');
  return ctx;
}
