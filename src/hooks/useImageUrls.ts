import { useState, useEffect } from 'react';
import { getImageUrl, getImageUrls, getImageUrlSync } from '../lib/imageCache';

export function useImageUrl(photoPath: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => {
    if (!photoPath) return undefined;
    return getImageUrlSync(photoPath);
  });

  useEffect(() => {
    if (!photoPath) {
      setUrl(undefined);
      return;
    }

    let mounted = true;

    getImageUrl(photoPath).then(resolvedUrl => {
      if (mounted) {
        setUrl(resolvedUrl);
      }
    });

    return () => {
      mounted = false;
    };
  }, [photoPath]);

  return url;
}

export function useImageUrls(photoPaths: string[] | undefined): string[] {
  const [urls, setUrls] = useState<string[]>(() => {
    if (!photoPaths || photoPaths.length === 0) return [];
    return photoPaths.map(path => getImageUrlSync(path));
  });

  useEffect(() => {
    if (!photoPaths || photoPaths.length === 0) {
      setUrls([]);
      return;
    }

    let mounted = true;

    getImageUrls(photoPaths).then(resolvedUrls => {
      if (mounted) {
        setUrls(resolvedUrls);
      }
    });

    return () => {
      mounted = false;
    };
  }, [photoPaths]);

  return urls;
}
