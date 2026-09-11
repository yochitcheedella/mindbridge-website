import { createClient } from '@supabase/supabase-js';

// Initial version Supabase credentials for real-time syncing and document storage at VIT
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hweyomasaofopsgirqvs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZXlvbWFzYW9mb3BzZ2lycXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjIzMTUsImV4cCI6MjEwMDczODMxNX0.s4BdO6_-ip2sVGQJzs8eDQFOEAwCSkLjU7YPXfTHVp4';

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
