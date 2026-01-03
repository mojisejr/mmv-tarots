import { db } from '@/lib/server/db';
import { decrypt } from '@/lib/server/security/encryption';

interface CachedPrompt {
  prompt: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 1 minute cache
const promptCache = new Map<string, CachedPrompt>();

export class AgentService {
  static async getPrompt(slug: string): Promise<string> {
    const now = Date.now();
    const cached = promptCache.get(slug);

    if (cached && cached.expiresAt > now) {
      return cached.prompt;
    }

    const config = await db.agentConfig.findUnique({
      where: { slug },
    });

    if (!config) {
      throw new Error(`Agent config not found for slug: ${slug}`);
    }

    if (!config.isActive) {
      throw new Error(`Agent ${slug} is currently inactive`);
    }

    try {
      const decryptedPrompt = decrypt(config.encryptedPrompt);
      
      promptCache.set(slug, {
        prompt: decryptedPrompt,
        expiresAt: now + CACHE_TTL_MS,
      });

      return decryptedPrompt;
    } catch (error) {
      console.error(`Failed to decrypt prompt for ${slug}:`, error);
      throw new Error(`Security violation: Unable to decrypt agent prompt for ${slug}`);
    }
  }

  static invalidateCache(slug?: string) {
    if (slug) {
      promptCache.delete(slug);
    } else {
      promptCache.clear();
    }
  }
}
