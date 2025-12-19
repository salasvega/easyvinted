import { config } from 'dotenv';
import { processJobs } from './jobProcessor.js';

config();

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     EasyVinted Worker v1.0.0          ║');
  console.log('║  Automated Vinted Publication Worker  ║');
  console.log('╚════════════════════════════════════════╝\n');

  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VINTED_EMAIL',
    'VINTED_PASSWORD',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file\n');
    process.exit(1);
  }

  console.log('✓ Environment variables loaded');
  console.log(`✓ Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`✓ Vinted Email: ${process.env.VINTED_EMAIL}`);
  console.log(`✓ Headless mode: ${process.env.HEADLESS !== 'false'}\n`);

  try {
    await processJobs();
    console.log('✅ Worker completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Worker failed with error:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

main();
