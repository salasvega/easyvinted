import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPersonas() {
  console.log('🔍 Analyse des custom personas et family members...\n');

  // Récupérer tous les custom personas
  const { data: customPersonas, error: customError } = await supabase
    .from('custom_personas')
    .select('*')
    .order('created_at', { ascending: false });

  if (customError) {
    console.error('❌ Erreur lors de la récupération des custom personas:', customError);
    return;
  }

  console.log('📋 CUSTOM PERSONAS DANS LA BASE:\n');
  console.log('='.repeat(80));

  if (!customPersonas || customPersonas.length === 0) {
    console.log('Aucun custom persona trouvé.\n');
  } else {
    customPersonas.forEach((persona, index) => {
      console.log(`\n${index + 1}. ID: ${persona.id}`);
      console.log(`   User ID: ${persona.user_id}`);
      console.log(`   Base Persona ID: ${persona.base_persona_id || 'NULL (standalone)'}`);
      console.log(`   Name: ${persona.name ? `"${persona.name}"` : 'NULL ⚠️'}`);
      console.log(`   Description: ${persona.description ? `"${persona.description}"` : 'NULL ⚠️'}`);
      console.log(`   Writing Style: ${persona.writing_style ? `"${persona.writing_style.substring(0, 80)}..."` : 'NULL ⚠️'}`);
      console.log(`   Emoji: ${persona.emoji || 'NULL ⚠️'}`);
      console.log(`   Color: ${persona.color || 'NULL ⚠️'}`);
    });
  }

  // Récupérer tous les family members
  const { data: familyMembers, error: membersError } = await supabase
    .from('family_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (membersError) {
    console.error('❌ Erreur lors de la récupération des family members:', membersError);
    return;
  }

  console.log('\n\n📋 FAMILY MEMBERS DANS LA BASE:\n');
  console.log('='.repeat(80));

  if (!familyMembers || familyMembers.length === 0) {
    console.log('Aucun family member trouvé.\n');
  } else {
    familyMembers.forEach((member, index) => {
      console.log(`\n${index + 1}. ID: ${member.id}`);
      console.log(`   Name: ${member.name}`);
      console.log(`   Persona ID: ${member.persona_id}`);
      console.log(`   Custom Persona ID: ${member.custom_persona_id || 'NULL'}`);
      console.log(`   Writing Style: ${member.writing_style ? `"${member.writing_style.substring(0, 80)}..."` : 'NULL'}`);
      console.log(`   Is Default: ${member.is_default}`);

      // Trouver le custom persona correspondant
      if (member.persona_id === 'custom' && member.custom_persona_id) {
        const matchingPersona = customPersonas?.find(p => p.id === member.custom_persona_id);
        if (matchingPersona) {
          console.log(`   ✅ Custom Persona trouvé (standalone):`);
          console.log(`      - Name: ${matchingPersona.name || 'NULL ⚠️'}`);
          console.log(`      - Description: ${matchingPersona.description || 'NULL ⚠️'}`);
        } else {
          console.log(`   ⚠️  Custom Persona introuvable!`);
        }
      } else {
        const matchingPersona = customPersonas?.find(p => p.base_persona_id === member.persona_id);
        if (matchingPersona) {
          console.log(`   ✅ Custom Persona trouvé (basé sur ${member.persona_id}):`);
          console.log(`      - Name: ${matchingPersona.name || 'NULL ⚠️'}`);
          console.log(`      - Description: ${matchingPersona.description || 'NULL ⚠️'}`);
        } else {
          console.log(`   ℹ️  Pas de custom persona (utilise persona de base: ${member.persona_id})`);
        }
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Analyse terminée !');
}

debugPersonas().catch(console.error);
