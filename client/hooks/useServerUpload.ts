import { useCallback } from 'react';
import { useToast } from './use-toast';

type Kind = 'image' | 'document';

/**
 * Upload files via backend API (uses service role to bypass RLS)
 */
export function useServerUpload() {
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File, kind: Kind) => {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const filename = `${timestamp}-${randomId}-${file.name}`;
      const bucket = kind === 'image' ? 'warehouse-images' : 'warehouse-documents';

      console.log(`📤 Uploading ${kind}: ${filename}`);

      // Read file as base64
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Content = reader.result as string;
            
            const response = await fetch('/api/warehouse-submission/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bucket,
                filename,
                content: base64Content.split(',')[1], // Remove data:image/png;base64, prefix
                contentType: file.type
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || `Upload failed with status ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
              console.log(`✅ ${kind} uploaded: ${result.publicUrl}`);
              return resolve(result.publicUrl);
            } else {
              throw new Error(result.error || 'Upload failed');
            }
          } catch (error) {
            console.error(`❌ Upload error:`, error);
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };

        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error(`❌ Upload error:`, err);
      throw err;
    }
  }, [toast]);

  return { uploadFile };
}

export default useServerUpload;
