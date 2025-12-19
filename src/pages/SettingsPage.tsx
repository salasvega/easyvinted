import { useState, useEffect } from 'react';
import { Shield, Clock, Info, Bell } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { useNotificationPreferencesMutation } from '../hooks/useNotificationPreferencesMutation';

export function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: notifPrefs } = useNotificationPreferences(user?.id);
  const notifMutation = useNotificationPreferencesMutation(user?.id);
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'error' | 'success' }>(
    { isOpen: false, title: '', message: '', type: 'info' }
  );
  const [vintedSettings, setVintedSettings] = useState({
    email: '',
    password: '',
  });

  const [automationSettings, setAutomationSettings] = useState({
    maxPostsPerDay: 10,
    minDelayMinutes: 30,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enablePlannerNotifications: true,
    notificationDaysBefore: 14,
  });

  useEffect(() => {
    if (notifPrefs) {
      setNotificationSettings({
        enablePlannerNotifications: notifPrefs.enable_planner_notifications ?? true,
        notificationDaysBefore: notifPrefs.notification_days_before ?? 14,
      });
    }
  }, [notifPrefs]);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVintedSettings({
          email: data.vinted_email || '',
          password: '',
        });
        setAutomationSettings({
          maxPostsPerDay: data.max_posts_per_day || 10,
          minDelayMinutes: data.min_delay_minutes || 30,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: 'Erreur lors du chargement des paramètres',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVintedSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);

      let encryptedPassword = '';
      if (vintedSettings.password) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const { data: session } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            action: 'encrypt',
            password: vintedSettings.password,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chiffrement du mot de passe');
        }

        const { encryptedPassword: encrypted } = await response.json();
        encryptedPassword = encrypted;
      }

      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsData: any = {
        user_id: user.id,
        vinted_email: vintedSettings.email,
        updated_at: new Date().toISOString(),
      };

      if (encryptedPassword) {
        settingsData.vinted_password_encrypted = encryptedPassword;
      }

      if (existingSettings) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      setModalState({
        isOpen: true,
        title: 'Paramètres enregistrés',
        message: 'Vos identifiants Vinted ont été enregistrés avec succès',
        type: 'success'
      });

      setVintedSettings({ ...vintedSettings, password: '' });
    } catch (error) {
      console.error('Error saving Vinted settings:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement des identifiants',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutomationSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsData = {
        user_id: user.id,
        max_posts_per_day: automationSettings.maxPostsPerDay,
        min_delay_minutes: automationSettings.minDelayMinutes,
        updated_at: new Date().toISOString(),
      };

      if (existingSettings) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      setModalState({
        isOpen: true,
        title: 'Paramètres enregistrés',
        message: 'Les règles d\'automatisation ont été enregistrées avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving automation settings:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'enregistrement des paramètres',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await notifMutation.mutateAsync({
        enable_planner_notifications: notificationSettings.enablePlannerNotifications,
        notification_days_before: notificationSettings.notificationDaysBefore,
      });

      setModalState({
        isOpen: true,
        title: 'Paramètres enregistrés',
        message: 'Vos préférences de notifications ont été enregistrées avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'enregistrement des préférences de notifications',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
      <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-600 mt-1">
          Configurez votre compte Vinted et les règles d'automatisation
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Chargement des paramètres...</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Connexion Vinted</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Vinted
              </label>
              <input
                type="email"
                value={vintedSettings.email}
                onChange={(e) => setVintedSettings({ ...vintedSettings, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="votre-email@exemple.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mot de passe Vinted
              </label>
              <input
                type="password"
                value={vintedSettings.password}
                onChange={(e) => setVintedSettings({ ...vintedSettings, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-md">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">
                <strong>Sécurité :</strong> Votre mot de passe est chiffré côté serveur avec AES-256-GCM avant d'être stocké.
                Il ne sera jamais enregistré en clair dans la base de données.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveVintedSettings} disabled={saving || loading}>
                {saving ? 'Enregistrement...' : 'Enregistrer les identifiants'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Rythme de publication</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre maximum d'annonces par jour
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={automationSettings.maxPostsPerDay}
                onChange={(e) => setAutomationSettings({ ...automationSettings, maxPostsPerDay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limite recommandée : 10-15 annonces par jour pour éviter les restrictions
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Délai minimum entre 2 annonces (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={automationSettings.minDelayMinutes}
                onChange={(e) => setAutomationSettings({ ...automationSettings, minDelayMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Délai recommandé : 30-60 minutes pour simuler un comportement naturel
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Ces paramètres permettent de publier vos annonces de manière progressive et naturelle,
                en respectant les bonnes pratiques de Vinted et en évitant tout comportement suspect.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveAutomationSettings} disabled={saving || loading}>
                {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Activer les notifications du planificateur
                </label>
                <p className="text-xs text-gray-600">
                  Recevez des alertes quand vos articles approchent de leur période optimale de vente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotificationSettings({
                  ...notificationSettings,
                  enablePlannerNotifications: !notificationSettings.enablePlannerNotifications
                })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  notificationSettings.enablePlannerNotifications ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notificationSettings.enablePlannerNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {notificationSettings.enablePlannerNotifications && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Me prévenir combien de jours avant la période optimale ?
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={notificationSettings.notificationDaysBefore}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    notificationDaysBefore: parseInt(e.target.value) || 14
                  })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Par défaut : 14 jours avant la période optimale
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Les notifications vous aideront à ne jamais manquer le moment idéal pour publier vos articles.
                Le système analysera vos articles et vous alertera en fonction des saisons et tendances.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveNotificationSettings} disabled={saving || loading}>
                {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-800">
            <strong>Important :</strong> L'automatisation de la publication sur Vinted est en cours de développement.
            Ces paramètres seront utilisés par le système d'automatisation basé sur Puppeteer/Playwright
            pour publier vos annonces de manière sécurisée et progressive.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
