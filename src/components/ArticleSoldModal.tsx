import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Article } from '../types/article';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SaleData {
  soldPrice: number;
  soldAt: string;
  platform: string;
  fees: number;
  shippingCost: number;
  buyerName: string;
  notes: string;
  sellerId?: string;
}

interface ArticleSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (saleData: SaleData) => void;
  article: Article;
  initialData?: {
    soldPrice: number;
    soldAt: string;
    platform: string;
    fees: number;
    shippingCost: number;
    buyerName?: string;
    notes?: string;
    sellerId?: string;
  };
}

export function ArticleSoldModal({ isOpen, onClose, onConfirm, article, initialData }: ArticleSoldModalProps) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [soldPrice, setSoldPrice] = useState(
    initialData?.soldPrice?.toString() || article.price.toString()
  );
  const [soldAt, setSoldAt] = useState(
    initialData?.soldAt ? new Date(initialData.soldAt).toISOString().split('T')[0] : today
  );
  const [platform, setPlatform] = useState(initialData?.platform || 'Vinted');
  const [fees, setFees] = useState(initialData?.fees?.toString() || '0');
  const [shippingCost, setShippingCost] = useState(initialData?.shippingCost?.toString() || '0');
  const [buyerName, setBuyerName] = useState(initialData?.buyerName || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [sellerId, setSellerId] = useState<string>(initialData?.sellerId || article.seller_id || '');
  const [familyMembers, setFamilyMembers] = useState<Array<{id: string; name: string; is_default: boolean}>>([]);

  useEffect(() => {
    if (isOpen && user) {
      loadFamilyMembers();
    }
  }, [isOpen, user]);

  async function loadFamilyMembers() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, name, is_default')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  }

  if (!isOpen) return null;

  const handleConfirm = () => {
    const price = parseFloat(soldPrice);
    const platformFees = parseFloat(fees);
    const shipping = parseFloat(shippingCost);

    if (price > 0) {
      onConfirm({
        soldPrice: price,
        soldAt: new Date(soldAt).toISOString(),
        platform,
        fees: platformFees,
        shippingCost: shipping,
        buyerName,
        notes,
        sellerId: sellerId || undefined,
      });
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {initialData ? 'Modifier la vente' : 'Enregistrer une vente'}
                </h3>
                <p className="text-sm text-gray-600">{article.title}</p>
                <p className="text-xs text-gray-500 mt-1">Prix initial : {article.price.toFixed(2)} €</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Prix de vente final (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="25.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Date de vente *
                </label>
                <input
                  type="date"
                  value={soldAt}
                  onChange={(e) => setSoldAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Plateforme de vente *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Vinted">Vinted</option>
                <option value="Leboncoin">Leboncoin</option>
                <option value="Ebay">Ebay</option>
                <option value="Facebook Marketplace">Facebook Marketplace</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Frais et coûts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Frais de plateforme (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Commission prélevée par la plateforme</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Frais de livraison (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Coût d'envoi du colis</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Informations complémentaires</h4>
              <div className="space-y-4">
                {familyMembers.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Vendu par
                    </label>
                    <select
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez un vendeur</option>
                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} {member.is_default ? '(par défaut)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Nom de l'acheteur (optionnel)
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Ajoutez des notes sur cette vente..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-700">
                <p className="font-medium mb-1">Bénéfice net estimé</p>
                <p>
                  {soldPrice && !isNaN(parseFloat(soldPrice)) ? (
                    <>
                      {(parseFloat(soldPrice) - parseFloat(fees || '0') - parseFloat(shippingCost || '0')).toFixed(2)} €
                      <span className="text-emerald-600 ml-1">
                        (Prix de vente - Frais)
                      </span>
                    </>
                  ) : (
                    'Entrez le prix de vente pour voir le calcul'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!soldPrice || parseFloat(soldPrice) <= 0 || !soldAt}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? 'Enregistrer les modifications' : 'Enregistrer la vente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
