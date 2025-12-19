import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Product } from '../lib/supabase';

interface SoldModalProps {
  product: Product;
  onConfirm: (salePrice: number) => void;
  onClose: () => void;
}

export function SoldModal({ product, onConfirm, onClose }: SoldModalProps) {
  const [salePrice, setSalePrice] = useState(product.price);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(salePrice);
  };

  const profit = salePrice - (product.purchase_price || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Marquer comme vendu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Produit: <span className="font-medium text-gray-900">{product.title}</span>
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix de vente final (€)
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Prix d'achat:</span>
              <span className="font-medium">{(product.purchase_price || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Prix de vente:</span>
              <span className="font-medium">{salePrice.toFixed(2)}€</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium text-gray-900">Bénéfice:</span>
              <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
