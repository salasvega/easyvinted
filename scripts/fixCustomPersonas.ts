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

const PERSONAS = [
  {
    id: 'minimalist',
    name: 'La Minimaliste',
    description: 'Descriptions courtes, claires et efficaces',
  },
  {
    id: 'enthusiast',
    name: 'L\'Enthousiaste',
    description: 'Dynamique, positive et pleine d\'énergie',
  },
  {
    id: 'fashion_pro',
    name: 'La Pro de la Mode',
    description: 'Experte, technique et détaillée',
  },
  {
    id: 'friendly',
    name: 'La Copine Sympa',
    description: 'Chaleureuse, accessible et décontractée',
  },
  {
    id: 'elegant',
    name: 'L\'Élégante',
    description: 'Raffinée, sophistiquée et chic',
  },
  {
    id: 'eco_conscious',
    name: 'L\'Écolo Engagée',
    description: 'Responsable avec focus sur la durabilité',
  },
];

async function fixCustomPersonas() {
  console.log('🔍 Recherche des custom personas à corriger...\n');

  const { data: customPersonas, error } = await supabase
    .from('custom_personas')
    .select('*')
    .or('name.is.null,description.is.null');

  if (error) {
    console.error('❌ Erreur lors de la récupération des custom personas:', error);
    return;
  }

  if (!customPersonas || customPersonas.length === 0) {
    console.log('✅ Aucun custom persona à corriger !');
    return;
  }

  console.log(`📋 ${customPersonas.length} custom persona(s) à corriger :\n`);

  for (const persona of customPersonas) {
    console.log(`\nPersona ID: ${persona.id}`);
    console.log(`Base Persona ID: ${persona.base_persona_id || 'standalone'}`);
    console.log(`Name actuel: ${persona.name || 'NULL'}`);
    console.log(`Description actuelle: ${persona.description || 'NULL'}`);

    let updates: any = {};

    if (persona.base_persona_id) {
      const basePersona = PERSONAS.find(p => p.id === persona.base_persona_id);
      if (basePersona) {
        if (!persona.name) {
          updates.name = basePersona.name;
        }
        if (!persona.description) {
          updates.description = basePersona.description;
        }
      }
    } else {
      if (!persona.name) {
        updates.name = 'Persona personnalisé';
      }
      if (!persona.description) {
        updates.description = 'Description personnalisée';
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('custom_personas')
        .update(updates)
        .eq('id', persona.id);

      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour:`, updateError);
      } else {
        console.log(`✅ Mise à jour effectuée:`);
        if (updates.name) console.log(`   - Name: ${updates.name}`);
        if (updates.description) console.log(`   - Description: ${updates.description}`);
      }
    } else {
      console.log('⏭️  Aucune mise à jour nécessaire');
    }
  }

  console.log('\n✅ Correction terminée !');
}

fixCustomPersonas().catch(console.error);
