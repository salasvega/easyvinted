import { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, X, Palette, Store, User, Shirt, Undo2, Redo2, RotateCcw, Check, Move, Download, Info, Plus, Replace, SplitSquareHorizontal } from 'lucide-react';
import { editProductImage } from '../lib/geminiService';
import { compressImage, formatFileSize } from '../lib/imageCompression';

interface ImageEditorProps {
  imageUrl: string;
  allPhotos: string[];
  currentPhotoIndex: number;
  onImageEdited: (newImageDataUrl: string) => void;
  onAddAsNewPhoto?: (newImageDataUrl: string) => void;
  onClose: () => void;
  onPhotoSelect?: (index: number) => void;
}

const SMART_BACKGROUND_PROMPT = `
Analyze the garment (color, material, style) and how it is presented (on hanger, flatlay, etc.) in the image, then change the background strictly following these rules:

1. **Light / white clothing**: Use a slightly textured, light neutral surface (light concrete, cool beige, or light pearl grey) to avoid "white on white" disappearance. Ensure soft contrast.
2. **Dark clothing (black, navy, charcoal)**: Use pure white, off-white, or light cream. Optionally add very subtle texture.
3. **Natural textiles (linen, wool, organic)**: Use light wood, beige linen fabric, or kraft/light brown paper to create visual continuity.
4. **Streetwear / Sport**: Use light concrete, soft metal texture, or a simple neutral urban wall. Style should be modern/editorial but clean.
5. **Elegant pieces (dresses, suits)**: Use sophisticated neutrals (light grey, warm beige) with very light texture. Avoid busy patterns.
6. **Photos on hanger/rack**: Use pure white, light beige, or a very simple clean wall. Keep vertical silhouette clear.
7. **Flatlay photos**: Use white photo paper, matte white cardboard, light wood, or very light linen fabric.

**Conflict Resolution**: If multiple rules apply, prioritize in this order:
1. Presentation type (hanger vs flatlay)
2. Style (streetwear/elegant)
3. Color (light vs dark)
4. Material.

**Default**: If unsure, use a clean, pure white studio background with a very soft, realistic shadow.

**Goal**: High readability, clean modern background, no visual noise, strict preservation of the product and labels.
`;

const ACTION_PROMPTS = {
  PLACE: `Action: Place. Place the product in the most appropriate setting, surface, or environment (hanger, clothing rack, wooden table, clean bedspread, minimalist boutique shelf, neutral interior) to showcase it in the most flattering and realistic way. Identify the garment type, style, color. Select a background that enhances it. Keep style realistic, clean, natural. Add soft consistent shadows. Strictly preserve the product details (logos, text, shapes).`,
  FOLD: `Action: Fold. Fold the garment naturally according to standard retail presentation and place it on the most appropriate support (wooden table, white matte board, linen fabric, shelf, bedspread). Maintain perfect realism, correct lighting, natural shadows. The folded shape must remain true to the garment's real proportions. Strictly preserve the product details (logos, text, shapes).`,
  TRY_ON: `Action: Real-Life Try-On. Display the garment worn or held by a realistic human model, in a natural, everyday context (street, neutral interior). Determine correct model type. Keep model realistic, neutral. Integrate garment with perfect physical accuracy (fit, drape, fabric behavior). NO distortion. Strictly preserve the product details.`
};

export function ImageEditor({ imageUrl, allPhotos, currentPhotoIndex, onImageEdited, onAddAsNewPhoto, onClose, onPhotoSelect }: ImageEditorProps) {
  const [instruction, setInstruction] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditHistory([imageUrl]);
    setHistoryIndex(0);
  }, [imageUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  const currentImage = editHistory[historyIndex] || imageUrl;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;
  const hasEdited = historyIndex > 0;

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImage]);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      if (zoom === 1 && e.deltaY > 0) return;

      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.25;

      setZoom(prev => {
        const newZoom = Math.min(Math.max(prev + delta, 1), 5);
        if (newZoom === 1) setPan({ x: 0, y: 0 });
        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoom]);

  const handleEdit = async (customPrompt?: string) => {
    const promptToUse = typeof customPrompt === 'string' ? customPrompt : instruction;

    if (!promptToUse.trim()) {
      setError('Veuillez entrer une instruction');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(currentImage);
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

      const editedImageBase64 = await editProductImage(base64, mimeType, promptToUse);

      const editedImageDataUrl = `data:${mimeType};base64,${editedImageBase64}`;

      const responseEdited = await fetch(editedImageDataUrl);
      const editedBlob = await responseEdited.blob();
      const tempFile = new File([editedBlob], 'edited-image.jpg', { type: 'image/jpeg' });

      const compressionResult = await compressImage(tempFile);
      console.log(`Compressed edited image: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);

      const compressedBlob = compressionResult.file;
      const compressedDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedBlob);
      });

      setEditHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(compressedDataUrl);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);

      if (typeof customPrompt !== 'string') {
        setInstruction('');
      }
    } catch (err) {
      console.error('Error editing image:', err);

      let errorMessage = 'Erreur lors de l\'édition de l\'image';

      if (err instanceof Error) {
        if (err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'Quota Gemini dépassé. Le modèle de génération d\'images Gemini nécessite un compte avec facturation activée. Veuillez activer la facturation sur console.cloud.google.com ou utiliser une clé API avec crédit disponible.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setEditHistory([imageUrl]);
    setHistoryIndex(0);
    setError(null);
    setShowComparison(false);
  };

  const handleAddAsNew = () => {
    if (onAddAsNewPhoto && hasEdited) {
      onAddAsNewPhoto(currentImage);
      onClose();
    }
  };

  const handleReplace = () => {
    onImageEdited(currentImage);
    onClose();
  };

  const handleComparisonDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setComparisonPosition(x);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 5));
  const handleZoomOut = () => {
    setZoom(z => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement de l\'image');
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[80] overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl z-[100]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate"> Studio Magik-AI</h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">By AXS Design</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div ref={infoRef} className="relative hidden lg:block">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Info size={18} />
                <span>{showInfo ? 'Masquer' : 'Infos'}</span>
              </button>

              {showInfo && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white border-2 border-blue-300 rounded-xl p-5 shadow-2xl z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 bg-blue-100 rounded-lg p-2">
                      <Sparkles className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-900 font-bold text-base mb-2">
                        Studio Magik-AI - By AXS Design
                      </h3>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        Décrivez les modifications que vous souhaitez apporter pour mettre en valeur votre article et laissez Studio Magik-AI les réaliser: Il peut remplacer l'arrière-plan (fond blanc studio, béton gris, bois clair...), améliorer la luminosité, centrer le produit, placer le vêtement à plat ou le plier si vous etes mauvais (si-si)! Si vous êtes trop moche pour le montrer porté sur vous, cliquez sur le bouton "Try-On" ou encore mieux demandez à notre Assistant Studio (dans les instructions personnalisées) de le faire porter par un modèle de votre choix! En bref, Laissez vous guider par votre créativité, notre seule limite est votre imagination! 
                      </p>
                    </div>
                    <button
                      onClick={() => setShowInfo(false)}
                      className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 rounded-lg p-1"
                      title="Fermer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 relative">
          {/* Colonne de gauche - Photo principale et miniatures */}
          <div className="flex flex-col space-y-4 relative z-0 h-full">
            {/* Photo principale */}
            <div
              ref={imageContainerRef}
              className="flex-1 min-h-[400px] bg-slate-100 rounded-xl overflow-hidden relative select-none z-0"
            >
              {showComparison && hasEdited ? (
                <div
                  ref={comparisonRef}
                  className="absolute inset-0 cursor-ew-resize"
                  onMouseMove={handleComparisonDrag}
                  onClick={handleComparisonDrag}
                >
                  <div className="absolute inset-0">
                    <img
                      src={currentImage}
                      alt="Image editee"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                  >
                    <img
                      src={imageUrl}
                      alt="Image originale"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${comparisonPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <SplitSquareHorizontal size={18} className="text-slate-600" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                    Avant
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                    Apres
                  </div>
                </div>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={currentImage}
                    alt="Image a editer"
                    draggable={false}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                    className={`w-full h-full object-contain origin-center ${processing ? 'opacity-50 blur-sm' : ''}`}
                  />
                </div>
              )}

              {!showComparison && zoom > 1 && (
                <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-[5] px-4 py-2 rounded-full backdrop-blur-md shadow-sm border border-white/20 flex items-center gap-2 pointer-events-none transition-all duration-300 ${isDragging ? 'bg-blue-600/90 text-white shadow-blue-500/20 scale-105' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
                  <Move size={14} className={isDragging ? 'animate-pulse' : ''} />
                  <span className="text-xs font-semibold tracking-wide">{isDragging ? 'Deplacement' : 'Glisser pour deplacer'}</span>
                </div>
              )}

              {!showComparison && hasEdited && !processing && (
                <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 z-[5]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Editee ({historyIndex} modif.)</span>
                </div>
              )}
              {!showComparison && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 z-[5]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Magik-AI</span>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 flex items-center justify-center z-[10]">
                  <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-slate-900">Edition en cours...</span>
                  </div>
                </div>
              )}

              {/* Boutons de navigation et telechargement - en overlay */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-[5]">
                {hasEdited && (
                  <button
                    type="button"
                    onClick={() => setShowComparison(!showComparison)}
                    className={`p-2.5 rounded-lg transition-all shadow-lg ${showComparison ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200'}`}
                    title="Comparer avant/apres"
                  >
                    <SplitSquareHorizontal className="w-5 h-5" />
                  </button>
                )}
                <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200 p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={`p-2 rounded-md transition-all ${canUndo ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                    title="Annuler"
                  >
                    <Undo2 size={18} />
                  </button>
                  <div className="w-px h-5 bg-slate-300 mx-0.5"></div>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className={`p-2 rounded-md transition-all ${canRedo ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                    title="Refaire"
                  >
                    <Redo2 size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                  title="Telecharger l'image"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Miniatures des autres photos */}
            {allPhotos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allPhotos.map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onPhotoSelect && onPhotoSelect(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colonne de droite - AI Magic Editor */}
          <div className="space-y-6">

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              AI Magic Editor
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleEdit(SMART_BACKGROUND_PROMPT)}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Palette size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center">Smart Bg</span>
              </button>

              <button
                type="button"
                onClick={() => handleEdit(ACTION_PROMPTS.PLACE)}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
              >
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Store size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">Place</span>
              </button>

              <button
                type="button"
                onClick={() => handleEdit(ACTION_PROMPTS.TRY_ON)}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
              >
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <User size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">Try-On</span>
              </button>

              <button
                type="button"
                onClick={() => handleEdit(ACTION_PROMPTS.FOLD)}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
              >
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Shirt size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">Fold</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center gap-2 mb-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ou personnalisé</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Instruction personnalisée
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Ajoute un arrière-plan avec des plantes..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={processing}
            />
          </div>

          <div className="flex gap-3">
            {hasEdited && (
              <button
                type="button"
                onClick={handleReset}
                disabled={processing}
                className="px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Reinitialiser a l'image originale"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleEdit()}
              disabled={processing || !instruction.trim()}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Edition...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Editer</span>
                </>
              )}
            </button>
          </div>

          {hasEdited && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm font-medium text-emerald-800 mb-3">
                Image editee avec succes ! Que souhaitez-vous faire ?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleAddAsNew}
                  disabled={processing || !onAddAsNewPhoto}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title={!onAddAsNewPhoto ? "Non disponible" : "Ajouter l'image editee comme nouvelle photo"}
                >
                  <Plus className="w-5 h-5" />
                  <span>Ajouter comme nouvelle photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleReplace}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Replace className="w-5 h-5" />
                  <span>Remplacer l'originale</span>
                </button>
              </div>
            </div>
          )}

          {!hasEdited && (
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="w-full mt-4 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              <span>Fermer</span>
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
