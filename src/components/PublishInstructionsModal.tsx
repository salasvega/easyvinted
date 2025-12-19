import { X, Copy, Terminal, CheckCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface PublishInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
}

export function PublishInstructionsModal({
  isOpen,
  onClose,
  articleId,
}: PublishInstructionsModalProps) {
  const [copied, setCopied] = useState(false);
  const command = `npm run vinted:publish:single ${articleId}`;

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Article prêt pour publication
                </h3>
                <p className="text-sm text-gray-600">
                  Votre article est enregistré et prêt à être publié automatiquement sur Vinted.
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

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Article ID</p>
            <p className="text-sm font-mono text-gray-900 break-all">{articleId}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Pour publier sur Vinted, exécutez cette commande dans votre terminal :
            </p>

            <div className="relative">
              <div className="bg-gray-900 rounded-lg p-4 pr-12">
                <code className="text-sm text-green-400 font-mono break-all">
                  {command}
                </code>
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                title="Copier la commande"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                📋 Ce qui va se passer :
              </p>
              <ol className="space-y-2 text-sm text-blue-700">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Un navigateur Chromium s'ouvrira automatiquement</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Le script se connectera à votre compte Vinted (connexion manuelle la première fois)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Votre article sera automatiquement publié avec toutes les informations</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span className="font-semibold text-blue-900">La base de données sera mise à jour automatiquement avec l'URL Vinted</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">5.</span>
                  <span>L'article apparaîtra dans votre tableau de bord comme "Publié"</span>
                </li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">
                ✅ Synchronisation automatique
              </p>
              <p className="text-sm text-green-700">
                Pas besoin de revenir ici pour mettre à jour manuellement ! Une fois la publication terminée dans le terminal,
                rafraîchissez simplement cette page pour voir votre article marqué comme "Publié" avec son lien Vinted.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                ⚠️ Première utilisation
              </p>
              <p className="text-sm text-amber-700">
                Si c'est votre première publication, le navigateur vous demandera de vous connecter manuellement à Vinted.
                Ensuite, la session sera sauvegardée et les prochaines publications seront 100% automatiques.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 px-4 py-3 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copier la commande
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
