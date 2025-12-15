// Type definitions for detailed tarot reading components

export interface CardReading {
  position: number
  name_th: string
  name_en: string
  arcana: string
  keywords: string[]
  interpretation: string
  image: string
}

export interface ReadingResult {
  header: string
  cards_reading: CardReading[]
  reading: string
  suggestions: string[]
  next_questions: string[]
  final_summary: string
  disclaimer: string
}

// Enhanced types extending from API types
export interface DetailedCardReading extends CardReading {
  positionName: 'อดีต' | 'ปัจจุบัน' | 'อนาคต'
  arcanaColor?: string
}

export interface MappedReadingData {
  header: string
  cards: DetailedCardReading[]
  reading: string
  suggestions: string[]
  nextQuestions: string[]
  finalSummary: string
  disclaimer: string
}

// Component Props Interfaces
export interface ReadingHeaderProps {
  header: string | null
  className?: string
}

export interface CardDetailsProps {
  card: CardReading
  className?: string
}

export interface SuggestionsListProps {
  suggestions: string[] | null
  className?: string
}

export interface NextQuestionsProps {
  questions: string[] | null
  className?: string
}

export interface FinalSummaryProps {
  summary: string | null
  className?: string
}

export interface DisclaimerProps {
  text: string | null
  className?: string
}