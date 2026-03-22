# Snapshot: Social Share UI Refactoring (#none)

**Time**: 2026-01-18 22:54
**Context**: Refactoring `ShareActions` component in `mmv-tarots` to replace single share button with 3 social icons (Facebook, X, TikTok).

## Insight

- Current implementation uses `navigator.share` (Web Share API).
- Replacing with manual intents:
  - Facebook: `sharer/sharer.php`
  - X: `intent/tweet`
  - TikTok: Web intent is limited, likely need fallback to "Copy Link" or specialized app link if available.
- Design: Moving towards branded icons while maintaining the project's glassmorphism style.

## Apply When

- Building social sharing features for specific platforms.
- Moving away from native OS share dialogs for better branding control.

## Tags

`ui-refactoring` `social-share` `mmv-tarots` `nextjs`
