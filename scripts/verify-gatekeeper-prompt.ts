import { db } from '../lib/server/db';
import { decrypt } from '../lib/server/security/encryption';

async function main() {
  try {
    console.log('Fetching Gatekeeper prompt from DB...');
    const config = await db.agentConfig.findUnique({
      where: { slug: 'gatekeeper' },
    });

    if (!config) {
      throw new Error('Gatekeeper config not found');
    }

    const decryptedPrompt = decrypt(config.encryptedPrompt);
    console.log('--- Current Gatekeeper Prompt ---');
    console.log(decryptedPrompt);
    console.log('---------------------------------');
    
    // Check for key phrases
    if (decryptedPrompt.includes('รายได้จากการทำงาน') && decryptedPrompt.includes('การพนันโดยตรง')) {
      console.log('✅ Verification Passed: Prompt contains new logic.');
    } else {
      console.error('❌ Verification Failed: Prompt does not match expected logic.');
    }

  } catch (error) {
    console.error('Error verifying prompt:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
