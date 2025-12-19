import {
  TrendingUp,
  Package,
  ShoppingBag,
  Euro,
  Wallet,
  TrendingDown,
} from 'lucide-react';
import { Product } from '../lib/supabase';
import { Card, IconCircle, GradientStatCard, InfoRow } from './ui/UiKit';

interface StatsProps {
  products: Product[];
}

export function Stats({ products }: StatsProps) {
  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.status !== 'sold').length;
  const soldProducts = products.filter((p) => p.status === 'sold').length;

  const totalInvestment = products.reduce(
    (sum, p) => sum + (p.purchase_price || 0),
    0
  );

  const totalRevenue = products
    .filter((p) => p.status === 'sold')
    .reduce((sum, p) => sum + (p.sale_price || 0), 0);

  const totalPurchaseForSold = products
    .filter((p) => p.status === 'sold')
    .reduce((sum, p) => sum + (p.purchase_price || 0), 0);

  const totalProfit = totalRevenue - totalPurchaseForSold;

  const potentialRevenue = products
    .filter((p) => p.status !== 'sold')
    .reduce((sum, p) => sum + p.price, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(value);

  const profitVariant =
    totalProfit > 0 ? ('success' as const) : ('soft' as const);

  const profitTextClass =
    totalProfit > 0
      ? 'text-emerald-600'
      : totalProfit < 0
      ? 'text-rose-600'
      : 'text-slate-900';

  const stats = [
    {
      icon: Package,
      label: 'Total produits',
      value: totalProducts.toString(),
      variant: 'soft' as const,
    },
    {
      icon: ShoppingBag,
      label: 'Disponibles',
      value: availableProducts.toString(),
      variant: 'success' as const,
    },
    {
      icon: TrendingUp,
      label: 'Vendus',
      value: soldProducts.toString(),
      variant: 'solid' as const,
    },
    {
      icon: Euro,
      label: 'Bénéfice réalisé',
      value: formatCurrency(totalProfit),
      variant: profitVariant,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Stat cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">
                  {stat.value}
                </p>
              </div>
              <IconCircle icon={stat.icon} variant={stat.variant} />
            </div>
          </Card>
        ))}
      </div>

      {/* Bloc financier détaillé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <InfoRow
            icon={TrendingDown}
            title="Investissement total"
            description="Coût d'achat cumulé"
            value={formatCurrency(totalInvestment)}
            valueClassName="text-slate-900"
            separator={false}
          />
        </Card>

        <Card>
          <InfoRow
            icon={Wallet}
            title="Revenu total"
            description="Somme des ventes réalisées"
            value={formatCurrency(totalRevenue)}
            valueClassName="text-emerald-600"
            separator={false}
          />
        </Card>

        <GradientStatCard
          label="Revenu potentiel"
          value={formatCurrency(potentialRevenue)}
          sublabel="Si tous les articles disponibles sont vendus au prix actuel"
        />
      </div>
    </div>
  );
}
