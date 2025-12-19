import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle,
  X,
  Package,
  Check,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/ui/Toast';
import { ScheduleModal } from '../components/ScheduleModal';
import { Article } from '../types/article';
import { Lot } from '../types/lot';
import { AdminDetailDrawer } from '../components/admin/AdminDetailDrawer';

// UI Kit Apple-style
import {
  Card,
  SoftCard,
  Pill,
  PrimaryButton,
  GhostButton,
} from '../components/ui/UiKit';

interface Suggestion {
  id: string;
  article_id?: string;
  lot_id?: string;
  suggested_date: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled';
  article?: Article;
  lot?: Lot;
}

const PRIORITY_LABELS = {
  high: 'Haute priorité',
  medium: 'Priorité moyenne',
  low: 'Basse priorité',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
  'all-season': 'Toutes saisons',
  'all-seasons': 'Toutes saisons',
  'all_seasons': 'Toutes saisons',
};

export function PlannerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [scheduledArticlesDisplayLimit, setScheduledArticlesDisplayLimit] = useState(5);
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);

  const [readyArticles, setReadyArticles] = useState<Article[]>([]);
  const [readyLots, setReadyLots] = useState<Lot[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<Article[]>([]);
  const [scheduledLots, setScheduledLots] = useState<Lot[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<any>(null);

  useEffect(() => {
    async function initializePlanner() {
      await generateSuggestions();
      await loadSuggestions();
    }
    initializePlanner();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [user]);

  async function loadSuggestions() {
    if (!user) return;

    try {
      setLoading(true);
      const { data: suggestionsData, error } = await supabase
        .from('selling_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('suggested_date', { ascending: true });

      if (error) throw error;

      const suggestionsWithData = await Promise.all(
        (suggestionsData || []).map(async (suggestion) => {
          if (suggestion.article_id) {
            const { data: article } = await supabase
              .from('articles')
              .select('*')
              .eq('id', suggestion.article_id)
              .maybeSingle();
            return { ...suggestion, article };
          } else if (suggestion.lot_id) {
            const { data: lot } = await supabase
              .from('lots')
              .select('*')
              .eq('id', suggestion.lot_id)
              .maybeSingle();
            return { ...suggestion, lot };
          }
          return suggestion;
        })
      );

      const filteredSuggestions = suggestionsWithData.filter(
        (suggestion) =>
          (suggestion.article &&
            suggestion.article.status !== 'sold' &&
            suggestion.article.status !== 'draft') ||
          (suggestion.lot &&
            suggestion.lot.status !== 'sold' &&
            suggestion.lot.status !== 'draft')
      );

      setSuggestions(filteredSuggestions as Suggestion[]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setToast({
        type: 'error',
        text: 'Erreur lors du chargement des suggestions',
      });
    } finally {
      setLoading(false);
    }
  }

  async function generateSuggestions() {
    if (!user) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-planner-suggestions`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  }

  async function acceptSuggestion(
    suggestionId: string,
    itemId: string,
    suggestedDate: string,
    isLot: boolean = false
  ) {
    try {
      const scheduledFor = new Date(suggestedDate).toISOString();
      const tableName = isLot ? 'lots' : 'articles';

      const { error: itemError } = await supabase
        .from(tableName)
        .update({ status: 'scheduled', scheduled_for: scheduledFor })
        .eq('id', itemId);

      if (itemError) throw itemError;

      const { error: suggestionError } = await supabase
        .from('selling_suggestions')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (suggestionError) throw suggestionError;

      await loadSuggestions();
      await loadArticles();
      setToast({
        type: 'success',
        text: `Suggestion acceptée et ${isLot ? 'lot' : 'article'} planifié`,
      });
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      setToast({
        type: 'error',
        text: "Erreur lors de l'acceptation de la suggestion",
      });
    }
  }

  async function rejectSuggestion(suggestionId: string) {
    try {
      const { error } = await supabase
        .from('selling_suggestions')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;

      await loadSuggestions();
      setToast({ type: 'success', text: 'Suggestion rejetée' });
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      setToast({
        type: 'error',
        text: 'Erreur lors du rejet de la suggestion',
      });
    }
  }

  function handleOpenScheduleModal(
    item: Article | Lot,
    suggestionId: string,
    isLot: boolean = false,
    suggestedDateTime?: string
  ) {
    if (isLot) {
      setSelectedLot(item as Lot);
      setSelectedArticle(null);
    } else {
      setSelectedArticle(item as Article);
      setSelectedLot(null);
    }
    setSelectedSuggestionId(suggestionId);
    setSuggestedDate(suggestedDateTime || null);
    setScheduleModalOpen(true);
  }

  async function handleOpenPreviewModal(item: Article | Lot, isLot: boolean = false) {
    const adminItem = await convertToAdminItem(item, isLot);
    setDrawerItem(adminItem);
    setDrawerOpen(true);
  }

  async function convertToAdminItem(item: Article | Lot, isLot: boolean = false): Promise<any> {
    if (isLot) {
      const lot = item as Lot;

      let articles = [];
      const { data: lotItems } = await supabase
        .from('lot_items')
        .select('article_id')
        .eq('lot_id', lot.id);

      if (lotItems && lotItems.length > 0) {
        const articleIds = lotItems.map(item => item.article_id);
        const { data: articlesData } = await supabase
          .from('articles')
          .select('id, title, brand, price, photos, size')
          .in('id', articleIds);

        if (articlesData) {
          articles = articlesData;
        }
      }

      return {
        id: lot.id,
        type: 'lot' as const,
        title: lot.name || '',
        brand: undefined,
        price: lot.price || 0,
        status: lot.status,
        photos: lot.cover_photo ? [lot.cover_photo] : [],
        created_at: lot.created_at || '',
        scheduled_for: lot.scheduled_for,
        seller_id: lot.seller_id,
        published_at: lot.published_at,
        sold_at: lot.sold_at,
        sold_price: lot.sold_price,
        net_profit: lot.net_profit,
        reference_number: lot.reference_number,
        description: lot.description,
        vinted_url: lot.vinted_url,
        fees: lot.fees,
        shipping_cost: lot.shipping_cost,
        buyer_name: lot.buyer_name,
        sale_notes: lot.sale_notes,
        lot_article_count: lot.article_count,
        original_total_price: lot.original_total_price,
        discount_percentage: lot.discount_percentage,
        articles: articles,
      };
    } else {
      const article = item as Article;
      return {
        id: article.id,
        type: 'article' as const,
        title: article.title || '',
        brand: article.brand,
        price: article.price || 0,
        status: article.status,
        photos: article.photos || [],
        created_at: article.created_at || '',
        season: article.season,
        scheduled_for: article.scheduled_for,
        seller_id: article.seller_id,
        published_at: article.published_at,
        sold_at: article.sold_at,
        sold_price: article.sold_price,
        net_profit: article.net_profit,
        reference_number: article.reference_number,
        description: article.description,
        suggested_period: article.suggested_period,
        vinted_url: article.vinted_url,
        fees: article.fees,
        shipping_cost: article.shipping_cost,
        buyer_name: article.buyer_name,
        sale_notes: article.sale_notes,
        size: article.size,
        color: article.color,
        material: article.material,
        condition: article.condition,
        main_category: article.main_category,
        subcategory: article.subcategory,
        item_category: article.item_category,
      };
    }
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setDrawerItem(null);
  };

  const handleEdit = (suggestions?: Record<string, any>) => {
    if (!drawerItem) return;
    if (drawerItem.type === 'article') {
      navigate(`/articles/${drawerItem.id}/edit`);
    } else {
      navigate(`/lots/${drawerItem.id}/edit`);
    }
  };

  const handlePublish = () => {
    setToast({ type: 'error', text: 'Fonctionnalité en cours de développement' });
  };

  const handleDuplicate = () => {
    setToast({ type: 'error', text: 'Fonctionnalité en cours de développement' });
  };

  const handleSchedule = () => {
    if (!drawerItem) return;
    handleDrawerClose();
    setTimeout(() => {
      if (drawerItem.type === 'article') {
        const article = scheduledArticles.find(a => a.id === drawerItem.id) ||
                       readyArticles.find(a => a.id === drawerItem.id);
        if (article) {
          setSelectedArticle(article);
          setSelectedLot(null);
          setScheduleModalOpen(true);
        }
      } else {
        const lot = scheduledLots.find(l => l.id === drawerItem.id);
        if (lot) {
          setSelectedLot(lot);
          setSelectedArticle(null);
          setScheduleModalOpen(true);
        }
      }
    }, 300);
  };

  const handleMarkSold = () => {
    setToast({ type: 'error', text: 'Fonctionnalité en cours de développement' });
  };

  const handleDelete = async () => {
    if (!drawerItem || !user) return;

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${drawerItem.type === 'lot' ? 'ce lot' : 'cet article'} ?`
    );

    if (!confirmDelete) return;

    try {
      const table = drawerItem.type === 'article' ? 'articles' : 'lots';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', drawerItem.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setToast({
        type: 'success',
        text: `${drawerItem.type === 'lot' ? 'Lot' : 'Article'} supprimé avec succès`
      });
      handleDrawerClose();
      await loadArticles();
      await loadSuggestions();
    } catch (error) {
      console.error('Error deleting:', error);
      setToast({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleStatusChange = () => {
    setToast({ type: 'error', text: 'Fonctionnalité en cours de développement' });
  };

  const handleLabelOpen = () => {
    setToast({ type: 'error', text: 'Fonctionnalité en cours de développement' });
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Non défini';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  async function handleScheduled() {
    if (selectedSuggestionId) {
      try {
        const { error } = await supabase
          .from('selling_suggestions')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', selectedSuggestionId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating suggestion:', error);
      }
    }

    await loadSuggestions();
    await loadArticles();
    setToast({ type: 'success', text: 'Article programmé avec succès' });
    setScheduleModalOpen(false);
    setSelectedArticle(null);
    setSelectedLot(null);
    setSelectedSuggestionId(null);
  }

  async function loadArticles() {
    if (!user) return;

    try {
      const { data: ready, error: readyError } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false });

      const { data: readyLotsData, error: readyLotsError } = await supabase
        .from('lots')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false });

      const { data: scheduled, error: scheduledError } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      const { data: scheduledLotsData, error: scheduledLotsError } = await supabase
        .from('lots')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (readyError) throw readyError;
      if (readyLotsError) throw readyLotsError;
      if (scheduledError) throw scheduledError;
      if (scheduledLotsError) throw scheduledLotsError;

      setReadyArticles(ready || []);
      setReadyLots(readyLotsData || []);
      setScheduledArticles(scheduled || []);
      setScheduledLots(scheduledLotsData || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  }

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const totalReady = readyArticles.length + readyLots.length;
  const totalScheduled = scheduledArticles.length + scheduledLots.length;

  const currentArticleForSchedule = selectedArticle || (selectedLot as any);

  return (
    <>
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {currentArticleForSchedule && (
        <ScheduleModal
          isOpen={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setSelectedArticle(null);
            setSelectedLot(null);
            setSelectedSuggestionId(null);
            setSuggestedDate(null);
          }}
          article={currentArticleForSchedule}
          onScheduled={handleScheduled}
          initialDate={suggestedDate || undefined}
        />
      )}

      <div>
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Planificateur intelligent</h1>
            <p className="text-sm text-gray-600 mt-1">
              Optimisez vos ventes en publiant vos articles et lots au meilleur moment. ({pendingSuggestions.length} {pendingSuggestions.length === 1 ? 'suggestion' : 'suggestions'})
            </p>
          </div>

          {loading ? (
            <Card className="py-10 sm:py-12 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4" />
              <p className="text-sm text-slate-600">
                Chargement des suggestions…
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Section Aperçu */}
              <Card>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      {totalReady + totalScheduled} annonce
                      {totalReady + totalScheduled > 1 ? 's prêtes' : ' prête'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    Le planificateur vous aide à lisser vos ventes dans le temps.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Suggestions de planification optimisées */}
                  <SoftCard className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Suggestions de planification
                      </h3>
                    </div>
                    <div className="text-3xl font-semibold text-blue-700 mb-1">
                      {pendingSuggestions.length}
                    </div>
                    <p className="text-xs text-blue-700 mb-4">
                      {pendingSuggestions.length > 0
                        ? 'Suggestions IA basées sur la saisonnalité et la demande.'
                        : 'Aucune suggestion pour le moment.'}
                    </p>

                    {pendingSuggestions.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white flex items-center justify-center">
                          <Clock className="w-7 h-7 text-blue-400" />
                        </div>
                        <p className="text-xs text-blue-700 mb-3">
                          Cliquez pour analyser votre stock
                        </p>
                        <GhostButton
                          onClick={generateSuggestions}
                          className="text-xs px-3 py-2 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Générer
                        </GhostButton>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
                        {pendingSuggestions.map((suggestion) => {
                          const isLot = !!suggestion.lot_id;
                          const item = suggestion.lot || suggestion.article;
                          const itemPhoto = suggestion.lot?.cover_photo || suggestion.article?.photos?.[0];
                          const itemTitle = suggestion.lot?.name || suggestion.article?.title || 'Élément inconnu';
                          const itemId = suggestion.lot?.id || suggestion.article?.id;

                          return (
                            <div
                              key={suggestion.id}
                              onClick={() => {
                                if (item) {
                                  handleOpenPreviewModal(item, isLot);
                                }
                              }}
                              className="group bg-white rounded-xl p-2 hover:shadow-sm transition-all border border-blue-100 cursor-pointer"
                            >
                              <div className="flex items-start gap-2 mb-2">
                                {itemPhoto ? (
                                  <img
                                    src={itemPhoto}
                                    alt={itemTitle}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    {isLot ? (
                                      <Package className="w-5 h-5 text-slate-400" />
                                    ) : (
                                      <Calendar className="w-5 h-5 text-slate-400" />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    {isLot && (
                                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                        <Package className="w-2.5 h-2.5" />
                                        Lot
                                      </span>
                                    )}
                                    <p className="text-xs font-medium text-slate-900 truncate leading-tight">
                                      {itemTitle}
                                    </p>
                                  </div>
                                  <p className="text-[11px] text-slate-600 line-clamp-1 leading-tight mb-1">
                                    {suggestion.reason}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    <span className="text-[11px] font-medium text-blue-700">
                                      {new Date(suggestion.suggested_date).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectSuggestion(suggestion.id);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
                                  title="Refuser cette suggestion"
                                >
                                  <X className="w-3 h-3" />
                                  Refuser
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item && itemId) {
                                      acceptSuggestion(suggestion.id, itemId, suggestion.suggested_date, isLot);
                                    }
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                                  title="Accepter la date suggérée"
                                >
                                  <Check className="w-3 h-3" />
                                  Accepter
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item && itemId) {
                                      handleOpenScheduleModal(item, suggestion.id, isLot, suggestion.suggested_date);
                                    }
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                                  title="Modifier la date de publication"
                                >
                                  <Calendar className="w-3 h-3" />
                                  Planifier
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SoftCard>

                  {/* Articles & lots programmés */}
                  <SoftCard className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Annonces programmées
                      </h3>
                    </div>
                    <div className="text-3xl font-semibold text-emerald-700 mb-1">
                      {totalScheduled}
                    </div>
                    <p className="text-xs text-emerald-700 mb-4">
                      {totalScheduled > 0
                        ? 'Vos prochaines publications sont déjà calées dans le temps.'
                        : 'Aucune publication planifiée.'}
                    </p>

                    {(scheduledArticles.length > 0 || scheduledLots.length > 0) && (
                      <>
                        <div className="space-y-2">
                          {scheduledArticles
                            .slice(0, scheduledArticlesDisplayLimit)
                            .map((article) => (
                              <button
                                key={`article-${article.id}`}
                                type="button"
                                onClick={() =>
                                  handleOpenPreviewModal(article, false)
                                }
                                className="w-full flex items-center gap-3 bg-white rounded-2xl p-2 hover:shadow-sm transition-shadow border border-emerald-100 text-left"
                              >
                                {article.photos?.[0] ? (
                                  <img
                                    src={article.photos[0]}
                                    alt={article.title}
                                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-900 truncate">
                                    {article.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    <span className="text-xs text-emerald-700">
                                      {article.scheduled_for
                                        ? new Date(
                                            article.scheduled_for
                                          ).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                          })
                                        : 'Bientôt'}
                                    </span>
                                  </div>
                                </div>
                                <Pill variant="warning" className="hidden sm:inline-flex">
                                  Planifié
                                </Pill>
                              </button>
                            ))}

                          {scheduledLots
                            .slice(
                              0,
                              Math.max(
                                0,
                                scheduledArticlesDisplayLimit -
                                  scheduledArticles.length
                              )
                            )
                            .map((lot) => (
                              <button
                                key={`lot-${lot.id}`}
                                type="button"
                                onClick={() =>
                                  handleOpenPreviewModal(lot, true)
                                }
                                className="w-full flex items-center gap-3 bg-white rounded-2xl p-2 hover:shadow-sm transition-shadow border border-emerald-100 text-left"
                              >
                                {lot.cover_photo ? (
                                  <img
                                    src={lot.cover_photo}
                                    alt={lot.name}
                                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-purple-600" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[11px] px-1.5 py-0.5 rounded font-semibold">
                                      <Package className="w-3 h-3" />
                                      Lot
                                    </span>
                                    <p className="text-xs font-medium text-slate-900 truncate">
                                      {lot.name}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    <span className="text-xs text-emerald-700">
                                      {lot.scheduled_for
                                        ? new Date(
                                            lot.scheduled_for
                                          ).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                          })
                                        : 'Bientôt'}
                                    </span>
                                  </div>
                                </div>
                                <Pill variant="warning" className="hidden sm:inline-flex">
                                  Planifié
                                </Pill>
                              </button>
                            ))}
                        </div>

                        {totalScheduled > scheduledArticlesDisplayLimit && (
                          <GhostButton
                            onClick={() =>
                              setScheduledArticlesDisplayLimit((prev) => prev + 5)
                            }
                            className="w-full mt-3 justify-center text-xs"
                          >
                            Voir + (
                            {totalScheduled - scheduledArticlesDisplayLimit} restants)
                          </GhostButton>
                        )}
                      </>
                    )}
                  </SoftCard>
                </div>
              </Card>
            </div>
          )}
      </div>

      <AdminDetailDrawer
        item={drawerItem}
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onDuplicate={handleDuplicate}
        onSchedule={handleSchedule}
        onMarkSold={handleMarkSold}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onLabelOpen={handleLabelOpen}
        formatDate={formatDate}
      />
    </>
  );
}
