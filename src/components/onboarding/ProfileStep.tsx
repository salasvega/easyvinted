import { useState } from 'react';

interface ProfileStepProps {
  onNext: (data: ProfileData) => void;
  initialData?: ProfileData;
}

export interface ProfileData {
  name: string;
  age: string;
  top_size: string;
  bottom_size: string;
  shoe_size: string;
}

const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const BOTTOM_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50'];
const SHOE_SIZES = Array.from({ length: 30 }, (_, i) => (i + 20).toString());

export default function ProfileStep({ onNext, initialData }: ProfileStepProps) {
  const [formData, setFormData] = useState<ProfileData>(
    initialData || {
      name: '',
      age: '',
      top_size: '',
      bottom_size: '',
      shoe_size: '',
    }
  );

  const isValid = formData.name.trim() !== '' && formData.age.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onNext(formData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Créons votre profil</h2>
        <p className="text-gray-600">Commençons par les informations de base</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre nom"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre âge"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Taille haut</label>
            <select
              value={formData.top_size}
              onChange={(e) => setFormData({ ...formData, top_size: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner</option>
              {TOP_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Taille bas</label>
            <select
              value={formData.bottom_size}
              onChange={(e) => setFormData({ ...formData, bottom_size: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner</option>
              {BOTTOM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pointure</label>
            <select
              value={formData.shoe_size}
              onChange={(e) => setFormData({ ...formData, shoe_size: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner</option>
              {SHOE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Suivant
        </button>
      </form>
    </div>
  );
}
