import { Heart, Sparkles, Sun, Sword } from 'lucide-react';

export interface TarotCard {
  position: number;
  id: string;
  name_en: string;
  name_th: string;
  image_url?: string;
  keywords: string[];
  orientation: 'upright' | 'reversed';
  interpretation: string;
}

export interface TarotCardVisualProps {
  card: TarotCard;
  delay?: number;
  showPosition?: boolean;
  className?: string;
}

/**
 * Tarot card visual component with glassmorphism design
 * Features:
 * - Dynamic icon selection based on card ID
 * - 3D perspective and hover effects
 * - Animated entrance with configurable delay
 * - Glass morphism styling with backdrop blur
 */
export function TarotCardVisual({
  card,
  delay = 150,
  showPosition = true,
  className = '',
}: TarotCardVisualProps) {
  // Map card types to icons with appropriate styling
  const getCardIcon = (cardId: string) => {
    // Sword cards
    if (cardId.includes('swords')) {
      return <Sword className="w-10 h-10 text-[var(--foreground)]/60" data-testid="sword-icon" aria-hidden="true" />;
    }

    // Major Arcana specific cards
    switch (cardId) {
      case 'major_06':
      case '06':
        return (
          <Heart
            className="w-10 h-10 text-[var(--primary)] drop-shadow-[0_0_10px_rgba(242,118,105,0.8)]"
            data-testid="heart-icon"
            aria-hidden="true"
          />
        );
      case 'major_19':
      case '19':
        return (
          <Sun
            className="w-10 h-10 text-[var(--accent)] drop-shadow-[0_0_10px_rgba(252,189,116,0.8)]"
            data-testid="sun-icon"
            aria-hidden="true"
          />
        );
      default:
        // Default sparkles icon for other cards
        return <Sparkles className="w-10 h-10 text-white/50" data-testid="sparkles-icon" aria-hidden="true" />;
    }
  };

  return (
    <article
      className={`relative group perspective-1000 w-[260px] flex-shrink-0 mx-auto animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      role="article"
      aria-label={`Tarot card: ${card.name_th} (${card.name_en})`}
    >
      <div className="relative transform transition-all duration-700 hover:scale-[1.02] hover:-translate-y-1">
        <div className="bg-glass-mimi backdrop-blur-md rounded-3xl border border-primary/20 shadow-warm flex flex-col items-center justify-center p-6 text-center overflow-hidden aspect-[2/3]">
          {/* Background gradient orb */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[40px] rounded-full"
            aria-hidden="true"
          />

          {/* Card position badge */}
          {showPosition && (
            <div className="relative z-10 text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.2em] font-sans font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/10">
              {card.position}
            </div>
          )}

          {/* Icon container with hover effect */}
          <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center mb-4 border border-primary/10 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
            {getCardIcon(card.id)}
          </div>

          {/* Card names */}
          <h3 className="relative z-10 font-serif text-xl text-foreground font-bold leading-tight mb-1">
            {card.name_th}
          </h3>
          <p className="relative z-10 text-xs text-muted-foreground font-sans italic mb-4">
            {card.name_en}
          </p>

          {/* Keywords */}
          <div className="relative z-10 flex flex-wrap justify-center gap-1.5" role="list" aria-label="Keywords">
            {card.keywords.map((keyword, index) => (
              <span
                key={`${card.id}-keyword-${index}`}
                className="px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-[10px] text-white/80"
                role="listitem"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}