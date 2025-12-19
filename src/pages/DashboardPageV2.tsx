import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, Edit2, Trash2, FileText, CheckCircle2, Clock, Send, DollarSign } from 'lucide-react';
import { Article, ArticleStatus } from '../types/article';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Toast } from '../components/ui/Toast';
import { ArticleStatusModal } from '../components/ArticleStatusModal';
import { ArticleSoldModal } from '../components/ArticleSoldModal';
import { Button } from '../components/ui/Button';
import { ArticleFormDrawer } from '../components/admin/ArticleFormDrawer';

const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Brouillon',
  ready: 'Prêt',
  scheduled: 'Planifié',
  published: 'Publié',
  sold: 'Vendu',
};

const STATUS_COLORS: Record<ArticleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  ready: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  sold: 'bg-green-100 text-green-700',
};

export function DashboardPageV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [familyMembers, setFamilyMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; articleId: string | null }>({
    isOpen: false,
    articleId: null,
  });
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; article: Article | null }>({
    isOpen: false,
    article: null,
  });
  const [soldModal, setSoldModal] = useState<{ isOpen: boolean; article: Article | null }>({
    isOpen: false,
    article: null,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [articleFormDrawer, setArticleFormDrawer] = useState<{
    isOpen: boolean;
    articleId?: string;
  }>({
    isOpen: false,
    articleId: undefined,
  });

  useEffect(() => {
    fetchArticles();
    fetchFamilyMembers();
  }, [user]);

  const fetchArticles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setArticles(
        (data || []).map((article) => ({
          ...article,
          price: parseFloat(article.price),
          season: article.season === 'all_seasons' ? 'all-seasons' : article.season,
        }))
      );
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesStatus = statusFilter === 'all' ? true : article.status === statusFilter;
    const matchesSeller = sellerFilter === 'all' ? true : article.seller_id === sellerFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.brand?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query);
    const isNotSold = article.status !== 'sold';
    return matchesStatus && matchesSeller && matchesQuery && isNotSold;
  });

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const renderStatusIcon = (status: ArticleStatus) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-3.5 h-3.5" />;
      case 'ready':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'scheduled':
        return <Clock className="w-3.5 h-3.5" />;
      case 'published':
        return <Send className="w-3.5 h-3.5" />;
      case 'sold':
        return <DollarSign className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const handleStatusChange = async (status: ArticleStatus) => {
    if (!statusModal.article) return;

    try {
      const updateData: any = { status };

      if (status === 'published' && !statusModal.article.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', statusModal.article.id);

      if (error) throw error;

      setToast({ type: 'success', text: `Statut changé en "${STATUS_LABELS[status]}"` });
      fetchArticles();
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ type: 'error', text: 'Erreur lors du changement de statut' });
    }
  };

  const handleMarkAsSold = async (saleData: {
    soldPrice: number;
    soldAt: string;
    platform: string;
    fees: number;
    shippingCost: number;
    buyerName: string;
    notes: string;
    sellerId?: string;
  }) => {
    if (!soldModal.article) return;

    try {
      const netProfit = saleData.soldPrice - saleData.fees - saleData.shippingCost;

      const updateData: any = {
        status: 'sold',
        sold_price: saleData.soldPrice,
        sold_at: saleData.soldAt,
        platform: saleData.platform,
        fees: saleData.fees,
        shipping_cost: saleData.shippingCost,
        buyer_name: saleData.buyerName,
        sale_notes: saleData.notes,
        net_profit: netProfit,
        updated_at: new Date().toISOString(),
      };

      if (saleData.sellerId) {
        updateData.seller_id = saleData.sellerId;
      }

      const { error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', soldModal.article.id);

      if (error) throw error;

      setToast({ type: 'success', text: 'Article marqué comme vendu' });
      setSoldModal({ isOpen: false, article: null });
      fetchArticles();
    } catch (error) {
      console.error('Error marking article as sold:', error);
      setToast({ type: 'error', text: 'Erreur lors du marquage comme vendu' });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.articleId || !user) return;

    try {
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('photos')
        .eq('id', deleteModal.articleId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (article?.photos && article.photos.length > 0) {
        const filePaths = article.photos
          .map((photoUrl: string) => {
            const urlParts = photoUrl.split('/article-photos/');
            return urlParts.length === 2 ? urlParts[1] : null;
          })
          .filter((path: string | null): path is string => path !== null);

        if (filePaths.length > 0) {
          await supabase.storage.from('article-photos').remove(filePaths);
        }
      }

      try {
        const folderPath = `${user.id}/${deleteModal.articleId}`;
        const { data: folderContents } = await supabase.storage
          .from('article-photos')
          .list(folderPath);

        if (folderContents && folderContents.length > 0) {
          const filesToDelete = folderContents.map((file: any) => `${folderPath}/${file.name}`);
          await supabase.storage.from('article-photos').remove(filesToDelete);
        }
      } catch (folderError) {
        console.log('No folder to clean up or error cleaning folder:', folderError);
      }

      const { error } = await supabase.from('articles').delete().eq('id', deleteModal.articleId);

      if (error) throw error;

      setToast({ type: 'success', text: 'Article supprimé avec succès' });
      setDeleteModal({ isOpen: false, articleId: null });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      setToast({ type: 'error', text: 'Erreur lors de la suppression de l\'article' });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon stock</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez vos articles, préparez-les pour Vinted et suivez leur statut. ({filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'})
          </p>
        </div>

        <Button
          onClick={() => setArticleFormDrawer({ isOpen: true, articleId: undefined })}
          className="inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Button>
      </div>

      <div className="mb-5 space-y-3">
        <div className="relative max-w-2xl w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, marque, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm transition-all hover:shadow"
          />
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-0.5 h-3 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-gray-900">Statut</h3>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-0.5 px-0.5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm scale-[1.02]'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  Tous
                </button>
                {(['draft', 'ready', 'scheduled', 'published'] as ArticleStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-all ${
                      statusFilter === status
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm scale-[1.02]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {renderStatusIcon(status)}
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-0.5 h-3 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-gray-900">Vendeur</h3>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-0.5 px-0.5">
                <button
                  onClick={() => setSellerFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                    sellerFilter === 'all'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm scale-[1.02]'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  Tous
                </button>
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSellerFilter(member.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                      sellerFilter === member.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm scale-[1.02]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium text-slate-900 mb-2">Aucun article trouvé</p>
          <p className="text-sm text-slate-500">Commencez par créer votre premier article</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden" onClick={() => navigate(`/articles/${article.id}/preview`)}>
                {article.photos && article.photos.length > 0 ? (
                  <img
                    src={article.photos[0]}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusModal({ isOpen: true, article });
                    }}
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-medium transition-all hover:shadow-md active:scale-95 ${STATUS_COLORS[article.status]}`}
                  >
                    {STATUS_LABELS[article.status]}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArticleFormDrawer({ isOpen: true, articleId: article.id });
                      }}
                      className="p-2 bg-white rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600 hover:text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ isOpen: true, articleId: article.id });
                      }}
                      className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4" onClick={() => navigate(`/articles/${article.id}/preview`)}>
                <h3 className="text-base font-semibold text-slate-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-500 mb-2">
                  {article.brand || 'Unknown'} • {article.size || 'M'}
                </p>
                <div className="flex items-center text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formatDate(article.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, articleId: null })}
        onConfirm={handleDelete}
        title="Supprimer l'article"
        message="Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />

      <ArticleStatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, article: null })}
        article={statusModal.article}
        onStatusChange={handleStatusChange}
        onOpenSoldModal={() => {
          if (statusModal.article) {
            setSoldModal({ isOpen: true, article: statusModal.article });
          }
        }}
      />

      {soldModal.article && (
        <ArticleSoldModal
          isOpen={soldModal.isOpen}
          onClose={() => setSoldModal({ isOpen: false, article: null })}
          onConfirm={handleMarkAsSold}
          article={soldModal.article}
        />
      )}

      <ArticleFormDrawer
        isOpen={articleFormDrawer.isOpen}
        onClose={() => setArticleFormDrawer({ isOpen: false, articleId: undefined })}
        articleId={articleFormDrawer.articleId}
        onSaved={fetchArticles}
      />
    </div>
  );
}
