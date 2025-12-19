import { supabase } from './supabase';
import { LotStatus } from '../types/lot';
import { ArticleStatus } from '../types/article';

export async function updateLotStatus(
  lotId: string,
  newStatus: LotStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('*, lot_items(article_id)')
      .eq('id', lotId)
      .single();

    if (lotError) throw lotError;

    const { error: updateError } = await supabase
      .from('lots')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : lot.published_at
      })
      .eq('id', lotId);

    if (updateError) throw updateError;

    if (newStatus === 'published') {
      const articleIds = lot.lot_items.map((item: any) => item.article_id);

      if (articleIds.length > 0) {
        const { error: articlesError } = await supabase
          .from('articles')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .in('id', articleIds);

        if (articlesError) throw articlesError;
      }
    }

    if (newStatus === 'sold') {
      const articleIds = lot.lot_items.map((item: any) => item.article_id);

      if (articleIds.length > 0) {
        const { error: articlesError } = await supabase
          .from('articles')
          .update({ status: 'sold' })
          .in('id', articleIds);

        if (articlesError) throw articlesError;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating lot status:', error);
    return { success: false, error: error.message };
  }
}

export async function checkArticleInLot(
  articleId: string
): Promise<{ inLot: boolean; lotName?: string; lotId?: string }> {
  try {
    const { data, error } = await supabase
      .from('lot_items')
      .select('lot_id, lots!inner(id, name, status)')
      .eq('article_id', articleId)
      .neq('lots.status', 'sold');

    if (error) throw error;

    if (data && data.length > 0) {
      const lot = data[0].lots as any;
      return {
        inLot: true,
        lotName: lot.name,
        lotId: lot.id,
      };
    }

    return { inLot: false };
  } catch (error) {
    console.error('Error checking article in lot:', error);
    return { inLot: false };
  }
}

export async function canDeleteArticle(articleId: string): Promise<{ canDelete: boolean; reason?: string }> {
  const lotCheck = await checkArticleInLot(articleId);

  if (lotCheck.inLot) {
    return {
      canDelete: false,
      reason: `Cet article fait partie du lot "${lotCheck.lotName}". Supprimez d'abord le lot ou retirez l'article du lot.`,
    };
  }

  return { canDelete: true };
}

export async function getArticlesInLots(userId: string): Promise<Map<string, { lotName: string; lotId: string }>> {
  try {
    const { data, error } = await supabase
      .from('lot_items')
      .select('article_id, lots!inner(id, name, status, user_id)')
      .eq('lots.user_id', userId)
      .neq('lots.status', 'sold');

    if (error) throw error;

    const map = new Map<string, { lotName: string; lotId: string }>();

    if (data) {
      data.forEach((item: any) => {
        map.set(item.article_id, {
          lotName: item.lots.name,
          lotId: item.lots.id,
        });
      });
    }

    return map;
  } catch (error) {
    console.error('Error getting articles in lots:', error);
    return new Map();
  }
}
