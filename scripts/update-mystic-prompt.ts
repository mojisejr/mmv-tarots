import { db } from '../lib/server/db';
import { encrypt } from '../lib/server/security/encryption';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    const promptPath = path.join(process.cwd(), '.tmp/mystic-prompt-polite.txt');
    const promptContent = fs.readFileSync(promptPath, 'utf-8');

    console.log('Encrypting prompt...');
    const encryptedPrompt = encrypt(promptContent);

    console.log('Updating database...');
    await db.agentConfig.upsert({
      where: { slug: 'mystic' },
      update: {
        encryptedPrompt: encryptedPrompt,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        slug: 'mystic',
        encryptedPrompt: encryptedPrompt,
        isActive: true,
      },
    });

    console.log('Successfully updated Mystic Agent prompt (Encrypted).');
  } catch (error) {
    console.error('Error updating prompt:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
