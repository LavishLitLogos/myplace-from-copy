import { supabase } from './supabase';

const BUCKET = 'myplace-uploads';

export async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.find(b => b.id === BUCKET)) return;
  await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '20MB' });
}

export async function uploadFile(file: File, path: string): Promise<string | null> {
  await ensureBucket();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function validateFileSize(file: File, maxMB: number): string | null {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes * 1.005) {
    return `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is ${maxMB}MB`;
  }
  return null;
}

export function storagePath(creatorId: string, type: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${creatorId}/${type}/${Date.now()}_${safeName}`;
}
