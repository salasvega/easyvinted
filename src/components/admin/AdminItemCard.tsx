import { memo } from 'react';
import { Package, FileText, CheckCircle2, Clock, Send, DollarSign, Eye, ClipboardEdit, Upload, Flower2, Sun, Leaf, Snowflake, CloudSun, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArticleStatus, Season } from '../../types/article';
import { LazyImage } from '../ui/LazyImage';

interface AdminItem {
  id: string;
  type: 'article' | 'lot';
  title: string;
  brand?: string;
  size?: string;
  price: number;
  status: ArticleStatus;
  photos: string[];
  created_at: string;
  season?: Season;
  scheduled_for?: string;
  seller_id?: string;
  seller_name?: string;
  published_at?: string;
  sold_at?: string;
  sold_price?: number;
  net_profit?: number;
  reference_number?: string;
  lot_article_count?: number;
  isInLot?: boolean;
}

interface AdminItemCardProps {
  item: AdminItem;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onStatusClick: () => void;
  formatDate: (date?: string) => string;
  currentPhotoIndex: number;
  onPreviousPhoto: (e: React.MouseEvent) => void;
  onNextPhoto: (e: React.MouseEvent) => void;
}

const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Brouillon',
  ready: 'Pret',
  scheduled: 'Planifie',
  published: 'Publie',
  sold: 'Vendu',
};

const STATUS_COLORS: Record<ArticleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  ready: 'bg-blue-100 text-blue-700 border-blue-200',
  scheduled: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-violet-100 text-violet-700 border-violet-200',
  sold: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const renderStatusIcon = (status: ArticleStatus) => {
  const iconClass = 'w-3 h-3';
  switch (status) {
    case 'draft': return <FileText className={iconClass} />;
    case 'ready': return <CheckCircle2 className={iconClass} />;
    case 'scheduled': return <Clock className={iconClass} />;
    case 'published': return <Send className={iconClass} />;
    case 'sold': return <DollarSign className={iconClass} />;
    default: return null;
  }
};

const renderSeasonIcon = (season?: Season) => {
  const iconClass = 'w-3.5 h-3.5';
  switch (season) {
    case 'spring': return <Flower2 className={`${iconClass} text-pink-500`} />;
    case 'summer': return <Sun className={`${iconClass} text-orange-500`} />;
    case 'autumn': return <Leaf className={`${iconClass} text-amber-600`} />;
    case 'winter': return <Snowflake className={`${iconClass} text-blue-500`} />;
    case 'all-seasons': return <CloudSun className={`${iconClass} text-slate-500`} />;
    default: return <CloudSun className={`${iconClass} text-slate-300`} />;
  }
};

const AdminItemCardComponent = ({
  item,
  onView,
  onEdit,
  onPublish,
  onStatusClick,
  formatDate,
  currentPhotoIndex,
  onPreviousPhoto,
  onNextPhoto,
}: AdminItemCardProps) => {
  const getDateInfo = () => {
    if (item.status === 'sold' && item.sold_at) {
      return { label: 'Vendu', date: item.sold_at };
    }
    if (item.status === 'scheduled' && item.scheduled_for) {
      return { label: 'Planifie', date: item.scheduled_for };
    }
    return { label: 'Cree', date: item.created_at };
  };

  const dateInfo = getDateInfo();
  const photos = Array.isArray(item.photos) ? item.photos : [];

  return (
    <div
      onClick={onView}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-square bg-slate-100">
        {photos.length > 0 ? (
          <>
            <LazyImage
              src={photos[currentPhotoIndex]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-slate-300" />
                </div>
              }
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={onPreviousPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {photos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentPhotoIndex
                          ? 'bg-white w-4'
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-slate-300" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg ${
              item.type === 'lot' ? 'bg-violet-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {item.type === 'lot' ? 'Lot' : 'Article'}
            </span>
            {item.type === 'article' && item.season && (
              <span className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg">
                {renderSeasonIcon(item.season)}
              </span>
            )}
          </div>
          {item.type === 'article' && item.isInLot && (
            <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
              Dans un lot
            </span>
          )}
        </div>

        {item.type === 'lot' && item.lot_article_count && (
          <div className="absolute top-3 right-3">
            <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-xs font-medium">{item.lot_article_count} articles</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick();
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border backdrop-blur-sm ${STATUS_COLORS[item.status]} hover:scale-105 transition-transform`}
          >
            {renderStatusIcon(item.status)}
            {STATUS_LABELS[item.status]}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {item.brand || 'Sans marque'}
            {item.size && ` • ${item.size}`}
          </p>
          {item.reference_number && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{item.reference_number}</p>
          )}
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{item.price.toFixed(0)}€</p>
            {item.status === 'sold' && item.net_profit !== undefined && (
              <p className={`text-xs font-semibold ${item.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.net_profit >= 0 ? '+' : ''}{item.net_profit.toFixed(0)}€ net
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{dateInfo.label}</p>
            <p className="text-xs text-slate-600">{formatDate(dateInfo.date)}</p>
          </div>
        </div>

        {item.seller_name && (
          <p className="text-xs text-slate-500 mb-3">
            Vendeur: <span className="font-medium text-slate-700">{item.seller_name}</span>
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Voir
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ClipboardEdit className="w-3.5 h-3.5" />
            Modifier
          </button>
          {(item.status === 'ready' || item.status === 'scheduled') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPublish();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Publier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminItemCard = memo(AdminItemCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.photos === nextProps.item.photos &&
    prevProps.currentPhotoIndex === nextProps.currentPhotoIndex
  );
});
