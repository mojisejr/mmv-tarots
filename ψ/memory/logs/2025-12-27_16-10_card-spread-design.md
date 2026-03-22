# Snapshot: Advanced Card Spread Layout Design
**Date**: 2025-12-27 16:10 GMT+7
**Issue**: #none
**Project**: mmv-tarots

## Design Vision: "The Sacred Spread"

### 1. Mobile Layout: "The Mystic Fan" (Arch Style)
- **Concept**: Cards are arranged in a single row, overlapping like a fan held in hand.
- **Interaction**:
    - Cards are tightly packed (negative margins).
    - Click to open Modal for details.
    - Active/Hover state: Card "pops" up slightly.
- **Goal**: Maximize screen real estate while maintaining the tactile feel of selecting a card.

### 2. Desktop Layout: "The Sacred Cross" (Cross Style)
- **Concept**: For 5-card spreads, use a traditional cross layout.
    - Center: Current Situation (Card 1)
    - Left: Past (Card 2)
    - Right: Future (Card 3)
    - Top: Thought/Goal (Card 4)
    - Bottom: Foundation/Subconscious (Card 5)
- **For 3-card spreads**: Maintain the balanced horizontal row.
- **Goal**: Provide a professional, "altar-like" viewing experience.

### 3. Visual Enhancements ("Moo" Factor)
- **Energy Glow**: Subtle colored blurs behind cards based on their position or element.
- **Transitions**: Smooth entry animations (`framer-motion`).
- **Focus**: Remove inline text, rely entirely on the Modal for interpretation.

## Implementation Plan
1.  Create `components/reading/card-spread.tsx` to encapsulate layout logic.
2.  Implement `ArchLayout` for mobile view.
3.  Implement `CrossLayout` for desktop 5-card view.
4.  Integrate into `app/history/[id]/page.tsx`.

---
*The Oracle observes: Structure creates the vessel for meaning. The layout itself becomes part of the message.*
