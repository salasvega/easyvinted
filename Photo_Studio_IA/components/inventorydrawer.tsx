import React, { useEffect, useState } from 'react';
import { X, Trash2, Calendar, PackageOpen, ChevronRight, Search, ArchiveX } from 'lucide-react';
import { InventoryItem } from '../types';
import { getInventory, deleteFromInventory, clearInventory } from '../services/historyservice';

interface InventoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadItem: (item: InventoryItem) => void;
}

const InventoryDrawer: React.FC<InventoryDrawerProps> = ({ isOpen, onClose, onLoadItem }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadItems = () => {
    setItems(getInventory());
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setSearchQuery(''); // Reset search when opening
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFromInventory(id);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    if (window.confirm("Are you sure you want to delete all items from your inventory? This cannot be undone.")) {
      clearInventory();
      setItems([]);
    }
  };

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.productData.title.toLowerCase().includes(query) ||
      item.productData.category?.toLowerCase().includes(query) ||
      item.productData.description?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity animate-in fade-in" 
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-100 z-10 shadow-sm">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                 <PackageOpen size={20} />
              </div>
              My Inventory
            </h2>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear All"
                >
                  <ArchiveX size={20} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="px-5 pb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <PackageOpen size={32} className="opacity-40" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Your inventory is empty</p>
                <p className="text-sm mt-1 opacity-70">Save analyzed products to build your catalog.</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-6">
              <Search size={32} className="opacity-30 mb-3" />
              <p className="text-sm">No items found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => onLoadItem(item)}
                className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex gap-3 relative overflow-hidden"
              >
                <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                  <img 
                    src={`data:${item.mimeType};base64,${item.imageData}`} 
                    alt={item.productData.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                      {item.productData.title}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                     <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                       {item.productData.priceEstimate || 'N/A'}
                     </span>
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-100">
                  <button 
                       onClick={(e) => handleDelete(e, item.id)}
                       className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                       title="Delete"
                     >
                       <Trash2 size={14} />
                  </button>
                  <div className="w-px bg-gray-200 my-1"></div>
                  <div className="p-1.5 text-indigo-600">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryDrawer;