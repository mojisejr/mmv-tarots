import { db } from '../lib/server/db';
import { encrypt } from '../lib/server/security/encryption';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    const promptPath = path.join(process.cwd(), '.tmp/gatekeeper-prompt-refined.txt');
    
    if (!fs.existsSync(promptPath)) {
      throw new Error(`Prompt file not found at: ${promptPath}`);
    }

    const promptContent = fs.readFileSync(promptPath, 'utf-8');

    console.log('Encrypting Gatekeeper prompt...');
    const encryptedPrompt = encrypt(promptContent);

    console.log('Updating database for agent: gatekeeper...');
    await db.agentConfig.upsert({
      where: { slug: 'gatekeeper' },
      update: {
        encryptedPrompt: encryptedPrompt,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        slug: 'gatekeeper',
        encryptedPrompt: encryptedPrompt,
        isActive: true,
      },
    });

    console.log('Successfully updated Gatekeeper Agent prompt (Encrypted).');
  } catch (error) {
    console.error('Error updating prompt:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
