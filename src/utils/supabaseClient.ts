import { createClient } from '@supabase/supabase-js';

// Supabase credentials for mind_bridge_web dedicated web platform
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sxwhytrwunkrbyldjagn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4d2h5dHJ3dW5rcmJ5bGRqYWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNzU2NDYsImV4cCI6MjEwNDY1MTY0Nn0.1vKFv7md260qkCiOYKl_83w-c3htKgvJ8OyKE_gHnN4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a document or counseling file to Supabase storage for the initial version.
 */
export async function uploadFileToSupabase(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    console.error('Error uploading file to Supabase Storage:', error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
}
