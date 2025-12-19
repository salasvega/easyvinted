import React, { useState, useEffect, useRef } from 'react';
import { ProductData } from '../../lib/geminiService';
import { Tag, CheckCircle, DollarSign, Box, Copy, Check, Instagram, Mail, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductDetailsProps {
  products: ProductData[];
  loading: boolean;
  onProductUpdate?: (index: number, product: ProductData) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ products, loading, onProductUpdate }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const prevCountRef = useRef(0);

  useEffect(() => {
    if (products.length > 0 && prevCountRef.current === 0) {
      setExpandedIndex(0);
    } else if (products.length === 0) {
      setExpandedIndex(null);
    }
    prevCountRef.current = products.length;
  }, [products]);

  if (loading) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-6 py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-50 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center space-y-2">
           <p className="text-gray-900 font-semibold text-lg">Analyzing your product...</p>
           <p className="text-gray-500 text-sm">Identifying items and drafting content.</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
      <Box size={48} className="mb-4 opacity-50" />
      <p>Select a product to see details here.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="flex justify-between items-center sticky top-0 bg-gray-50/95 backdrop-blur-sm z-20 py-2 border-b border-gray-200/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Product Analysis</h2>
          <p className="text-xs text-gray-500">Found {products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-6">
        {products.map((product, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200">

            <div className="p-4 flex items-center gap-3 border-b border-gray-50">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <h3 className="font-bold text-gray-900">{product.title || 'Untitled Product'}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{product.category}</span>
                   <span className="text-xs font-medium text-green-600 flex items-center"><DollarSign size={10} />{product.priceEstimate}</span>
                </div>
              </div>
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="text-gray-400 hover:text-blue-600"
              >
                {expandedIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {expandedIndex === index && (
              <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                 <div className="my-4 border-t border-gray-100"></div>
                 <SingleProductView
                   data={product}
                   onUpdate={(updated) => onProductUpdate && onProductUpdate(index, updated)}
                 />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SingleProductView: React.FC<{
  data: ProductData;
  onUpdate?: (updated: ProductData) => void;
}> = ({ data, onUpdate }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [marketingTab, setMarketingTab] = useState<'social' | 'email' | 'seo'>('social');

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const LabelWithCopy = ({ label, text, fieldId }: { label: string, text: string, fieldId: string }) => (
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">{label}</label>
      <button
        onClick={() => handleCopy(text, fieldId)}
        className="text-gray-400 hover:text-blue-600 transition-colors"
        title={`Copy ${label}`}
      >
        {copiedField === fieldId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
           <LabelWithCopy label="Product Title" text={data.title || ''} fieldId="title" />
           <input
             type="text"
             value={data.title || ''}
             onChange={(e) => onUpdate?.({ ...data, title: e.target.value })}
             className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
             placeholder="Product Name"
           />
        </div>
        <div>
           <LabelWithCopy label="Category" text={data.category || ''} fieldId="category" />
           <input
             type="text"
             value={data.category || ''}
             onChange={(e) => onUpdate?.({ ...data, category: e.target.value })}
             className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
             placeholder="e.g. Men's T-Shirt"
           />
        </div>
         <div>
           <LabelWithCopy label="Price Estimate" text={data.priceEstimate || ''} fieldId="price" />
           <input
             type="text"
             value={data.priceEstimate || ''}
             onChange={(e) => onUpdate?.({ ...data, priceEstimate: e.target.value })}
             className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
             placeholder="$0.00"
           />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Box size={14} /> Description
           </h3>
           <button
              onClick={() => handleCopy(data.description, 'desc')}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Copy Description"
            >
              {copiedField === 'desc' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        </div>
        <textarea
          value={data.description || ''}
          onChange={(e) => onUpdate?.({ ...data, description: e.target.value })}
          className="w-full bg-transparent border-none p-0 text-sm text-gray-700 leading-relaxed focus:ring-0 resize-y min-h-[100px]"
          placeholder="Enter product description..."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Tag size={14} /> Key Features
          </h3>
          <button
              onClick={() => handleCopy((data.features || []).join('\n'), 'features')}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Copy Features List"
            >
              {copiedField === 'features' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        </div>
        <ul className="space-y-2">
          {data.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={14} />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.marketing && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 overflow-hidden">
          <div className="p-3 border-b border-blue-100 bg-white/50 backdrop-blur-sm">
             <h3 className="text-xs font-bold text-blue-900 flex items-center gap-2">
               <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px]">AI</span> Marketing Hub
             </h3>
          </div>

          <div className="flex border-b border-blue-100 bg-white/30">
            <button
              onClick={() => setMarketingTab('social')}
              className={`flex-1 py-2 text-xs font-medium flex justify-center items-center gap-2 ${marketingTab === 'social' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Instagram size={14} /> Social
            </button>
            <button
              onClick={() => setMarketingTab('email')}
              className={`flex-1 py-2 text-xs font-medium flex justify-center items-center gap-2 ${marketingTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mail size={14} /> Email
            </button>
            <button
              onClick={() => setMarketingTab('seo')}
              className={`flex-1 py-2 text-xs font-medium flex justify-center items-center gap-2 ${marketingTab === 'seo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Search size={14} /> SEO
            </button>
          </div>

          <div className="p-4">
            {marketingTab === 'social' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Caption</span>
                    <button
                      onClick={() => handleCopy(data.marketing!.instagramCaption, 'caption')}
                      className="text-blue-400 hover:text-blue-600"
                      title="Copy Caption"
                    >
                       {copiedField === 'caption' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border border-blue-50 italic">
                    {data.marketing.instagramCaption}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase block">Hashtags</span>
                    <button
                      onClick={() => handleCopy(data.marketing!.hashtags.map(t => `#${t}`).join(' '), 'hashtags')}
                      className="text-blue-400 hover:text-blue-600"
                      title="Copy Hashtags"
                    >
                       {copiedField === 'hashtags' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.marketing.hashtags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-white text-blue-600 px-1.5 py-0.5 rounded border border-blue-50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {marketingTab === 'email' && (
              <div>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Email Draft</span>
                    <button
                      onClick={() => handleCopy(data.marketing!.salesEmail, 'email')}
                      className="text-blue-400 hover:text-blue-600"
                      title="Copy Email"
                    >
                       {copiedField === 'email' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                <div className="bg-white p-3 rounded border border-blue-50 text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {data.marketing.salesEmail}
                </div>
              </div>
            )}

            {marketingTab === 'seo' && (
               <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block">Keywords</span>
                  <button
                      onClick={() => handleCopy(data.marketing!.seoKeywords.join(', '), 'seo')}
                      className="text-blue-400 hover:text-blue-600"
                      title="Copy Keywords"
                    >
                       {copiedField === 'seo' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.marketing?.seoKeywords?.map((keyword, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-800 text-white rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
