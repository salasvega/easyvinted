import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, CheckCircle, ArrowLeft, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Article } from '../types/article';

interface Lot {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_percentage: number;
  original_total_price: number;
  reference_number?: string;
  status: string;
}

export function LotStructureFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lot, setLot] = useState<Lot | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [markingAsPublished, setMarkingAsPublished] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadLot();
  }, [id]);

  async function loadLot() {
    if (!id || !user) return;

    try {
      const { data: lotData, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (lotError) throw lotError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('lot_items')
        .select(
          `
          articles (
            id,
            title,
            brand,
            price,
            photos,
            size,
            description
          )
        `
        )
        .eq('lot_id', id);

      if (itemsError) throw itemsError;

      const articlesList = itemsData.map((item: any) => item.articles).filter(Boolean);

      setLot(lotData);
      setArticles(articlesList as Article[]);
    } catch (error) {
      console.error('Error loading lot:', error);
      setToast({ message: 'Erreur lors du chargement du lot', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setToast({ message: `${fieldName} copié !`, type: 'success' });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const markAsPublished = async () => {
    if (!id || !user) return;

    setMarkingAsPublished(true);
    try {
      const { error } = await supabase
        .from('lots')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setToast({ message: 'Lot marqué comme publié !', type: 'success' });
      setTimeout(() => {
        navigate('/admin-v2');
      }, 1500);
    } catch (error) {
      console.error('Error marking lot as published:', error);
      setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    } finally {
      setMarkingAsPublished(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-red-600">Lot non trouvé</p>
      </div>
    );
  }

  const allPhotos = articles.flatMap(a => a.photos || []);
  const articlesDescription = articles.map((a, idx) =>
    `${idx + 1}. ${a.title} - ${a.brand || 'Sans marque'} - Taille ${a.size || 'N/A'}`
  ).join('\n');

  const fullDescription = `${lot.description}\n\nArticles inclus dans ce lot :\n${articlesDescription}`;

  const fields = [
    {
      name: 'Photos',
      value: `${allPhotos.length} photo(s) (toutes les photos des articles)`,
      description: 'Téléchargez toutes les photos des articles dans l\'ordre',
      copyable: false,
      showPhotos: true,
    },
    {
      name: 'Titre',
      value: lot.name,
      description: 'Le titre de votre lot',
    },
    {
      name: 'Description',
      value: fullDescription,
      description: 'Description détaillée du lot avec la liste des articles',
      multiline: true,
    },
    {
      name: 'Prix',
      value: `${lot.price.toFixed(2)} €`,
      description: 'Prix du lot',
    },
    {
      name: 'Nombre d\'articles',
      value: `${articles.length} article${articles.length > 1 ? 's' : ''}`,
      description: 'Nombre total d\'articles dans le lot',
      copyable: false,
    },
    {
      name: 'Remise',
      value: `${lot.discount_percentage}%`,
      description: 'Pourcentage de remise appliqué',
      copyable: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/admin-v2')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la boutique
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Formulaire de publication Vinted
            </h1>
            <p className="text-gray-600">
              Publication d'un lot de {articles.length} articles
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">Mode d'emploi</h2>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Ouvrez Vinted dans un nouvel onglet (et identifiez vous si besoin)</li>
          <li className="ml-4 italic">
            Recommandé : Placez l'onglet Vinted sur la barre latérale droite de votre navigateur pour l'afficher "Côte à Côte" avec celui-ci et faciliter les manips
          </li>
          <li>Glissez-Déposez toutes les photos des articles dans la section "+ Ajoute des Photos" de Vinted</li>
          <li>Cliquez sur le bouton Copier pour chaque champ</li>
          <li>Collez la valeur dans le champ correspondant sur Vinted</li>
          <li>Une fois publié sur Vinted, cliquez sur "Marquer comme publié"</li>
        </ol>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {field.name}
                  {copiedField === field.name && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </h3>
                <p className="text-sm text-gray-500">{field.description}</p>
              </div>
              {field.copyable !== false && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(field.value, field.name)}
                  className="ml-4"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copier
                </Button>
              )}
            </div>

            {field.showPhotos && allPhotos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {allPhotos.slice(0, 8).map((photo, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {allPhotos.length > 8 && (
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">+{allPhotos.length - 8}</span>
                  </div>
                )}
              </div>
            )}

            {!field.showPhotos && (
              <div className={`mt-2 p-3 bg-gray-50 rounded border border-gray-200 ${field.multiline ? 'whitespace-pre-wrap' : ''}`}>
                <p className="text-gray-900 font-mono text-sm">
                  {field.value}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="font-semibold text-green-900 mb-3">Publication terminée ?</h2>
        <p className="text-green-800 text-sm mb-4">
          Une fois votre lot publié sur Vinted, cliquez sur le bouton ci-dessous pour le marquer comme publié dans votre stock.
        </p>
        <Button
          onClick={markAsPublished}
          disabled={markingAsPublished}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {markingAsPublished ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Mise à jour...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer comme publié
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
