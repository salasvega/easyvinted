import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixMissingProfile() {
  console.log('🔍 Recherche des utilisateurs sans profil...\n');

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
    return;
  }

  for (const user of users.users) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error(`❌ Erreur pour ${user.email}:`, profileError);
      continue;
    }

    if (!profile) {
      console.log(`📝 Création du profil pour ${user.email}...`);

      const { data: familyMember } = await supabase
        .from('family_members')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      const userName = familyMember?.name || 'Utilisateur';

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: userName,
          top_size: '',
          bottom_size: '',
          shoe_size: '',
          onboarding_complet: false,
          default_seller_id: familyMember?.id || null,
        });

      if (insertError) {
        console.error(`❌ Erreur lors de la création du profil:`, insertError);
      } else {
        console.log(`✅ Profil créé pour ${user.email} (${userName})\n`);
      }
    } else {
      console.log(`✓ ${user.email} a déjà un profil`);
    }
  }

  console.log('\n✨ Terminé !');
}

fixMissingProfile();
