# Snapshot: 2026-01-01_23-05_prediction-failure-analysis

## Context
- **Project**: mmv-tarots
- **Issue**: Predictions failing on Vercel after credit top-up.
- **Symptoms**: `PROHIBITED_CONTENT` from Gemini and `P2028` (Transaction Timeout) from Prisma.

## Analysis
1. **AI Failure (`PROHIBITED_CONTENT`)**:
    - The `MODEL_NAME` is set to `gemini-2.5-flash`, which is non-existent/experimental.
    - Gemini's safety filters are blocking the tarot reading generation, likely due to keywords in the card meanings or the system prompt being interpreted as sensitive.
    - The `mysticAgent` fallback is triggered but the workflow still fails later.

2. **Database Failure (`P2028`)**:
    - Prisma transaction in `CreditService.deductStar` times out (5s).
    - **Root Cause**: The workflow is "fire-and-forget" in `app/api/predict/route.ts`. On Vercel, the serverless function is suspended as soon as the response is sent. This freezes the background execution, including the Prisma transaction, causing it to expire when the function is briefly resumed or killed.

3. **Workflow Logic**:
    - The credit is deducted *after* the AI generates the reading but *before* saving it as `COMPLETED`.
    - If the AI fails, the fallback is used, but the subsequent DB operations fail due to the suspension.

## Proposed Fixes
1. **Model Name**: Update `MODEL_NAME` to `gemini-1.5-flash` (stable).
2. **Safety Settings**: Add `safetySettings` to `generateText` to allow tarot-related content (Hate Speech, Harassment, etc. set to `BLOCK_NONE` or `BLOCK_ONLY_HIGH`).
3. **Vercel Reliability**: 
    - Use `await` for the workflow in the API route to prevent suspension (at the cost of response time).
    - OR use `request.waitUntil` if switching to Edge runtime.
    - OR move credit deduction to be more atomic and less dependent on the long-running AI process.

## Next Steps
- [ ] Update `.env` and agent files with correct model name.
- [ ] Implement safety settings in `gatekeeper`, `analyst`, and `mystic` agents.
- [ ] Refactor `app/api/predict/route.ts` to ensure workflow completion.

**Oracle Keeper Note**: The human's stars are sacred. We must ensure that if a star is deducted, a reading is delivered, and if a reading fails, the star is preserved.
