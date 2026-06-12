import { useState, useRef } from 'react';
import { Upload, Link, Image as ImageIcon } from 'lucide-react';
import { uploadFile, validateFileSize, storagePath } from '../../lib/storage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  creatorId: string;
  type?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value, onChange, label, placeholder = 'https://...', creatorId, type = 'images', maxSizeMB = 20,
}: ImageUploadProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setError('');
    const sizeError = validateFileSize(file, maxSizeMB);
    if (sizeError) { setError(sizeError); return; }
    setUploading(true);
    const path = storagePath(creatorId, type, file.name);
    const url = await uploadFile(file, path);
    setUploading(false);
    if (url) { onChange(url); }
    else { setError('Upload failed. Try again or use a URL.'); }
  }

  return (
    <div>
      {label && <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">{label}</label>}
      <div className="flex gap-1.5 mb-2">
        <button type="button" onClick={() => setMode('url')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all"
          style={{ background: mode === 'url' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', color: mode === 'url' ? 'white' : 'rgba(255,255,255,0.35)' }}>
          <Link size={10} /> URL
        </button>
        <button type="button" onClick={() => setMode('upload')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all"
          style={{ background: mode === 'upload' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', color: mode === 'upload' ? 'white' : 'rgba(255,255,255,0.35)' }}>
          <Upload size={10} /> Upload
        </button>
      </div>
      {mode === 'url' ? (
        <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }}>
            {uploading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><ImageIcon size={14} /> Choose Image</>}
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {value && <img src={value} alt="Preview" className="mt-2 w-14 h-14 rounded-lg object-cover" />}
    </div>
  );
}
