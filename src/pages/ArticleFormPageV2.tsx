import { useState, useEffect, DragEvent as ReactDragEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  X,
  Plus,
  Sparkles,
  Trash2,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Wand2,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
} from 'lucide-react';
import { Condition, Season, ArticleStatus } from '../types/article';
import { Toast } from '../components/ui/Toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ImageEditor } from '../components/ImageEditor';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VINTED_CATEGORIES } from '../constants/categories';
import { COLORS, MATERIALS } from '../constants/articleAttributes';
import { analyzeProductImage } from '../lib/openaiService';
import VirtualAgent from '../components/VirtualAgent';
import { parseSuggestionValue } from '../lib/geminiService';
import { compressImage, formatFileSize } from '../lib/imageCompression';

// ✅ Shipping Simulator (assure-toi que ce chemin correspond bien à ton arborescence)
import { ShippingSimulator } from '../components/tools/ShippingSimulator';

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
    case 'draft': return <FileText className={iconClass} />;
    case 'ready': return <CheckCircle2 className={iconClass} />;
    case 'scheduled': return <Clock className={iconClass} />;
    case 'published': return <Send className={iconClass} />;
    case 'sold': return <DollarSign className={iconClass} />;
    default: return null;
  }
};

export function ArticleFormPageV2() {
  const navigate = useNavigate();
  const { id } = useParams();
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

  // ✅ Ajout des champs du simulateur
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
    photos: [] as string[],
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
  });

  useEffect(() => {
    loadUserProfile();
    loadFamilyMembers();
    if (id) fetchArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

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
    if (!id || !user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setArticleStatus(data.status || 'draft');
        setFormData({
          title: data.title || '',
          description: data.description || '',
          brand: data.brand || '',
          size: data.size || '',
          condition: data.condition || 'very_good',
          main_category: data.main_category || '',
          subcategory: data.subcategory || '',
          item_category: data.item_category || '',
          price: data.price?.toString() || '',
          season: (data.season === 'all_seasons' ? 'all-seasons' : data.season) || 'all-seasons',
          suggested_period: data.suggested_period || '',
          photos: data.photos || [],
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
        });
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
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const compressionResult = await compressImage(file);
        console.log(`Compressed ${file.name}: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);

        const fileExt = 'jpg';
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('article-photos')
          .upload(fileName, compressionResult.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('article-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('Error uploading photos:', error);
      setToast({ type: 'error', text: 'Erreur lors du telechargement des photos' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (formData.photos.length === 0) {
      setToast({ type: 'error', text: "Veuillez ajouter au moins une photo pour utiliser l'analyse IA" });
      return;
    }
    analyzeWithAI(formData.photos[0]);
  };

  const analyzeWithAI = async (photoUrl: string) => {
    if (!photoUrl) return;

    try {
      setAnalyzingWithAI(true);

      const response = await fetch(photoUrl);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      const mimeType = blob.type;
      const writingStyle = userProfile?.writing_style || undefined;

      const products = await analyzeProductImage(base64, mimeType, writingStyle);

      if (products && products.length > 0) {
        const product = products[0];
        const priceMatch = product.priceEstimate?.match(/\d+/);
        const estimatedPrice = priceMatch ? priceMatch[0] : '';

        setFormData((prev) => ({
          ...prev,
          title: product.title || prev.title,
          description: product.description || prev.description,
          brand: product.brand || prev.brand,
          color: product.color || prev.color,
          material: product.material || prev.material,
          size: product.size || prev.size,
          price: estimatedPrice || prev.price,
        }));

        setToast({ type: 'success', text: 'Analyse IA terminee avec succes !' });
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      setToast({ type: 'error', text: "Echec de l'analyse IA" });
    } finally {
      setAnalyzingWithAI(false);
    }
  };

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
      const referenceNumber =
        formData.reference_number ||
        `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const articleData = {
        ...formData,
        reference_number: referenceNumber,
        price: parseFloat(formData.price),
        season: formData.season === 'all-seasons' ? 'all_seasons' : formData.season,
        user_id: user.id,
        status: 'draft' as ArticleStatus,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setToast({ type: 'success', text: 'Article modifie avec succes' });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([{ ...articleData, created_at: new Date().toISOString() }]);

        if (error) throw error;
        setToast({ type: 'success', text: 'Article cree avec succes' });
      }

      setTimeout(() => navigate('/dashboard-v2'), 1500);
    } catch (error) {
      console.error('Error saving article:', error);
      setToast({ type: 'error', text: "Erreur lors de la sauvegarde de l'article" });
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    if (selectedPhotoIndex >= formData.photos.length - 1) {
      setSelectedPhotoIndex(Math.max(0, formData.photos.length - 2));
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;

    try {
      if (formData.photos && formData.photos.length > 0) {
        const filePaths = formData.photos
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
        const folderPath = `${user.id}/${id}`;
        const { data: folderContents } = await supabase.storage
          .from('article-photos')
          .list(folderPath);

        if (folderContents && folderContents.length > 0) {
          const filesToDelete = folderContents.map((file) => `${folderPath}/${file.name}`);
          await supabase.storage.from('article-photos').remove(filesToDelete);
        }
      } catch (folderError) {
        console.log('No folder to clean up:', folderError);
      }

      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;

      setToast({ type: 'success', text: 'Article supprime avec succes' });
      setDeleteModalOpen(false);
      setTimeout(() => navigate('/dashboard-v2'), 1000);
    } catch (error) {
      console.error('Error deleting article:', error);
      setToast({ type: 'error', text: "Erreur lors de la suppression de l'article" });
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

    if (selectedPhotoIndex === draggedIndex) {
      setSelectedPhotoIndex(dropIndex);
    } else if (selectedPhotoIndex > draggedIndex && selectedPhotoIndex <= dropIndex) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    } else if (selectedPhotoIndex < draggedIndex && selectedPhotoIndex >= dropIndex) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }

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

      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-photos')
        .upload(fileName, compressionResult.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('article-photos')
        .getPublicUrl(fileName);

      const newPhotos = [...formData.photos];
      newPhotos[editingImageIndex] = urlData.publicUrl;

      setFormData((prev) => ({ ...prev, photos: newPhotos }));
      setToast({ type: 'success', text: 'Photo mise a jour avec succes' });
    } catch (error) {
      console.error('Error uploading edited image:', error);
      setToast({ type: 'error', text: 'Erreur lors de la mise a jour de la photo' });
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

      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-photos')
        .upload(fileName, compressionResult.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('article-photos')
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, urlData.publicUrl],
      }));
      setToast({ type: 'success', text: 'Nouvelle photo ajoutee avec succes' });
    } catch (error) {
      console.error('Error uploading new photo:', error);
      setToast({ type: 'error', text: "Erreur lors de l'ajout de la nouvelle photo" });
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
        return 'Cette annonce est planifiee pour une publication ulterieure.';
      default:
        return 'Cette annonce est en cours de preparation.';
    }
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const statusColors = STATUS_COLORS[articleStatus];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Photos */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden aspect-square relative">
              {formData.photos.length > 0 ? (
                <>
                  <img
                    src={formData.photos[selectedPhotoIndex]}
                    alt="Produit"
                    className="w-full h-full object-cover"
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Thumbnails */}
            {formData.photos.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-600 mb-3">
                  Glissez-deposez les photos pour reorganiser leur ordre. La premiere photo sera la photo principale.
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div
                      key={photo}
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
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className={`w-full h-full object-cover rounded-xl border-2 transition-all ${
                          selectedPhotoIndex === index
                            ? 'border-blue-500 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-slate-300'
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
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  disabled={analyzingWithAI}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {analyzingWithAI ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyser l&apos;article
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Form */}
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
              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border-0 border-b-2 border-slate-100 focus:border-emerald-500 focus:ring-0 px-0 py-1 text-xl font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="Titre de l'article"
                  />
                </h3>
                {formData.reference_number && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 font-mono">Ref. #{formData.reference_number}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Description</h4>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full text-sm text-slate-700 leading-relaxed bg-transparent border-0 focus:ring-0 p-0 resize-none"
                    placeholder="Decrivez votre article..."
                  />
                </div>
              </div>

              {/* Article Details Grid */}
              <div className="grid grid-cols-2 gap-3">
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
                      <option key={color} value={color}>{color}</option>
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
                      <option key={material} value={material}>{material}</option>
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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Categorie</p>
                <select
                  value={formData.main_category}
                  onChange={(e) =>
                    setFormData({ ...formData, main_category: e.target.value, subcategory: '', item_category: '' })
                  }
                  className="w-full text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                >
                  <option value="">Selectionner une categorie</option>
                  {VINTED_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
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
                      <option key={sub.name} value={sub.name}>{sub.name}</option>
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
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price & Seller */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Prix</p>
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

                {familyMembers.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Vendeur</p>
                    <select
                      value={formData.seller_id || ''}
                      onChange={(e) => setFormData({ ...formData, seller_id: e.target.value || null })}
                      className="w-full text-sm text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                    >
                      <option value="">Moi</option>
                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ✅ Shipping Simulator (in-page) */}
              <div className="mt-2">
                <ShippingSimulator
                  title={formData.title}
                  price={formData.price ? parseFloat(formData.price) : null}
                  mainCategory={formData.main_category}
                  subcategory={formData.subcategory}
                  itemCategory={formData.item_category}
                  onEstimateChange={(estimate) => {
                    setFormData((prev) => ({
                      ...prev,
                      estimated_weight: estimate.weight ?? null,
                      shipping_estimate: estimate.price ?? null,
                      shipping_carrier_preferred:
                        estimate.carrierLabel || estimate.bestCarrier?.label || '',
                      shipping_band_label: estimate.bandLabel || '',
                      suggested_price_min: estimate.suggestedPriceMin ?? null,
                      suggested_price_max: estimate.suggestedPriceMax ?? null,
                    }));
                  }}
                />
              </div>

              {/* ✅ Résumé frais de port (ultra lisible) */}
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Poids estimé</span>
                  <span className="font-semibold">
                    {formData.estimated_weight ? `${formData.estimated_weight} g` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Transporteur recommandé</span>
                  <span className="font-semibold">
                    {formData.shipping_carrier_preferred || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Frais de port estimés</span>
                  <span className="font-semibold">
                    {typeof formData.shipping_estimate === 'number'
                      ? `${formData.shipping_estimate.toFixed(2)} €`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Prix conseillé (fourchette)</span>
                  <span className="font-semibold">
                    {typeof formData.suggested_price_min === 'number' &&
                    typeof formData.suggested_price_max === 'number'
                      ? `${formData.suggested_price_min.toFixed(2)} € – ${formData.suggested_price_max.toFixed(2)} €`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Status Section */}
              {id && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${statusColors.bg} ${statusColors.text} ${statusColors.border} text-sm font-semibold`}
                    >
                      {renderStatusIcon(articleStatus)}
                      <span>{STATUS_LABELS[articleStatus]}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{getStatusMessage()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex flex-wrap justify-center gap-3">
            {id && (
              <>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>

                <button
                  onClick={() => navigate(`/articles/${id}/preview`)}
                  className="px-6 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Previsualiser
                </button>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
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
          imageUrl={formData.photos[editingImageIndex]}
          allPhotos={formData.photos}
          currentPhotoIndex={editingImageIndex}
          onImageEdited={handleImageEdited}
          onAddAsNewPhoto={handleAddAsNewPhoto}
          onPhotoSelect={(index) => setEditingImageIndex(index)}
          onClose={() => {
            setShowImageEditor(false);
            setEditingImageIndex(null);
          }}
        />
      )}

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
          photos: formData.photos,
        }}
        activePhoto={formData.photos[selectedPhotoIndex]}
        onApplySuggestion={(field, value) => {
          const parsedValue = parseSuggestionValue(field, value);
          setFormData(prev => ({
            ...prev,
            [field]: parsedValue
          }));
        }}
      />

      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
