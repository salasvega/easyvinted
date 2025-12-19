import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Edit,
  Send,
  Package,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar,
  DollarSign,
  Trash2,
  X,
  Tag,
  FileText,
  CheckCircle2,
  Clock,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  CloudSun,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article, ArticleStatus, Season } from '../types/article';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PublishInstructionsModal } from '../components/PublishInstructionsModal';
import { ScheduleModal } from '../components/ScheduleModal';
import { LazyImage } from '../components/ui/LazyImage';
import { ArticleSoldModal } from '../components/ArticleSoldModal';
import { SaleDetailModal } from '../components/SaleDetailModal';
import { LabelModal } from '../components/LabelModal';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Brouillon',
  ready: 'Pret',
  scheduled: 'Planifie',
  published: 'Publie',
  sold: 'Vendu',
};

const STATUS_COLORS: Record<ArticleStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  ready: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  scheduled: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  published: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  sold: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const SEASON_LABELS: Record<Season, string> = {
  spring: 'Printemps',
  summer: 'Ete',
  autumn: 'Automne',
  winter: 'Hiver',
  'all-seasons': 'Toutes saisons',
  undefined: 'Non defini',
};

const CONDITION_LABELS: Record<string, string> = {
  new_with_tag: 'Neuf avec etiquette',
  new_without_tag: 'Neuf sans etiquette',
  new_with_tags: 'Neuf avec etiquette',
  new_without_tags: 'Neuf sans etiquette',
  very_good: 'Tres bon etat',
  good: 'Bon etat',
  satisfactory: 'Satisfaisant',
};

const renderStatusIcon = (status: ArticleStatus) => {
  const iconClass = 'w-4 h-4';
  switch (status) {
    case 'draft': return <FileText className={iconClass} />;
    case 'ready': return <CheckCircle2 className={iconClass} />;
    case 'scheduled': return <Clock className={iconClass} />;
    case 'published': return <Send className={iconClass} />;
    case 'sold': return <DollarSign className={iconClass} />;
    default: return null;
  }
};

const renderSeasonIcon = (season?: Season) => {
  const iconClass = 'w-4 h-4';
  switch (season) {
    case 'spring': return <Flower2 className={`${iconClass} text-pink-500`} />;
    case 'summer': return <Sun className={`${iconClass} text-orange-500`} />;
    case 'autumn': return <Leaf className={`${iconClass} text-amber-600`} />;
    case 'winter': return <Snowflake className={`${iconClass} text-blue-500`} />;
    case 'all-seasons': return <CloudSun className={`${iconClass} text-slate-500`} />;
    default: return <CloudSun className={`${iconClass} text-slate-300`} />;
  }
};

export function PreviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [publishInstructionsModal, setPublishInstructionsModal] = useState<{
    isOpen: boolean;
    articleId: string;
  }>({ isOpen: false, articleId: '' });

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [saleDetailModalOpen, setSaleDetailModalOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  async function fetchArticle() {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select(
          `
          *,
          family_members!articles_seller_id_fkey(name)
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setArticle({
          ...data,
          price: parseFloat(data.price),
        });

        if (data.family_members) {
          setSellerName(data.family_members.name);
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: "Erreur lors du chargement de l'article",
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateAndSend() {
    if (!id) return;

    try {
      setPublishing(true);
      setPublishInstructionsModal({
        isOpen: true,
        articleId: id,
      });
    } catch (error) {
      console.error('Error preparing article:', error);
      setToast({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : "Erreur lors de la preparation de l'article",
      });
    } finally {
      setPublishing(false);
    }
  }

  async function handleMarkAsReady() {
    if (!id) return;

    try {
      setMarkingReady(true);

      const { error } = await supabase
        .from('articles')
        .update({ status: 'ready' })
        .eq('id', id);

      if (error) throw error;

      setToast({
        type: 'success',
        text: 'Article marque comme pret pour Vinted',
      });

      await fetchArticle();
    } catch (error) {
      console.error('Error marking article as ready:', error);
      setToast({
        type: 'error',
        text: 'Erreur lors de la mise a jour du statut',
      });
    } finally {
      setMarkingReady(false);
    }
  }

  function handleOpenSoldModal() {
    setSoldModalOpen(true);
  }

  async function handleDelete() {
    if (!id || !article || !user) return;

    try {
      if (article.photos && article.photos.length > 0) {
        const filePaths = article.photos
          .map((photoUrl: string) => {
            const urlParts = photoUrl.split('/article-photos/');
            return urlParts.length === 2 ? urlParts[1] : null;
          })
          .filter((path: string | null): path is string => path !== null);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('article-photos')
            .remove(filePaths);

          if (storageError) {
            console.error('Error deleting photos from storage:', storageError);
          }
        }
      }

      try {
        const folderPath = `${user.id}/${id}`;
        const { data: folderContents } = await supabase.storage
          .from('article-photos')
          .list(folderPath);

        if (folderContents && folderContents.length > 0) {
          const filesToDelete = folderContents.map(
            (file) => `${folderPath}/${file.name}`
          );
          await supabase.storage.from('article-photos').remove(filesToDelete);
        }
      } catch (folderError) {
        console.log('No folder to clean up or error cleaning folder:', folderError);
      }

      const { error } = await supabase.from('articles').delete().eq('id', id);

      if (error) throw error;

      setToast({
        type: 'success',
        text: 'Article supprime avec succes',
      });

      setDeleteModalOpen(false);
      setTimeout(() => {
        navigate('/stock');
      }, 1000);
    } catch (error) {
      console.error('Error deleting article:', error);
      setToast({
        type: 'error',
        text: "Erreur lors de la suppression de l'article",
      });
    }
  }

  async function handleMarkAsSold(saleData: {
    soldPrice: number;
    soldAt: string;
    platform: string;
    fees: number;
    shippingCost: number;
    buyerName: string;
    notes: string;
    sellerId?: string;
  }) {
    if (!id || !article) return;

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
        .eq('id', id);

      if (error) throw error;

      setToast({
        type: 'success',
        text: 'Article marque comme vendu',
      });

      setSoldModalOpen(false);
      await fetchArticle();
    } catch (error) {
      console.error('Error marking article as sold:', error);
      setToast({
        type: 'error',
        text: 'Erreur lors de la mise a jour du statut',
      });
    }
  }

  const handlePreviousPhoto = () => {
    if (!article?.photos) return;
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? article.photos.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    if (!article?.photos) return;
    setCurrentPhotoIndex((prev) =>
      prev === article.photos.length - 1 ? 0 : prev + 1
    );
  };

  const getStatusMessage = () => {
    if (!article) return '';
    switch (article.status) {
      case 'draft':
        return "Cette annonce est en cours de préparation. Complétez toutes les infos requises avant de l'envoyer.";
      case 'ready':
        return 'Tous les champs requis sont remplis. Vous pouvez maintenant envoyer cette annonce.';
      case 'published':
        return 'Cette annonce est actuellement en ligne.';
      case 'sold':
        return 'Cet article a ete vendu avec succes.';
      case 'scheduled':
        return 'Cette annonce est planifiee pour une publication ulterieure.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Article non trouve</h2>
          <p className="text-sm text-slate-500">
            Impossible de charger cette annonce. Elle a peut-etre ete supprimée.
          </p>
        </div>
      </div>
    );
  }

  const statusColors = STATUS_COLORS[article.status];

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      <PublishInstructionsModal
        isOpen={publishInstructionsModal.isOpen}
        onClose={() => setPublishInstructionsModal({ isOpen: false, articleId: '' })}
        articleId={publishInstructionsModal.articleId}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        article={article}
        onScheduled={() => {
          setToast({
            type: 'success',
            text: 'Article programme avec succes',
          });
          fetchArticle();
        }}
      />

      <ArticleSoldModal
        isOpen={soldModalOpen}
        onClose={() => setSoldModalOpen(false)}
        onConfirm={handleMarkAsSold}
        article={article}
      />

      {saleDetailModalOpen && article.status === 'sold' && (
        <SaleDetailModal
          sale={{
            id: article.id,
            title: article.title,
            brand: article.brand || '',
            price: article.price || 0,
            sold_price: article.sold_price || article.price || 0,
            sold_at: article.sold_at || new Date().toISOString(),
            platform: article.platform || 'Vinted',
            shipping_cost: article.shipping_cost || 0,
            fees: article.fees || 0,
            net_profit: article.net_profit || 0,
            photos: article.photos || [],
            buyer_name: article.buyer_name,
            sale_notes: article.sale_notes,
            seller_name: sellerName || undefined,
          }}
          onClose={() => setSaleDetailModalOpen(false)}
        />
      )}

      {article.reference_number && (
        <LabelModal
          isOpen={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
          article={{
            reference_number: article.reference_number,
            title: article.title,
            brand: article.brand,
            size: article.size,
            color: article.color,
            price: article.price,
          }}
          sellerName={sellerName || undefined}
        />
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'article"
        message="Etes-vous sur de vouloir supprimer cet article ? Cette action est irreversible."
        confirmLabel="Supprimer"
        variant="danger"
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Photos */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden aspect-square relative">
              {article.photos && article.photos.length > 0 ? (
                <>
                  <LazyImage
                    src={article.photos[currentPhotoIndex]}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Package className="w-16 h-16 text-slate-300" />
                      </div>
                    }
                  />
                  {article.photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5 text-slate-900" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-900" />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                        {currentPhotoIndex + 1} / {article.photos.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                  <Package className="w-16 h-16 text-slate-300 mb-4" />
                  <span className="text-slate-400 font-medium">Aucune photo</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {article.photos && article.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 bg-white rounded-2xl border border-slate-200">
                {article.photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                      currentPhotoIndex === index
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setCurrentPhotoIndex(index)}
                  >
                    <LazyImage
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-lg bg-blue-100 text-blue-700">
                    Article
                  </span>
                  <h2 className="font-semibold text-slate-900">Details</h2>
                </div>
                <button
                  onClick={() => navigate('/dashboard-v2')}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* 1. Title + Brand + Reference */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{article.title}</h3>
                <p className="text-sm font-medium text-slate-600">{article.brand || 'Sans marque'}</p>
                {article.reference_number && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 font-mono">Ref. #{article.reference_number}</span>
                  </div>
                )}
              </div>

              {/* 2. Description */}
              {article.description && (
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Description</h4>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {article.description}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Article Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {article.size && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Taille</p>
                    <p className="text-sm font-medium text-slate-900">{article.size}</p>
                  </div>
                )}
                {article.brand && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Marque</p>
                    <p className="text-sm font-medium text-slate-900">{article.brand}</p>
                  </div>
                )}
                {article.color && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Couleur</p>
                    <p className="text-sm font-medium text-slate-900">{article.color}</p>
                  </div>
                )}
                {article.material && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Matiere</p>
                    <p className="text-sm font-medium text-slate-900">{article.material}</p>
                  </div>
                )}
                {article.condition && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Etat</p>
                    <p className="text-sm font-medium text-slate-900">{CONDITION_LABELS[article.condition] || article.condition}</p>
                  </div>
                )}
                {article.season && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Saison</p>
                    <div className="flex items-center gap-2">
                      {renderSeasonIcon(article.season)}
                      <span className="text-sm font-medium text-slate-900">{SEASON_LABELS[article.season]}</span>
                    </div>
                  </div>
)}
       {article.suggested_period && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Periode conseillee</p>
                    <p className="text-sm font-medium text-slate-900">{article.suggested_period}</p>
                  </div>
                )}
                
                {article.main_category && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Categorie</p>
                    <p className="text-sm font-medium text-slate-900">
                      {article.main_category}
                      {article.subcategory && ` > ${article.subcategory}`}
                      {article.item_category && ` > ${article.item_category}`}
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Price, Seller, Suggested Period Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Prix</p>
                  <p className="text-lg font-bold text-emerald-600">{article.price.toFixed(2)} €</p>
                </div>
                {sellerName && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Vendeur</p>
                    <p className="text-sm font-medium text-slate-900">{sellerName}</p>
                  </div>
                )}
               
              </div>

              {/* 5. Sale Details (if sold) */}
              {article.status === 'sold' && (article.fees !== undefined || article.shipping_cost !== undefined || article.buyer_name) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-3">Details de la vente</h4>
                  <div className="space-y-2">
                    {article.buyer_name && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-emerald-700">Acheteur</span>
                        <span className="text-sm font-medium text-emerald-900">{article.buyer_name}</span>
                      </div>
                    )}
                    {article.fees !== undefined && (
                      <div className="flex items-center justify-between py-1.5 border-t border-emerald-200">
                        <span className="text-sm text-emerald-700">Frais</span>
                        <span className="text-sm font-medium text-emerald-900">{article.fees.toFixed(2)} €</span>
                      </div>
                    )}
                    {article.shipping_cost !== undefined && (
                      <div className="flex items-center justify-between py-1.5 border-t border-emerald-200">
                        <span className="text-sm text-emerald-700">Frais de port</span>
                        <span className="text-sm font-medium text-emerald-900">{article.shipping_cost.toFixed(2)} €</span>
                      </div>
                    )}
                    {article.net_profit !== undefined && (
                      <div className="flex items-center justify-between py-1.5 border-t border-emerald-200">
                        <span className="text-sm text-emerald-700 font-semibold">Profit net</span>
                        <span className={`text-sm font-bold ${article.net_profit >= 0 ? 'text-emerald-900' : 'text-rose-600'}`}>
                          {article.net_profit >= 0 ? '+' : ''}{article.net_profit.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    {article.sale_notes && (
                      <div className="pt-2 border-t border-emerald-200">
                        <p className="text-xs text-emerald-700 mb-1 font-semibold">Notes</p>
                        <p className="text-sm text-emerald-900">{article.sale_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Vinted URL */}
              {article.vinted_url && (
                <a
                  href={article.vinted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl hover:from-teal-100 hover:to-cyan-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-teal-900">Voir sur Vinted</p>
                      <p className="text-xs text-teal-600">Ouvrir l&apos;annonce</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-teal-500 group-hover:translate-x-1 transition-transform" />
                </a>
              )}

              {/* 7. Status Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${statusColors.bg} ${statusColors.text} ${statusColors.border} text-sm font-semibold`}
                  >
                    {renderStatusIcon(article.status)}
                    <span>{STATUS_LABELS[article.status]}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{getStatusMessage()}</p>
              </div>

              {/* 8. Package Label */}
              {article.reference_number && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Etiquette de colis
                    </h3>
                    <button
                      onClick={() => setLabelModalOpen(true)}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Generer l&apos;etiquette
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>

            <button
              onClick={() => navigate(`/articles/${id}/edit-v2`)}
              className="px-6 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>

            {article.status === 'draft' && (
              <button
                onClick={handleMarkAsReady}
                disabled={markingReady}
                className="px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {markingReady ? 'Enregistrement...' : 'Pret pour Vinted'}
              </button>
            )}

            {article.status === 'ready' && (
              <button
                onClick={() => navigate(`/articles/${article.id}/structure`)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Envoyer a Vinted
              </button>
            )}

            {(article.status === 'published' || article.status === 'scheduled') && (
              <>
                <button
                  onClick={() => setScheduleModalOpen(true)}
                  className="px-6 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Programmer
                </button>
                <button
                  onClick={handleOpenSoldModal}
                  className="px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Marquer vendu
                </button>
              </>
            )}

            {article.status === 'sold' && (
              <button
                onClick={() => setSaleDetailModalOpen(true)}
                className="px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Voir la vente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
