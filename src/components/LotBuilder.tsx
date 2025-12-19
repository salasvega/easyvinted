import { useEffect, useMemo, useState, DragEvent } from 'react';
import {
  X,
  Check,
  Package,
  AlertCircle,
  Search,
  Layers,
  Tag,
  Image as ImageIcon,
  Trash2,
  TrendingDown,
  Filter,
  Grid3x3,
  Sparkles,
  Euro,
  FileText,
  Calendar,
  Info,
  ChevronRight,
  Hash,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article, Season } from '../types/article';
import { LotStatus } from '../types/lot';
import { useUserProfile } from '../hooks/useUserProfile';
import { generateLotTitleAndDescription } from '../lib/lotAnalysisService';

import { Card, Pill, IconButton } from './ui/UiKit';
import { ShippingSimulator } from './tools/ShippingSimulator';
import { Toast } from './ui/Toast';
import { ConfirmModal } from './ui/ConfirmModal';
import { LabelModal } from './LabelModal';

interface LotBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingLotId?: string;
}

interface LotData {
  name: string;
  description: string;
  category_id?: number;
  season?: Season;
  selectedArticles: string[];
  price: number;
  cover_photo?: string;
  photos: string[];
  status: LotStatus;
  seller_id?: string | null;
  scheduled_for?: string | null;
  reference_number?: string | null;
  seo_keywords?: string[];
  hashtags?: string[];
  search_terms?: string[];
  ai_confidence_score?: number | null;
}

type MobileTab = 'builder' | 'library';

export default function LotBuilder({ isOpen, onClose, onSuccess, existingLotId }: LotBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [error, setError] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [articlesInLots, setArticlesInLots] = useState<Set<string>>(new Set());

  const [draggedArticleId, setDraggedArticleId] = useState<string | null>(null);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

  const [lotData, setLotData] = useState<LotData>({
    name: '',
    description: '',
    selectedArticles: [],
    price: 0,
    photos: [],
    status: 'draft',
    seller_id: null,
    scheduled_for: null,
    seo_keywords: [],
    hashtags: [],
    search_terms: [],
  });

  const [filters, setFilters] = useState({
    search: '',
    season: 'all',
    brand: 'all',
    size: 'all',
  });

  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);

  const [mobileTab, setMobileTab] = useState<MobileTab>('library');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [showShippingSimulator, setShowShippingSimulator] = useState(false);

  // ========= Schedule modal (comme en mode Détail) =========
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState<string>(''); // datetime-local string
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // ========= Auth cache (évite /auth/v1/user en boucle) =========
  const [userId, setUserId] = useState<string | null>(null);

  const { data: userProfile } = useUserProfile(userId || undefined);

  const getUserId = async () => {
    if (userId) return userId;
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getUser:', error);
      return null;
    }
    const id = data?.user?.id ?? null;
    if (id) setUserId(id);
    return id;
  };

  // ========= Helpers =========
  const selectedArticlesList = useMemo(
    () => articles.filter((a) => lotData.selectedArticles.includes(a.id)),
    [articles, lotData.selectedArticles]
  );

  const totalPrice = useMemo(() => {
    return selectedArticlesList.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  }, [selectedArticlesList]);

  const discount = useMemo(() => {
    if (!totalPrice || totalPrice <= 0 || !lotData.price) return 0;
    return Math.max(0, Math.round(((totalPrice - lotData.price) / totalPrice) * 100));
  }, [totalPrice, lotData.price]);

  const isLotValid = useMemo(() => {
    return lotData.name.trim().length > 0 && lotData.selectedArticles.length >= 2 && lotData.price > 0;
  }, [lotData.name, lotData.selectedArticles.length, lotData.price]);

  const allPhotos = lotData.photos || [];

  const availableBrands = useMemo(() => {
    const s = new Set<string>();
    for (const a of articles) if (a.brand) s.add(a.brand);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const availableSizes = useMemo(() => {
    const s = new Set<string>();
    for (const a of articles) if (a.size) s.add(a.size);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const sellerName = useMemo(() => {
    if (!lotData.seller_id) return undefined;
    const member = familyMembers.find(m => m.id === lotData.seller_id);
    return member?.name;
  }, [lotData.seller_id, familyMembers]);

  // ========= Scheduling helpers =========
  const pad2 = (n: number) => String(n).padStart(2, '0');

  // ISO -> "YYYY-MM-DDTHH:mm" (pour input datetime-local)
  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  // "YYYY-MM-DDTHH:mm" -> ISO string
  const localInputToIso = (localValue: string) => {
    if (!localValue) return null;
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const formatLocalDisplay = (localValue: string) => {
    if (!localValue) return '';
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const formatDateOnly = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // ========= Lifecycle =========
  useEffect(() => {
    if (!isOpen) return;

    setMobileTab('library');
    setError('');

    (async () => {
      const uid = await getUserId();
      if (!uid) return;

      await Promise.all([fetchArticles(uid), fetchArticlesInLots(uid), fetchFamilyMembers(uid)]);

      if (existingLotId) {
        await loadExistingLot(existingLotId);
      } else {
        resetForm();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingLotId]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, articles]);

  // Synchronise photos à partir des articles sélectionnés
  useEffect(() => {
    if (!isOpen) return;

    if (lotData.selectedArticles.length === 0) {
      setLotData((prev) => ({
        ...prev,
        photos: [],
        cover_photo: undefined,
      }));
      return;
    }

    const newPhotos = selectedArticlesList.flatMap((a) => a.photos || []);
    const uniqueNewPhotos = Array.from(new Set(newPhotos));

    setLotData((prev) => {
      // conserver l’ordre déjà présent, si possible
      const kept = prev.photos.filter((p) => uniqueNewPhotos.includes(p));
      const added = uniqueNewPhotos.filter((p) => !kept.includes(p));
      const merged = [...kept, ...added];

      const cover = prev.cover_photo && merged.includes(prev.cover_photo) ? prev.cover_photo : merged[0];

      return { ...prev, photos: merged, cover_photo: cover };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lotData.selectedArticles, selectedArticlesList]);

  // ========= Data loading =========
  const resetForm = () => {
    setLotData({
      name: '',
      description: '',
      selectedArticles: [],
      price: 0,
      photos: [],
      status: 'draft',
      seller_id: null,
      scheduled_for: null,
      reference_number: null,
      seo_keywords: [],
      hashtags: [],
      search_terms: [],
      ai_confidence_score: null,
    });
    setError('');
  };

  const fetchFamilyMembers = async (uid: string) => {
    const { data, error } = await supabase.from('family_members').select('id, name').eq('user_id', uid).order('name');

    if (error) {
      console.error('Error loading family members:', error);
      return;
    }
    setFamilyMembers(data || []);
  };

  const fetchArticles = async (uid: string) => {
    const { data, error } = await supabase
      .from('articles')
      // ⚠️ select minimal (adapte si tu ajoutes des champs dans la UI)
      .select('id, title, brand, price, photos, size, season, status, created_at')
      .eq('user_id', uid)
      .in('status', ['draft', 'ready', 'scheduled'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      return;
    }

    setArticles(data || []);
    setFilteredArticles(data || []);
  };

  const fetchArticlesInLots = async (uid: string) => {
    let query = supabase
      .from('lot_items')
      .select('article_id, lot_id, lots!inner(status, user_id)')
      .eq('lots.user_id', uid)
      .neq('lots.status', 'sold');

    if (existingLotId) query = query.neq('lot_id', existingLotId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lot items:', error);
      return;
    }

    const ids = new Set((data || []).map((row: any) => row.article_id));
    setArticlesInLots(ids);
  };

  const loadExistingLot = async (lotId: string) => {
    try {
      const { data: lotRow, error: lotError } = await supabase.from('lots').select('*').eq('id', lotId).single();
      if (lotError) throw lotError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('lot_items')
        .select('article_id')
        .eq('lot_id', lotId);

      if (itemsError) throw itemsError;

      const articleIds = (itemsData || []).map((i: any) => i.article_id);

      setLotData({
        name: lotRow.name || '',
        description: lotRow.description || '',
        category_id: lotRow.category_id,
        season: lotRow.season,
        selectedArticles: articleIds,
        price: Number(lotRow.price) || 0,
        cover_photo: lotRow.cover_photo || undefined,
        photos: lotRow.photos || [],
        status: lotRow.status || 'draft',
        seller_id: lotRow.seller_id || null,
        scheduled_for: lotRow.scheduled_for || null,
        reference_number: lotRow.reference_number || null,
        seo_keywords: Array.isArray(lotRow.seo_keywords) ? lotRow.seo_keywords : [],
        hashtags: Array.isArray(lotRow.hashtags) ? lotRow.hashtags : [],
        search_terms: Array.isArray(lotRow.search_terms) ? lotRow.search_terms : [],
        ai_confidence_score: lotRow.ai_confidence_score ?? null,
      });

      // Pré-remplissage de la modale de planification
      setScheduleValue(isoToLocalInput(lotRow.scheduled_for || null));
    } catch (e) {
      console.error('Error loading existing lot:', e);
      setError('Erreur lors du chargement du lot');
    }
  };

  // ========= Filters =========
  const applyFilters = () => {
    let filtered = [...articles];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (a) => (a.title || '').toLowerCase().includes(q) || (a.brand || '').toLowerCase().includes(q)
      );
    }

    if (filters.season !== 'all') {
      filtered = filtered.filter((a) => a.season === (filters.season as any));
    }

    if (filters.brand !== 'all') {
      filtered = filtered.filter((a) => a.brand === filters.brand);
    }

    if (filters.size !== 'all') {
      filtered = filtered.filter((a) => a.size === filters.size);
    }

    setFilteredArticles(filtered);
  };

  // ========= Selection =========
  const toggleArticleSelection = (articleId: string) => {
    setLotData((prev) => {
      const exists = prev.selectedArticles.includes(articleId);
      const next = exists ? prev.selectedArticles.filter((id) => id !== articleId) : [...prev.selectedArticles, articleId];
      return { ...prev, selectedArticles: next };
    });
  };

  const handleDiscountSlider = (discountPercent: number) => {
    const newPrice = Math.round(totalPrice * (1 - discountPercent / 100));
    setLotData((prev) => ({ ...prev, price: newPrice }));
  };

  // ========= Drag & drop articles into preview =========
  const handleDragStart = (e: DragEvent, articleId: string) => {
    setDraggedArticleId(articleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (draggedArticleId && !articlesInLots.has(draggedArticleId)) {
      toggleArticleSelection(draggedArticleId);
    }
    setDraggedArticleId(null);
  };

  // ========= Drag & drop photos reorder =========
  const handlePhotoDragStart = (e: DragEvent, index: number) => {
    setDraggedPhotoIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDrop = (e: DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPhotoIndex === null || draggedPhotoIndex === targetIndex) {
      setDraggedPhotoIndex(null);
      return;
    }

    setLotData((prev) => {
      const newPhotos = [...(prev.photos || [])];
      const [removed] = newPhotos.splice(draggedPhotoIndex, 1);
      newPhotos.splice(targetIndex, 0, removed);

      const cover = prev.cover_photo && newPhotos.includes(prev.cover_photo) ? prev.cover_photo : newPhotos[0];

      return { ...prev, photos: newPhotos, cover_photo: cover };
    });

    setDraggedPhotoIndex(null);
  };

  // ========= Save =========
  const handleGenerateLotText = async () => {
    if (lotData.selectedArticles.length < 2) {
      setToast({ type: 'error', text: "Veuillez sélectionner au moins 2 articles pour générer le titre et la description" });
      return;
    }

    try {
      setGeneratingText(true);

      const result = await generateLotTitleAndDescription(
        selectedArticlesList,
        userProfile?.writing_style || undefined
      );

      const discountedPrice = Math.round(totalPrice * 0.9);

      setLotData((prev) => ({
        ...prev,
        name: result.title || prev.name,
        description: result.description || prev.description,
        price: discountedPrice,
        seo_keywords: result.seo_keywords || [],
        hashtags: result.hashtags || [],
        search_terms: result.search_terms || [],
        ai_confidence_score: result.ai_confidence_score || null,
      }));

      setToast({
        type: 'success',
        text: 'Titre, description, prix et données SEO générés avec succès ! (Remise de 10% appliquée)'
      });

    } catch (error: any) {
      console.error('Error generating lot text:', error);
      setToast({ type: 'error', text: error.message || "Echec de la génération" });
    } finally {
      setGeneratingText(false);
    }
  };

  const generateLotReferenceNumber = async (uid: string, dressingName?: string): Promise<string> => {
    try {
      const { count } = await supabase
        .from('lots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .not('reference_number', 'is', null);

      const finalDressingName = (dressingName || 'MonDressing').replace(/\s+/g, '_');
      const lotNumber = (count || 0) + 1;
      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();

      return `LOT_${finalDressingName}_${lotNumber}_${timestamp}${randomSuffix}`;
    } catch (e) {
      console.error('Error generating lot reference number:', e);
      return `LOT_${Date.now()}`;
    }
  };

  const handleSubmit = async (statusOverride?: LotStatus) => {
    setError('');

    if (!lotData.name?.trim()) {
      setToast({ type: 'error', text: 'Le nom du lot est requis' });
      return;
    }

    if (lotData.selectedArticles.length < 2) {
      setToast({ type: 'error', text: 'Sélectionne au moins 2 articles pour créer un lot' });
      return;
    }

    if (!lotData.price || lotData.price <= 0) {
      setToast({ type: 'error', text: 'Un prix valide (supérieur à 0) est requis' });
      return;
    }

    try {
      setLoading(true);

      const uid = await getUserId();
      if (!uid) throw new Error('Utilisateur non authentifié');

      const original_total_price = totalPrice;
      const discount_percentage =
        original_total_price > 0 ? Math.round(((original_total_price - lotData.price) / original_total_price) * 100) : 0;

      const reference_number = existingLotId ? undefined : await generateLotReferenceNumber(uid, userProfile?.dressing_name);

      const payload: any = {
        user_id: uid,
        name: lotData.name.trim(),
        description: lotData.description?.trim() || null,
        season: lotData.season || null,
        category_id: lotData.category_id || null,
        price: lotData.price,
        original_total_price,
        discount_percentage,
        cover_photo: lotData.cover_photo || lotData.photos?.[0],
        photos: (lotData.photos || []).slice(0, 5),
        status: statusOverride ?? lotData.status,
        seller_id: lotData.seller_id,
        scheduled_for: lotData.scheduled_for ?? null,
        seo_keywords: lotData.seo_keywords || null,
        hashtags: lotData.hashtags || null,
        search_terms: lotData.search_terms || null,
        ai_confidence_score: lotData.ai_confidence_score ?? null,
      };

      console.log('📦 LotBuilder - Données SEO à sauvegarder:', {
        seo_keywords: payload.seo_keywords,
        hashtags: payload.hashtags,
        search_terms: payload.search_terms,
        ai_confidence_score: payload.ai_confidence_score,
      });

      if (reference_number) payload.reference_number = reference_number;

      let lotId: string;

      if (existingLotId) {
        const { error: lotError } = await supabase.from('lots').update(payload).eq('id', existingLotId);
        if (lotError) {
          console.error('❌ Erreur lors de la mise à jour du lot:', lotError);
          throw lotError;
        }
        console.log('✅ Lot mis à jour avec succès');
        lotId = existingLotId;

        const { error: deleteError } = await supabase.from('lot_items').delete().eq('lot_id', existingLotId);
        if (deleteError) throw deleteError;
      } else {
        const { data: inserted, error: lotError } = await supabase.from('lots').insert([payload]).select().single();
        if (lotError) {
          console.error('❌ Erreur lors de l\'insertion du lot:', lotError);
          throw lotError;
        }
        console.log('✅ Lot créé avec succès');
        lotId = inserted.id;
      }

      const lotItems = lotData.selectedArticles.map((articleId) => ({ lot_id: lotId, article_id: articleId }));
      const { error: itemsError } = await supabase.from('lot_items').insert(lotItems);
      if (itemsError) throw itemsError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving lot:', err);
      setError(err?.message || `Erreur lors de ${existingLotId ? 'la modification' : 'la création'} du lot`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: LotStatus) => {
    if (!existingLotId) {
      setToast({ type: 'error', text: 'Enregistre le lot une première fois avant de changer son statut' });
      return;
    }
    await handleSubmit(nextStatus);
    setLotData((p) => ({ ...p, status: nextStatus }));
  };

  // ========= Planification (identique au bouton "Planifier" en mode Détail) =========
  const openScheduleModal = () => {
    if (!existingLotId) {
      setToast({ type: 'error', text: 'Enregistre le lot une première fois avant de le planifier' });
      return;
    }
    if (lotData.status === ('sold' as LotStatus) || lotData.status === ('draft' as LotStatus)) {
      setToast({ type: 'error', text: 'Impossible de planifier un lot vendu ou en brouillon' });
      return;
    }

    const preset =
      isoToLocalInput(lotData.scheduled_for) ||
      isoToLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    setScheduleValue(preset);
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => setScheduleModalOpen(false);

  const confirmSchedule = async () => {
    if (!existingLotId) return;
    const iso = localInputToIso(scheduleValue);
    if (!iso) {
      setToast({ type: 'error', text: 'Choisis une date et une heure de publication' });
      return;
    }

    try {
      setScheduleSaving(true);

      const uid = await getUserId();
      if (!uid) throw new Error('Utilisateur non authentifié');

      const { error: updErr } = await supabase
        .from('lots')
        .update({
          status: 'scheduled',
          scheduled_for: iso,
        })
        .eq('id', existingLotId)
        .eq('user_id', uid);

      if (updErr) throw updErr;

      setLotData((p) => ({ ...p, status: 'scheduled' as LotStatus, scheduled_for: iso }));
      setToast({ type: 'success', text: `Publication programmée : ${formatLocalDisplay(scheduleValue)}` });
      setScheduleModalOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error scheduling lot:', err);
      setToast({ type: 'error', text: err?.message || 'Erreur lors de la planification' });
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeleteLot = async () => {
    if (!existingLotId) return;
    try {
      setLoading(true);
      const uid = await getUserId();
      if (!uid) throw new Error('Utilisateur non authentifié');

      const { error: itemsError } = await supabase.from('lot_items').delete().eq('lot_id', existingLotId);
      if (itemsError) throw itemsError;

      const { error: lotError } = await supabase.from('lots').delete().eq('id', existingLotId).eq('user_id', uid);
      if (lotError) throw lotError;

      setToast({ type: 'success', text: 'Lot supprimé' });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting lot:', err);
      setToast({ type: 'error', text: err?.message || 'Erreur lors de la suppression du lot' });
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  // ========= Panels (SCROLL FIXED) =========
  const renderLibraryPanel = () => (
    <div className="h-full min-h-0 flex flex-col bg-white">
      {/* Filters (fixe) */}
      <div className="border-b border-slate-200 bg-slate-50/50 p-3 lg:p-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 text-xs lg:text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <Filter className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            Filtres
          </button>
          <div className="h-3 w-px bg-slate-300" />
          <span className="text-xs lg:text-sm text-slate-600">{filteredArticles.length} article(s)</span>
        </div>

        {showFilters && (
          <div className="space-y-2 lg:space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Rechercher…"
                className="w-full pl-8 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl border border-slate-200 bg-white text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 lg:flex lg:flex-wrap lg:gap-2">
              <select
                value={filters.season}
                onChange={(e) => setFilters((p) => ({ ...p, season: e.target.value }))}
                className="px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-slate-200 bg-white text-xs lg:text-sm"
              >
                <option value="all">Saisons</option>
                <option value="spring">Printemps</option>
                <option value="summer">Été</option>
                <option value="autumn">Automne</option>
                <option value="winter">Hiver</option>
              </select>

              <select
                value={filters.brand}
                onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}
                className="px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-slate-200 bg-white text-xs lg:text-sm"
              >
                <option value="all">Marques</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={filters.size}
                onChange={(e) => setFilters((p) => ({ ...p, size: e.target.value }))}
                className="px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-slate-200 bg-white text-xs lg:text-sm"
              >
                <option value="all">Tailles</option>
                {availableSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* List (scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 lg:p-4">
        <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 lg:gap-3">
          {filteredArticles.map((a) => {
            const isSelected = lotData.selectedArticles.includes(a.id);
            const isLocked = articlesInLots.has(a.id);

            return (
              <button
                key={a.id}
                onClick={() => {
                  if (isLocked) return;
                  toggleArticleSelection(a.id);
                }}
                draggable={!isLocked}
                onDragStart={(e) => {
                  if (isLocked) return;
                  handleDragStart(e, a.id);
                }}
                className={[
                  'group text-left rounded-xl lg:rounded-2xl border overflow-hidden transition-all',
                  isLocked
                    ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                    : isSelected
                    ? 'border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
                ].join(' ')}
              >
                <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                  {a.photos?.[0] ? (
                    <img src={a.photos[0]} alt={a.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <Package className="w-4 h-4 lg:w-6 lg:h-6 text-slate-300" />
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 lg:w-6 lg:h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-1.5 lg:p-3">
                  <p className="text-[10px] lg:text-sm font-semibold text-slate-900 truncate leading-tight">{a.title}</p>
                  <p className="text-[9px] lg:text-xs text-slate-500 truncate mt-0.5 lg:mt-0">
                    {a.brand || 'Sans marque'}
                  </p>
                  <div className="mt-1 lg:mt-2 flex items-center justify-between">
                    <div className="text-xs lg:text-sm font-bold text-emerald-600">{(Number(a.price) || 0).toFixed(0)}€</div>
                    {isLocked && (
                      <span className="text-[8px] lg:text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">En lot</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-8 lg:py-16">
            <div className="mx-auto w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-100 flex items-center justify-center">
              <Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
            </div>
            <p className="mt-2 lg:mt-3 text-xs lg:text-sm font-semibold text-slate-700">Aucun article trouvé</p>
            <p className="text-xs lg:text-sm text-slate-500">Ajuste tes filtres</p>
          </div>
        )}

        {lotData.selectedArticles.length >= 2 && (
          <div className="sticky bottom-0 left-0 right-0 mt-2 p-2 bg-gradient-to-t from-white via-white to-transparent lg:hidden">
            <button
              onClick={() => setMobileTab('builder')}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              Aperçu ({lotData.selectedArticles.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderBuilderPanel = () => (
    <div className="h-full min-h-0 flex flex-col bg-white">
      {/* Scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 1) Message d’erreur */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-rose-700">Erreur</p>
                <p className="text-sm text-rose-700/90 break-words">{error}</p>
              </div>
            </div>
          )}

          {/* 2) Aperçu du lot */}
          <Card>
           

            {/* Image principale (drop d’articles) */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative rounded-2xl overflow-hidden border border-dashed border-slate-200 bg-slate-50/60"
            >
              <div className="aspect-[4/3] flex items-center justify-center overflow-hidden">
                {lotData.cover_photo ? (
                  <img
                    src={lotData.cover_photo}
                    alt="Cover lot"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Sélectionne ou Glisse des articles ici</p>
                    <p className="text-sm text-slate-500">La photo principale se générera automatiquement.</p>
                  </div>
                )}
              </div>

              <div className="absolute left-3 top-3">
                <Pill variant="success" className="shadow-sm">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Photo principale
                </Pill>
              </div>

              {lotData.selectedArticles.length > 0 && (
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <Pill variant="ghost" className="shadow-sm bg-white/90">
                    <Layers className="w-3.5 h-3.5" />
                    {lotData.selectedArticles.length} article(s)
                  </Pill>
                  <Pill variant="ghost" className="shadow-sm bg-white/90">
                    <Tag className="w-3.5 h-3.5" />
                    {lotData.price.toFixed(0)}€
                  </Pill>
                </div>
              )}
            </div>

            {/* Galerie photos + drag & drop */}
            {allPhotos.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-700">Galerie (drag & drop)</p>
                  <p className="text-xs text-slate-500">{allPhotos.length}/5</p>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {allPhotos.slice(0, 5).map((p, idx) => {
                    const isCover = p === lotData.cover_photo;
                    return (
                      <div
                        key={`${p}-${idx}`}
                        draggable
                        onDragStart={(e) => handlePhotoDragStart(e, idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => handlePhotoDrop(e, idx)}
                        className={[
                          'relative aspect-square rounded-xl overflow-hidden border cursor-move',
                          isCover ? 'border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]' : 'border-slate-200',
                        ].join(' ')}
                        title={isCover ? 'Photo principale' : 'Déposer pour réordonner / cliquer pour définir en cover'}
                      >
                        <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        <button
                          onClick={() => setLotData((prev) => ({ ...prev, cover_photo: p }))}
                          className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"
                          aria-label="Définir en photo principale"
                        />
                        {isCover && (
                          <div className="absolute left-1.5 top-1.5">
                            <Pill variant="success" className="px-2 py-1 text-[10px]">
                              Cover
                            </Pill>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* 3) Articles sélectionnés */}
          <Card>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Articles sélectionnés *</h3>
              </div>

              {lotData.selectedArticles.length > 0 && (
                <button
                  onClick={() => setLotData((prev) => ({ ...prev, selectedArticles: [] }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Tout retirer
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-3">Minimum 2 articles requis</p>

            {lotData.selectedArticles.length === 0 ? (
              <div className="text-sm text-slate-500">Aucun article sélectionné pour l'instant.</div>
            ) : (
              <div className="space-y-2">
                {selectedArticlesList.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 bg-white">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {a.photos?.[0] ? (
                        <img src={a.photos[0]} alt={a.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                      <p className="text-xs text-slate-500 truncate">{(a.brand || 'Sans marque') + (a.size ? ` • ${a.size}` : '')}</p>
                    </div>
                    <div className="text-sm font-bold text-emerald-600">{(Number(a.price) || 0).toFixed(0)}€</div>
                    <button
                      onClick={() => toggleArticleSelection(a.id)}
                      className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                      title="Retirer"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 4) Style rédactionnel */}
          {familyMembers.length > 0 && lotData.selectedArticles.length >= 2 && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-semibold text-purple-900">Sélectionner un vendeur</h3>
              </div>
              <p className="text-xs text-purple-600 mb-3">
                Les informations du lot seront rédigées selon le style du vendeur sélectionné
              </p>
              <select
                value={lotData.seller_id || 'all'}
                onChange={(e) => setLotData((p) => ({ ...p, seller_id: e.target.value === 'all' ? null : e.target.value }))}
                className="w-full text-sm font-medium text-slate-900 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 px-3 py-2"
              >
                <option value="all">Sélectionner un vendeur</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {lotData.seller_id && (
                <button
                  type="button"
                  onClick={handleGenerateLotText}
                  disabled={generatingText}
                  className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingText ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Analyser le Lot
                    </>
                  )}
                </button>
              )}
            </Card>
          )}

          {/* 6) Formulaire du lot */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Informations du lot</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Nom *</label>
                <input
                  value={lotData.name}
                  onChange={(e) => setLotData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Lot hiver garçon 8 ans"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  value={lotData.description}
                  onChange={(e) => {
                    setLotData((p) => ({ ...p, description: e.target.value }));
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                  placeholder="Décris ton lot (état, marques, infos utiles.)"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none overflow-hidden"
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Saison</label>
                <select
                  value={lotData.season || ''}
                  onChange={(e) => setLotData((p) => ({ ...p, season: (e.target.value as any) || undefined }))}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  <option value="">—</option>
                  <option value="spring">Printemps</option>
                  <option value="summer">Été</option>
                  <option value="autumn">Automne</option>
                  <option value="winter">Hiver</option>
                </select>
              </div>
            </div>
          </Card>

          {/* SEO & Marketing Section */}
          <div>
            <button
              type="button"
              onClick={() => setSeoExpanded(!seoExpanded)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl hover:from-teal-100 hover:to-emerald-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-600 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-teal-900">SEO & Marketing</h4>
                {lotData.ai_confidence_score && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-teal-600 text-white rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {lotData.ai_confidence_score}%
                  </span>
                )}
              </div>
              <ChevronRight className={`w-5 h-5 text-teal-700 transition-transform ${seoExpanded ? 'rotate-90' : ''}`} />
            </button>

            {seoExpanded && (
              <Card className="mt-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium mb-1.5">
                    <Search className="w-3 h-3" />
                    Mots-clés SEO
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {lotData.seo_keywords && lotData.seo_keywords.map((keyword, idx) => (
                      <div key={idx} className="group flex items-center gap-1 px-2 py-1 bg-white/70 border border-teal-200 text-teal-800 text-xs rounded-lg hover:border-teal-400 transition-colors">
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setLotData(prev => ({
                              ...prev,
                              seo_keywords: (prev.seo_keywords || []).filter((_, i) => i !== idx)
                            }));
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Ajouter un mot-clé (Entrée pour valider)"
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        console.log('🔑 Ajout mot-clé:', value);
                        console.log('📋 Keywords actuels:', lotData.seo_keywords);
                        const currentKeywords = lotData.seo_keywords || [];
                        if (value && !currentKeywords.includes(value)) {
                          const newKeywords = [...currentKeywords, value];
                          console.log('✅ Nouveaux keywords:', newKeywords);
                          setLotData(prev => {
                            console.log('📦 State précédent:', prev.seo_keywords);
                            const updated = { ...prev, seo_keywords: newKeywords };
                            console.log('📦 State après update:', updated.seo_keywords);
                            return updated;
                          });
                          e.currentTarget.value = '';
                        } else {
                          console.log('⚠️ Valeur vide ou déjà présente');
                        }
                      }
                    }}
                  />
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium mb-1.5">
                    <Hash className="w-3 h-3" />
                    Hashtags tendance
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {lotData.hashtags && lotData.hashtags.map((tag, idx) => (
                      <div key={idx} className="group flex items-center gap-1 px-2 py-1 bg-teal-600/10 text-teal-700 text-xs rounded-lg font-medium hover:bg-teal-600/20 transition-colors">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setLotData(prev => ({
                              ...prev,
                              hashtags: (prev.hashtags || []).filter((_, i) => i !== idx)
                            }));
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Ajouter un hashtag (Entrée pour valider)"
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        let value = e.currentTarget.value.trim();
                        console.log('🏷️ Ajout hashtag:', value);
                        if (value) {
                          if (!value.startsWith('#')) value = '#' + value;
                          const currentHashtags = lotData.hashtags || [];
                          console.log('📋 Hashtags actuels:', currentHashtags);
                          if (!currentHashtags.includes(value)) {
                            const newHashtags = [...currentHashtags, value];
                            console.log('✅ Nouveaux hashtags:', newHashtags);
                            setLotData(prev => ({ ...prev, hashtags: newHashtags }));
                            e.currentTarget.value = '';
                          } else {
                            console.log('⚠️ Hashtag déjà présent');
                          }
                        } else {
                          console.log('⚠️ Valeur vide');
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium mb-1.5">
                    <Zap className="w-3 h-3" />
                    Termes de recherche
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {lotData.search_terms && lotData.search_terms.map((term, idx) => (
                      <div key={idx} className="group flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-lg hover:bg-emerald-200 transition-colors">
                        <span>"{term}"</span>
                        <button
                          type="button"
                          onClick={() => {
                            setLotData(prev => ({
                              ...prev,
                              search_terms: (prev.search_terms || []).filter((_, i) => i !== idx)
                            }));
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Ajouter un terme (Entrée pour valider)"
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        console.log('🔍 Ajout terme de recherche:', value);
                        const currentTerms = lotData.search_terms || [];
                        console.log('📋 Termes actuels:', currentTerms);
                        if (value && !currentTerms.includes(value)) {
                          const newTerms = [...currentTerms, value];
                          console.log('✅ Nouveaux termes:', newTerms);
                          setLotData(prev => ({ ...prev, search_terms: newTerms }));
                          e.currentTarget.value = '';
                        } else {
                          console.log('⚠️ Valeur vide ou déjà présente');
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            )}
          </div>


          {/* 7) Prix intelligent */}
          {lotData.selectedArticles.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-semibold text-slate-900">Prix intelligent</h3>
                </div>
                {discount > 0 && (
                  <Pill variant="success">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {discount}% de remise
                  </Pill>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Total articles</span>
                  <span className="text-sm font-bold text-slate-900">{totalPrice.toFixed(0)}€</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Slider de remise</label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={discount}
                    onChange={(e) => handleDiscountSlider(parseInt(e.target.value, 10))}
                    className="w-full mt-2 accent-emerald-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                  <span className="text-sm font-medium text-slate-700">Prix du lot *</span>
                  <input
                    type="number"
                    step="1"
                    value={lotData.price || ''}
                    onChange={(e) => setLotData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-24 px-3 py-2 rounded-lg border border-emerald-200 bg-white text-right text-lg font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* 8) Simulation de livraison */}
          {lotData.selectedArticles.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowShippingSimulator(!showShippingSimulator)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors text-sm font-medium text-blue-700"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Info frais de port</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${showShippingSimulator ? 'rotate-90' : ''}`} />
              </button>

              {showShippingSimulator && (
                <div className="mt-3">
                  <ShippingSimulator
                    title={lotData.name || 'Lot'}
                    price={lotData.price || null}
                    mainCategory={(selectedArticlesList[0] as any)?.main_category || ''}
                    subcategory={(selectedArticlesList[0] as any)?.subcategory || ''}
                    itemCategory={(selectedArticlesList[0] as any)?.item_category || ''}
                    lotArticles={selectedArticlesList.map(a => ({
                      id: a.id,
                      title: a.title,
                      main_category: a.main_category,
                      subcategory: a.subcategory,
                      item_category: a.item_category,
                      estimated_weight: a.estimated_weight,
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* 9) Section Statut */}
          {existingLotId && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="mb-2">
                <button
                  onClick={() => {
                    const statusOrder: LotStatus[] = ['draft', 'ready', 'scheduled', 'published', 'sold'];
                    const currentIndex = statusOrder.indexOf(lotData.status);
                    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                    handleUpdateStatus(nextStatus);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    lotData.status === 'draft'
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : lotData.status === 'ready'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : lotData.status === 'scheduled'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : lotData.status === 'published'
                      ? 'bg-violet-100 text-violet-700 border-violet-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  } hover:scale-105 transition-transform text-sm font-semibold`}
                >
                  <span>
                    {lotData.status === 'draft'
                      ? 'Brouillon'
                      : lotData.status === 'ready'
                      ? 'Pret'
                      : lotData.status === 'scheduled'
                      ? 'Planifie'
                      : lotData.status === 'published'
                      ? 'Publie'
                      : 'Vendu'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lotData.status === 'draft'
                  ? "Ce lot est en cours de préparation. Complétez les infos requises avant de l'envoyer."
                  : lotData.status === 'ready'
                  ? 'Tous les champs requis sont remplis. Vous pouvez maintenant planifier ou publier ce lot.'
                  : lotData.status === 'scheduled'
                  ? lotData.scheduled_for
                    ? `La publication de ce lot est planifiée au ${formatDateOnly(lotData.scheduled_for)}`
                    : 'Ce lot est planifié pour une publication ultérieure sur Vinted.'
                  : lotData.status === 'published'
                  ? 'Ce lot est actuellement en ligne sur Vinted.'
                  : 'Ce lot a été vendu avec succès.'}
              </p>
            </div>
          )}

          {/* 10) Section Étiquette de colis */}
          {existingLotId && lotData.reference_number && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Étiquette de colis
                </h3>
                <button
                  onClick={() => setLabelModalOpen(true)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Générer l&apos;étiquette
                </button>
              </div>
            </div>
          )}

          {/* 11) Boutons dans le footer (voir bas de page) */}
        </div>
      </div>
    </div>
  );

  const renderFooterActions = () => {
    const canSave = !loading && isLotValid;
    const canChangeStatus = !!existingLotId && !loading;

    return (
      <div className="shrink-0 p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => handleSubmit()}
            disabled={!canSave}
            className="flex flex-col items-center gap-1 py-2 px-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors min-w-0 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title={existingLotId ? 'Sauvegarder les modifications' : 'Créer le lot'}
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap">{existingLotId ? 'Sauvegarder' : 'Créer'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex flex-col items-center gap-1 py-2 px-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors min-w-0 flex-1"
          >
            <X className="w-4 h-4 flex-shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap">Annuler</span>
          </button>

          {existingLotId && lotData.status !== ('sold' as LotStatus) && lotData.status !== ('draft' as LotStatus) && (
            <button
              onClick={openScheduleModal}
              disabled={!canChangeStatus || scheduleSaving}
              className="flex flex-col items-center gap-1 py-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors min-w-0 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] font-medium whitespace-nowrap">Planifier</span>
            </button>
          )}

          <button
            onClick={() => handleUpdateStatus('sold' as LotStatus)}
            disabled={!canChangeStatus || lotData.status === ('sold' as LotStatus)}
            className="flex flex-col items-center gap-1 py-2 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors min-w-0 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Euro className="w-4 h-4 flex-shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap">Vendu</span>
          </button>

          {existingLotId && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex flex-col items-center gap-1 py-2 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors min-w-0 flex-1"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] font-medium whitespace-nowrap">Supprimer</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // ========= Render =========
  if (!isOpen) return null;

  return (
    <>
      {/* ======================
          MOBILE: Right drawer
         ====================== */}
      <div className="fixed inset-0 z-[70] lg:hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Drawer */}
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col min-h-0">
          {/* Header (fixe) */}
          <div className="shrink-0 sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 truncate">{existingLotId ? 'Modifier le lot' : 'Créer un lot'}</h2>
                {lotData.selectedArticles.length > 0 && (
                  <div className="text-xs text-slate-500 truncate">
                    {lotData.selectedArticles.length} article(s) • {totalPrice.toFixed(0)}€
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {discount > 0 && (
                <Pill variant="success" className="hidden sm:inline-flex">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {discount}% de remise
                </Pill>
              )}
              <IconButton icon={X} ariaLabel="Fermer" onClick={onClose} />
            </div>
          </div>

          {/* Tabs (fixe) */}
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-slate-100 bg-white">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => setMobileTab('library')}
                className={[
                  'px-3 py-2 rounded-xl text-sm font-semibold transition-colors',
                  mobileTab === 'library' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900',
                ].join(' ')}
              >
                Articles disponibles
              </button>
              <button
                onClick={() => setMobileTab('builder')}
                className={[
                  'px-3 py-2 rounded-xl text-sm font-semibold transition-colors',
                  mobileTab === 'builder' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900',
                ].join(' ')}
              >
                Aperçu du lot
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0">{mobileTab === 'builder' ? renderBuilderPanel() : renderLibraryPanel()}</div>

          {renderFooterActions()}
        </div>
      </div>

      {/* ======================
          DESKTOP: Modal (center)
         ====================== */}
      <div className="fixed inset-0 z-[70] hidden lg:flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-[1100px] h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex min-h-0">
          {/* Left: Library */}
          <div className="w-[46%] border-r border-slate-200 min-h-0">{renderLibraryPanel()}</div>

          {/* Right: Builder + footer */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">{renderBuilderPanel()}</div>
            {renderFooterActions()}
          </div>

          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <IconButton icon={X} ariaLabel="Fermer" onClick={onClose} />
          </div>
        </div>
      </div>

      {/* ======================
          MODALE: Programmer la publication (identique au mode Détail)
         ====================== */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeScheduleModal} />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-slate-900">Programmer la publication</h3>
                  <p className="text-sm text-slate-500">Choisis la date et l'heure de publication.</p>
                </div>
              </div>
              <button
                onClick={closeScheduleModal}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Date &amp; heure</p>

                  <div className="mt-3 relative">
                    <input
                      type="datetime-local"
                      value={scheduleValue}
                      onChange={(e) => setScheduleValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {scheduleValue && (
                    <p className="mt-2 text-xs text-slate-500">Prévisualisation : {formatLocalDisplay(scheduleValue)}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">À quoi ça sert ?</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Le lot passera en statut <span className="font-semibold">scheduled</span> et sera publié automatiquement à la date choisie.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">(Logs, upload, checks, etc.)</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex items-center justify-end">
              <button
                onClick={confirmSchedule}
                disabled={scheduleSaving || !scheduleValue}
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {scheduleSaving ? 'Programmation…' : 'Programmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteLot}
        title="Supprimer le lot"
        message="Êtes-vous sûr de vouloir supprimer ce lot ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />

      {lotData.reference_number && (
        <LabelModal
          isOpen={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
          article={{
            reference_number: lotData.reference_number,
            title: lotData.name,
            brand: undefined,
            size: undefined,
            color: undefined,
            price: lotData.price,
          }}
          sellerName={sellerName}
          lotArticles={selectedArticlesList.map(a => ({
            title: a.title,
            brand: a.brand,
          }))}
        />
      )}

      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
