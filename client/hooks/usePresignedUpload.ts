import { useCallback } from 'react';

type Kind = 'image' | 'document';

/**
 * Upload files via server API → Supabase Storage (service role key bypasses RLS)
 * Replaces the old MinIO presign approach that required localhost:4001
 */
export function usePresignedUpload() {
  const presignAndUpload = useCallback(async (file: File, kind: Kind): Promise<string> => {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    const resp = await fetch('/api/warehouse-submissions/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type,
        bucket: kind === 'image' ? 'warehouse-images' : 'warehouse-documents',
        folder: kind === 'image' ? 'submissions' : 'documents',
      }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.error || 'Upload failed');
    }

    const body = await resp.json();
    if (!body.success) {
      throw new Error(body.error || 'Upload failed');
    }

    return body.url;
  }, []);

  return { presignAndUpload };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default usePresignedUpload;
