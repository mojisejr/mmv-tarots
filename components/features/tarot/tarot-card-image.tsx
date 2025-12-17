'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Sword, Heart, Sun } from 'lucide-react';
import { TarotCardData } from '@/types/tarot';

interface TarotCardImageProps {
  card: TarotCardData;
  className?: string;
  lazy?: boolean;
  priority?: boolean;
  width?: number;
  height?: number;
}

/**
 * Tarot card image component with fallback and loading states
 * Features:
 * - Real card images from Supabase
 * - Loading spinner during image load
 * - Fallback icon on error
 * - Responsive design with Next.js Image optimization
 */
export function TarotCardImage({
  card,
  className = '',
  lazy = true,
  priority = false,
  width = 200,
  height = 300,
}: TarotCardImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Don't render if no image URL
  if (!card.imageUrl) {
    return <FallbackIcon cardName={card.displayName || card.name || 'Unknown'} className={className} />;
  }

  return (
    <div
      className={`relative tarot-card-image-container ${className}`}
      data-testid="tarot-card-image-container"
    >
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-lg"
          data-testid="loading-spinner"
        >
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}

      {hasError ? (
        <FallbackIcon cardName={card.displayName || card.name || 'Unknown'} className={className} />
      ) : (
        <Image
          src={card.imageUrl}
          alt={`${card.displayName || card.name || 'Unknown'} tarot card`}
          width={width}
          height={height}
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          data-testid="tarot-card-img"
          loading={lazy ? 'lazy' : 'eager'}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          sizes="(max-width: 768px) 150px, 200px"
        />
      )}
    </div>
  );
}

interface FallbackIconProps {
  cardName?: string;
  className?: string;
}

/**
 * Fallback icon component for cards without images or on load error
 */
function FallbackIcon({ cardName, className }: FallbackIconProps) {
  const getIcon = () => {
    // Safety check
    if (!cardName || typeof cardName !== 'string') {
      return <Sparkles className="w-12 h-12 text-white/60" data-testid="fallback-icon" />;
    }

    // Card-specific icon mapping
    if (cardName.includes('Swords') || cardName.includes('ดาบ')) {
      return <Sword className="w-12 h-12 text-white/60" data-testid="fallback-icon" />;
    }
    if (cardName.includes('Lovers') || cardName.includes('คู่รัก')) {
      return <Heart className="w-12 h-12 text-white/60" data-testid="fallback-icon" />;
    }
    if (cardName.includes('Sun') || cardName.includes('พระอาทิตย์')) {
      return <Sun className="w-12 h-12 text-white/60" data-testid="fallback-icon" />;
    }

    // Default sparkle icon
    return <Sparkles className="w-12 h-12 text-white/60" data-testid="fallback-icon" />;
  };

  return (
    <div
      className={`w-full h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center ${className}`}
    >
      {getIcon()}
    </div>
  );
}