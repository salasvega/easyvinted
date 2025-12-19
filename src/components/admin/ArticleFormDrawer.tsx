import { useState, useEffect, DragEvent as ReactDragEvent, useRef, useCallback } from 'react';
import {
  Save,
  X,
  Plus,
  Sparkles,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Wand2,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  DollarSign,
  Calendar,
  Tag,
  Info,
} from 'lucide-react';
import { Condition, Season, ArticleStatus } from '../../types/article';
import { Toast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Modal } from '../ui/Modal';
import { ImageEditor } from '../ImageEditor';
import { ArticleSoldModal } from '../ArticleSoldModal';
import { LabelModal } from '../LabelModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { VINTED_CATEGORIES } from '../../constants/categories';
import { COLORS, MATERIALS } from '../../constants/articleAttributes';
import VirtualAgent from '../VirtualAgent';
import { Hash, Search, TrendingUp, Zap } from 'lucide-react';
import { compressImage, formatFileSize } from '../../lib/imageCompression';
import { parseSuggestionValue } from '../../lib/geminiService';

import { ShippingSimulator } from '../tools/ShippingSimulator';

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: 'new_with_tags', label: 'Neuf avec etiquette' },
  { value: 'new_without_tags', label: 'Neuf sans etiquette' },
  { value: 'very_good', label: 'Tres bon etat' },
  { value: 'good', label: 'Bon etat' },
  { value: 'satisfactory', label: 'Satisfaisant' },
];

const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: 'spring', label: 'Printemps' },
  { value: 'summer', label: 'Ete' },
  { value: 'autumn', label: 'Automne' },
  { value: 'winter', label: 'Hiver' },
  { value: 'all-seasons', label: 'Toutes saisons' },
];

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

const renderStatusIcon = (status: ArticleStatus) => {
  const iconClass = 'w-4 h-4';
  switch (status) {
    case 'draft':
      return <FileText className={iconClass} />;
    case 'ready':
      return <CheckCircle2 className={iconClass} />;
    case 'scheduled':
      return <Clock className={iconClass} />;
    case 'published':
      return <Send className={iconClass} />;
    case 'sold':
      return <DollarSign className={iconClass} />;
    default:
      return null;
  }
};

interface PhotoItem {
  url: string;
  isNew: boolean;
}

interface ArticleFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: string;
  onSaved: () => void;
  suggestions?: Record<string, any>;
}

export function ArticleFormDrawer({ isOpen, onClose, articleId, onSaved, suggestions }: ArticleFormDrawerProps) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<{ writing_style: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [articleStatus, setArticleStatus] = useState<ArticleStatus>('draft');
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasAppliedSuggestions, setHasAppliedSuggestions] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'seller' | 'kelly' | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState<string>('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [showShippingSimulator, setShowShippingSimulator] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    size: '',
    condition: 'very_good' as Condition,
    main_category: '',
    subcategory: '',
    item_category: '',
    price: '',
    season: 'all-seasons' as Season,
    suggested_period: '',
    photos: [] as PhotoItem[],
    color: '',
    material: '',
    seller_id: null as string | null,
    reference_number: '',

    estimated_weight: null as number | null,
    shipping_estimate: null as number | null,
    shipping_carrier_preferred: '' as string,
    shipping_band_label: '' as string,
    suggested_price_min: null as number | null,
    suggested_price_max: null as number | null,

    seo_keywords: [] as string[],
    hashtags: [] as string[],
    search_terms: [] as string[],
    ai_confidence_score: null as number | null,
  });

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      loadUserProfile();
      loadFamilyMembers();
      if (articleId) {
        fetchArticle();
      } else {
        resetForm();
      }
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 450);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, articleId, user, shouldRender]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 50);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      brand: '',
      size: '',
      condition: 'very_good',
      main_category: '',
      subcategory: '',
      item_category: '',
      price: '',
      season: 'all-seasons',
      suggested_period: '',
      photos: [],
      color: '',
      material: '',
      seller_id: null,
      reference_number: '',

      estimated_weight: null,
      shipping_estimate: null,
      shipping_carrier_preferred: '',
      shipping_band_label: '',
      suggested_price_min: null,
      suggested_price_max: null,

      seo_keywords: [],
      hashtags: [],
      search_terms: [],
      ai_confidence_score: null,
    });
    setArticleStatus('draft');
    setSelectedPhotoIndex(0);
    setHasAppliedSuggestions(false);
  };

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('writing_style')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) setUserProfile({ writing_style: data.writing_style || null });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadFamilyMembers = async () => {
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
      console.error('Error loading family members:', error);
    }
  };

  const fetchArticle = async () => {
    if (!articleId || !user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('📊 Loaded article data:', {
          main_category: data.main_category,
          subcategory: data.subcategory,
          item_category: data.item_category
        });

        let correctedMainCategory = data.main_category || '';
        let correctedSubcategory = data.subcategory || '';
        let correctedItemCategory = data.item_category || '';

        const subcategoryToMainCategory: Record<string, string> = {
          'Vetements': 'Femmes',
          'Vêtements': 'Femmes',
          'Chaussures': 'Femmes',
          'Sacs': 'Femmes',
          'Accessoires': 'Femmes',
        };

        if (correctedMainCategory && !VINTED_CATEGORIES.find(c => c.name === correctedMainCategory)) {
          console.log('⚠️ Invalid main_category detected, attempting auto-correction...');

          if (subcategoryToMainCategory[correctedMainCategory]) {
            correctedItemCategory = correctedSubcategory;
            correctedSubcategory = correctedMainCategory;
            correctedMainCategory = subcategoryToMainCategory[correctedMainCategory];
            console.log('✅ Auto-corrected categories:', {
              main_category: correctedMainCategory,
              subcategory: correctedSubcategory,
              item_category: correctedItemCategory
            });
          } else {
            correctedMainCategory = '';
            console.log('❌ Could not auto-correct, clearing category');
          }
        }

        setArticleStatus(data.status || 'draft');
        setScheduledFor(data.scheduled_for || null);
        const baseData = {
          title: data.title || '',
          description: data.description || '',
          brand: data.brand || '',
          size: data.size || '',
          condition: data.condition || 'very_good',
          main_category: correctedMainCategory,
          subcategory: correctedSubcategory,
          item_category: correctedItemCategory,
          price: data.price?.toString() || '',
          season: (data.season === 'all_seasons' ? 'all-seasons' : data.season) || 'all-seasons',
          suggested_period: data.suggested_period || '',
          photos: Array.isArray(data.photos) ? data.photos.map((url: string) => ({ url, isNew: false })) : [],
          color: data.color || '',
          material: data.material || '',
          seller_id: data.seller_id || null,
          reference_number: data.reference_number || '',

          estimated_weight: data.estimated_weight ?? null,
          shipping_estimate: data.shipping_estimate ?? null,
          shipping_carrier_preferred: data.shipping_carrier_preferred || '',
          shipping_band_label: data.shipping_band_label || '',
          suggested_price_min: data.suggested_price_min ?? null,
          suggested_price_max: data.suggested_price_max ?? null,

          seo_keywords: Array.isArray(data.seo_keywords) ? data.seo_keywords : [],
          hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
          search_terms: Array.isArray(data.search_terms) ? data.search_terms : [],
          ai_confidence_score: data.ai_confidence_score ?? null,
        };

        if (suggestions && Object.keys(suggestions).length > 0) {
          const parsedSuggestions: Record<string, any> = {};
          Object.entries(suggestions).forEach(([field, value]) => {
            if (field !== 'photos') {
              parsedSuggestions[field] = parseSuggestionValue(field, value);
            }
          });
          setFormData({ ...baseData, ...parsedSuggestions });
          setHasAppliedSuggestions(true);
          setToast({ type: 'success', text: `${Object.keys(suggestions).length} suggestion(s) de Kelly appliquée(s)` });
        } else {
          setFormData(baseData);
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      setToast({ type: 'error', text: "Erreur lors du chargement de l'article" });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    try {
      setLoading(true);
      const newPhotos: PhotoItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const compressionResult = await compressImage(file);
        console.log(`Compressed ${file.name}: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);

        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(compressionResult.file);
        });

        newPhotos.push({ url: dataUrl, isNew: true });
      }

      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
      setToast({ type: 'success', text: `${newPhotos.length} photo(s) ajoutée(s) (sera uploadée à la sauvegarde)` });
    } catch (error) {
      console.error('Error processing photos:', error);
      setToast({ type: 'error', text: 'Erreur lors du traitement des photos' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (formData.photos.length === 0) {
      setToast({ type: 'error', text: "Veuillez ajouter au moins une photo pour utiliser l'analyse IA" });
      return;
    }

    try {
      setAnalyzingWithAI(true);

      const uploadedPhotoUrls: string[] = [];
      const updatedPhotos: PhotoItem[] = [];

      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];

        if (photo.isNew) {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], `photo-${i}.jpg`, { type: 'image/jpeg' });

          const fileExt = 'jpg';
          const fileName = `${user?.id}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from('article-photos').upload(fileName, file);
          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('article-photos').getPublicUrl(fileName);
          uploadedPhotoUrls.push(urlData.publicUrl);
          updatedPhotos.push({ url: urlData.publicUrl, isNew: false });
        } else {
          uploadedPhotoUrls.push(photo.url);
          updatedPhotos.push(photo);
        }
      }

      setFormData((prev) => ({ ...prev, photos: updatedPhotos }));

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setToast({ type: 'error', text: 'Session expirée, veuillez vous reconnecter' });
        return;
      }

      const maxRetries = 3;
      let lastError: Error | null = null;

      const sellerIdToUse = analysisMode === 'kelly' ? null : formData.seller_id;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-article-image`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({
                imageUrls: uploadedPhotoUrls,
                sellerId: sellerIdToUse,
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const details = errorData.details ? ` (${errorData.details.join(', ')})` : '';
            throw new Error((errorData.error || `Erreur serveur (${response.status})`) + details);
          }

          const rawResult = await response.json();
          console.log('AI Analysis Result:', rawResult);

          const result = {
            title: rawResult['INFORMATIONS PRODUIT']?.title || rawResult.title,
            description: rawResult['INFORMATIONS PRODUIT']?.description || rawResult.description,
            brand: rawResult['INFORMATIONS PRODUIT']?.brand || rawResult.brand,
            category: rawResult['INFORMATIONS PRODUIT']?.category || rawResult.category,
            subcategory: rawResult['INFORMATIONS PRODUIT']?.subcategory || rawResult.subcategory,
            color: rawResult['ATTRIBUTS VINTED']?.color || rawResult.color,
            material: rawResult['ATTRIBUTS VINTED']?.material || rawResult.material,
            size: rawResult['ATTRIBUTS VINTED']?.size || rawResult.size,
            condition: rawResult['ATTRIBUTS VINTED']?.condition || rawResult.condition,
            season: rawResult['OPTIMISATION VENTE']?.season || rawResult.season,
            suggestedPeriod: rawResult['OPTIMISATION VENTE']?.suggestedPeriod || rawResult.suggestedPeriod,
            estimatedPrice: rawResult['OPTIMISATION VENTE']?.estimatedPrice || rawResult.estimatedPrice,
            seoKeywords: rawResult['SEO & MARKETING VINTED']?.seoKeywords || rawResult.seoKeywords,
            hashtags: rawResult['SEO & MARKETING VINTED']?.hashtags || rawResult.hashtags,
            searchTerms: rawResult['SEO & MARKETING VINTED']?.searchTerms || rawResult.searchTerms,
            confidenceScore: rawResult['QUALITE']?.confidenceScore || rawResult.confidenceScore,
          };

          setFormData((prev) => {
            const subcategoryMapping: Record<string, { main: string; sub: string }> = {
              'tops': { main: prev.main_category || 'Femmes', sub: 'Vêtements' },
              'bottoms': { main: prev.main_category || 'Femmes', sub: 'Vêtements' },
              'dresses': { main: 'Femmes', sub: 'Vêtements' },
              'outerwear': { main: prev.main_category || 'Femmes', sub: 'Vêtements' },
              'shoes': { main: prev.main_category || 'Femmes', sub: 'Chaussures' },
              'accessories': { main: prev.main_category || 'Femmes', sub: 'Accessoires' },
              'bags': { main: prev.main_category || 'Femmes', sub: 'Sacs' },
            };

            const categoryInfo = result.category && subcategoryMapping[result.category.toLowerCase()];

            return ({
            ...prev,
            title: result.title || prev.title,
            description: result.description || prev.description,
            brand: result.brand && result.brand !== 'Non spécifié' && result.brand !== 'Sans marque' ? result.brand : prev.brand,
            color: result.color || prev.color,
            material: result.material || prev.material,
            size: result.size || prev.size,
            price: result.estimatedPrice?.toString() || prev.price,
            condition: result.condition || prev.condition,
            season: result.season || prev.season,
            suggested_period: result.suggestedPeriod || prev.suggested_period,
            main_category: categoryInfo?.main || result.category || prev.main_category,
            subcategory: categoryInfo?.sub || result.subcategory || prev.subcategory,
            item_category: result.itemCategory || prev.item_category,
            seo_keywords: result.seoKeywords || prev.seo_keywords,
            hashtags: result.hashtags || prev.hashtags,
            search_terms: result.searchTerms || prev.search_terms,
            ai_confidence_score: result.confidenceScore || prev.ai_confidence_score,
            });
          });

          const fieldsAnalyzed = [
            result.title && 'titre',
            result.description && 'description',
            result.brand && result.brand !== 'Sans marque' && 'marque',
            result.size && 'taille',
            result.color && 'couleur',
            result.material && 'matière',
            result.estimatedPrice && 'prix',
          ].filter(Boolean).length;

          const confidenceText = result.confidenceScore
            ? ` (confiance: ${result.confidenceScore}%)`
            : '';

          setToast({
            type: 'success',
            text: `Analyse terminee ! ${fieldsAnalyzed} champs preremplis${confidenceText}`
          });
          return;

        } catch (error: any) {
          lastError = error;
          if (error.name === 'AbortError') {
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, 1000 * attempt));
              continue;
            }
            throw new Error('Délai d\'attente dépassé, veuillez réessayer');
          }
          if (attempt < maxRetries && !error.message?.includes('authentifié')) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          throw error;
        }
      }

      throw lastError || new Error('Échec après plusieurs tentatives');

    } catch (error: any) {
      console.error('Error analyzing with AI:', error);
      setToast({ type: 'error', text: error.message || "Echec de l'analyse IA" });
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  // ✅ IMPORTANT: callback stable pour éviter la boucle "Maximum update depth exceeded"
  const handleEstimateChange = useCallback((estimate: any) => {
    setFormData((prev) => ({
      ...prev,
      estimated_weight: estimate.weight ?? null,
      shipping_estimate: estimate.price ?? null,
      shipping_carrier_preferred: estimate.carrierLabel || estimate.bestCarrier?.label || '',
      shipping_band_label: estimate.bandLabel || '',
      suggested_price_min: estimate.suggestedPriceMin ?? null,
      suggested_price_max: estimate.suggestedPriceMax ?? null,
    }));
  }, []);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.title?.trim()) {
      setToast({ type: 'error', text: 'Le titre est requis' });
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      setToast({ type: 'error', text: 'Un prix valide est requis' });
      return;
    }

    try {
      setLoading(true);

      const finalPhotoUrls: string[] = [];

      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];

        if (photo.isNew) {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], `photo-${i}.jpg`, { type: 'image/jpeg' });

          const fileExt = 'jpg';
          const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from('article-photos').upload(fileName, file);
          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('article-photos').getPublicUrl(fileName);
          finalPhotoUrls.push(urlData.publicUrl);
        } else {
          finalPhotoUrls.push(photo.url);
        }
      }

      const referenceNumber =
        formData.reference_number ||
        `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const articleData = {
        title: formData.title,
        description: formData.description,
        brand: formData.brand,
        size: formData.size,
        condition: formData.condition,
        main_category: formData.main_category,
        subcategory: formData.subcategory,
        item_category: formData.item_category,
        price: parseFloat(formData.price),
        season: formData.season === 'all-seasons' ? 'all_seasons' : formData.season,
        suggested_period: formData.suggested_period,
        photos: finalPhotoUrls,
        color: formData.color,
        material: formData.material,
        seller_id: formData.seller_id,
        reference_number: referenceNumber,
        estimated_weight: formData.estimated_weight,
        shipping_estimate: formData.shipping_estimate,
        shipping_carrier_preferred: formData.shipping_carrier_preferred,
        shipping_band_label: formData.shipping_band_label,
        suggested_price_min: formData.suggested_price_min,
        suggested_price_max: formData.suggested_price_max,
        seo_keywords: formData.seo_keywords,
        hashtags: formData.hashtags,
        search_terms: formData.search_terms,
        ai_confidence_score: formData.ai_confidence_score,
        user_id: user.id,
        status: 'draft' as ArticleStatus,
        updated_at: new Date().toISOString(),
      };

      console.log('📝 ArticleFormDrawer - Données SEO à sauvegarder:', {
        seo_keywords: articleData.seo_keywords,
        hashtags: articleData.hashtags,
        search_terms: articleData.search_terms,
        ai_confidence_score: articleData.ai_confidence_score,
      });

      if (articleId) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', articleId)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Erreur lors de la mise à jour:', error);
          throw error;
        }
        console.log('✅ Article mis à jour avec succès');
        setToast({ type: 'success', text: 'Article modifie avec succes' });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([{ ...articleData, created_at: new Date().toISOString() }]);

        if (error) {
          console.error('❌ Erreur lors de l\'insertion:', error);
          throw error;
        }
        console.log('✅ Article créé avec succès');
        setToast({ type: 'success', text: 'Article cree avec succes' });
      }

      onSaved();
      handleClose();
    } catch (error) {
      console.error('Error saving article:', error);
      setToast({ type: 'error', text: "Erreur lors de la sauvegarde de l'article" });
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    if (selectedPhotoIndex >= formData.photos.length - 1) {
      setSelectedPhotoIndex(Math.max(0, formData.photos.length - 2));
    }
  };

  const handleDelete = async () => {
    if (!articleId || !user) return;

    try {
      if (formData.photos && formData.photos.length > 0) {
        const filePaths = formData.photos
          .filter((photo) => !photo.isNew)
          .map((photo) => {
            const urlParts = photo.url.split('/article-photos/');
            return urlParts.length === 2 ? urlParts[1] : null;
          })
          .filter((path: string | null): path is string => path !== null);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('article-photos')
            .remove(filePaths);

          if (storageError) {
            console.warn('Error deleting some photos:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)
        .eq('user_id', user.id);

      if (error) throw error;

      setToast({ type: 'success', text: 'Article supprime avec succes' });
      setDeleteModalOpen(false);
      onSaved();
      handleClose();
    } catch (error) {
      console.error('Error deleting article:', error);
      setToast({ type: 'error', text: "Erreur lors de la suppression de l'article" });
    }
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

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

  const openScheduleModal = () => {
    if (articleStatus === 'sold' || articleStatus === 'draft') {
      setToast({ type: 'error', text: 'Impossible de planifier un article vendu ou en brouillon' });
      return;
    }

    const preset =
      isoToLocalInput(scheduledFor) ||
      isoToLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    setScheduleValue(preset);
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => setScheduleModalOpen(false);

  const confirmSchedule = async () => {
    if (!articleId || !user) return;
    const iso = localInputToIso(scheduleValue);
    if (!iso) {
      setToast({ type: 'error', text: 'Date invalide' });
      return;
    }

    try {
      setScheduleSaving(true);

      const { error: updErr } = await supabase
        .from('articles')
        .update({
          scheduled_for: iso,
          status: 'scheduled' as ArticleStatus,
        })
        .eq('id', articleId)
        .eq('user_id', user.id);

      if (updErr) throw updErr;

      setToast({ type: 'success', text: `Publication programmée : ${formatLocalDisplay(scheduleValue)}` });
      setScheduleModalOpen(false);
      setArticleStatus('scheduled');
      setScheduledFor(iso);

      setTimeout(() => {
        onSaved();
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error scheduling article:', err);
      setToast({ type: 'error', text: err.message || 'Erreur lors de la programmation' });
    } finally {
      setScheduleSaving(false);
    }
  };

  const handlePhotoDragStart = (e: ReactDragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e: ReactDragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handlePhotoDragLeave = () => setDragOverIndex(null);

  const handlePhotoDrop = (e: ReactDragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...formData.photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    setFormData({ ...formData, photos: newPhotos });

    if (selectedPhotoIndex === draggedIndex) setSelectedPhotoIndex(dropIndex);
    else if (selectedPhotoIndex > draggedIndex && selectedPhotoIndex <= dropIndex) setSelectedPhotoIndex(selectedPhotoIndex - 1);
    else if (selectedPhotoIndex < draggedIndex && selectedPhotoIndex >= dropIndex) setSelectedPhotoIndex(selectedPhotoIndex + 1);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
    setShowImageEditor(true);
  };

  const handleImageEdited = async (newImageDataUrl: string) => {
    if (editingImageIndex === null || !user) return;

    try {
      setLoading(true);

      const response = await fetch(newImageDataUrl);
      const blob = await response.blob();
      const tempFile = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });

      const compressionResult = await compressImage(tempFile);
      console.log(`Compressed edited image: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressionResult.file);
      });

      const newPhotos = [...formData.photos];
      newPhotos[editingImageIndex] = { url: dataUrl, isNew: true };

      setFormData((prev) => ({ ...prev, photos: newPhotos }));
      setToast({ type: 'success', text: 'Photo mise a jour (sera uploadée à la sauvegarde)' });
    } catch (error) {
      console.error('Error processing edited image:', error);
      setToast({ type: 'error', text: 'Erreur lors du traitement de la photo' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsNewPhoto = async (newImageDataUrl: string) => {
    if (!user) return;

    if (formData.photos.length >= 8) {
      setToast({ type: 'error', text: 'Limite de 8 photos atteinte' });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(newImageDataUrl);
      const blob = await response.blob();
      const tempFile = new File([blob], 'new-image.jpg', { type: 'image/jpeg' });

      const compressionResult = await compressImage(tempFile);
      console.log(`Compressed new image: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressionResult.file);
      });

      setFormData((prev) => ({ ...prev, photos: [...prev.photos, { url: dataUrl, isNew: true }] }));
      setToast({ type: 'success', text: 'Nouvelle photo ajoutée (sera uploadée à la sauvegarde)' });
    } catch (error) {
      console.error('Error processing new photo:', error);
      setToast({ type: 'error', text: "Erreur lors du traitement de la nouvelle photo" });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev === 0 ? formData.photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev === formData.photos.length - 1 ? 0 : prev + 1));
  };

  const selectedCategory = VINTED_CATEGORIES.find((c) => c.name === formData.main_category);
  const selectedSubcategory = selectedCategory?.subcategories.find((s) => s.name === formData.subcategory);

  useEffect(() => {
    if (formData.main_category) {
      console.log('🔍 Category check:', {
        main_category: formData.main_category,
        found: !!selectedCategory,
        available: VINTED_CATEGORIES.map(c => c.name)
      });
    }
  }, [formData.main_category, selectedCategory]);

  const getStatusMessage = () => {
    switch (articleStatus) {
      case 'draft':
        return "Cette annonce est en cours de préparation. Complétez toutes les infos requises avant de l'envoyer";
      case 'ready':
        return 'Tous les champs requis sont remplis. Vous pouvez maintenant envoyer cette annonce.';
      case 'published':
        return 'Cette annonce est actuellement en ligne.';
      case 'sold':
        return 'Cet article a ete vendu avec succes.';
      case 'scheduled':
        if (scheduledFor) {
          const formattedDate = formatDateOnly(scheduledFor);
          return `La publication de cet article est planifiee au ${formattedDate}`;
        }
        return 'Cette annonce est planifiee pour une publication ulterieure.';
      default:
        return 'Cette annonce est en cours de preparation.';
    }
  };

  if (!shouldRender) return null;

  const statusColors = STATUS_COLORS[articleStatus];

  const isFormValid = formData.title?.trim() &&
    formData.price &&
    !isNaN(parseFloat(formData.price)) &&
    parseFloat(formData.price) > 0;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes formDrawerSlideIn {
          0% { transform: translateX(100%) rotateY(-18deg) scale(0.92); opacity: 0.7; }
          60% { transform: translateX(-2%) rotateY(2deg) scale(1.01); opacity: 1; }
          100% { transform: translateX(0) rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes formDrawerSlideOut {
          0% { transform: translateX(0) rotateY(0deg) scale(1); opacity: 1; filter: blur(0px); }
          30% { transform: translateX(20px) scale(0.96) rotateY(8deg) rotateZ(-3deg); opacity: 0.7; }
          100% { transform: translateX(140%) scale(0.65) rotateY(30deg) rotateZ(10deg); opacity: 0; filter: blur(10px); }
        }
        @keyframes formContentFadeIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes formContentFadeOut {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.85) rotate(3deg); }
        }
        @keyframes formBackdropFadeIn {
          0% { opacity: 0; backdrop-filter: blur(0px) brightness(100%); }
          100% { opacity: 1; backdrop-filter: blur(4px) brightness(60%); }
        }
        @keyframes formBackdropFadeOut {
          0% { opacity: 1; backdrop-filter: blur(4px) brightness(60%); }
          100% { opacity: 0; backdrop-filter: blur(0px) brightness(100%); }
        }
        .form-drawer-backdrop-enter { animation: formBackdropFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .form-drawer-backdrop-exit { animation: formBackdropFadeOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards; }
        .form-drawer-enter { animation: formDrawerSlideIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .form-drawer-exit { animation: formDrawerSlideOut 0.45s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        .form-drawer-content-item { animation: formContentFadeIn 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) forwards; animation-delay: calc(var(--item-index) * 0.06s); }
        .form-drawer-content-item-exit { animation: formContentFadeOut 0.28s ease-out forwards; animation-delay: calc((7 - var(--item-index)) * 0.025s); }
      `,
        }}
      />

      <div
        className={`fixed inset-0 bg-black/50 z-[60] ${!isClosing ? 'form-drawer-backdrop-enter' : 'form-drawer-backdrop-exit'} ${
          isClosing ? 'pointer-events-none' : ''
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white z-[60] shadow-2xl ${!isClosing ? 'form-drawer-enter' : 'form-drawer-exit'}`}
        style={{ perspective: '1000px' }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div>
              <h2 className="font-semibold text-slate-900">{articleId ? "Modifier l'article" : 'Nouvel article'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Completez les informations de votre article</p>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && articleId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-5">
                  {/* Photos */}
                  <div className={`space-y-4 ${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 0 } as React.CSSProperties}>
                    <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden aspect-square relative">
                      {formData.photos.length > 0 ? (
                        <>
                          <img src={formData.photos[selectedPhotoIndex].url} alt="Produit" className="w-full h-full object-cover" />

                          <button
                            type="button"
                            onClick={() => handleEditImage(selectedPhotoIndex)}
                            className="absolute top-4 right-4 p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 flex items-center gap-2"
                            title="Editer avec IA"
                          >
                            <Wand2 className="w-5 h-5" />
                            <span className="font-semibold text-sm">Editer avec IA</span>
                          </button>

                          {formData.photos.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={handlePreviousPhoto}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                              >
                                <ChevronLeft className="w-5 h-5 text-slate-900" />
                              </button>
                              <button
                                type="button"
                                onClick={handleNextPhoto}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                              >
                                <ChevronRight className="w-5 h-5 text-slate-900" />
                              </button>
                              <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                                {selectedPhotoIndex + 1} / {formData.photos.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                          <Plus className="w-16 h-16 text-slate-300 mb-4" />
                          <span className="text-slate-400 font-medium">Ajouter des photos</span>
                          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      )}
                    </div>

                    {formData.photos.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-600 mb-3">
                          Glissez-deposez les photos pour reorganiser leur ordre. La premiere photo sera la photo principale.
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                          {Array.isArray(formData.photos) && formData.photos.map((photo, index) => (
                            <div
                              key={`${photo.url}-${index}`}
                              draggable
                              onDragStart={(e) => handlePhotoDragStart(e, index)}
                              onDragOver={(e) => handlePhotoDragOver(e, index)}
                              onDragLeave={handlePhotoDragLeave}
                              onDrop={(e) => handlePhotoDrop(e, index)}
                              onDragEnd={handlePhotoDragEnd}
                              onClick={() => setSelectedPhotoIndex(index)}
                              className={`relative group aspect-square transition-all ${
                                draggedIndex === index ? 'opacity-50 scale-95 cursor-grabbing' : 'cursor-grab hover:cursor-pointer'
                              } ${dragOverIndex === index ? 'ring-2 ring-emerald-500' : ''}`}
                            >
                              <img
                                src={photo.url}
                                alt={`Photo ${index + 1}`}
                                className={`w-full h-full object-cover rounded-xl border-2 transition-all ${
                                  selectedPhotoIndex === index ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                                }`}
                              />
                              <div className="absolute top-2 left-2 flex gap-1">
                                <div className="p-1 bg-slate-900/70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditImage(index);
                                  }}
                                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Editer avec IA"
                                >
                                  <Wand2 className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePhoto(index);
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              {index === 0 && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs rounded-md font-medium">
                                  Photo principale
                                </div>
                              )}
                            </div>
                          ))}

                          {formData.photos.length < 8 && (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                            >
                              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                              <p className="text-xs text-slate-500 font-medium">Ajouter</p>
                              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                            </div>
                          )}
                        </div>

                        {familyMembers.length > 0 && formData.photos.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                              <h4 className="text-xs uppercase tracking-wide text-blue-800 font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                Analyse de l&apos;article
                              </h4>
                              <p className="text-xs text-blue-600 mb-3">
                                Choisissez comment analyser votre article
                              </p>

                              <div className="space-y-2">
                                <label className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                                  <input
                                    type="radio"
                                    name="analysisMode"
                                    checked={analysisMode === 'seller'}
                                    onChange={() => setAnalysisMode('seller')}
                                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">Utiliser le style du Vendeur</div>
                                    <div className="text-xs text-slate-500">Analyse basée sur le profil du vendeur sélectionné</div>
                                  </div>
                                </label>

                                <label className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                                  <input
                                    type="radio"
                                    name="analysisMode"
                                    checked={analysisMode === 'kelly'}
                                    onChange={() => setAnalysisMode('kelly')}
                                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">Style par défaut</div>
                                    <div className="text-xs text-slate-500">Analyse par défaut sans profil de vendeur</div>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {analysisMode === 'seller' && (
                              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                <h4 className="text-xs uppercase tracking-wide text-purple-800 font-semibold mb-1 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5" />
                                  Sélectionnez un Vendeur
                                </h4>
                                <p className="text-xs text-purple-600 mb-2">
                                  La description sera rédigée selon le style du vendeur sélectionné
                                </p>
                                <select
                                  value={formData.seller_id || ''}
                                  onChange={(e) => setFormData({ ...formData, seller_id: e.target.value || null })}
                                  className="w-full text-sm font-medium text-slate-900 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 px-3 py-2"
                                >
                                  <option value="">Sélectionner un vendeur</option>
                                  {familyMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                      {member.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {((analysisMode === 'seller' && formData.seller_id) || analysisMode === 'kelly') && (
                              <button
                                type="button"
                                onClick={handleAnalyzeWithAI}
                                disabled={analyzingWithAI}
                                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {analyzingWithAI ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    Analyse en cours...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-5 h-5" />
                                    Analyser l&apos;article
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <div className="space-y-5">
                    {/* Title */}
                    <div className={`${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 1 } as React.CSSProperties}>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full border-0 border-b-2 border-slate-100 focus:border-emerald-500 focus:ring-0 px-0 py-1 text-xl font-bold text-slate-900 placeholder:text-slate-400"
                          placeholder="Titre de l'article *"
                        />
                      </h3>
                      {formData.reference_number && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-400 font-mono">Ref. #{formData.reference_number}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className={`${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 2 } as React.CSSProperties}>
                      <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Description</h4>
                      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <textarea
                          value={formData.description}
                          onChange={(e) => {
                            setFormData({ ...formData, description: e.target.value });
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
                          className="w-full text-sm text-slate-700 leading-relaxed bg-transparent border-0 focus:ring-0 p-0 resize-none overflow-hidden"
                          placeholder="Decrivez votre article."
                          style={{ minHeight: '100px' }}
                        />
                      </div>
                    </div>

                    {/* Article Details Grid */}
                    <div className={`grid grid-cols-2 gap-3 ${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 3 } as React.CSSProperties}>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Marque</p>
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                          placeholder="Sans marque"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Taille</p>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                          placeholder="M"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Couleur</p>
                        <select
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                        >
                          <option value="">Selectionner</option>
                          {COLORS.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Matiere</p>
                        <select
                          value={formData.material}
                          onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                        >
                          <option value="">Selectionner</option>
                          {MATERIALS.map((material) => (
                            <option key={material} value={material}>
                              {material}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Etat</p>
                        <select
                          value={formData.condition}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                        >
                          {CONDITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Periode conseillee</p>
                        <input
                          type="text"
                          value={formData.suggested_period}
                          onChange={(e) => setFormData({ ...formData, suggested_period: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                          placeholder="Ex: Sept-Oct"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Saison</p>
                        <select
                          value={formData.season}
                          onChange={(e) => setFormData({ ...formData, season: e.target.value as Season })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                        >
                          {SEASON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Category */}
                    <div className={`p-3 bg-slate-50 rounded-xl border border-slate-200 ${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 4 } as React.CSSProperties}>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Categorie</p>
                      <select
                        value={formData.main_category}
                        onChange={(e) => setFormData({ ...formData, main_category: e.target.value, subcategory: '', item_category: '' })}
                        className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                      >
                        <option value="">Selectionner une categorie</option>
                        {VINTED_CATEGORIES.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    {selectedCategory && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Sous-categorie</p>
                        <select
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value, item_category: '' })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                        >
                          <option value="">Selectionner une sous-categorie</option>
                          {selectedCategory.subcategories.map((sub) => (
                            <option key={sub.name} value={sub.name}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Item Category */}
                    {selectedSubcategory && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Type d&apos;article</p>
                        <select
                          value={formData.item_category}
                          onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                        >
                          <option value="">Selectionner le type d&apos;article</option>
                          {selectedSubcategory.items.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* SEO & Marketing Section */}
                    <div
                      className={`${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`}
                      style={{ '--item-index': 5 } as React.CSSProperties}
                    >
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
                          {formData.ai_confidence_score && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-teal-600 text-white rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {formData.ai_confidence_score}%
                            </span>
                          )}
                        </div>
                        <ChevronRight className={`w-5 h-5 text-teal-700 transition-transform ${seoExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {seoExpanded && (
                        <div className="mt-2 p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium mb-1.5">
                              <Search className="w-3 h-3" />
                              Mots-clés SEO
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {formData.seo_keywords.map((keyword, idx) => (
                                <div key={idx} className="group flex items-center gap-1 px-2 py-1 bg-white/70 border border-teal-200 text-teal-800 text-xs rounded-lg hover:border-teal-400 transition-colors">
                                  <span>{keyword}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        seo_keywords: prev.seo_keywords.filter((_, i) => i !== idx)
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
                                  console.log('📋 Keywords actuels:', formData.seo_keywords);
                                  if (value && !formData.seo_keywords.includes(value)) {
                                    const newKeywords = [...formData.seo_keywords, value];
                                    console.log('✅ Nouveaux keywords:', newKeywords);
                                    setFormData(prev => ({ ...prev, seo_keywords: newKeywords }));
                                    e.currentTarget.value = '';
                                  } else {
                                    console.log('⚠️ Valeur vide ou déjà présente');
                                  }
                                }
                              }}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium mb-1.5">
                              <Hash className="w-3 h-3" />
                              Hashtags tendance
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {formData.hashtags.map((tag, idx) => (
                                <div key={idx} className="group flex items-center gap-1 px-2 py-1 bg-teal-600/10 text-teal-700 text-xs rounded-lg font-medium hover:bg-teal-600/20 transition-colors">
                                  <span>{tag}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        hashtags: prev.hashtags.filter((_, i) => i !== idx)
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
                                    console.log('📋 Hashtags actuels:', formData.hashtags);
                                    if (!formData.hashtags.includes(value)) {
                                      const newHashtags = [...formData.hashtags, value];
                                      console.log('✅ Nouveaux hashtags:', newHashtags);
                                      setFormData(prev => ({ ...prev, hashtags: newHashtags }));
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
                              {formData.search_terms.map((term, idx) => (
                                <div key={idx} className="group flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-lg hover:bg-emerald-200 transition-colors">
                                  <span>"{term}"</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        search_terms: prev.search_terms.filter((_, i) => i !== idx)
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
                                  console.log('📋 Termes actuels:', formData.search_terms);
                                  if (value && !formData.search_terms.includes(value)) {
                                    const newTerms = [...formData.search_terms, value];
                                    console.log('✅ Nouveaux termes:', newTerms);
                                    setFormData(prev => ({ ...prev, search_terms: newTerms }));
                                    e.currentTarget.value = '';
                                  } else {
                                    console.log('⚠️ Valeur vide ou déjà présente');
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className={`${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 6 } as React.CSSProperties}>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Prix *</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full text-lg font-bold text-emerald-600 bg-transparent border-0 focus:ring-0 p-0"
                            placeholder="0.00"
                          />
                          <span className="text-lg font-bold text-emerald-600">€</span>
                        </div>
                      </div>
                    </div>

                    {/* ✅ Shipping Simulator */}
                    <div className={`${!isClosing ? 'form-drawer-content-item' : 'form-drawer-content-item-exit'}`} style={{ '--item-index': 7 } as React.CSSProperties}>
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
                            title={formData.title}
                            price={formData.price ? parseFloat(formData.price) : null}
                            mainCategory={formData.main_category}
                            subcategory={formData.subcategory}
                            itemCategory={formData.item_category}
                            onEstimateChange={handleEstimateChange}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status Section */}
                    {articleId && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <div className="mb-2">
                          <button
                            onClick={() => setStatusModalOpen(true)}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${statusColors.bg} ${statusColors.text} ${statusColors.border} hover:scale-105 transition-transform text-sm font-semibold`}
                          >
                            {renderStatusIcon(articleStatus)}
                            <span>{STATUS_LABELS[articleStatus]}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{getStatusMessage()}</p>
                      </div>
                    )}

                    {/* Label Section */}
                    {articleId && formData.reference_number && (
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
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading || !isFormValid}
                    className="flex flex-col items-center gap-1 py-2 px-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors min-w-0 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] font-medium whitespace-nowrap">Sauvegarder</span>
                  </button>

                  <button
                    onClick={handleClose}
                    className="flex flex-col items-center gap-1 py-2 px-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors min-w-0 flex-1"
                  >
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] font-medium whitespace-nowrap">Annuler</span>
                  </button>

                  {articleId && articleStatus !== 'sold' && articleStatus !== 'draft' && (
                    <button
                      onClick={openScheduleModal}
                      disabled={scheduleSaving}
                      className="flex flex-col items-center gap-1 py-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors min-w-0 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[10px] font-medium whitespace-nowrap">Planifier</span>
                    </button>
                  )}

                  {articleId && (
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
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'article"
        message="Etes-vous sur de vouloir supprimer cet article ? Cette action est irreversible."
        confirmLabel="Supprimer"
        variant="danger"
      />

      {showImageEditor && editingImageIndex !== null && (
        <ImageEditor
          imageUrl={formData.photos[editingImageIndex].url}
          allPhotos={formData.photos.map(p => p.url)}
          currentPhotoIndex={editingImageIndex}
          onImageEdited={handleImageEdited}
          onAddAsNewPhoto={formData.photos.length < 8 ? handleAddAsNewPhoto : undefined}
          onPhotoSelect={(index) => setEditingImageIndex(index)}
          onClose={() => {
            setShowImageEditor(false);
            setEditingImageIndex(null);
          }}
        />
      )}

      {isOpen && (
        <VirtualAgent
          article={{
            title: formData.title,
            description: formData.description,
            brand: formData.brand,
            size: formData.size,
            condition: formData.condition,
            price: parseFloat(formData.price) || 0,
            color: formData.color,
            material: formData.material,
            main_category: formData.main_category,
            photos: formData.photos.map(p => p.url),
          }}
          activePhoto={formData.photos[selectedPhotoIndex]?.url}
          onApplySuggestion={(field, value) => {
            const parsedValue = parseSuggestionValue(field, value);
            setFormData(prev => ({
              ...prev,
              [field]: parsedValue
            }));
          }}
        />
      )}

      {scheduleModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeScheduleModal} />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
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
                    L'article passera en statut <span className="font-semibold">scheduled</span> et sera publié automatiquement à la date choisie.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">(Logs, upload, checks, etc.)</p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex items-center justify-end">
              <button
                onClick={confirmSchedule}
                disabled={scheduleSaving || !scheduleValue}
                className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scheduleSaving ? 'Programmation...' : 'Programmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Changer le statut"
      >
        <div className="space-y-2">
          {(['draft', 'ready', 'scheduled', 'published', 'sold'] as ArticleStatus[]).map((status) => (
            <button
              key={status}
              onClick={async () => {
                try {
                  if (status === 'sold') {
                    setStatusModalOpen(false);
                    setSoldModalOpen(true);
                    return;
                  }

                  const updateData: any = { status };

                  if (status === 'published') {
                    const { data: currentArticle } = await supabase
                      .from('articles')
                      .select('published_at')
                      .eq('id', articleId)
                      .maybeSingle();

                    if (currentArticle && !currentArticle.published_at) {
                      updateData.published_at = new Date().toISOString();
                    }
                  }

                  const { error } = await supabase
                    .from('articles')
                    .update(updateData)
                    .eq('id', articleId);

                  if (error) throw error;

                  setArticleStatus(status);
                  setToast({
                    type: 'success',
                    text: `Statut change en "${STATUS_LABELS[status]}"`,
                  });
                  setStatusModalOpen(false);
                  onSaved();
                } catch (error) {
                  console.error('Error updating status:', error);
                  setToast({
                    type: 'error',
                    text: 'Erreur lors du changement de statut',
                  });
                }
              }}
              disabled={articleStatus === status}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                articleStatus === status
                  ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} ${STATUS_COLORS[status].border} border`}>
                {renderStatusIcon(status)}
                {STATUS_LABELS[status]}
              </span>
              {articleStatus === status && (
                <span className="ml-auto text-xs text-slate-500">(Actuel)</span>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {soldModalOpen && articleId && (
        <ArticleSoldModal
          isOpen={soldModalOpen}
          onClose={() => setSoldModalOpen(false)}
          onConfirm={async (saleData) => {
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
                .eq('id', articleId);

              if (error) throw error;

              setArticleStatus('sold');
              setToast({ type: 'success', text: 'Article marque comme vendu' });
              setSoldModalOpen(false);
              onSaved();
            } catch (error) {
              console.error('Error marking article as sold:', error);
              setToast({ type: 'error', text: 'Erreur lors de la mise a jour' });
            }
          }}
          article={{
            id: articleId,
            title: formData.title,
            brand: formData.brand,
            price: parseFloat(formData.price) || 0,
            photos: formData.photos.map(p => p.url),
            seller_id: formData.seller_id,
          } as any}
        />
      )}

      {labelModalOpen && articleId && formData.reference_number && (
        <LabelModal
          isOpen={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
          article={{
            reference_number: formData.reference_number,
            title: formData.title,
            brand: formData.brand,
            size: formData.size,
            color: formData.color,
            price: parseFloat(formData.price) || 0,
          }}
          sellerName={undefined}
        />
      )}

      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
