import { supabase } from './supabase';

interface CacheEntry {
  url: string;
  timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 60;
const imageUrlCache = new Map<string, CacheEntry>();

let db: IDBDatabase | null = null;
const DB_NAME = 'ImageCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'imageUrls';

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
  });
}

async function getCachedFromDB(photoPath: string): Promise<CacheEntry | null> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(photoPath);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({ url: result.url, timestamp: result.timestamp });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading from IndexedDB:', error);
    return null;
  }
}

async function saveCacheToDB(photoPath: string, entry: CacheEntry): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        path: photoPath,
        url: entry.url,
        timestamp: entry.timestamp
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error writing to IndexedDB:', error);
  }
}

async function removeFromDB(photoPath: string): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(photoPath);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting from IndexedDB:', error);
  }
}

async function clearDB(): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
}

export async function getImageUrl(photoPath: string): Promise<string> {
  const now = Date.now();

  let cached = imageUrlCache.get(photoPath);

  if (!cached) {
    cached = await getCachedFromDB(photoPath);
    if (cached) {
      imageUrlCache.set(photoPath, cached);
    }
  }

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.url;
  }

  const { data } = supabase.storage
    .from('article-photos')
    .getPublicUrl(photoPath);

  const entry: CacheEntry = {
    url: data.publicUrl,
    timestamp: now
  };

  imageUrlCache.set(photoPath, entry);
  await saveCacheToDB(photoPath, entry);

  return data.publicUrl;
}

export function getImageUrlSync(photoPath: string): string {
  const cached = imageUrlCache.get(photoPath);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.url;
  }

  const { data } = supabase.storage
    .from('article-photos')
    .getPublicUrl(photoPath);

  const entry: CacheEntry = {
    url: data.publicUrl,
    timestamp: now
  };

  imageUrlCache.set(photoPath, entry);
  saveCacheToDB(photoPath, entry);

  return data.publicUrl;
}

export async function getImageUrls(photoPaths: string[]): Promise<string[]> {
  return Promise.all(photoPaths.map(path => getImageUrl(path)));
}

export async function clearImageCache(): Promise<void> {
  imageUrlCache.clear();
  await clearDB();
}

export async function removeFromCache(photoPath: string): Promise<void> {
  imageUrlCache.delete(photoPath);
  await removeFromDB(photoPath);
}

export async function preloadImages(photoPaths: string[]): Promise<void> {
  const urls = await Promise.all(photoPaths.map(path => getImageUrl(path)));
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}
