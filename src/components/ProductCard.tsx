import { Package2, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Product } from '../lib/supabase';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onMarkAsSold: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete, onMarkAsSold }: ProductCardProps) {
  const profit = product.status === 'sold' && product.sale_price
    ? product.sale_price - (product.purchase_price || 0)
    : product.price - (product.purchase_price || 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package2 className="w-16 h-16 text-gray-400" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.status === 'sold' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {product.status === 'sold' ? 'Vendu' : 'Disponible'}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
          {product.brand && <span className="font-medium">{product.brand}</span>}
          {product.size && <span className="text-gray-500">• Taille {product.size}</span>}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {product.status === 'sold' && product.sale_price ? product.sale_price : product.price}€
            </span>
            <span className="text-sm text-gray-500 ml-2">
              (Acheté: {product.purchase_price}€)
            </span>
          </div>
        </div>

        <div className={`text-sm font-medium mb-3 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€ de bénéfice
        </div>

        <div className="flex gap-2">
          {product.status !== 'sold' && (
            <button
              onClick={() => onMarkAsSold(product)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Marquer vendu
            </button>
          )}
          <button
            onClick={() => onEdit(product)}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
