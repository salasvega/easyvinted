import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAllStoragePhotos(): Promise<Set<string>> {
  const photoSet = new Set<string>();
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .storage
      .from('article-photos')
      .list('', {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing storage files:', error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    data.forEach(file => {
      if (file.name && !file.name.endsWith('/')) {
        photoSet.add(file.name);
      }
    });

    if (data.length < limit) {
      break;
    }

    offset += limit;
  }

  return photoSet;
}

async function getAllReferencedPhotos(): Promise<Set<string>> {
  const photoSet = new Set<string>();

  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('photos');

  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
  } else if (articles) {
    articles.forEach(article => {
      if (article.photos && Array.isArray(article.photos)) {
        article.photos.forEach((photoUrl: string) => {
          const match = photoUrl.match(/article-photos\/(.+)$/);
          if (match) {
            photoSet.add(match[1]);
          }
        });
      }
    });
  }

  const { data: lots, error: lotsError } = await supabase
    .from('lots')
    .select('photos, cover_photo');

  if (lotsError) {
    console.error('Error fetching lots:', lotsError);
  } else if (lots) {
    lots.forEach(lot => {
      if (lot.photos && Array.isArray(lot.photos)) {
        lot.photos.forEach((photoUrl: string) => {
          const match = photoUrl.match(/article-photos\/(.+)$/);
          if (match) {
            photoSet.add(match[1]);
          }
        });
      }

      if (lot.cover_photo) {
        const match = lot.cover_photo.match(/article-photos\/(.+)$/);
        if (match) {
          photoSet.add(match[1]);
        }
      }
    });
  }

  return photoSet;
}

async function cleanOrphanPhotos() {
  console.log('🔍 Scanning storage for photos...');
  const storagePhotos = await getAllStoragePhotos();
  console.log(`   Found ${storagePhotos.size} photos in storage`);

  console.log('\n🔍 Scanning database for referenced photos...');
  const referencedPhotos = await getAllReferencedPhotos();
  console.log(`   Found ${referencedPhotos.size} referenced photos`);

  const orphanPhotos: string[] = [];
  storagePhotos.forEach(photo => {
    if (!referencedPhotos.has(photo)) {
      orphanPhotos.push(photo);
    }
  });

  console.log(`\n📊 Found ${orphanPhotos.length} orphan photos`);

  if (orphanPhotos.length === 0) {
    console.log('✅ No orphan photos to clean!');
    return;
  }

  console.log('\n🗑️  Deleting orphan photos...');
  let deletedCount = 0;
  let errorCount = 0;

  for (const photo of orphanPhotos) {
    const { error } = await supabase
      .storage
      .from('article-photos')
      .remove([photo]);

    if (error) {
      console.error(`   ❌ Failed to delete ${photo}:`, error.message);
      errorCount++;
    } else {
      deletedCount++;
      if (deletedCount % 10 === 0) {
        console.log(`   Deleted ${deletedCount}/${orphanPhotos.length} photos...`);
      }
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Deleted: ${deletedCount} photos`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} photos`);
  }
}

cleanOrphanPhotos().catch(console.error);
