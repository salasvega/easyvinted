import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Sparkles,
  Calendar,
  Upload,
  Camera,
  TrendingUp,
  Shield,
  Zap,
  Check,
  ArrowRight,
  BarChart3,
  Clock,
  MessageSquare,
  Star
} from "lucide-react";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin-v2');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                EasyVinted
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Connexion
              </Link>
             
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6 lg:px-8">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            

            {/* Main title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
              Vendez plus vite sur{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Vinted
              </span>
              <br />
              avec l'IA
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              Créez vos annonces en quelques secondes, optimisez vos prix et publiez au moment parfait.
              Automatisez ce qui prend du temps, gardez le contrôle.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white text-base font-semibold rounded-full hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 hover:scale-105"
              >
                Se connecter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

             
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Gratuit pour commencer</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Configuration en 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Support 7j/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-8 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10x", label: "Plus rapide" },
              { value: "85%", label: "Temps économisé" },
              { value: "95%", label: "Satisfaction client" },
              { value: "24/7", label: "Disponibilité IA" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-slate-600">
              Une suite complète d'outils pour automatiser et optimiser vos ventes sur Vinted
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Génération IA automatique
              </h3>
              <p className="text-slate-600 leading-relaxed">
                L'IA analyse vos photos et génère automatiquement un titre accrocheur, une description détaillée, le prix optimal et la catégorie adaptée.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Planification intelligente
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Publiez vos annonces aux meilleurs moments selon la saison, le type de produit et les périodes de forte activité.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Photo Studio IA
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Éditez vos photos professionnellement avec l'IA : suppression d'arrière-plan, amélioration automatique, et suggestions de mise en scène.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Optimisation des prix
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Recevez des recommandations de prix basées sur le marché, la demande et l'état de vos articles pour maximiser vos ventes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Analytics détaillées
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Suivez vos performances, analysez vos ventes et obtenez des insights pour améliorer votre stratégie de vente.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                100% sécurisé
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Vos données sont protégées et cryptées. Nous ne stockons jamais vos identifiants Vinted et respectons votre vie privée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-slate-400">
              Créez vos annonces en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Uploadez vos photos",
                description: "Importez simplement les photos de vos articles. Notre IA se charge du reste."
              },
              {
                step: "02",
                icon: Zap,
                title: "L'IA génère tout",
                description: "En quelques secondes, obtenez titre, description, prix et catégorie optimisés."
              },
              {
                step: "03",
                icon: Clock,
                title: "Planifiez et publiez",
                description: "Programmez vos publications aux meilleurs moments ou publiez instantanément."
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="text-7xl font-bold text-slate-800 mb-6">{item.step}</div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/3 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Ils adorent EasyVinted
            </h2>
            <p className="text-xl text-slate-600">
              Découvrez ce que nos utilisateurs disent de nous
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marie L.",
                role: "Vendeuse particulière",
                content: "J'ai économisé des heures chaque semaine ! L'IA génère des descriptions parfaites et mes articles se vendent 2x plus vite.",
                rating: 5
              },
              {
                name: "Thomas D.",
                role: "Revendeur professionnel",
                content: "Le planificateur intelligent est génial. Mes articles sont publiés aux moments optimaux et mes ventes ont explosé.",
                rating: 5
              },
              {
                name: "Sophie M.",
                role: "Maman organisée",
                content: "Parfait pour vendre les vêtements des enfants ! En 5 minutes je crée 10 annonces. Un gain de temps incroyable.",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Prêt à transformer vos ventes ?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Rejoignez des centaines de vendeurs qui automatisent leurs ventes avec l'IA
          </p>

          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-slate-900 text-lg font-bold rounded-full hover:bg-slate-100 transition-all shadow-2xl hover:shadow-white/20 hover:scale-105"
          >
            Se connecter
            <ArrowRight className="w-6 h-6" />
          </Link>

          <p className="mt-6 text-sm text-slate-400">
            Aucune carte bancaire requise • Configuration en 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">EasyVinted</span>
              </div>
              <p className="text-slate-600 mb-4 max-w-md">
                L'assistant IA qui automatise vos ventes sur Vinted. Créez, optimisez et publiez vos annonces en quelques secondes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Produit</h4>
              <ul className="space-y-2">
                <li><Link to="/photo-studio" className="text-slate-600 hover:text-slate-900 transition-colors">Photo Studio</Link></li>
                <li><Link to="/admin-v2" className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link></li>
                <li><Link to="/planner" className="text-slate-600 hover:text-slate-900 transition-colors">Planificateur</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Compte</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-slate-600 hover:text-slate-900 transition-colors">Connexion</Link></li>
                <li><Link to="/signup" className="text-slate-600 hover:text-slate-900 transition-colors">Inscription</Link></li>
                <li><Link to="/profile" className="text-slate-600 hover:text-slate-900 transition-colors">Profil</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
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
