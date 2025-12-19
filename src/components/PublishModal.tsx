import { X, Rocket, AlertCircle, CheckCircle } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  articleTitle: string;
  isScheduled?: boolean;
  scheduledDate?: string;
}

export function PublishModal({
  isOpen,
  onClose,
  onConfirm,
  articleTitle,
  isScheduled = false,
  scheduledDate,
}: PublishModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {isScheduled ? 'Programmer la publication' : 'Publier maintenant'}
                </h3>
                <p className="text-sm text-gray-600">
                  {articleTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {isScheduled && scheduledDate ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Publication programmée
                </p>
                <p className="text-sm text-blue-700">
                  L'article sera publié automatiquement le{' '}
                  <span className="font-semibold">{formatDate(scheduledDate)}</span>
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Publication immédiate
                </p>
                <p className="text-sm text-emerald-700">
                  L'article sera ajouté à la file d'attente et publié automatiquement par le worker dans les prochaines minutes.
                </p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Ce qui va se passer :
              </p>
              <ol className="space-y-1 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Un job de publication sera créé dans la base de données</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Le worker récupérera le job et publiera l'article sur Vinted</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>L'article sera mis à jour automatiquement avec le lien Vinted</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Vous recevrez une notification une fois publié</span>
                </li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Important
              </p>
              <p className="text-sm text-amber-700">
                Assurez-vous que le worker est bien déployé et actif sur votre VPS pour que la publication soit effectuée.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
