import { Search, X, LayoutGrid, List, FileText, CheckCircle2, Clock, Send, DollarSign } from 'lucide-react';
import { ArticleStatus } from '../../types/article';

interface FamilyMember {
  id: string;
  name: string;
}

interface AdminFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | ArticleStatus;
  onStatusFilterChange: (value: 'all' | ArticleStatus) => void;
  typeFilter: 'all' | 'article' | 'lot';
  onTypeFilterChange: (value: 'all' | 'article' | 'lot') => void;
  sellerFilter: string;
  onSellerFilterChange: (value: string) => void;
  familyMembers: FamilyMember[];
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
}

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; activeColor: string }> = {
  draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600 border-slate-200', activeColor: 'bg-slate-600 text-white border-slate-600' },
  ready: { label: 'Pret', color: 'bg-blue-50 text-blue-600 border-blue-200', activeColor: 'bg-blue-600 text-white border-blue-600' },
  scheduled: { label: 'Planifie', color: 'bg-amber-50 text-amber-600 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500' },
  published: { label: 'Publie', color: 'bg-violet-50 text-violet-600 border-violet-200', activeColor: 'bg-violet-600 text-white border-violet-600' },
  sold: { label: 'Vendu', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
};

const renderStatusIcon = (status: ArticleStatus) => {
  const iconClass = 'w-3.5 h-3.5';
  switch (status) {
    case 'draft': return <FileText className={iconClass} />;
    case 'ready': return <CheckCircle2 className={iconClass} />;
    case 'scheduled': return <Clock className={iconClass} />;
    case 'published': return <Send className={iconClass} />;
    case 'sold': return <DollarSign className={iconClass} />;
    default: return null;
  }
};

export function AdminFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sellerFilter,
  onSellerFilterChange,
  familyMembers,
  viewMode,
  onViewModeChange,
}: AdminFiltersProps) {
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || sellerFilter !== 'all' || searchQuery.length > 0;

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onTypeFilterChange('all');
    onSellerFilterChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, marque, reference..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vue tableau"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vue grille"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onTypeFilterChange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => onTypeFilterChange('article')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              typeFilter === 'article'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            Articles
          </button>
          <button
            onClick={() => onTypeFilterChange('lot')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              typeFilter === 'lot'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
            }`}
          >
            Lots
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['draft', 'ready', 'scheduled', 'published', 'sold'] as ArticleStatus[]).map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => onStatusFilterChange(isActive ? 'all' : status)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isActive ? config.activeColor : config.color
                } hover:scale-105 active:scale-95`}
              >
                {renderStatusIcon(status)}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {familyMembers.length > 0 && (
          <>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <select
              value={sellerFilter}
              onChange={(e) => onSellerFilterChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="all">Tous les vendeurs</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
              <option value="none">Non assigne</option>
            </select>
          </>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="ml-auto px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  );
}
