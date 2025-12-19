interface CompletionStepProps {
  onComplete: () => void;
  userName: string;
}

export default function CompletionStep({ onComplete, userName }: CompletionStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        Bienvenue sur EasyVinted, {userName} !
      </h2>

      <p className="text-lg text-gray-600 mb-8">
        Votre compte est prêt. Vous pouvez maintenant commencer à créer vos articles et gérer vos ventes facilement.
      </p>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes :</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">Créez votre premier article</div>
              <div className="text-sm text-gray-600">Prenez des photos et laissez l'IA vous aider</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Optimisez vos descriptions</div>
              <div className="text-sm text-gray-600">Utilisez votre persona pour des textes percutants</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Publiez sur Vinted</div>
              <div className="text-sm text-gray-600">Exportez vos articles en un clic</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
      >
        Accéder à EasyVinted
      </button>
    </div>
  );
}
