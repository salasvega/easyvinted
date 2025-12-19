import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ProfileStep, { ProfileData } from '../components/onboarding/ProfileStep';
import PersonaStep, { PersonaData } from '../components/onboarding/PersonaStep';
import TeamStep, { TeamData } from '../components/onboarding/TeamStep';
import CompletionStep from '../components/onboarding/CompletionStep';

type Step = 'profile' | 'persona' | 'team' | 'completion';

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);

  const steps: Step[] = ['profile', 'persona', 'team', 'completion'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleProfileNext = (data: ProfileData) => {
    setProfileData(data);
    setCurrentStep('persona');
  };

  const handlePersonaNext = (data: PersonaData) => {
    setPersonaData(data);
    setCurrentStep('team');
  };

  const handlePersonaSkip = () => {
    setPersonaData(null);
    setCurrentStep('team');
  };

  const handleTeamNext = (data: TeamData) => {
    setTeamData(data);
    setCurrentStep('completion');
  };

  const handleTeamSkip = () => {
    if (profileData) {
      setTeamData({
        members: [
          {
            id: 'main',
            display_name: profileData.name,
            is_default: true,
          },
        ],
        defaultMemberId: 'main',
      });
    }
    setCurrentStep('completion');
  };

  const handleComplete = async () => {
    if (!user || !profileData) return;

    setLoading(true);
    setError(null);

    try {
      let defaultSellerId: string | null = null;

      const { data: existingSellers } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', user.id);

      if (!existingSellers || existingSellers.length === 0) {
        const sellersToCreate = teamData?.members || [
          {
            id: 'main',
            display_name: profileData.name,
            is_default: true,
          },
        ];

        for (const member of sellersToCreate) {
          const isMainUser = member.id === 'main' || member.display_name === profileData.name;

          const familyMemberData: any = {
            user_id: user.id,
            name: member.display_name,
            age: isMainUser && profileData.age ? parseInt(profileData.age) : 0,
            top_size: isMainUser ? profileData.top_size || null : null,
            bottom_size: isMainUser ? profileData.bottom_size || null : null,
            shoe_size: isMainUser ? profileData.shoe_size || null : null,
            persona_id: isMainUser && personaData?.personaId ? personaData.personaId : 'casual',
            is_default: member.is_default || member.id === teamData?.defaultMemberId,
          };

          if (isMainUser && personaData) {
            if (personaData.personaId && personaData.personaWritingStyle) {
              familyMemberData.writing_style = personaData.personaWritingStyle;
            } else if (personaData.customPersonaStyle) {
              familyMemberData.writing_style = personaData.customPersonaStyle;
            }
          }

          const { data: newSeller, error: sellerError } = await supabase
            .from('family_members')
            .insert(familyMemberData)
            .select()
            .single();

          if (sellerError) throw sellerError;

          if (member.is_default || member.id === teamData?.defaultMemberId) {
            defaultSellerId = newSeller.id;
          }
        }
      }

      let customPersonaId: string | null = null;

      if (personaData && !personaData.personaId && personaData.customPersonaName) {
        const { data: customPersona, error: customPersonaError } = await supabase
          .from('custom_personas')
          .insert({
            user_id: user.id,
            name: personaData.customPersonaName,
            writing_style: personaData.customPersonaStyle || '',
          })
          .select()
          .single();

        if (customPersonaError) throw customPersonaError;
        customPersonaId = customPersona?.id || null;
      }

      const profileUpdate: any = {
        id: user.id,
        name: profileData.name,
        age: profileData.age ? parseInt(profileData.age) : null,
        top_size: profileData.top_size || '',
        bottom_size: profileData.bottom_size || '',
        shoe_size: profileData.shoe_size || '',
        onboarding_complet: true,
      };

      if (defaultSellerId) {
        profileUpdate.default_seller_id = defaultSellerId;
      }

      if (personaData?.personaId) {
        profileUpdate.persona_id = personaData.personaId;
      }

      if (customPersonaId) {
        profileUpdate.custom_persona_id = customPersonaId;
      }

      if (personaData?.customPersonaStyle) {
        profileUpdate.writing_style = personaData.customPersonaStyle;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileUpdate, { onConflict: 'id' });

      if (profileError) throw profileError;

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              {steps.slice(0, -1).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 2 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all ${
                        index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {currentStep === 'profile' && (
              <ProfileStep onNext={handleProfileNext} initialData={profileData || undefined} />
            )}

            {currentStep === 'persona' && (
              <PersonaStep
                onNext={handlePersonaNext}
                onSkip={handlePersonaSkip}
                initialData={personaData || undefined}
              />
            )}

            {currentStep === 'team' && profileData && (
              <TeamStep
                onNext={handleTeamNext}
                onSkip={handleTeamSkip}
                mainUserName={profileData.name}
                initialData={teamData || undefined}
              />
            )}

            {currentStep === 'completion' && profileData && (
              <CompletionStep onComplete={handleComplete} userName={profileData.name} />
            )}
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700">Configuration de votre compte...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
