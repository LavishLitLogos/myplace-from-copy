import { useEffect, useState } from 'react';
import { AlertTriangle, Check, X, Eye, MessageCircle, Music, Play, Newspaper, Star, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ContentReport, ViewName } from '../../types';

interface AdminModerationProps {
  onNavigate: (view: ViewName) => void;
}

const REASON_LABELS: Record<string, string> = {
  hate: 'Hate Speech',
  harassment: 'Harassment',
  threat: 'Threats',
  sexual: 'Sexual Content',
  gore: 'Graphic Gore',
  criminal: 'Criminal Activity',
  other: 'Other',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  music: Music,
  video: Play,
  exclusive: Star,
  comment: MessageCircle,
  chat: MessageCircle,
};

export function AdminModeration({ onNavigate }: AdminModerationProps) {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const query = supabase
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query.eq('status', 'pending');
    }

    const { data } = await query;
    setReports(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, [filter]);

  async function updateReportStatus(
    id: string,
    status: 'approved' | 'removed' | 'dismissed'
  ) {
    await supabase
      .from('content_reports')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="pb-10">
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => setFilter('pending')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={
            filter === 'pending'
              ? { background: '#EF4444', color: '#fff' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
          }
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={
            filter === 'all'
              ? { background: 'rgba(255,255,255,0.15)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
          }
        >
          All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-500/10 border border-green-500/20">
            <Check size={24} className="text-green-400" />
          </div>
          <p className="text-white font-semibold mb-1">All Clear</p>
          <p className="text-white/40 text-sm text-center">No reports pending review</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {reports.map(report => {
            const IconComp = TYPE_ICONS[report.content_type] ?? AlertTriangle;
            return (
              <div
                key={report.id}
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    report.status === 'pending'
                      ? 'rgba(239,68,68,0.3)'
                      : report.status === 'removed'
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(34,197,94,0.15)'
                  }`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <IconComp size={14} className="text-white/50" />
                    <span className="text-white/50 text-xs capitalize">{report.content_type}</span>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      background:
                        report.status === 'pending'
                          ? 'rgba(239,68,68,0.2)'
                          : report.status === 'removed'
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(34,197,94,0.1)',
                      color:
                        report.status === 'pending'
                          ? '#F87171'
                          : report.status === 'removed'
                          ? '#EF4444'
                          : '#22C55E',
                    }}
                  >
                    {report.status}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-xs text-red-400 font-semibold">
                      {REASON_LABELS[report.reason]}
                    </span>
                  </div>
                  {report.details && (
                    <p className="text-white/60 text-sm">{report.details}</p>
                  )}
                </div>

                <p className="text-white/30 text-[10px]">
                  Reported {new Date(report.created_at).toLocaleDateString()}
                </p>

                {report.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => updateReportStatus(report.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 transition-all active:scale-95"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'removed')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 transition-all active:scale-95"
                    >
                      <X size={12} /> Remove
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-white/10 text-white/50 transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
