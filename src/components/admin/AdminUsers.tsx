import { useEffect, useState } from 'react';
import { Users, User, Shield, Ban, Check, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FamzProfile, ViewName } from '../../types';

interface AdminUsersProps {
  onNavigate: (view: ViewName) => void;
}

interface UserWithRole {
  profile: FamzProfile;
  isAdmin: boolean;
  adminRole?: string;
}

export function AdminUsers({ onNavigate }: AdminUsersProps) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'famz' | 'admins'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);

    // Get all FAMZ profiles
    const { data: famzProfiles } = await supabase
      .from('famz_profiles')
      .select('*');

    // Get all admin roles
    const { data: adminRoles } = await supabase
      .from('admin_roles')
      .select('*');

    const adminUserIds = new Set((adminRoles ?? []).map(a => a.user_id));
    const adminRolesMap = new Map((adminRoles ?? []).map(a => [a.user_id, a.role]));

    const withRoles: UserWithRole[] = (famzProfiles ?? []).map(p => ({
      profile: p,
      isAdmin: adminUserIds.has(p.user_id),
      adminRole: adminRolesMap.get(p.user_id),
    }));

    setUsers(withRoles);
    setLoading(false);
  }

  async function toggleAdmin(userId: string, isCurrentlyAdmin: boolean) {
    if (isCurrentlyAdmin) {
      await supabase.from('admin_roles').delete().eq('user_id', userId);
    } else {
      await supabase.from('admin_roles').insert({ user_id: userId, role: 'admin' });
    }
    await loadUsers();
  }

  const filtered = search.trim()
    ? users.filter(u =>
        u.profile.display_name.toLowerCase().includes(search.toLowerCase()) ||
        u.profile.user_id.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const displayUsers = tab === 'admins'
    ? filtered.filter(u => u.isAdmin)
    : tab === 'famz'
    ? filtered.filter(u => !u.isAdmin)
    : filtered;

  return (
    <div className="pb-10">
      <div className="px-4 py-3 space-y-3">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Search size={16} className="text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
          />
        </div>

        <div className="flex gap-1">
          {(['all', 'famz', 'admins'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
              style={
                tab === t
                  ? { background: '#EC4899', color: '#000' }
                  : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              {t === 'all' ? 'All' : t === 'famz' ? 'FAMZ' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex items-center gap-2 text-white/30 text-xs mb-2">
        <Users size={12} />
        <span>{displayUsers.length} user{displayUsers.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {displayUsers.map(user => (
            <div
              key={user.profile.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  border: `2px solid ${user.profile.display_color}`,
                  background: `${user.profile.display_color}20`,
                }}
              >
                {user.profile.avatar_url ? (
                  <img src={user.profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: user.profile.display_color }}>
                      {user.profile.display_name?.[0]?.toUpperCase() ?? 'F'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold truncate">{user.profile.display_name}</p>
                  {user.isAdmin && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}
                    >
                      {user.adminRole?.toUpperCase() ?? 'ADMIN'}
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs truncate">FAMZ</p>
              </div>
              <button
                onClick={() => toggleAdmin(user.profile.user_id, user.isAdmin)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  user.isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'
                }`}
              >
                {user.isAdmin ? <Ban size={14} /> : <Shield size={14} />}
              </button>
            </div>
          ))}
          {displayUsers.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
