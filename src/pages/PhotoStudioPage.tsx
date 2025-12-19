import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeProductImage, editProductImage, ProductData } from '../lib/openaiService';
import { ImageUploader } from '../components/photostudio/ImageUploader';
import { ProductDetails } from '../components/photostudio/ProductDetails';
import { EditorPanel } from '../components/photostudio/EditorPanel';
import { Image as ImageIcon, Wand2, FileText, Download, ZoomIn, ZoomOut, Maximize2, Move, AlertCircle, Plus } from 'lucide-react';

enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  EDITING = 'EDITING',
  ERROR = 'ERROR'
}

export function PhotoStudioPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'studio'>('details');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImage = editHistory[historyIndex] || null;

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImage]);

  const handleImageSelected = useCallback(async (base64: string, type: string) => {
    setOriginalImage(base64);
    setEditHistory([base64]);
    setHistoryIndex(0);
    setMimeType(type);
    setAppState(AppState.ANALYZING);
    setError(null);
    setProducts([]);
    setActiveTab('details');

    try {
      const detectedProducts = await analyzeProductImage(base64, type);
      setProducts(detectedProducts);
      setAppState(AppState.READY);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleEditImage = useCallback(async (prompt: string) => {
    if (!currentImage) return;

    setAppState(AppState.EDITING);
    setError(null);

    try {
      const newImageBase64 = await editProductImage(currentImage, mimeType, prompt);

      setEditHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newImageBase64);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);

      setAppState(AppState.READY);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to edit image. Please try a different prompt.");
      setAppState(AppState.READY);
    }
  }, [currentImage, mimeType, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleResetImage = () => {
    if (originalImage) {
      setEditHistory([originalImage]);
      setHistoryIndex(0);
    }
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = `data:${mimeType};base64,${currentImage}`;
      const extension = mimeType.split('/')[1] || 'jpg';
      const type = currentImage !== originalImage ? 'edited' : 'original';
      link.download = `easyvinted-studio-${type}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleProductUpdate = (index: number, updatedProduct: ProductData) => {
    setProducts(prev => {
      const newProducts = [...prev];
      newProducts[index] = updatedProduct;
      return newProducts;
    });
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

  const handleWheel = (e: React.WheelEvent) => {
    if (!currentImage) return;

    if (zoom === 1 && e.deltaY > 0) return;

    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.25;

    setZoom(prev => {
      const newZoom = Math.min(Math.max(prev + delta, 1), 5);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const type = result.split(';')[0].split(':')[1];
        handleImageSelected(base64, type);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 -m-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Photo Studio IA</h1>
            <p className="text-sm text-gray-600 mt-1">
              Analysez et éditez vos photos de produits avec l'IA
            </p>
          </div>
        </div>
      </div>

      <main className="w-full">

        {!originalImage && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 min-h-[calc(100vh-200px)]">
            <div className="max-w-xl w-full text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Transformez vos photos en <span className="text-blue-600">ventes</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                  Uploadez une photo de produit. Notre IA va analyser l'image et vous proposer des modifications.
                </p>
              </div>

              <div className="bg-white p-1 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                 <div className="p-6 sm:p-8">
                    <ImageUploader onImageSelected={handleImageSelected} />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  { icon: ImageIcon, title: 'Upload', desc: 'Photo du produit', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: FileText, title: 'Analyse', desc: 'Détails et contenu', color: 'text-green-600', bg: 'bg-green-50' },
                  { icon: Wand2, title: 'Edition', desc: 'Studio IA', color: 'text-orange-600', bg: 'bg-orange-50' }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`p-2 rounded-lg ${feature.bg} ${feature.color}`}>
                      <feature.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {originalImage && (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-150px)] overflow-hidden">

            <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 lg:h-full shrink-0">
            <div
              className="flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] bg-white relative flex flex-col h-[40vh] lg:h-auto group overflow-hidden select-none"
              onWheel={handleWheel}
            >
              <div
                className="absolute inset-0 p-6 flex items-center justify-center overflow-hidden"
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {currentImage && (
                  <img
                    src={`data:${mimeType};base64,${currentImage}`}
                    alt="Product"
                    draggable={false}
                    style={{
                       transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                       transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                    className={`w-full h-full object-contain origin-center ${appState === AppState.EDITING ? 'opacity-50 blur-[2px] transition-all duration-500' : ''}`}
                  />
                )}

                {appState === AppState.EDITING && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in zoom-in duration-300">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-blue-900">L'IA édite l'image...</span>
                    </div>
                  </div>
                )}
              </div>

               {zoom > 1 && (
                 <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full backdrop-blur-md shadow-sm border border-white/20 flex items-center gap-2 pointer-events-none transition-all duration-300 ${isDragging ? 'bg-blue-600/90 text-white shadow-blue-500/20 scale-105' : 'bg-white/80 text-gray-600 hover:bg-white'}`}>
                    <Move size={14} className={isDragging ? 'animate-pulse' : ''} />
                    <span className="text-xs font-semibold tracking-wide">{isDragging ? 'Déplacement' : 'Glisser pour déplacer'}</span>
                 </div>
               )}

              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                 {currentImage !== originalImage && (
                  <span className="px-3 py-1 bg-blue-600/90 backdrop-blur text-white text-xs font-bold rounded-full shadow-lg border border-white/20 animate-in fade-in slide-in-from-top-2">
                    ÉDITÉE
                  </span>
                 )}
              </div>

              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={handleDownload}
                  className="p-3 bg-white/90 backdrop-blur-md text-gray-700 rounded-full hover:bg-white hover:text-blue-600 hover:shadow-lg transition-all border border-gray-200/50 transform hover:scale-105 active:scale-95"
                  title="Télécharger l'image"
                >
                  <Download size={20} />
                </button>
              </div>

              {currentImage && (
                <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
                  <button
                    onClick={handleZoomIn}
                    className="p-2.5 bg-white/90 backdrop-blur-md text-gray-700 rounded-full hover:bg-white hover:text-blue-600 shadow-lg border border-gray-200/50 transition-all active:scale-95"
                    title="Zoom avant"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2.5 bg-white/90 backdrop-blur-md text-gray-700 rounded-full hover:bg-white hover:text-blue-600 shadow-lg border border-gray-200/50 transition-all active:scale-95"
                    title="Zoom arrière"
                  >
                    <ZoomOut size={18} />
                  </button>
                  {zoom > 1 && (
                    <button
                      onClick={handleResetZoom}
                      className="p-2.5 bg-blue-600/90 backdrop-blur-md text-white rounded-full hover:bg-blue-700 shadow-lg border border-blue-500/50 transition-all active:scale-95"
                      title="Réinitialiser la vue"
                    >
                      <Maximize2 size={18} />
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="absolute bottom-6 left-6 right-16 mx-auto max-w-sm bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-5 z-30">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-red-800 font-medium text-sm">Action échouée</h3>
                    <p className="text-red-700 text-xs mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
                </div>
              )}
            </div>

              <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 ring-2 ring-blue-100 shrink-0">
                    {currentImage && (
                      <img
                        src={`data:${mimeType};base64,${currentImage}`}
                        alt="Miniature"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 font-medium">Ajouter</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col h-full bg-white relative z-10">

              <div className="flex items-center border-b border-gray-200 px-4 pt-4 gap-6 shrink-0 bg-white z-10 sticky top-0">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                    activeTab === 'details' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText size={18} />
                  Détails Produit
                  {activeTab === 'details' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                    activeTab === 'studio' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Wand2 size={18} />
                  Studio IA
                  {activeTab === 'studio' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                {activeTab === 'details' ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <ProductDetails
                      products={products}
                      loading={appState === AppState.ANALYZING}
                      onProductUpdate={handleProductUpdate}
                    />
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                    <EditorPanel
                      onEdit={handleEditImage}
                      onReset={handleResetImage}
                      onDownload={handleDownload}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      canUndo={historyIndex > 0}
                      canRedo={historyIndex < editHistory.length - 1}
                      loading={appState === AppState.EDITING || appState === AppState.ANALYZING}
                      hasEditedImage={currentImage !== originalImage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
