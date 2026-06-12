import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FamzProfile, CreatorTap, DailyDrop, FamzDailyClaim, PlatformSettings } from '../types';
import { useAuth } from './AuthContext';

interface FamzContextValue {
  famzProfile: FamzProfile | null;
  creatorTaps: CreatorTap[];
  dailyDrop: DailyDrop | null;
  todayClaim: FamzDailyClaim | null;
  platformSettings: PlatformSettings | null;
  loading: boolean;
  isAdmin: boolean;
  isFamz: boolean;
  refreshFamz: () => Promise<void>;
  refreshTaps: () => Promise<void>;
  createFamzProfile: (name: string, color: string) => Promise<{ error: string | null }>;
  updateFamzProfile: (updates: Partial<FamzProfile>) => Promise<{ error: string | null }>;
  tapCreator: (creatorId: string) => Promise<{ error: string | null }>;
  untapCreator: (creatorId: string) => Promise<{ error: string | null }>;
  claimDailyDrop: () => Promise<{ error: string | null; reward?: DailyDrop }>;
  loadDailyDrop: () => Promise<void>;
}

const FamzCtx = createContext<FamzContextValue | null>(null);

export function FamzProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [famzProfile, setFamzProfile] = useState<FamzProfile | null>(null);
  const [creatorTaps, setCreatorTaps] = useState<CreatorTap[]>([]);
  const [dailyDrop, setDailyDrop] = useState<DailyDrop | null>(null);
  const [todayClaim, setTodayClaim] = useState<FamzDailyClaim | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isFamz = !!(user && famzProfile);

  useEffect(() => {
    if (user) {
      loadFamz();
    } else {
      setFamzProfile(null);
      setCreatorTaps([]);
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user?.id]);

  async function loadFamz() {
    setLoading(true);

    // Load FAMZ profile
    const { data: famz } = await supabase
      .from('famz_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setFamzProfile(famz);

    // Check admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle();
    setIsAdmin(!!adminRole);

    // Load platform settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    setPlatformSettings(settings);

    // Load taps if FAMZ exists
    if (famz) {
      const { data: taps } = await supabase
        .from('creator_taps')
        .select('*')
        .eq('famz_id', famz.id);
      setCreatorTaps(taps ?? []);

      // Load today's claim
      const today = new Date().toISOString().split('T')[0];
      const { data: claim } = await supabase
        .from('famz_daily_claims')
        .select('*')
        .eq('famz_id', famz.id)
        .eq('claim_date', today)
        .maybeSingle();
      setTodayClaim(claim ?? null);
    }

    // Load daily drop
    await loadDailyDropInternal();

    setLoading(false);
  }

  async function loadDailyDropInternal() {
    const today = new Date().toISOString().split('T')[0];
    const { data: drop } = await supabase
      .from('daily_drops')
      .select('*')
      .eq('drop_date', today)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    setDailyDrop(drop ?? null);
  }

  const refreshFamz = useCallback(async () => {
    await loadFamz();
  }, [user?.id]);

  const refreshTaps = useCallback(async () => {
    if (!famzProfile) return;
    const { data } = await supabase
      .from('creator_taps')
      .select('*')
      .eq('famz_id', famzProfile.id);
    setCreatorTaps(data ?? []);
  }, [famzProfile?.id]);

  async function createFamzProfile(name: string, color: string) {
    const { data, error } = await supabase
      .from('famz_profiles')
      .insert({
        user_id: user!.id,
        display_name: name,
        display_color: color,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    setFamzProfile(data);
    return { error: null };
  }

  async function updateFamzProfile(updates: Partial<FamzProfile>) {
    if (!famzProfile) return { error: 'No FAMZ profile' };
    const { error } = await supabase
      .from('famz_profiles')
      .update(updates)
      .eq('id', famzProfile.id);
    if (!error) {
      setFamzProfile(prev => prev ? { ...prev, ...updates } : prev);
    }
    return { error: error?.message ?? null };
  }

  async function tapCreator(creatorId: string) {
    if (!famzProfile) return { error: 'No FAMZ profile' };
    const { error } = await supabase
      .from('creator_taps')
      .insert({ famz_id: famzProfile.id, creator_id: creatorId });
    if (!error) {
      await refreshTaps();
    }
    return { error: error?.message ?? null };
  }

  async function untapCreator(creatorId: string) {
    if (!famzProfile) return { error: 'No FAMZ profile' };
    const { error } = await supabase
      .from('creator_taps')
      .delete()
      .eq('famz_id', famzProfile.id)
      .eq('creator_id', creatorId);
    if (!error) {
      setCreatorTaps(prev => prev.filter(t => t.creator_id !== creatorId));
    }
    return { error: error?.message ?? null };
  }

  async function claimDailyDrop() {
    if (!famzProfile || !dailyDrop) return { error: 'No drop available' };

    const { data, error } = await supabase
      .from('famz_daily_claims')
      .insert({
        famz_id: famzProfile.id,
        daily_drop_id: dailyDrop.id,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    setTodayClaim(data);
    return { error: null, reward: dailyDrop };
  }

  async function loadDailyDrop() {
    await loadDailyDropInternal();
  }

  return (
    <FamzCtx.Provider value={{
      famzProfile,
      creatorTaps,
      dailyDrop,
      todayClaim,
      platformSettings,
      loading,
      isAdmin,
      isFamz,
      refreshFamz,
      refreshTaps,
      createFamzProfile,
      updateFamzProfile,
      tapCreator,
      untapCreator,
      claimDailyDrop,
      loadDailyDrop,
    }}>
      {children}
    </FamzCtx.Provider>
  );
}

export function useFamz() {
  const ctx = useContext(FamzCtx);
  if (!ctx) throw new Error('useFamz must be used within FamzProvider');
  return ctx;
}
