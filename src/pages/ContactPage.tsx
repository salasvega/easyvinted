import { Link } from "react-router-dom";
import { Mail, ArrowLeft, MessageSquare, Send } from "lucide-react";
import { useState, FormEvent } from "react";

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const mailtoLink = `mailto:contact@easyvinted.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`;

    window.location.href = mailtoLink;
    setSubmitted(true);

    setTimeout(() => {
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setSubmitted(false);
    }, 3000);
  };

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
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EasyVinted</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Contactez-nous
          </h1>
          <p className="text-lg text-slate-600">
            Une question ? Un problème ? Nous sommes là pour vous aider.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Email</h3>
            <a href="mailto:contact@easyvinted.com" className="text-emerald-600 hover:text-emerald-700 transition-colors">
              contact@easyvinted.com
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Support</h3>
            <p className="text-slate-600 text-sm">
              Réponse sous 24-48h
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Rapide</h3>
            <p className="text-slate-600 text-sm">
              Formulaire instantané
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Envoyez-nous un message</h2>

          {submitted && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700 font-medium">
                Votre client email va s'ouvrir. Envoyez le message pour nous le faire parvenir.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sujet
              </label>
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">Sélectionnez un sujet</option>
                <option value="Question générale">Question générale</option>
                <option value="Problème technique">Problème technique</option>
                <option value="Fonctionnalité">Suggestion de fonctionnalité</option>
                <option value="Compte">Gestion de compte</option>
                <option value="Bug">Signaler un bug</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                placeholder="Décrivez votre demande en détail..."
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Envoyer le message
            </button>
          </form>
        </div>

        <div className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Questions fréquentes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Comment fonctionne l'IA de génération ?</h4>
              <p className="text-slate-300">
                Notre IA analyse vos photos pour détecter automatiquement le type d'article, la marque, les couleurs et génère un titre et une description optimisés pour maximiser vos chances de vente.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mes données sont-elles sécurisées ?</h4>
              <p className="text-slate-300">
                Absolument. Nous utilisons un cryptage de niveau bancaire et ne stockons jamais vos identifiants Vinted. Consultez notre{' '}
                <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">
                  politique de confidentialité
                </Link>{' '}
                pour plus de détails.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Le service est-il gratuit ?</h4>
              <p className="text-slate-300">
                EasyVinted propose une version gratuite avec les fonctionnalités essentielles. Des options premium sont disponibles pour les vendeurs professionnels.
              </p>
            </div>
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
