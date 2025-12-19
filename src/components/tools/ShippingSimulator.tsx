import React, { useEffect, useMemo, useState } from "react";

export type CarrierId =
  | "mondial_relay"
  | "colissimo"
  | "chrono_shop2shop"
  | "relais_colis"
  | "ups_access"
  | "lettre_suivie";

type ArticleKind =
  | "tshirt"
  | "pull"
  | "pantalon"
  | "veste"
  | "manteau"
  | "chaussures"
  | "sac"
  | "echarpe"
  | "lot";

type Band = { label: string; maxWeight: number; price: number };

export interface ShippingEstimate {
  carrierId: CarrierId | null;
  carrierLabel: string | null;
  price: number | null;
  weight: number | null;
  bandLabel: string | null;
  bestCarrier?: {
    carrierId: CarrierId;
    label: string;
    price: number;
  } | null;
  suggestedPriceMin?: number | null;
  suggestedPriceMax?: number | null;
}

interface LotArticle {
  id: string;
  title: string;
  main_category: string;
  subcategory: string;
  item_category: string;
  estimated_weight?: number | null;
}

interface ShippingSimulatorProps {
  title: string;
  price: number | null;
  mainCategory: string;
  subcategory: string;
  itemCategory: string;
  onEstimateChange?: (estimate: ShippingEstimate) => void;
  lotArticles?: LotArticle[];
}

// === Grilles tarifaires (indicatives 2025, à ajuster si besoin) ===

const COLISSIMO_BANDS: Band[] = [
  { label: "Jusqu'à 250 g", maxWeight: 250, price: 5.25 },
  { label: "250 à 500 g", maxWeight: 500, price: 7.35 },
  { label: "500 à 750 g", maxWeight: 750, price: 8.65 },
  { label: "750 g à 1 kg", maxWeight: 1000, price: 9.4 },
  { label: "1 à 2 kg", maxWeight: 2000, price: 10.7 },
  { label: "2 à 5 kg", maxWeight: 5000, price: 16.6 },
  { label: "5 à 10 kg", maxWeight: 10000, price: 24.2 },
  { label: "10 à 15 kg", maxWeight: 15000, price: 30.55 },
  { label: "15 à 30 kg", maxWeight: 30000, price: 37.85 },
];

const MONDIAL_RELAY_BANDS: Band[] = [
  { label: "Jusqu'à 500 g", maxWeight: 500, price: 4.5 },
  { label: "500 g à 1 kg", maxWeight: 1000, price: 5.0 },
  { label: "1 à 2 kg", maxWeight: 2000, price: 5.6 },
  { label: "2 à 3 kg", maxWeight: 3000, price: 6.1 },
  { label: "3 à 5 kg", maxWeight: 5000, price: 7.0 },
  { label: "5 à 10 kg", maxWeight: 10000, price: 8.5 },
];

const CHRONO_SHOP2SHOP_BANDS: Band[] = [
  { label: "Jusqu'à 500 g", maxWeight: 500, price: 4.4 },
  { label: "500 g à 1 kg", maxWeight: 1000, price: 4.9 },
  { label: "1 à 2 kg", maxWeight: 2000, price: 5.4 },
  { label: "2 à 3 kg", maxWeight: 3000, price: 5.9 },
  { label: "3 à 5 kg", maxWeight: 5000, price: 6.9 },
];

const RELAIS_COLIS_BANDS: Band[] = [
  { label: "Jusqu'à 500 g", maxWeight: 500, price: 4.3 },
  { label: "500 g à 1 kg", maxWeight: 1000, price: 4.8 },
  { label: "1 à 2 kg", maxWeight: 2000, price: 5.3 },
  { label: "2 à 5 kg", maxWeight: 5000, price: 6.5 },
];

const UPS_ACCESS_BANDS: Band[] = [
  { label: "Jusqu'à 500 g", maxWeight: 500, price: 5.0 },
  { label: "500 g à 1 kg", maxWeight: 1000, price: 5.7 },
  { label: "1 à 2 kg", maxWeight: 2000, price: 6.4 },
  { label: "2 à 5 kg", maxWeight: 5000, price: 7.5 },
];

const LETTRE_SUIVIE_BANDS: Band[] = [
  { label: "Jusqu'à 100 g", maxWeight: 100, price: 2.5 },
  { label: "100 à 250 g", maxWeight: 250, price: 3.5 },
];

const CARRIER_CONFIG: {
  id: CarrierId;
  label: string;
  short: string;
  description: string;
  bands: Band[];
}[] = [
  {
    id: "mondial_relay",
    label: "Mondial Relay",
    short: "Relay",
    description: "Point relais, très utilisé sur Vinted",
    bands: MONDIAL_RELAY_BANDS,
  },
  {
    id: "colissimo",
    label: "Colissimo",
    short: "Colissimo",
    description: "La Poste, livraison à domicile",
    bands: COLISSIMO_BANDS,
  },
  {
    id: "chrono_shop2shop",
    label: "Chrono Shop2Shop",
    short: "Shop2Shop",
    description: "Points relais Chronopost",
    bands: CHRONO_SHOP2SHOP_BANDS,
  },
  {
    id: "relais_colis",
    label: "Relais Colis",
    short: "Relais Colis",
    description: "Réseau relais alternatif",
    bands: RELAIS_COLIS_BANDS,
  },
  {
    id: "ups_access",
    label: "UPS Access Point",
    short: "UPS",
    description: "Réseau UPS Access Point",
    bands: UPS_ACCESS_BANDS,
  },
  {
    id: "lettre_suivie",
    label: "Lettre suivie",
    short: "Lettre",
    description: "Accessoires très légers (bijoux, petits textiles)",
    bands: LETTRE_SUIVIE_BANDS,
  },
];

// Types d'articles et poids moyens
const ARTICLE_TYPE_CONFIG: {
  kind: ArticleKind;
  label: string;
  emoji: string;
  avgWeight: number;
}[] = [
  { kind: "tshirt", label: "T-shirt", emoji: "👕", avgWeight: 150 },
  { kind: "pull", label: "Pull", emoji: "🧶", avgWeight: 500 },
  { kind: "pantalon", label: "Pantalon", emoji: "👖", avgWeight: 450 },
  { kind: "veste", label: "Veste", emoji: "🧥", avgWeight: 600 },
  { kind: "manteau", label: "Manteau", emoji: "🧥", avgWeight: 1200 },
  { kind: "chaussures", label: "Chaussures", emoji: "👟", avgWeight: 900 },
  { kind: "sac", label: "Sac à main", emoji: "👜", avgWeight: 400 },
  { kind: "echarpe", label: "Écharpe", emoji: "🧣", avgWeight: 200 },
  { kind: "lot", label: "Lot d'articles", emoji: "📦", avgWeight: 0 },
];

// Devine le type d’article à partir des métadonnées
function inferKindFromMetadata(
  mainCategory: string,
  itemCategory: string,
  title: string
): ArticleKind | undefined {
  const source = `${mainCategory} ${itemCategory} ${title}`.toLowerCase();

  if (source.includes("t-shirt") || source.includes("tee shirt") || source.includes("tshirt")) {
    return "tshirt";
  }
  if (source.includes("pull") || source.includes("sweat")) {
    return "pull";
  }
  if (source.includes("pantalon") || source.includes("jean")) {
    return "pantalon";
  }
  if (source.includes("veste") || source.includes("blouson")) {
    return "veste";
  }
  if (source.includes("manteau") || source.includes("parka")) {
    return "manteau";
  }
  if (source.includes("chaussure") || source.includes("sneaker") || source.includes("basket")) {
    return "chaussures";
  }
  if (source.includes("sac")) {
    return "sac";
  }
  if (source.includes("écharpe") || source.includes("echarpe") || source.includes("foulard")) {
    return "echarpe";
  }

  return undefined;
}

function getBandForWeight(bands: Band[], weightGrams: number | null) {
  if (!weightGrams || weightGrams <= 0) return null;
  const band = bands.find((b) => weightGrams <= b.maxWeight) ?? bands[bands.length - 1];
  return band;
}

// Calcule une fourchette de prix conseillé
function computeSuggestedPriceRange(
  basePrice: number | null | undefined,
  shippingPrice: number | null
): { min: number | null; max: number | null } {
  if (!shippingPrice && !basePrice) return { min: null, max: null };

  const base = basePrice && basePrice > 0 ? basePrice : shippingPrice ?? 0;

  // logique simple :
  // min = prix + 50% des frais de port
  // max = prix * 1.3 (petite marge)
  const min = Math.round((base + (shippingPrice ?? 0) * 0.5) * 100) / 100;
  const max = Math.round(base * 1.3 * 100) / 100;

  return { min, max };
}

// Calcule le poids d'un article basé sur ses métadonnées
function estimateArticleWeight(article: LotArticle): number {
  if (article.estimated_weight && article.estimated_weight > 0) {
    return article.estimated_weight;
  }

  const kind = inferKindFromMetadata(
    article.main_category,
    article.item_category,
    article.title
  );

  if (kind) {
    const config = ARTICLE_TYPE_CONFIG.find((t) => t.kind === kind);
    if (config) {
      return config.avgWeight;
    }
  }

  return 400;
}

// Calcule le poids total d'un lot d'articles
function calculateLotWeight(articles: LotArticle[]): number {
  if (!articles || articles.length === 0) return 0;
  return articles.reduce((total, article) => total + estimateArticleWeight(article), 0);
}

// Retourne le poids maximal supporté par un transporteur
function getMaxWeightForCarrier(bands: Band[]): number {
  if (bands.length === 0) return 0;
  return Math.max(...bands.map(b => b.maxWeight));
}

// Filtre les transporteurs qui peuvent gérer le poids donné
function getAvailableCarriers(weight: number | null): typeof CARRIER_CONFIG {
  if (!weight) return CARRIER_CONFIG;
  return CARRIER_CONFIG.filter(carrier => {
    const maxWeight = getMaxWeightForCarrier(carrier.bands);
    return weight <= maxWeight;
  });
}

export const ShippingSimulator: React.FC<ShippingSimulatorProps> = ({
  title,
  price,
  mainCategory,
  subcategory,
  itemCategory,
  onEstimateChange,
  lotArticles,
}) => {
  const inferredKind = useMemo(() => {
    if (lotArticles && lotArticles.length > 0) {
      return "lot";
    }
    return inferKindFromMetadata(mainCategory, itemCategory, title);
  }, [mainCategory, itemCategory, title, lotArticles]);

  const [selectedKind, setSelectedKind] = useState<ArticleKind | "">(inferredKind ?? "");
  const [customWeight, setCustomWeight] = useState<string>("");
  const [carrierId, setCarrierId] = useState<CarrierId>("mondial_relay");
  const [userHasSelectedCarrier, setUserHasSelectedCarrier] = useState(false);

  // Synchronise selectedKind avec inferredKind quand il change
  useEffect(() => {
    if (inferredKind) {
      setSelectedKind(inferredKind);
    }
  }, [inferredKind]);

  const typeConfig = ARTICLE_TYPE_CONFIG.find((t) => t.kind === selectedKind);

  const effectiveWeight = useMemo(() => {
    const custom = Number(customWeight.replace(",", "."));
    if (!Number.isNaN(custom) && custom > 0) {
      return Math.round(custom);
    }

    if (selectedKind === "lot" && lotArticles && lotArticles.length > 0) {
      return calculateLotWeight(lotArticles);
    }

    if (typeConfig) {
      return typeConfig.avgWeight;
    }
    return null;
  }, [customWeight, typeConfig, selectedKind, lotArticles]);

  const availableCarriers = useMemo(
    () => getAvailableCarriers(effectiveWeight),
    [effectiveWeight]
  );

  const carrierConfig = CARRIER_CONFIG.find((c) => c.id === carrierId)!;
  const band = getBandForWeight(carrierConfig.bands, effectiveWeight ?? null);

  const bestCarrier = useMemo(() => {
    if (!effectiveWeight) return null;
    let best: { carrierId: CarrierId; label: string; price: number } | null = null;

    for (const c of availableCarriers) {
      const b = getBandForWeight(c.bands, effectiveWeight);
      if (!b) continue;
      if (!best || b.price < best.price) {
        best = { carrierId: c.id, label: c.label, price: b.price };
      }
    }
    return best;
  }, [effectiveWeight, availableCarriers]);

  // Réinitialise le flag de sélection manuelle quand le poids change
  useEffect(() => {
    setUserHasSelectedCarrier(false);
  }, [effectiveWeight]);

  // Vérifie si le transporteur sélectionné peut gérer le poids, sinon bascule vers le meilleur
  useEffect(() => {
    const isCurrentCarrierAvailable = availableCarriers.some(c => c.id === carrierId);
    if (!isCurrentCarrierAvailable && bestCarrier) {
      setCarrierId(bestCarrier.carrierId);
      setUserHasSelectedCarrier(false);
    }
  }, [availableCarriers, carrierId, bestCarrier]);

  // Sélectionne automatiquement le meilleur transporteur si l'utilisateur n'a pas fait de choix manuel
  useEffect(() => {
    if (!userHasSelectedCarrier && bestCarrier) {
      setCarrierId(bestCarrier.carrierId);
    }
  }, [bestCarrier, userHasSelectedCarrier]);

  const { min: suggestedPriceMin, max: suggestedPriceMax } = useMemo(
    () => computeSuggestedPriceRange(price ?? null, band?.price ?? null),
    [price, band?.price]
  );

  // Remonte l’estimation vers ArticleFormPage
  useEffect(() => {
    if (!onEstimateChange) return;

    const estimate: ShippingEstimate = {
      carrierId: band ? carrierId : null,
      carrierLabel: band ? carrierConfig.label : null,
      price: band ? band.price : null,
      weight: effectiveWeight,
      bandLabel: band ? band.label : null,
      bestCarrier: bestCarrier ?? null,
      suggestedPriceMin,
      suggestedPriceMax,
    };

    onEstimateChange(estimate);
  }, [
    band,
    carrierId,
    carrierConfig.label,
    effectiveWeight,
    bestCarrier,
    suggestedPriceMin,
    suggestedPriceMax,
    onEstimateChange,
  ]);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white text-sm shadow-sm">
            📦
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Simulateur de frais de port
            </h2>
            <p className="text-[11px] text-slate-500">
              Compare les transporteurs et ajuste ton prix.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
          France métropolitaine
        </span>
      </div>

      {/* Type d'article + poids */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Type d'article */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Type d&apos;article
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 py-2.5 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value as ArticleKind | "")}
            >
              <option value="">Sélectionner…</option>
              {ARTICLE_TYPE_CONFIG.map((t) => {
                if (t.kind === "lot" && (!lotArticles || lotArticles.length === 0)) {
                  return null;
                }
                return (
                  <option key={t.kind} value={t.kind}>
                    {t.emoji} {t.label}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400 text-xs">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {selectedKind === "lot" && lotArticles ? (
              <>
                Lot de <span className="font-medium">{lotArticles.length} article{lotArticles.length > 1 ? "s" : ""}</span>
              </>
            ) : (
              <>
                Article :{" "}
                <span className="font-medium">{title || "Non renseigné"}</span>
              </>
            )}
          </p>
        </div>

        {/* Poids personnalisé */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Poids personnalisé (g)
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder={
              selectedKind === "lot" && lotArticles && lotArticles.length > 0
                ? `Sinon ~${calculateLotWeight(lotArticles)} g seront calculés`
                : typeConfig
                ? `Sinon ~${typeConfig.avgWeight} g seront utilisés`
                : "Saisir le poids estimé du colis"
            }
            value={customWeight}
            onChange={(e) => setCustomWeight(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            {selectedKind === "lot"
              ? "Le poids saisi remplace le poids calculé du lot."
              : "Le poids saisi remplace le poids moyen si renseigné."}
          </p>
        </div>
      </div>

      {/* Détail du poids du lot si applicable */}
      {selectedKind === "lot" && lotArticles && lotArticles.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-blue-200/80 bg-blue-50/50 px-3.5 py-3 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-blue-700 font-semibold">Détail du poids du lot</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {lotArticles.map((article, idx) => {
              const weight = estimateArticleWeight(article);
              return (
                <div key={article.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-700 truncate flex-1">
                    {idx + 1}. {article.title}
                  </span>
                  <span className="font-medium text-slate-900 whitespace-nowrap">
                    ~{weight} g
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-200">
            <span className="text-blue-700 font-semibold">Poids total estimé</span>
            <span className="text-sm font-bold text-blue-900">
              {calculateLotWeight(lotArticles)} g
            </span>
          </div>
        </div>
      )}

      {/* Transporteurs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-700">Transporteur</p>
          {effectiveWeight && availableCarriers.length < CARRIER_CONFIG.length && (
            <p className="text-[10px] text-amber-600 italic">
              {CARRIER_CONFIG.length - availableCarriers.length} transporteur{CARRIER_CONFIG.length - availableCarriers.length > 1 ? 's' : ''} non adapté{CARRIER_CONFIG.length - availableCarriers.length > 1 ? 's' : ''} au poids
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100/80 p-1.5 border border-slate-200/80">
          {availableCarriers.map((c) => {
            const isActive = c.id === carrierId;
            const isBestPrice = bestCarrier && c.id === bestCarrier.carrierId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCarrierId(c.id);
                  setUserHasSelectedCarrier(true);
                }}
                className={[
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all relative",
                  "flex items-center gap-1.5",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 border border-transparent hover:bg-white/60",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? "bg-emerald-500" : "bg-slate-300",
                  ].join(" ")}
                />
                {c.short}
                {isBestPrice && (
                  <span className="ml-0.5 inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Meilleur prix
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">{carrierConfig.description}</p>
      </div>

      {/* Résumé des frais */}
      <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 text-xs text-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600">Poids estimé</span>
          <span className="font-semibold">
            {effectiveWeight ? `${effectiveWeight} g` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600">Transporteur recommandé</span>
          <span className="font-semibold">
            {band ? carrierConfig.label : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600">Frais de port estimés</span>
          <span className="font-semibold">
            {band ? `${band.price.toFixed(2)} €` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600">Prix conseillé</span>
          <span className="font-semibold">
            {suggestedPriceMin && suggestedPriceMax
              ? `${suggestedPriceMin.toFixed(2)} € – ${suggestedPriceMax.toFixed(2)} €`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};
