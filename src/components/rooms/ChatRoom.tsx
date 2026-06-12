import { useEffect, useRef, useState } from 'react';
import { Send, Crown, Pin, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { ChatMessage, FAMZ_COLORS, timeAgo } from '../../types';

const DISPLAY_NAME_KEY = 'myplace_famz_name';
const DISPLAY_COLOR_KEY = 'myplace_famz_color';

function randomColor() {
  return FAMZ_COLORS[Math.floor(Math.random() * FAMZ_COLORS.length)];
}

export function ChatRoom() {
  const { profile, isCreator } = usePlace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [senderName, setSenderName] = useState(() => localStorage.getItem(DISPLAY_NAME_KEY) ?? '');
  const [senderColor] = useState(() => localStorage.getItem(DISPLAY_COLOR_KEY) ?? randomColor());
  const [namePrompt, setNamePrompt] = useState(!localStorage.getItem(DISPLAY_NAME_KEY));
  const [tempName, setTempName] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    localStorage.setItem(DISPLAY_COLOR_KEY, senderColor);
  }, [senderColor]);

  useEffect(() => {
    if (!profile) return;
    loadMessages();

    const channel = supabase
      .channel(`chat_${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `creator_id=eq.${profile.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `creator_id=eq.${profile.id}`,
      }, payload => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as ChatMessage).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  async function loadMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('creator_id', profile!.id)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
  }

  function confirmName() {
    const n = tempName.trim() || 'FAMZ';
    setSenderName(n);
    localStorage.setItem(DISPLAY_NAME_KEY, n);
    setNamePrompt(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function sendMessage() {
    if (!input.trim() || !profile || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    const isCreatorMsg = isCreator;
    await supabase.from('chat_messages').insert({
      creator_id: profile.id,
      sender_name: isCreatorMsg ? (profile.name ?? 'Creator') : senderName,
      sender_color: isCreatorMsg ? accent : senderColor,
      message: msg,
      is_creator_message: isCreatorMsg,
    });
    setSending(false);
  }

  async function deleteMessage(id: string) {
    await supabase.from('chat_messages').delete().eq('id', id);
  }

  async function pinMessage(id: string, pinned: boolean) {
    await supabase.from('chat_messages').update({ is_pinned: !pinned }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_pinned: !pinned } : m));
  }

  const pinnedMessages = messages.filter(m => m.is_pinned);

  if (namePrompt && !isCreator) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: `${accent}20`, border: `2px solid ${accent}50` }}
        >
          <span className="text-2xl font-black" style={{ color: accent }}>F</span>
        </div>
        <h2 className="text-white font-bold text-xl mb-1">Enter the Chat</h2>
        <p className="text-white/40 text-sm mb-6 text-center">What should the community call you?</p>
        <input
          autoFocus
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && confirmName()}
          placeholder="Your name..."
          maxLength={24}
          className="w-full max-w-xs bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm mb-3 outline-none focus:border-white/30"
        />
        <button
          onClick={confirmName}
          className="w-full max-w-xs py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: accent, color: '#000' }}
        >
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Creator controls / active indicator */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-2">
        {isCreator ? (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}
          >
            <MessageCircle size={11} /> Creator Mode
          </button>
        ) : null}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2 h-2 rounded-full" style={{ background: accent, animation: 'pulse 2s infinite' }} />
          <span className="text-[10px] text-white/30">Creator Active</span>
        </div>
      </div>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5">
          {pinnedMessages.map(m => (
            <div key={m.id} className="flex items-start gap-2 py-1">
              <Pin size={10} className="text-white/30 mt-1 flex-shrink-0" />
              <p className="text-white/50 text-xs truncate">
                <span style={{ color: m.sender_color }}>{m.sender_name}</span>: {m.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain pb-28">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/20 text-sm">No messages yet. Say hi!</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-2 group">
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
              style={{
                background: `${msg.sender_color}20`,
                border: `1.5px solid ${msg.sender_color}`,
                color: msg.sender_color,
              }}
            >
              {msg.is_creator_message ? <Crown size={12} /> : msg.sender_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span
                  className="text-xs font-semibold"
                  style={{ color: msg.is_creator_message ? accent : msg.sender_color }}
                >
                  {msg.sender_name}
                  {msg.is_creator_message && (
                    <span
                      className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide"
                      style={{ background: `${accent}25`, color: accent }}
                    >
                      CREATOR
                    </span>
                  )}
                </span>
                <span className="text-white/20 text-[10px]">{timeAgo(msg.created_at)}</span>
              </div>
              <div
                className="text-sm text-white/85 leading-relaxed break-words px-3 py-2 rounded-xl rounded-tl-none inline-block max-w-full"
                style={{
                  background: msg.is_creator_message ? `${accent}15` : 'rgba(255,255,255,0.05)',
                  border: msg.is_creator_message ? `1px solid ${accent}25` : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {msg.message}
              </div>
            </div>
            {isCreator && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => pinMessage(msg.id, msg.is_pinned)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.is_pinned ? 'text-yellow-400' : 'text-white/20'}`}
                  style={msg.is_pinned ? { background: `${accent}20` } : {}}
                >
                  <Pin size={10} />
                </button>
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex items-center gap-2 border-t border-white/5 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div
          className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Say something..."
            maxLength={500}
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
          style={{ background: accent }}
        >
          <Send size={16} className="text-black" />
        </button>
      </div>
    </div>
  );
}
