import {
  X,
  Package,
  Calendar,
  User,
  FileText,
  ShoppingBag,
  Truck,
  CreditCard,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react';

interface SaleDetailModalProps {
  sale: {
    id: string;
    title: string;
    brand: string;
    price: number;
    sold_price: number;
    sold_at: string;
    platform: string;
    shipping_cost: number;
    fees: number;
    net_profit: number;
    photos: string[];
    buyer_name?: string;
    sale_notes?: string;
    seller_name?: string;
  };
  onClose: () => void;
}

export function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const totalCosts = sale.fees + sale.shipping_cost;
  const profitRate =
    sale.sold_price > 0 ? Math.round((sale.net_profit / sale.sold_price) * 100) : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-white md:rounded-3xl shadow-2xl max-w-5xl w-full h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/70">
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 md:gap-4 min-w-0">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-md">
                <BadgeCheck className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-lg md:text-2xl font-semibold text-slate-900 truncate">
                  Vente réalisée
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(sale.sold_at)}</span>
                  </span>

                  <span className="h-3 w-px bg-slate-200 hidden sm:inline-block" />

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px] md:max-w-[160px]">
                      {sale.platform}
                    </span>
                  </span>

                  {sale.price > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-600">
                      Prix initial&nbsp;: {sale.price.toFixed(2)} €
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Résumé financier compact en haut à droite */}
            <div className="hidden md:flex flex-col items-end gap-2">
             

             
            </div>

            {/* Bouton fermer (mobile + desktop) */}
            <button
              onClick={onClose}
              className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* CONTENU */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70">
          <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">
              {/* Colonne gauche : visuel + infos article + personnes */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  {sale.photos.length > 0 ? (
                    <img
                      src={sale.photos[0]}
                      alt={sale.title}
                      className="w-full aspect-square rounded-2xl object-cover mb-4"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Package className="w-16 h-16 md:w-20 md:h-20 text-slate-300" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-snug">
                      {sale.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">{sale.brand}</p>
                  </div>
                </div>

                {(sale.buyer_name || sale.seller_name) && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Personnes impliquées
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sale.buyer_name && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 text-white">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px] md:max-w-[160px]">
                            Acheteur&nbsp;: {sale.buyer_name}
                          </span>
                        </div>
                      )}

                      {sale.seller_name && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px] md:max-w-[160px]">
                            Vendeur&nbsp;: {sale.seller_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Petit rappel ID de la vente */}
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                    Identifiant EasyVinted
                  </p>
                  <p className="text-xs font-mono text-slate-600 truncate">{sale.id}</p>
                </div>
              </div>

              {/* Colonne droite : Détail transaction */}
              <div className="lg:col-span-2 space-y-4 md:space-y-5">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Détail de la transaction
                    </h4>

                    {/* Résumé financier pour mobile (en haut à droite du bloc) */}
                    <div className="md:hidden inline-flex flex-col items-end gap-1">
                      <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 px-3 py-1.5 text-right shadow">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-100 font-semibold">
                          Bénéfice net
                        </p>
                        <p className="text-base font-semibold text-white">
                          {sale.net_profit.toFixed(2)} €
                        </p>
                      </div>
                      {profitRate !== null && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>{profitRate}% de marge</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Prix de vente */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            Prix de vente
                          </p>
                          <p className="text-xs text-slate-500">
                            Montant payé par l’acheteur
                          </p>
                        </div>
                      </div>
                      <p className="text-base md:text-lg font-semibold text-slate-900 ml-2 flex-shrink-0">
                        {sale.sold_price.toFixed(2)} €
                      </p>
                    </div>

                    {/* Frais de plateforme */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4.5 h-4.5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            Frais de plateforme
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            Commission {sale.platform}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-rose-600 ml-2 flex-shrink-0">
                        − {sale.fees.toFixed(2)} €
                      </p>
                    </div>

                    {/* Frais d’expédition */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4.5 h-4.5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            Frais d’expédition
                          </p>
                          <p className="text-xs text-slate-500">
                            Participation aux coûts d’envoi
                          </p>
                        </div>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-amber-600 ml-2 flex-shrink-0">
                        − {sale.shipping_cost.toFixed(2)} €
                      </p>
                    </div>

                    {/* Coûts totaux */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4.5 h-4.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            Coûts totaux
                          </p>
                          <p className="text-xs text-slate-500">
                            Frais de plateforme + expédition
                          </p>
                        </div>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-slate-700 ml-2 flex-shrink-0">
                        {totalCosts.toFixed(2)} €
                      </p>
                    </div>

                    {/* Bénéfice net - bloc final bien mis en avant */}
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-4 md:px-5 md:py-5 flex items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-emerald-900 tracking-wide uppercase">
                          Résultat de la vente
                        </p>
                        <p className="text-sm text-emerald-800">
                          Bénéfice net après tous les frais
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-semibold text-emerald-700">
                          {sale.net_profit.toFixed(2)} €
                        </p>
                        {profitRate !== null && (
                          <p className="text-xs text-emerald-700/80 mt-0.5">
                            
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes de vente */}
                {sale.sale_notes && (
                  <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-amber-100">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-amber-900 mb-1.5">
                          Notes de vente
                        </h4>
                        <p className="text-sm text-amber-900/90 whitespace-pre-wrap leading-relaxed">
                          {sale.sale_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton fermer en bas (mobile friendly) */}
            <div className="pt-1 pb-3">
              <button
                onClick={onClose}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg active:scale-[0.98]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
