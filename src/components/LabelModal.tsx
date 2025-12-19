import { X, Printer } from 'lucide-react';
import { Button } from './ui/Button';

interface LotArticle {
  title: string;
  brand?: string;
}

interface LabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    reference_number: string;
    title: string;
    brand?: string;
    size?: string;
    color?: string;
    price: number;
  };
  sellerName?: string;
  lotArticles?: LotArticle[];
}

export function LabelModal({ isOpen, onClose, article, sellerName, lotArticles }: LabelModalProps) {
  if (!isOpen) return null;

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => {
      window.print();
    }, 100);

    return false;
  };

  const isLot = lotArticles && lotArticles.length > 0;
  const uniqueBrands = isLot ? [...new Set(lotArticles.map(a => a.brand).filter(Boolean))] : [];

  const labelContent = (
    <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          EasyVinted {sellerName && `by ${sellerName}`}
        </h3>
        <div className="inline-block border-2 border-gray-900 px-4 py-2 rounded">
          <span className="text-sm font-medium text-gray-900">Réf: </span>
          <span className="text-lg font-bold text-gray-900">{article.reference_number}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Article{isLot ? 's' : ''}</p>
          {isLot ? (
            <>
              <p className="text-lg font-bold text-gray-900 mb-2">Lot ({lotArticles.length} article{lotArticles.length > 1 ? 's' : ''})</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {lotArticles.map((lotArticle, idx) => (
                  <li key={idx} className="text-sm text-gray-900">{lotArticle.title}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-lg font-bold text-gray-900">{article.title}</p>
          )}
        </div>

        {(isLot ? uniqueBrands.length > 0 : article.brand) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Marque{isLot && uniqueBrands.length > 1 ? 's' : ''}</p>
            {isLot ? (
              <p className="text-base text-gray-900">{uniqueBrands.join(', ')}</p>
            ) : (
              <p className="text-base text-gray-900">{article.brand}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {article.size && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Taille</p>
              <p className="text-base text-gray-900">{article.size}</p>
            </div>
          )}

          {article.color && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Couleur</p>
              <p className="text-base text-gray-900">{article.color}</p>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Prix de vente</p>
          <p className="text-2xl font-bold text-emerald-600">{article.price.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[75] flex items-center justify-center p-4 no-print">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Étiquette de colis</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Imprimez cette étiquette et collez la sur votre colis.
              </p>
                <p className="text-sm text-blue-800">
                Vous pourrez identifier plus facilement son contenu le jour de l'expedition :) 
              </p>
            </div>

            {labelContent}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer l'étiquette
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="print-only">
        {labelContent}
      </div>

      <style>{`
        .no-print {
          display: block;
        }

        .print-only {
          display: none;
        }

        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          html, body {
            height: auto;
            overflow: visible;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
            width: 180mm;
            padding: 0;
            margin: 0;
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          .print-only > div {
            border: 2px solid #000 !important;
            border-radius: 8px;
            padding: 15mm;
            background: white;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
