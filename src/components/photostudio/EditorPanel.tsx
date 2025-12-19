import React, { useState, useRef, useEffect } from 'react';
import { Wand2, RotateCcw, Download, Sparkles, Undo2, Redo2, Palette, Store, Shirt, User, Info, X } from 'lucide-react';

interface EditorPanelProps {
  onEdit: (prompt: string) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  loading: boolean;
  hasEditedImage: boolean;
  onDownload: () => void;
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

export const EditorPanel: React.FC<EditorPanelProps> = ({
  onEdit,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  loading,
  hasEditedImage,
  onDownload
}) => {
  const [prompt, setPrompt] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onEdit(prompt);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto">
      <div ref={infoRef} className="relative mb-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-200 text-sm font-medium shadow-sm hover:shadow-md"
        >
          <Info size={18} />
          {showInfo ? 'Masquer les infos' : 'Infos'}
        </button>

        {showInfo && (
          <div className="mt-3 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Sparkles className="text-blue-600" size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-900 font-bold text-base mb-2 flex items-center gap-2">
                  Studio Photo IA - Gemini 2.5 Flash Image
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Décrivez les modifications que vous souhaitez. Gemini peut remplacer l'arrière-plan (fond blanc studio, béton gris, bois clair), améliorer la luminosité, centrer le produit, ou placer le vêtement à plat. L'IA préserve l'aspect original du produit.
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <Sparkles className="text-orange-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-orange-900 text-sm mb-1">Fonctionnalité limitée avec OpenAI</h4>
            <p className="text-orange-800 text-xs leading-relaxed">
              L'édition d'images n'est pas disponible avec OpenAI. Pour utiliser cette fonctionnalité, configurez Gemini en ajoutant VITE_GEMINI_API_KEY dans votre fichier .env.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wand2 className="text-blue-600" size={20} />
            AI Magic Editor
          </h3>

          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-all ${canUndo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-all ${canRedo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

          <button
            onClick={() => onEdit(SMART_BACKGROUND_PROMPT)}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Palette size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Smart Bg</span>
          </button>

          <button
            onClick={() => onEdit(ACTION_PROMPTS.PLACE)}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Store size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Place</span>
          </button>

          <button
            onClick={() => onEdit(ACTION_PROMPTS.TRY_ON)}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
          >
            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <User size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Try-On</span>
          </button>

          <button
            onClick={() => onEdit(ACTION_PROMPTS.FOLD)}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
          >
            <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Shirt size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Fold</span>
          </button>
        </div>

        <div className="relative flex items-center gap-2 mb-4">
            <div className="h-px bg-blue-200 flex-1"></div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">CUSTOM EDIT</span>
            <div className="h-px bg-blue-200 flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your edit (e.g., 'Add a sunset background')..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-800 resize-none h-24 shadow-sm"
            disabled={loading}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="absolute right-3 bottom-3 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            title="Generate"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Sparkles size={20} />}
          </button>
        </form>
      </div>

      {hasEditedImage && (
        <div className="mt-0 pt-6 border-t border-gray-200">
           <h4 className="text-sm font-semibold text-gray-900 mb-4">Export Results</h4>
           <div className="flex gap-3">
             <button
              onClick={onDownload}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download size={18} /> Download Image
            </button>
            <button
              onClick={onReset}
              className="py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition flex items-center gap-2"
              title="Reset to original"
            >
              <RotateCcw size={18} />
            </button>
           </div>
        </div>
      )}
    </div>
  );
};
