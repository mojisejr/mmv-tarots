'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardDetails } from './card-details';
import { TarotCardImage } from '@/components/features/tarot';
import type { CardReading } from '@/types/reading';

interface CardSpreadProps {
  cards: CardReading[];
  onCardClick: (card: CardReading) => void;
}

export function CardSpread({ cards, onCardClick }: CardSpreadProps) {
  const isFiveCard = cards.length === 5;
  const isThreeCard = cards.length === 3;

  const getPositionName = (position: number): string => {
    switch (position) {
      case 0: return 'อดีต';
      case 1: return 'ปัจจุบัน';
      case 2: return 'อนาคต';
      default: return `ตำแหน่ง ${position + 1}`;
    }
  };

  // Animation variants for staggered reveal
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Mobile Fan Layout (Shared for 3 and 5 cards)
  const renderMobileFan = () => (
    <div className="md:hidden w-full pb-16 pt-12 px-2">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex justify-center items-end w-full mx-auto"
      >
        {cards.map((card, index) => {
          const total = cards.length;
          const isFive = total === 5;
          const mid = Math.floor(total / 2);
          
          // Adjust rotation and offset for a more natural fan curve
          const rotation = (index - mid) * (isFive ? 5 : 8); 
          const yOffset = Math.abs(index - mid) * (isFive ? 6 : 10);
          
          // Dynamic sizing to fit screen without scrolling
          // 5 cards need more overlap and slightly smaller width to fit
          const widthClass = isFive ? "w-[135px] xs:w-[145px] sm:w-[160px]" : "w-[150px] xs:w-[170px] sm:w-[190px]";
          const marginClass = isFive ? "-ml-[85px] xs:-ml-[90px] sm:-ml-[100px]" : "-ml-[70px] xs:-ml-[80px] sm:-ml-[90px]";
          
          return (
            <motion.div
              key={index}
              variants={item}
              className={`relative ${marginClass} first:ml-0 transition-all duration-300 hover:-translate-y-6 hover:z-30 hover:scale-105 active:scale-95 cursor-pointer`}
              style={{ 
                zIndex: index,
                transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
                transformOrigin: 'bottom center'
              }}
              onClick={() => onCardClick(card)}
            >
              <div className={`${widthClass} relative group`}>
                {/* Card Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Main Card Container */}
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-primary/20 group-hover:border-primary/50 transition-all duration-300 bg-white/80">
                  <TarotCardImage
                    card={{
                      id: card.name_en,
                      name: card.name_en,
                      displayName: card.name_th,
                      imageUrl: card.image,
                      keywords: card.keywords,
                    }}
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent opacity-80" />
                  
                  {/* Card Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-center">
                    {/* <p className="text-[9px] sm:text-[10px] text-primary/90 font-serif tracking-widest uppercase mb-0.5 opacity-90">
                      {getPositionName(card.position)}
                    </p> */}
                    <p className="text-[10px] sm:text-xs text-foreground font-serif line-clamp-1">
                      {card.name_th}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <div className="flex flex-col items-center gap-2 mt-8 animate-pulse">
        <div className="w-1 h-6 bg-gradient-to-b from-primary to-transparent rounded-full" />
        <p className="text-center text-muted-foreground/60 text-[10px] uppercase tracking-widest">
          แตะที่ไพ่เพื่อดูคำทำนาย
        </p>
      </div>
    </div>
  );



  if (isFiveCard) {
    return (
      <>
        {renderMobileFan()}

        {/* Desktop View: Sacred Cross */}

        <div className="hidden md:block py-10">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="relative max-w-4xl mx-auto h-[600px] flex items-center justify-center"
          >
            {/* Connecting Lines (Sacred Geometry) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[1px] h-[80%] bg-gradient-to-b from-transparent via-primary to-transparent"></div>
              <div className="absolute w-[80%] h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <div className="absolute w-[400px] h-[400px] border border-primary/30 rounded-full"></div>
            </div>

            {/* Card 1: Center (Current) */}
            <motion.div variants={item} className="absolute z-20 scale-110">
              <div className="w-[180px]">
                <CardDetails card={cards[0]} onClick={() => onCardClick(cards[0])} />
              </div>
            </motion.div>

            {/* Card 2: Left (Past) */}
            <motion.div variants={item} className="absolute left-[10%] top-1/2 -translate-y-1/2">
              <div className="w-[160px]">
                <CardDetails card={cards[1]} onClick={() => onCardClick(cards[1])} />
              </div>
            </motion.div>

            {/* Card 3: Right (Future) */}
            <motion.div variants={item} className="absolute right-[10%] top-1/2 -translate-y-1/2">
              <div className="w-[160px]">
                <CardDetails card={cards[2]} onClick={() => onCardClick(cards[2])} />
              </div>
            </motion.div>

            {/* Card 4: Top (Thought) */}
            <motion.div variants={item} className="absolute top-[5%] left-1/2 -translate-x-1/2">
              <div className="w-[160px]">
                <CardDetails card={cards[3]} onClick={() => onCardClick(cards[3])} />
              </div>
            </motion.div>

            {/* Card 5: Bottom (Foundation) */}
            <motion.div variants={item} className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
              <div className="w-[160px]">
                <CardDetails card={cards[4]} onClick={() => onCardClick(cards[4])} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </>
    );
  }

  // Default 3-Card Layout
  return (
    <>
      {renderMobileFan()}
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="hidden md:grid md:grid-cols-3 gap-8"
      >
        {cards.map((card, index) => (
          <motion.div key={index} variants={item}>
            <CardDetails 
              card={card} 
              onClick={() => onCardClick(card)}
            />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

