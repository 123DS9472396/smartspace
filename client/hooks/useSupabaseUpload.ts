import { useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

type Kind = 'image' | 'document';

/**
 * Upload files directly to Supabase Storage
 * No presign server needed - works out of the box
 */
export function useSupabaseUpload() {
  const uploadFile = useCallback(async (file: File, kind: Kind) => {
    try {
      const bucket = kind === 'image' ? 'warehouse-images' : 'warehouse-documents';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const filename = `${timestamp}-${randomId}-${file.name}`;

      console.log(`📤 Uploading ${kind} to Supabase storage/${bucket}/${filename}`);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      const publicUrl = publicUrlData.publicUrl;
      console.log(`✅ ${kind} uploaded: ${publicUrl}`);

      return publicUrl;
    } catch (err) {
      console.error(`❌ Upload error:`, err);
      throw err;
    }
  }, []);

  return { uploadFile };
}

export default useSupabaseUpload;
