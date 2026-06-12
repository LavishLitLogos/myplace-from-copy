import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePlace } from '../contexts/PlaceContext';
import { supabase } from '../lib/supabase';
import { DEFAULT_ROOMS } from '../types';

interface AuthScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function AuthScreen({ onSuccess, onBack }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();
  const { refreshProfile } = usePlace();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email.trim() || !password.trim() || loading) return;
    setLoading(true);
    setError('');

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err); setLoading(false); return; }
      await refreshProfile();
      onSuccess();
      return;
    }

    // Sign up flow
    const { error: signupErr } = await signUp(email, password);
    if (signupErr) { setError(signupErr); setLoading(false); return; }

    // Sign in after signup
    const { error: signinErr } = await signIn(email, password);
    if (signinErr) { setError(signinErr); setLoading(false); return; }

    // Get the authenticated user to set user_id explicitly
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setError('Authentication failed. Please try signing in.');
      setLoading(false);
      return;
    }

    // Check if a profile already exists (e.g., someone else set up this deployment)
    const { data: existingProfile } = await supabase
      .from('creator_profile')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!existingProfile) {
      // Create new creator profile with explicit user_id
      const { data: newProfile, error: profileErr } = await supabase
        .from('creator_profile')
        .insert({
          user_id: authUser.id,
          name: placeName.trim() || 'My Place',
          welcome_message: `Welcome to ${placeName.trim() || 'My Place'}`,
          accent_color: '#EC4899',
          background_color: '#000000',
        })
        .select()
        .single();

      if (profileErr || !newProfile) {
        setError('Could not create your Place. Please try again.');
        setLoading(false);
        return;
      }

      // Seed default rooms
      for (const room of DEFAULT_ROOMS) {
        await supabase.from('rooms').insert({ ...room, creator_id: newProfile.id });
      }
    }

    await refreshProfile();
    onSuccess();
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #EC489918 0%, #000 60%)' }}
    >
      <div className="px-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/40 text-sm hover:text-white/60 transition-colors py-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(236,72,153,0.12)', border: '2px solid rgba(236,72,153,0.3)' }}
        >
          <img src="/myplacelogo.png" alt="MyPlace" className="w-12 h-12 object-contain" />
        </div>

        <h1 className="text-white font-black text-3xl tracking-tight mb-1">
          {mode === 'signin' ? 'Welcome Back' : 'Create Your Place'}
        </h1>
        <p className="text-white/40 text-sm mb-8 text-center">
          {mode === 'signin'
            ? 'Sign in to manage and update your Place'
            : 'Set up your creator-owned digital world'}
        </p>

        <div className="w-full max-w-sm space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">
                Place Name
              </label>
              <input
                type="text"
                value={placeName}
                onChange={e => setPlaceName(e.target.value)}
                placeholder="e.g. DJ Nova's Place..."
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3.5 text-white placeholder-white/25 text-sm outline-none focus:border-white/30 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3.5 text-white placeholder-white/25 text-sm outline-none focus:border-white/30 transition-colors"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3.5 pr-12 text-white placeholder-white/25 text-sm outline-none focus:border-white/30 transition-colors"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!email.trim() || !password.trim() || loading}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wide disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: '#EC4899', color: '#000' }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : mode === 'signin' ? 'Sign In' : 'Create My Place'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="w-full text-center text-white/40 text-sm py-2 hover:text-white/60 transition-colors"
          >
            {mode === 'signin' ? "Don't have a Place? Create one" : 'Already have a Place? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
