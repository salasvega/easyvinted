import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";

export function TermsPage() {
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
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EasyVinted</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Conditions générales d'utilisation
          </h1>
          <p className="text-lg text-slate-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-slate max-w-none">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptation des conditions</h2>
            <p className="text-slate-600 leading-relaxed">
              En accédant et en utilisant EasyVinted, vous acceptez d'être lié par ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description du service</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              EasyVinted est une plateforme d'assistance pour la création et la gestion d'annonces de vente en ligne. Le service comprend :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Génération automatique de titres et descriptions par IA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Gestion et organisation d'articles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Planification intelligente de publications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Édition et optimisation de photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Statistiques et analyses de ventes</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Compte utilisateur</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Pour utiliser EasyVinted, vous devez créer un compte. Vous vous engagez à :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Fournir des informations exactes et à jour</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Maintenir la sécurité de votre mot de passe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Ne pas partager votre compte avec d'autres personnes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Nous informer immédiatement de toute utilisation non autorisée</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Utilisation acceptable</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Vous vous engagez à ne pas :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Utiliser le service à des fins illégales ou frauduleuses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Publier du contenu offensant, diffamatoire ou inapproprié</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Tenter de contourner les mesures de sécurité</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Surcharger ou perturber le fonctionnement du service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Violer les droits de propriété intellectuelle</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Propriété intellectuelle</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Le contenu généré par EasyVinted :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Les titres et descriptions générés par l'IA vous appartiennent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Vos photos et contenus personnels vous appartiennent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Le logiciel, le design et la marque EasyVinted restent notre propriété exclusive</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation de responsabilité</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              EasyVinted est fourni "tel quel". Nous ne garantissons pas :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Le succès de vos ventes sur les plateformes tierces</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>La disponibilité continue du service sans interruption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>L'exactitude absolue des suggestions de l'IA</span>
              </li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Nous ne sommes pas responsables des pertes financières, de la perte de données ou des dommages indirects résultant de l'utilisation du service.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Indépendance vis-à-vis de Vinted</h2>
            <p className="text-slate-600 leading-relaxed">
              EasyVinted est un service indépendant et n'est pas affilié, approuvé ou sponsorisé par Vinted. L'utilisation d'EasyVinted pour créer des annonces destinées à Vinted doit respecter les conditions d'utilisation de Vinted.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Modification du service</h2>
            <p className="text-slate-600 leading-relaxed">
              Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment, avec ou sans préavis. Nous pouvons également modifier ces conditions à tout moment. Les modifications importantes vous seront notifiées par email.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Résiliation</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Nous nous réservons le droit de suspendre ou résilier votre compte en cas de :
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Violation de ces conditions d'utilisation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Activité frauduleuse ou illégale</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-1">•</span>
                <span>Utilisation abusive du service</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              Pour toute question concernant ces conditions d'utilisation, contactez-nous via notre{' '}
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
