import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import { PlaceProvider, usePlace } from './contexts/PlaceContext';
import { HomeScreen } from './components/HomeScreen';
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
import { AuthScreen } from './components/AuthScreen';
import { SlidePanel } from './components/ui/SlidePanel';
import { ViewName } from './types';
import { Music, MessageCircle, ShoppingBag, Play, Newspaper, Star } from 'lucide-react';

const ROOM_META: Record<string, { label: string; icon: typeof Music; color: string }> = {
  music: { label: 'Music', icon: Music, color: '#EC4899' },
  chat: { label: 'Chat', icon: MessageCircle, color: '#06B6D4' },
  merch: { label: 'Merch', icon: ShoppingBag, color: '#22C55E' },
  videos: { label: 'Videos', icon: Play, color: '#A855F7' },
  news: { label: 'News', icon: Newspaper, color: '#F97316' },
  exclusives: { label: 'Exclusives', icon: Star, color: '#EAB308' },
};

const CREATOR_TITLES: Record<string, string> = {
  'creator:panel': 'Creator Mode',
  'creator:profile': 'Profile & Branding',
  'creator:music': 'Manage Music',
  'creator:videos': 'Manage Videos',
  'creator:news': 'Manage News',
  'creator:merch': 'Manage Merch',
  'creator:exclusives': 'Manage Exclusives',
  'creator:rooms': 'Manage Rooms',
  'creator:admin': 'Platform Admin',
};

function AppInner() {
  const { loading: authLoading } = useAuth();
  const { profile, rooms, loading: placeLoading, refreshProfile } = usePlace();
  const [view, setView] = useState<ViewName>('splash');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading || placeLoading) return;
    setReady(true);
    if (view === 'splash') {
      setView(profile ? 'home' : 'auth');
    }
  }, [authLoading, placeLoading]);

  // If profile appears after auth, go home
  useEffect(() => {
    if (profile && ready && view === 'auth') {
      setView('home');
    }
  }, [profile?.id, ready]);

  if (!ready && view === 'splash') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
        <img
          src="/myplacelogo.png"
          alt="MyPlace"
          className="w-20 h-20 object-contain mb-6 opacity-90"
        />
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

  function navigate(to: ViewName) {
    setView(to);
  }

  function goHome() {
    setView('home');
  }

  const isCreatorView = view.startsWith('creator:');
  const creatorTitle = CREATOR_TITLES[view] ?? 'Creator Mode';

  return (
    <div className="fixed inset-0 bg-black" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="relative w-full h-full">

        {/* Auth screen */}
        {view === 'auth' && (
          <div className="absolute inset-0 overflow-y-auto">
            <AuthScreen
              onSuccess={() => setView('home')}
              onBack={profile ? () => setView('home') : () => {}}
            />
          </div>
        )}

        {/* Home screen */}
        {view === 'home' && (
          <div className="absolute inset-0">
            <HomeScreen onNavigate={navigate} />
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
              {/* Color accent line */}
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
          title={creatorTitle}
          showBack
        >
          {view === 'creator:panel' && <CreatorPanel onNavigate={navigate} />}
          {view === 'creator:profile' && <ManageProfile />}
          {view === 'creator:music' && <ManageMusic />}
          {view === 'creator:videos' && <ManageVideos />}
          {view === 'creator:news' && <ManageNews />}
          {view === 'creator:merch' && <ManageMerch />}
          {view === 'creator:exclusives' && <ManageExclusives />}
          {view === 'creator:rooms' && <ManageRooms />}
          {view === 'creator:admin' && <AdminPanel />}
        </SlidePanel>

        {/* Persistent audio player */}
        {view !== 'auth' && <AudioPlayer />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <PlaceProvider>
          <AppInner />
        </PlaceProvider>
      </AudioProvider>
    </AuthProvider>
  );
}
