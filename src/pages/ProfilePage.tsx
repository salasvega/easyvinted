import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CustomPersonaModal, CustomPersonaData } from '../components/CustomPersonaModal';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserProfileMutation } from '../hooks/useUserProfileMutation';
import type { UserProfile } from '../services/settings';

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: profileData, isLoading: loading } = useUserProfile(user?.id);
  const profileMutation = useUserProfileMutation(user?.id);

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone_number: '',
    clothing_size: '',
    shoe_size: '',
    dressing_name: '',
    persona_id: 'friendly',
    writing_style: '',
  });

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [customPersonaData, setCustomPersonaData] = useState<CustomPersonaData | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profileData) {
      setProfile({
        name: profileData.name || '',
        phone_number: profileData.phone_number || '',
        clothing_size: profileData.clothing_size || '',
        shoe_size: profileData.shoe_size || '',
        dressing_name: profileData.dressing_name || 'Mon Dressing',
        persona_id: profileData.persona_id || 'friendly',
        writing_style: profileData.writing_style || '',
      });
    }
  }, [profileData]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setToast(null);

    try {
      await profileMutation.mutateAsync(profile);
      setToast({ type: 'success', text: 'Profil enregistré avec succès' });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      setToast({ type: 'error', text: 'Erreur lors de l\'enregistrement du profil' });
    }
  };

  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setToast({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setToast({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Error updating password:', error);
      setToast({ type: 'error', text: 'Erreur lors de la modification du mot de passe' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="dressing_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du Dressing
              </label>
              <p className="text-sm text-gray-500 mb-2">Le nom de votre espace de vente</p>
              <input
                type="text"
                id="dressing_name"
                value={profile.dressing_name}
                onChange={(e) => setProfile({ ...profile, dressing_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Mon Dressing"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <p className="text-sm text-gray-500 mb-2">Le nom associé à ce compte</p>
              <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse e-mail
              </label>
              <p className="text-sm text-gray-500 mb-2">L'adresse e-mail associée à ce compte</p>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <p className="text-sm text-gray-500 mb-2">Le numéro de téléphone associé à ce compte</p>
              <input
                type="tel"
                id="phone_number"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+33612345678"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>


        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modifier le mot de passe</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Minimum 6 caractères"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Confirmer le mot de passe"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {savingPassword ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <CustomPersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => {
          setIsPersonaModalOpen(false);
          setCustomPersonaData(null);
        }}
        onSave={(data) => {
          setProfile({ ...profile, persona_id: 'custom', writing_style: data.description });
          setIsPersonaModalOpen(false);
          setCustomPersonaData(null);
        }}
        initialData={customPersonaData}
      />
    </>
  );
}
