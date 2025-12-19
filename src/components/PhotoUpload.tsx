import { useState, useRef, ChangeEvent, DragEvent as ReactDragEvent } from 'react';
import { Upload, X, Image as ImageIcon, GripVertical, Sparkles, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Modal } from './ui/Modal';
import { ImageEditor } from './ImageEditor';
import { compressImage, formatFileSize } from '../lib/imageCompression';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  onAnalyzeClick?: () => void;
  analyzing?: boolean;
  userId: string;
  articleId?: string;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 8, onAnalyzeClick, analyzing = false, userId, articleId }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'error' | 'warning' }>(
    { isOpen: false, title: '', message: '', type: 'info' }
  );
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const compressionResult = await compressImage(file);
      console.log(`Compressed ${file.name}: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);

      const fileExt = 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const tempArticleId = articleId || 'temp-' + Date.now();
      const filePath = `${userId}/${tempArticleId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-photos')
        .upload(filePath, compressionResult.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('article-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      setModalState({
        isOpen: true,
        title: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxPhotos} photos`,
        type: 'warning'
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToUpload.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;

      if (!isValidType) {
        setModalState({
          isOpen: true,
          title: 'Format non supporté',
          message: `${file.name} : Utilisez JPG, PNG ou WebP.`,
          type: 'error'
        });
        return false;
      }
      if (!isValidSize) {
        setModalState({
          isOpen: true,
          title: 'Fichier trop volumineux',
          message: `${file.name} : Maximum 5MB par photo.`,
          type: 'error'
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    const uploadPromises = validFiles.map(file => uploadPhoto(file));
    const uploadedUrls = await Promise.all(uploadPromises);
    const successfulUploads = uploadedUrls.filter((url): url is string => url !== null);

    if (successfulUploads.length > 0) {
      onPhotosChange([...photos, ...successfulUploads]);
    }

    if (successfulUploads.length < validFiles.length) {
      setModalState({
        isOpen: true,
        title: 'Erreur de téléchargement',
        message: 'Certaines photos n\'ont pas pu être téléchargées',
        type: 'error'
      });
    }

    setUploading(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrag = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
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

  const handlePhotoDragLeave = () => {
    setDragOverIndex(null);
  };

  const handlePhotoDrop = (e: ReactDragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    onPhotosChange(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const removePhoto = async (index: number) => {
    const photoUrl = photos[index];

    try {
      const urlParts = photoUrl.split('/article-photos/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('article-photos')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Error removing photo:', error);
    }

    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleImageEdited = async (newImageDataUrl: string) => {
    if (editingPhotoIndex === null) return;

    try {
      setUploading(true);

      const response = await fetch(newImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });

      const uploadedUrl = await uploadPhoto(file);

      if (uploadedUrl) {
        const oldPhotoUrl = photos[editingPhotoIndex];

        try {
          const urlParts = oldPhotoUrl.split('/article-photos/');
          if (urlParts.length === 2) {
            const filePath = urlParts[1];
            await supabase.storage.from('article-photos').remove([filePath]);
          }
        } catch (error) {
          console.error('Error removing old photo:', error);
        }

        const newPhotos = [...photos];
        newPhotos[editingPhotoIndex] = uploadedUrl;
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      console.error('Error replacing edited photo:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'enregistrement de l\'image editee',
        type: 'error'
      });
    } finally {
      setUploading(false);
      setEditingPhotoIndex(null);
    }
  };

  const handleAddAsNewPhoto = async (newImageDataUrl: string) => {
    if (photos.length >= maxPhotos) {
      setModalState({
        isOpen: true,
        title: 'Limite atteinte',
        message: `Vous avez atteint la limite de ${maxPhotos} photos`,
        type: 'warning'
      });
      setEditingPhotoIndex(null);
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(newImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });

      const uploadedUrl = await uploadPhoto(file);

      if (uploadedUrl) {
        onPhotosChange([...photos, uploadedUrl]);
      }
    } catch (error) {
      console.error('Error adding new photo:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout de la nouvelle photo',
        type: 'error'
      });
    } finally {
      setUploading(false);
      setEditingPhotoIndex(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      {editingPhotoIndex !== null && (
        <ImageEditor
          imageUrl={photos[editingPhotoIndex]}
          allPhotos={photos}
          currentPhotoIndex={editingPhotoIndex}
          onImageEdited={handleImageEdited}
          onAddAsNewPhoto={handleAddAsNewPhoto}
          onPhotoSelect={(index) => setEditingPhotoIndex(index)}
          onClose={() => setEditingPhotoIndex(null)}
        />
      )}

      <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-emerald-500'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {uploading ? 'Téléchargement en cours...' : 'Cliquez ou glissez-déposez des photos'}
        </p>
        <p className="text-xs text-gray-500">
          Jusqu'à {maxPhotos} photos • JPG, PNG, WebP • Max 5MB par photo
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {photos.length}/{maxPhotos} photos ajoutées
        </p>
      </div>

      {photos.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-2">
            Glissez-déposez les photos pour réorganiser leur ordre. La première photo sera la photo principale.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {photos.map((photo, index) => (
              <div
                key={photo}
                draggable
                onDragStart={(e) => handlePhotoDragStart(e, index)}
                onDragOver={(e) => handlePhotoDragOver(e, index)}
                onDragLeave={handlePhotoDragLeave}
                onDrop={(e) => handlePhotoDrop(e, index)}
                onDragEnd={handlePhotoDragEnd}
                className={`relative group aspect-square cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-2 left-2 p-1 bg-gray-900/70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPhotoIndex(index);
                    }}
                    className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    title="Éditer avec IA"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs rounded-md font-medium">
                    Photo principale
                  </div>
                )}
              </div>
            ))}
            {photos.length < maxPhotos && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Ajouter</p>
              </div>
            )}
          </div>
          {onAnalyzeClick && (
            <button
              type="button"
              onClick={onAnalyzeClick}
              disabled={analyzing}
              className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyse et Extraction des données en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyser l'article
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
