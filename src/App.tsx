import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import { PlaceProvider, usePlace } from './contexts/PlaceContext';
import { FamzProvider, useFamz } from './contexts/FamzContext';
import { ContentProvider } from './contexts/ContentContext';
import { HomeScreen } from './components/HomeScreen';
import { FamzHomeScreen } from './components/famz/FamzHomeScreen';
import { CreatorGrid } from './components/famz/CreatorGrid';
import { DailyDropScreen } from './components/famz/DailyDropScreen';
import { FamzSettings } from './components/famz/FamzSettings';
import { AudioPlayer } from './components/AudioPlayer';
import { MusicRoom } from './components/rooms/MusicRoom';
import { ChatRoom } from './components/rooms/ChatRoom';
import { MerchRoom } from './components/rooms/MerchRoom';
import { VideosRoom } from './components/rooms/VideosRoom';
import { NewsRoom } from './components/rooms/NewsRoom';
import { ExclusivesRoom } from './components/rooms/ExclusivesRoom';
import { CreatorPanel } from './components/creator/CreatorPanel';
import { ManageProfile } from './components/creator/ManageProfile';
import { ManageMusic } from './components/creator/ManageMusic';
import { ManageVideos } from './components/creator/ManageVideos';
import { ManageNews } from './components/creator/ManageNews';
import { ManageMerch } from './components/creator/ManageMerch';
import { ManageExclusives } from './components/creator/ManageExclusives';
import { ManageRooms } from './components/creator/ManageRooms';
import { AdminPanel } from './components/creator/AdminPanel';
import { AdminPlaces } from './components/admin/AdminPlaces';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminModeration } from './components/admin/AdminModeration';
import { AdminSettings } from './components/admin/AdminSettings';
import { AuthScreen } from './components/AuthScreen';
import { SlidePanel } from './components/ui/SlidePanel';
import { ViewName, CreatorProfile, ACCENT_COLORS } from './types';
import { Music, MessageCircle, ShoppingBag, Play, Newspaper, Star, Settings, ArrowLeft, Check } from 'lucide-react';

const ROOM_META: Record<string, { label: string; icon: typeof Music; color: string }> = {
  music: { label: 'Music', icon: Music, color: '#EC4899' },
  chat: { label: 'Chat', icon: MessageCircle, color: '#06B6D4' },
  merch: { label: 'Merch', icon: ShoppingBag, color: '#22C55E' },
  videos: { label: 'Videos', icon: Play, color: '#A855F7' },
  news: { label: 'News', icon: Newspaper, color: '#F97316' },
  exclusives: { label: 'Exclusives', icon: Star, color: '#EAB308' },
};

const PANEL_TITLES: Record<string, string> = {
  'creator:panel': 'Creator Mode',
  'creator:profile': 'Profile & Branding',
  'creator:music': 'Manage Music',
  'creator:videos': 'Manage Videos',
  'creator:news': 'Manage News',
  'creator:merch': 'Manage Merch',
  'creator:exclusives': 'Manage Exclusives',
  'creator:rooms': 'Manage Rooms',
  'creator:admin': 'Platform Admin',
  'admin:places': 'View All Places',
  'admin:users': 'Manage Users',
  'admin:moderation': 'Moderate Content',
  'admin:settings': 'Platform Settings',
};

// Update ManageProfile to include Chrome colors
function ManageProfileWithChrome() {
  const [form, setForm] = useState({
    name: '',
    bio: '',
    profile_image_url: '',
    cover_image_url: '',
    accent_color: '#EC4899',
    welcome_message: '',
  });
  const { profile, updateProfile } = usePlace();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        bio: profile.bio ?? '',
        profile_image_url: profile.profile_image_url ?? '',
        cover_image_url: profile.cover_image_url ?? '',
        accent_color: profile.accent_color ?? '#EC4899',
        welcome_message: profile.welcome_message ?? '',
      });
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setError('');
    const { error: err } = await updateProfile(form);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const accent = form.accent_color;

  return (
    <div className="px-4 py-4 pb-12 space-y-5">
      <Field label="Place Name" required>
        <input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Your Place name..."
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
      </Field>

      <Field label="Welcome Message">
        <input
          value={form.welcome_message}
          onChange={e => setForm(p => ({ ...p, welcome_message: e.target.value }))}
          placeholder="e.g. Welcome to my world..."
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
      </Field>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
          placeholder="Tell your FAMZ about yourself..."
          rows={3}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors resize-none"
        />
      </Field>

      <Field label="Profile Image URL">
        <input
          value={form.profile_image_url}
          onChange={e => setForm(p => ({ ...p, profile_image_url: e.target.value }))}
          placeholder="https://..."
          type="url"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
        {form.profile_image_url && (
          <img src={form.profile_image_url} alt="Preview" className="mt-2 w-16 h-16 rounded-full object-cover" />
        )}
      </Field>

      <Field label="Cover Image URL">
        <input
          value={form.cover_image_url}
          onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))}
          placeholder="https://..."
          type="url"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
        {form.cover_image_url && (
          <img src={form.cover_image_url} alt="Preview" className="mt-2 w-full h-20 rounded-xl object-cover" />
        )}
      </Field>

      <Field label="Accent Color">
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setForm(p => ({ ...p, accent_color: color }))}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 hover:scale-110"
              style={{ background: color }}
            >
              {accent === color && <Check size={16} className="text-white" />}
            </button>
          ))}
        </div>
      </Field>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: accent, color: '#000' }}
      >
        {saving ? (
          <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        ) : saved ? (
          <><Check size={16} /> Saved!</>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function AppInner() {
  const { user, loading: authLoading } = useAuth();
  const { profile, rooms, loading: placeLoading, isCreator } = usePlace();
  const { isAdmin, loading: famzLoading } = useFamz();
  const [view, setView] = useState<ViewName>('splash');
  const [ready, setReady] = useState(false);
  const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);

  const loading = authLoading || placeLoading || famzLoading;

  useEffect(() => {
    if (loading) return;
    setReady(true);
    if (view === 'splash') {
      // Default: go to home (which will show appropriate screen)
      setView('home');
    }
  }, [loading]);

  useEffect(() => {
    if (user && ready && view === 'auth') {
      setView('home');
    }
  }, [user?.id, ready]);

  if (!ready && view === 'splash') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
        <img src="/myplacelogo.png" alt="MyPlace" className="w-20 h-20 object-contain mb-6 opacity-90" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <p className="text-white/20 text-[10px] tracking-widest uppercase mt-6">MyPlace™</p>
      </div>
    );
  }

  const accent = profile?.accent_color ?? '#EC4899';

  // Determine home screen based on user role
  function goHome() {
    if (isCreator || isAdmin) {
      setView('home');
    } else {
      setView('famz:home');
    }
  }

  function navigate(to: ViewName) {
    setView(to);
  }

  const isRoomView = view.startsWith('room:');
  const isCreatorView = view.startsWith('creator:');
  const isAdminView = view.startsWith('admin:');
  const isFamzView = view.startsWith('famz:');
  const panelTitle = PANEL_TITLES[view] ?? '';

  // Creator home (shows room nodes) or FAMZ home
  const showCreatorHome = view === 'home' && (isCreator || isAdmin);
  const showFamzHome = view === 'home' && !isCreator && !isAdmin;
  const showFamzSubView = view === 'famz:home' || view === 'famz:grid' || view === 'famz:dailydrop' || view === 'famz:settings';
  const showAuth = view === 'auth';

  return (
    <div className="fixed inset-0 bg-black" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="relative w-full h-full">

        {/* Auth screen */}
        {showAuth && (
          <div className="absolute inset-0 overflow-y-auto">
            <AuthScreen
              onSuccess={() => setView('home')}
              onBack={profile ? () => setView('home') : () => {}}
            />
          </div>
        )}

        {/* Creator Home screen (with room nodes) */}
        {showCreatorHome && (
          <div className="absolute inset-0">
            <HomeScreen onNavigate={navigate} />
          </div>
        )}

        {/* FAMZ Home screen */}
        {(showFamzHome || view === 'famz:home') && (
          <div className="absolute inset-0">
            <FamzHomeScreen onNavigate={navigate} />
          </div>
        )}

        {/* FAMZ Creator Grid */}
        {view === 'famz:grid' && (
          <div className="absolute inset-0">
            <CreatorGrid
              onNavigate={navigate}
              onSelectCreator={(creator) => {
                // For now, just go to their Place view
                // In future, this would switch context to view their content
                setViewingCreatorId(creator.id);
                setView('home');
              }}
            />
          </div>
        )}

        {/* FAMZ Daily Drop */}
        {view === 'famz:dailydrop' && (
          <div className="absolute inset-0">
            <DailyDropScreen onNavigate={navigate} />
          </div>
        )}

        {/* FAMZ Settings */}
        {view === 'famz:settings' && (
          <div className="absolute inset-0">
            <FamzSettings onNavigate={navigate} />
          </div>
        )}

        {/* Room panels */}
        {(Object.keys(ROOM_META) as string[]).map(slug => {
          const roomView = `room:${slug}` as ViewName;
          const dbRoom = rooms.find(r => r.slug === slug);
          const label = dbRoom?.name ?? ROOM_META[slug].label;
          const color = dbRoom?.color ?? ROOM_META[slug].color;
          const isChat = slug === 'chat';

          return (
            <SlidePanel
              key={roomView}
              isOpen={view === roomView}
              onClose={goHome}
              title={label}
              showBack
              fullHeight={isChat}
            >
              <div className="h-0.5 w-full flex-shrink-0" style={{ background: color }} />
              {slug === 'music' && <MusicRoom onNavigate={navigate} />}
              {slug === 'chat' && <ChatRoom />}
              {slug === 'merch' && <MerchRoom onNavigate={navigate} />}
              {slug === 'videos' && <VideosRoom onNavigate={navigate} />}
              {slug === 'news' && <NewsRoom onNavigate={navigate} />}
              {slug === 'exclusives' && <ExclusivesRoom onNavigate={navigate} />}
            </SlidePanel>
          );
        })}

        {/* Creator management panel */}
        <SlidePanel
          isOpen={isCreatorView}
          onClose={goHome}
          title={panelTitle}
          showBack
        >
          {view === 'creator:panel' && <CreatorPanel onNavigate={navigate} />}
          {view === 'creator:profile' && <ManageProfileWithChrome />}
          {view === 'creator:music' && <ManageMusic />}
          {view === 'creator:videos' && <ManageVideos />}
          {view === 'creator:news' && <ManageNews />}
          {view === 'creator:merch' && <ManageMerch />}
          {view === 'creator:exclusives' && <ManageExclusives />}
          {view === 'creator:rooms' && <ManageRooms />}
          {view === 'creator:admin' && <AdminPanel onNavigate={navigate} />}
        </SlidePanel>

        {/* Admin panels */}
        <SlidePanel
          isOpen={isAdminView}
          onClose={() => setView('creator:admin')}
          title={panelTitle}
          showBack
        >
          {view === 'admin:places' && <AdminPlaces onNavigate={navigate} />}
          {view === 'admin:users' && <AdminUsers onNavigate={navigate} />}
          {view === 'admin:moderation' && <AdminModeration onNavigate={navigate} />}
          {view === 'admin:settings' && <AdminSettings />}
        </SlidePanel>

        {/* Persistent audio player */}
        {!showAuth && !isFamzView && <AudioPlayer />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <PlaceProvider>
          <FamzProvider>
            <ContentProvider>
              <AppInner />
            </ContentProvider>
          </FamzProvider>
        </PlaceProvider>
      </AudioProvider>
    </AuthProvider>
  );
}
