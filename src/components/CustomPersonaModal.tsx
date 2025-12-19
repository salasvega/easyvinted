import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: CustomPersonaData) => void;
  initialData?: CustomPersonaData | null;
  basePersonaId?: string;
}

export interface CustomPersonaData {
  name: string;
  description: string;
  writing_style: string;
  emoji: string;
  color: string;
}

const COLOR_OPTIONS = [
  { name: 'Bleu', value: 'bg-blue-100 border-blue-300 hover:border-blue-500' },
  { name: 'Rose', value: 'bg-pink-100 border-pink-300 hover:border-pink-500' },
  { name: 'Violet', value: 'bg-purple-100 border-purple-300 hover:border-purple-500' },
  { name: 'Vert', value: 'bg-green-100 border-green-300 hover:border-green-500' },
  { name: 'Jaune', value: 'bg-yellow-100 border-yellow-300 hover:border-yellow-500' },
  { name: 'Orange', value: 'bg-orange-100 border-orange-300 hover:border-orange-500' },
  { name: 'Rouge', value: 'bg-red-100 border-red-300 hover:border-red-500' },
  { name: 'Indigo', value: 'bg-indigo-100 border-indigo-300 hover:border-indigo-500' },
  { name: 'Cyan', value: 'bg-cyan-100 border-cyan-300 hover:border-cyan-500' },
  { name: 'Gris', value: 'bg-slate-100 border-slate-300 hover:border-slate-500' },
];

const EMOJI_SUGGESTIONS = ['🎨', '✨', '🌟', '💫', '🎭', '🎪', '🎬', '🎤', '🎸', '🎯', '🎲', '🎮', '🚀', '💎', '🌈', '⚡', '🔥', '💝', '🌺', '🦋'];

export function CustomPersonaModal({ isOpen, onClose, onSave, initialData, basePersonaId }: CustomPersonaModalProps) {
  const [formData, setFormData] = useState<CustomPersonaData>({
    name: '',
    description: '',
    writing_style: '',
    emoji: '🎨',
    color: 'bg-blue-100 border-blue-300 hover:border-blue-500',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        writing_style: initialData.writing_style,
        emoji: initialData.emoji,
        color: initialData.color,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        writing_style: '',
        emoji: '🎨',
        color: 'bg-blue-100 border-blue-300 hover:border-blue-500',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: '',
      description: '',
      writing_style: '',
      emoji: '🎨',
      color: 'bg-blue-100 border-blue-300 hover:border-blue-500',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Modifier le' : 'Créer un'} Persona{initialData && basePersonaId ? '' : ' personnalisé'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du Persona *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ex: La Créative"
              required
            />
          </div>

          <div>
            <label htmlFor="emoji" className="block text-sm font-medium text-gray-700 mb-1">
              Emoji *
            </label>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="text"
                id="emoji"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-2xl text-center"
                maxLength={2}
                required
              />
              <div className="flex-1 text-sm text-gray-500">
                Choisis un emoji ou saisis-en un
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`w-10 h-10 flex items-center justify-center text-2xl border-2 rounded-lg transition-all ${
                    formData.emoji === emoji
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description courte *
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ex: Créative avec une touche artistique"
              required
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
              Couleur *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOption.value })}
                  className={`h-12 rounded-lg border-2 transition-all ${colorOption.value} ${
                    formData.color === colorOption.value ? 'ring-2 ring-emerald-500 scale-105' : ''
                  }`}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="writing_style" className="block text-sm font-medium text-gray-700 mb-1">
              Style de rédaction pour l'IA *
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Décris comment l'IA doit rédiger avec ce persona (ton, vocabulaire, approche...)
            </p>
            <textarea
              id="writing_style"
              value={formData.writing_style}
              onChange={(e) => setFormData({ ...formData, writing_style: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={5}
              placeholder="Ex: Style créatif et artistique : utilise un vocabulaire imagé et poétique. Mets en valeur l'aspect unique et original de chaque pièce. Ton inspirant et créatif."
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Aperçu</h3>
            <div className={`p-4 border-2 rounded-xl ${formData.color}`}>
              <div className="text-4xl mb-2">{formData.emoji}</div>
              <div className="font-semibold text-sm text-gray-900">{formData.name || 'Nom du persona'}</div>
              <div className="text-xs text-gray-600 mt-1">{formData.description || 'Description du persona'}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {initialData ? 'Enregistrer' : 'Créer'} le Persona
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
