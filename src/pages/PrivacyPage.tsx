import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-slate-900 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EasyVinted</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Politique de confidentialité
          </h1>
          <p className="text-lg text-slate-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-slate max-w-none">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Chez EasyVinted, nous prenons la protection de vos données personnelles très au sérieux. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Données collectées</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Nous collectons les informations suivantes :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Informations de compte :</strong> Email et mot de passe (crypté)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Données d'articles :</strong> Photos, descriptions, prix et catégories des articles que vous créez</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Données d'utilisation :</strong> Statistiques anonymisées sur l'utilisation de l'application</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Utilisation des données</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Vos données sont utilisées pour :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Vous fournir les services d'EasyVinted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Générer automatiquement des titres et descriptions avec l'IA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Améliorer nos services et développer de nouvelles fonctionnalités</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Vous envoyer des notifications importantes concernant votre compte</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Sécurité des données</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Nous mettons en œuvre des mesures de sécurité avancées pour protéger vos données :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Cryptage des mots de passe avec des algorithmes de hachage sécurisés</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Connexions sécurisées HTTPS pour toutes les communications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Stockage sécurisé dans des serveurs protégés avec contrôle d'accès strict</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Nous ne stockons jamais vos identifiants Vinted</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Partage des données</h2>
            <p className="text-slate-600 leading-relaxed">
              Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers, sauf dans les cas suivants :
            </p>
            <ul className="space-y-2 text-slate-600 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Services d'IA (Google Gemini) pour la génération de contenu - vos données sont traitées de manière sécurisée et confidentielle</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Obligation légale ou demande judiciaire</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Vos droits</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Droit d'accès :</strong> Consulter les données que nous détenons sur vous</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Droit de rectification :</strong> Corriger vos données inexactes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Droit à l'effacement :</strong> Demander la suppression de votre compte et de vos données</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous via notre{' '}
              <Link to="/contact" className="text-emerald-600 font-medium hover:text-emerald-700">
                page de contact
              </Link>.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600">
              © 2024 EasyVinted. Créé par SALAS VEGA Sébastien
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Confidentialité</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Conditions</Link>
              <Link to="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
