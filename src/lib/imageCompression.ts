export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  mimeType: 'image/jpeg',
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  opts.mimeType = 'image/jpeg';

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > opts.maxWidth || height > opts.maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = opts.maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = opts.maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedSize = blob.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

            const compressedFile = new File([blob], file.name, {
              type: opts.mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio,
            });
          },
          opts.mimeType,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.readAsDataURL(file);
  });
}

export async function createThumbnail(
  file: File,
  maxSize: number = 400
): Promise<File> {
  const result = await compressImage(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.80,
  });

  return result.file;
}

export async function compressMultipleImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const compressionPromises = files.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
