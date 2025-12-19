import React, { useState, useCallback, useEffect } from 'react';
import { analyzeProductImage, editProductImage } from './services/geminiservice';
import { saveToInventory } from './services/historyservice';
import ImageUploader from './components/imageuploader';
import ProductDetails from './components/productdetails';
import EditorPanel from './components/editorpanel';
import InventoryDrawer from './components/inventorydrawer';
import { ProductData, AppState, InventoryItem } from './types';
import { ArrowLeft, Image as ImageIcon, ShoppingBag, AlertCircle, FileText, Wand2, Download, PackageOpen, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'studio'>('details');
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Derived state for the currently displayed image
  const currentImage = editHistory[historyIndex] || null;

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImage]);

  const handleImageSelected = useCallback(async (base64: string, type: string) => {
    setOriginalImage(base64);
    // Initialize history with the original image
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
        // Create new history up to current point, then add new image
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newImageBase64);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      
      setAppState(AppState.READY);
    } catch (err) {
      console.error(err);
      setError("Failed to edit image. Please try a different prompt.");
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
      // Reset history to just the original image
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
      link.download = `snapsell-${type}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStartOver = () => {
    setOriginalImage(null);
    setEditHistory([]);
    setHistoryIndex(-1);
    setProducts([]);
    setAppState(AppState.IDLE);
    setError(null);
    setActiveTab('details');
  };

  const handleSaveToInventory = (itemsToSave: ProductData[]) => {
    if (!originalImage) return;
    
    let successCount = 0;
    
    itemsToSave.forEach(product => {
      const item: InventoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        productData: product,
        imageData: originalImage,
        mimeType: mimeType
      };
      
      if (saveToInventory(item)) {
        successCount++;
      }
    });

    if (successCount < itemsToSave.length) {
      setError("Inventory full! Some items could not be saved.");
    }
  };

  const handleLoadFromInventory = (item: InventoryItem) => {
    setOriginalImage(item.imageData);
    setEditHistory([item.imageData]);
    setHistoryIndex(0);
    setMimeType(item.mimeType);
    setProducts([item.productData]);
    setAppState(AppState.READY);
    setError(null);
    setActiveTab('details');
    setIsInventoryOpen(false);
  };

  const handleProductUpdate = (index: number, updatedProduct: ProductData) => {
    setProducts(prev => {
      const newProducts = [...prev];
      newProducts[index] = updatedProduct;
      return newProducts;
    });
  };

  // Zoom Handlers
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
    
    // Allow standard scrolling if zoom is 1 and scrolling down (deltaY > 0)
    // This lets users scroll the page when the image is fully visible
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" role="button" onClick={handleStartOver}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">SnapSell AI</span>
          </div>
          
          <div className="flex items-center gap-3">
             <button
              onClick={() => setIsInventoryOpen(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-all"
            >
              <PackageOpen size={20} />
              <span className="hidden sm:inline">Inventory</span>
            </button>
            
            {originalImage && (
              <>
                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                <button 
                  onClick={handleStartOver}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft size={18} /> 
                  <span className="hidden sm:inline">New Scan</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Inventory Drawer */}
      <InventoryDrawer 
        isOpen={isInventoryOpen} 
        onClose={() => setIsInventoryOpen(false)} 
        onLoadItem={handleLoadFromInventory}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
        
        {/* State: No Image Selected (Onboarding) */}
        {!originalImage && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-xl w-full text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Turn Photos into <span className="text-indigo-600">Sales</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                  Upload a product photo. Our AI will write the description and help you edit the image instantly.
                </p>
              </div>

              <div className="bg-white p-1 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                 <div className="p-6 sm:p-8">
                    <ImageUploader onImageSelected={handleImageSelected} />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  { icon: ImageIcon, title: 'Upload', desc: 'Any product photo', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: FileText, title: 'Analyze', desc: 'Get title & features', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { icon: Wand2, title: 'Edit', desc: 'AI-powered studio', color: 'text-indigo-600', bg: 'bg-indigo-50' }
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

        {/* State: Image Selected (Workspace) */}
        {originalImage && (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
            
            {/* Left Panel: Image Preview (Sticky on Desktop, Top on Mobile) */}
            <div 
              className="w-full lg:w-1/2 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] bg-white relative flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 lg:h-full h-[40vh] shrink-0 group overflow-hidden select-none"
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
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-indigo-900">AI is editing...</span>
                    </div>
                  </div>
                )}
              </div>

               {/* Visual Drag Indicator (Visible when zoomed) */}
               {zoom > 1 && (
                 <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full backdrop-blur-md shadow-sm border border-white/20 flex items-center gap-2 pointer-events-none transition-all duration-300 ${isDragging ? 'bg-indigo-600/90 text-white shadow-indigo-500/20 scale-105' : 'bg-white/80 text-gray-600 hover:bg-white'}`}>
                    <Move size={14} className={isDragging ? 'animate-pulse' : ''} />
                    <span className="text-xs font-semibold tracking-wide">{isDragging ? 'Panning' : 'Drag to pan'}</span>
                 </div>
               )}

               {/* Image Badges */}
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                 {currentImage !== originalImage && (
                  <span className="px-3 py-1 bg-indigo-600/90 backdrop-blur text-white text-xs font-bold rounded-full shadow-lg border border-white/20 animate-in fade-in slide-in-from-top-2">
                    EDITED
                  </span>
                 )}
              </div>

              {/* Download Button */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={handleDownload}
                  className="p-3 bg-white/90 backdrop-blur-md text-gray-700 rounded-full hover:bg-white hover:text-indigo-600 hover:shadow-lg transition-all border border-gray-200/50 transform hover:scale-105 active:scale-95"
                  title="Download Image"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Zoom Controls */}
              {currentImage && (
                <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
                  <button
                    onClick={handleZoomIn}
                    className="p-2.5 bg-white/90 backdrop-blur-md text-gray-700 rounded-full hover:bg-white hover:text-indigo-600 shadow-lg border border-gray-200/50 transition-all active:scale-95"
                    title="Zoom In"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2.5 bg-white/90 backdrop-blur-md text-gray-700 rounded-full hover:bg-white hover:text-indigo-600 shadow-lg border border-gray-200/50 transition-all active:scale-95"
                    title="Zoom Out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  {zoom > 1 && (
                    <button
                      onClick={handleResetZoom}
                      className="p-2.5 bg-indigo-600/90 backdrop-blur-md text-white rounded-full hover:bg-indigo-700 shadow-lg border border-indigo-500/50 transition-all active:scale-95"
                      title="Reset View"
                    >
                      <Maximize2 size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Error Toast */}
              {error && (
                <div className="absolute bottom-6 left-6 right-16 mx-auto max-w-sm bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-5 z-30">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-red-800 font-medium text-sm">Action Failed</h3>
                    <p className="text-red-700 text-xs mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
                </div>
              )}
            </div>

            {/* Right Panel: Tabbed Interface */}
            <div className="w-full lg:w-1/2 flex flex-col h-full bg-white relative z-10">
              
              {/* Tab Navigation */}
              <div className="flex items-center border-b border-gray-200 px-4 pt-4 gap-6 shrink-0 bg-white z-10 sticky top-0">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                    activeTab === 'details' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText size={18} />
                  Product Details
                  {activeTab === 'details' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                    activeTab === 'studio' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Wand2 size={18} />
                  AI Studio
                  {activeTab === 'studio' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                {activeTab === 'details' ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <ProductDetails 
                      products={products} 
                      loading={appState === AppState.ANALYZING} 
                      onSave={appState === AppState.READY ? handleSaveToInventory : undefined}
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
};

export default App;