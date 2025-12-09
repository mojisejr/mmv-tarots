'use client';

import { useState } from 'react';
import {
  Navigation,
  QuestionInput,
  TarotCardVisual,
  MimiAvatar,
  GlassCard,
  GlassButton,
  FormattedText
} from '@/components';
import type { TarotCard } from '@/components/features/tarot/tarot-card';

// Mock tarot cards for demonstration
const mockCards: TarotCard[] = [
  {
    position: 1,
    id: 'swords_3',
    name_en: 'Three of Swords',
    name_th: 'ไพ่ 3 ดาบ',
    keywords: ['ความเจ็บปวด', 'แผลใจ', 'รักสามเส้า'],
    orientation: 'upright',
    interpretation: 'ไพ่ใบแรกเปิดมาเจอความเจ็บปวดเลย เหมือนหนูเพิ่งผ่านเรื่องที่ทำให้ร้องไห้หนักๆ มา',
  },
  {
    position: 2,
    id: 'major_06',
    name_en: 'The Lovers',
    name_th: 'ไพ่คู่รัก',
    keywords: ['ทางเลือก', 'ความรัก', 'ความลังเล'],
    orientation: 'upright',
    interpretation: 'แต่ในความเจ็บปวด ลึกๆ แล้วถ่านไฟเก่ายังคุกรุ่นนะ ไพ่ใบนี้บอกว่าทั้งคู่ยังมีเยื่อใยต่อกัน',
  },
  {
    position: 3,
    id: 'major_19',
    name_en: 'The Sun',
    name_th: 'ไพ่พระอาทิตย์',
    keywords: ['ความสำเร็จ', 'ฟ้าหลังฝน', 'ความสดใส'],
    orientation: 'upright',
    interpretation: 'สุดท้ายแล้ว ไม่ว่าจะเลือกทางไหน ฟ้าจะสว่างสดใสแน่นอนจ้ะ',
  },
];

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isLoggedIn] = useState(true); // Simulate logged in state
  const [currentPage, setCurrentPage] = useState('home');

  const handleQuestionSubmit = (value: string) => {
    console.log('Question submitted:', value);
    // In a real app, this would trigger the tarot reading flow
  };

  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  const handleBackClick = () => {
    console.log('Back clicked');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Navigation
        currentPage={currentPage}
        isLoggedIn={isLoggedIn}
        onMenuClick={handleMenuClick}
        onProfileClick={handleProfileClick}
        onBackClick={handleBackClick}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Hero Section with Mimi Avatar */}
          <section className="text-center space-y-6 py-12">
            <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight tracking-tight drop-shadow-lg animate-fade-in-up">
              What guidance
              <br />
              do you seek?
            </h1>

            <div className="relative w-72 h-72 md:w-[28rem] md:h-[28rem] mx-auto flex items-center justify-center">
              <MimiAvatar />
            </div>
          </section>

          {/* Question Input Demo */}
          <section className="w-full max-w-3xl mx-auto">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-serif text-white mb-6 text-center">
                Ask Mimi Your Question
              </h2>
              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleQuestionSubmit}
                placeholder="What would you like to know about your future?"
              />
            </GlassCard>
          </section>

          {/* Tarot Cards Gallery */}
          <section className="py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-white mb-4">
                Sample Tarot Reading
              </h2>
              <p className="text-white/70">
                Interactive tarot cards with 3D hover effects
              </p>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 px-4 pb-6 pt-2 no-scrollbar items-start">
              {mockCards.map((card, idx) => (
                <div key={idx} className="snap-center flex flex-col items-center flex-shrink-0">
                  <TarotCardVisual card={card} delay={idx * 150} />
                </div>
              ))}
              <div className="w-4 flex-shrink-0"></div>
            </div>
          </section>

          {/* Component Features */}
          <section className="grid md:grid-cols-2 gap-8 py-12">
            <GlassCard>
              <h3 className="text-xl font-semibold text-white mb-4">
                Phase 1: Liquid Background
              </h3>
              <p className="text-white/70 mb-4">
                Mystical liquid background with floating gradient orbs and noise texture
              </p>
              <ul className="space-y-2 text-white/60">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--primary)] rounded-full"></span>
                  Animated gradient orbs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full"></span>
                  Noise texture overlay
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--success)] rounded-full"></span>
                  Smooth floating animations
                </li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h3 className="text-xl font-semibold text-white mb-4">
                Phase 2: Core Components
              </h3>
              <p className="text-white/70 mb-4">
                Essential UI components with glassmorphism design
              </p>
              <ul className="space-y-2 text-white/60">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--primary)] rounded-full"></span>
                  Navigation with conditional buttons
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full"></span>
                  Auto-resizing question input
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--success)] rounded-full"></span>
                  Interactive tarot cards
                </li>
              </ul>
            </GlassCard>
          </section>

          {/* Test Results Badge */}
          <section className="text-center py-8">
            <GlassCard className="inline-flex items-center gap-3 px-6 py-3">
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <p className="font-semibold text-white">167 Tests Passing</p>
                <p className="text-sm text-white/60">100% Test Coverage</p>
              </div>
            </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}