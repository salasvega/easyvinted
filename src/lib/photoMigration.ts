import { supabase } from './supabase';

export async function migratePhotosFromTempFolder(
  photos: string[],
  userId: string,
  articleId: string
): Promise<string[]> {
  const needsMigration = photos.some((photoUrl) => photoUrl.includes('/temp-'));

  if (!needsMigration) {
    return photos;
  }

  const migratedPhotos: string[] = [];

  for (const photoUrl of photos) {
    if (photoUrl.includes('/temp-')) {
      try {
        const urlParts = photoUrl.split('/article-photos/');
        if (urlParts.length === 2) {
          const oldPath = urlParts[1];
          const fileName = oldPath.split('/').pop();

          if (!fileName) {
            migratedPhotos.push(photoUrl);
            continue;
          }

          const newPath = `${userId}/${articleId}/${fileName}`;

          const { data: fileData } = await supabase.storage
            .from('article-photos')
            .download(oldPath);

          if (fileData) {
            await supabase.storage
              .from('article-photos')
              .upload(newPath, fileData, {
                cacheControl: '3600',
                upsert: false,
              });

            await supabase.storage.from('article-photos').remove([oldPath]);

            const { data } = supabase.storage
              .from('article-photos')
              .getPublicUrl(newPath);

            migratedPhotos.push(data.publicUrl);
          } else {
            migratedPhotos.push(photoUrl);
          }
        }
      } catch (migrateError) {
        console.error('Error migrating photo:', migrateError);
        migratedPhotos.push(photoUrl);
      }
    } else {
      migratedPhotos.push(photoUrl);
    }
  }

  return migratedPhotos;
}

export async function cleanupTempFolder(userId: string, tempFolderId: string): Promise<void> {
  try {
    const folderPath = `${userId}/temp-${tempFolderId}`;
    const { data: folderContents } = await supabase.storage
      .from('article-photos')
      .list(folderPath);

    if (folderContents && folderContents.length > 0) {
      const filesToDelete = folderContents.map((file) => `${folderPath}/${file.name}`);
      await supabase.storage.from('article-photos').remove(filesToDelete);
    }
  } catch (error) {
    console.error('Error cleaning up temp folder:', error);
  }
}
