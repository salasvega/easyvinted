import { useState } from 'react';
import { usePersonas } from '../../hooks/usePersonas';

interface PersonaStepProps {
  onNext: (data: PersonaData) => void;
  onSkip: () => void;
  initialData?: PersonaData;
}

export interface PersonaData {
  personaId: string | null;
  personaName?: string;
  personaDescription?: string;
  personaWritingStyle?: string;
  customPersonaName?: string;
  customPersonaStyle?: string;
}

export default function PersonaStep({ onNext, onSkip, initialData }: PersonaStepProps) {
  const { data: personas, isLoading } = usePersonas();
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(
    initialData?.personaId || null
  );
  const [customName, setCustomName] = useState(initialData?.customPersonaName || '');
  const [customStyle, setCustomStyle] = useState(initialData?.customPersonaStyle || '');

  const isValid = mode === 'preset' ? selectedPersona !== null : customName.trim() !== '' && customStyle.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      if (mode === 'preset') {
        const persona = personas?.find(p => p.id === selectedPersona);
        if (persona) {
          onNext({
            personaId: selectedPersona,
            personaName: persona.name,
            personaDescription: persona.description,
            personaWritingStyle: persona.writing_style
          });
        }
      } else {
        onNext({
          personaId: null,
          customPersonaName: customName,
          customPersonaStyle: customStyle,
        });
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choisissez votre style d'écriture</h2>
        <p className="text-gray-600">Optionnel mais recommandé pour de meilleures descriptions</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setMode('preset')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            mode === 'preset'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Personas prédéfinis
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Persona personnalisé
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'preset' ? (
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des personas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas?.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersona(persona.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedPersona === persona.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{persona.emoji}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{persona.name}</h3>
                    <p className="text-sm text-gray-600">{persona.description}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du persona
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: La Créative"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style d'écriture
              </label>
              <textarea
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez le style d'écriture que vous souhaitez utiliser pour vos descriptions d'articles..."
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Passer cette étape
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      </form>
    </div>
  );
}
