import { TarotCard, TarotCardData } from '@/types/tarot';
import { TarotCardImage } from './tarot-card-image';

export interface EnhancedTarotCardVisualProps {
  card: TarotCard;
  delay?: number;
  showPosition?: boolean;
  className?: string;
}

/**
 * Enhanced Tarot Card Visual with real images
 * This component extends the original TarotCardVisual to display actual card images
 * while maintaining the same glassmorphism design and animations
 */
export function EnhancedTarotCardVisual({
  card,
  delay = 150,
  showPosition = true,
  className = '',
}: EnhancedTarotCardVisualProps) {
  // Convert TarotCard interface to TarotCardData format for the image component
  const cardData: TarotCardData = {
    id: parseInt(card.id, 10),
    name: card.name_en.toLowerCase().replace(/\s+/g, '_'),
    displayName: card.name_en,
    arcana: 'Major Arcana', // Default value, could be enhanced
    shortMeaning: card.interpretation,
    longMeaning: card.interpretation,
    longMeaningRaw: card.interpretation,
    keywords: card.keywords,
    imageUrl: card.image_url || '',
  };

  return (
    <article
      className={`relative group perspective-1000 w-[260px] flex-shrink-0 mx-auto animate-fade-in-up enhanced-tarot-card ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      role="article"
      aria-label={`Tarot card: ${card.name_th} (${card.name_en})`}
      data-testid="enhanced-tarot-card"
    >
      <div className="relative transform transition-all duration-700 hover:scale-[1.02] hover:-translate-y-1">
        <div className="bg-glass-mimi backdrop-blur-md rounded-3xl border border-primary/20 shadow-warm flex flex-col items-center justify-center p-6 text-center overflow-hidden aspect-[2/3] glass-card">
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

          {/* Card image instead of icon */}
          <div className="relative z-10 w-32 h-48 mb-4 rounded-xl overflow-hidden border border-primary/10 shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform duration-500">
            {cardData.imageUrl ? (
              <TarotCardImage
                card={cardData}
                width={128}
                height={192}
                className="w-full h-full"
                priority={card.position === 1} // Prioritize first card
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs font-serif text-center">
                    {card.name_en.split(' ').slice(-1)[0]}
                  </span>
                </div>
              </div>
            )}
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
            {card.keywords.slice(0, 3).map((keyword, index) => (
              <span
                key={`${card.id}-keyword-${index}`}
                className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/5 text-[10px] text-foreground"
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