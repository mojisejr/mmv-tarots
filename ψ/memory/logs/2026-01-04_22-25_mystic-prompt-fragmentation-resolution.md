# Snapshot: Mystic Prompt Fragmentation Resolution

**Time**: 2026-01-04 22:25
**Context**: Resolving a "Reality Gap" where the `main` branch had new prompt content but lacked the encryption logic from a feature branch, leading to a manual merge and database update.

## Insight

When working across branches where one focus is UI/Content (`main`) and another is Security/Infrastructure (`feature/prompt-encryption-final`), a "Reality Gap" can occur if the AI assumes the infrastructure is already in place. 

In this case, `mystic.ts` was updated in `main` with a new polite prompt, but it was still using raw strings instead of the `AgentService` encryption wrapper. To resolve this without a messy git merge, we:
1. Manually updated the code to use `AgentService`.
2. Created a one-off migration script (`scripts/update-mystic-prompt.ts`) to encrypt the new prompt and push it to the `AgentConfig` table.
3. Verified the build to ensure type safety and runtime integrity.

## Apply When

- Merging security features into content-heavy branches.
- Resolving discrepancies between local code and database state.
- Ensuring "Polite & Warm" prompts are properly secured before deployment.

## Tags

`mmv-tarots` `encryption` `prisma` `prompt-engineering` `fragmentation`
