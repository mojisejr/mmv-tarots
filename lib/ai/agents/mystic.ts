// Mystic Agent
// Phase 3: GREEN - Reading generation implementation

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  MYSTIC_SYSTEM_PROMPT,
  MYSTIC_USER_PROMPT_TEMPLATE
} from '../prompts/mystic'
import { AnalystResponse } from './analyst'

export interface CardReading {
  position: number
  name_en: string
  name_th: string
  image: string
  keywords: string[]
  interpretation: string
}

export interface MysticResponse {
  header: string
  cards_reading: CardReading[]
  reading: string
  suggestions: string[]
  next_questions: string[]
  final_summary: string
  disclaimer: string
}

// Card names mapping
const CARD_NAMES: Record<number, { en: string; th: string }> = {
  0: { en: 'The Fool', th: 'ไพ่คนโง่เขลา' },
  1: { en: 'The Magician', th: 'ไพ่พ่อมด' },
  2: { en: 'The High Priestess', th: 'ไพ่นางพรหมจารีสูงสุด' },
  3: { en: 'The Empress', th: 'ไพ่จักรพรรดินี' },
  4: { en: 'The Emperor', th: 'ไพ่จักรพรรดิ' },
  5: { en: 'The Hierophant', th: 'ไพียฏิปาสาธิกร' },
  6: { en: 'The Lovers', th: 'ไพ่คู่รัก' },
  7: { en: 'The Chariot', th: 'ไพ่รถม้า' },
  8: { en: 'Strength', th: 'ไพ่ความแข็งแกร่ง' },
  9: { en: 'The Hermit', th: 'ไพ่ฤาษี' },
  10: { en: 'Wheel of Fortune', th: 'วงล้อแห่งโชคชะตา' },
  11: { en: 'Justice', th: 'ไพ่ความยุติธรรม' },
  12: { en: 'The Hanged Man', th: 'ไพ่คนแขวนคอ' },
  13: { en: 'Death', th: 'ไพ่ความตาย' },
  14: { en: 'Temperance', th: 'ไพ่ความพอประมาณ' },
  15: { en: 'The Devil', th: 'ไพ่ซาตาน' },
  16: { en: 'The Tower', th: 'ไพ่หอคอย' },
  17: { en: 'The Star', th: 'ไพ่ดวงดาว' },
  18: { en: 'The Moon', th: 'ไพ่พระจันทร์' },
  19: { en: 'The Sun', th: 'ไพ่พระอาทิตย์' },
  20: { en: 'Judgement', th: 'ไพ่การพิพากษา' },
  21: { en: 'The World', th: 'ไพ่โลก' }
}

export async function mysticAgent(
  question: string,
  analysis: AnalystResponse,
  selectedCards: number[]
): Promise<MysticResponse> {
  try {
    const response = await generateText({
      model: openai('gpt-4o'),
      system: MYSTIC_SYSTEM_PROMPT,
      prompt: MYSTIC_USER_PROMPT_TEMPLATE(question, analysis, selectedCards),
      temperature: 0.8
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as MysticResponse

    // Enhance card information with proper names and images
    result.cards_reading = result.cards_reading.map((card, index) => ({
      ...card,
      name_en: CARD_NAMES[selectedCards[index]]?.en || 'Unknown',
      name_th: CARD_NAMES[selectedCards[index]]?.th || 'ไม่ทราบ',
      image: `cards/major/${selectedCards[index]}.jpg`
    }))

    // Validate response structure
    const requiredFields = [
      'header', 'cards_reading', 'reading', 'suggestions',
      'next_questions', 'final_summary', 'disclaimer'
    ]
    for (const field of requiredFields) {
      if (!result[field as keyof MysticResponse]) {
        throw new Error(`Missing field: ${field}`)
      }
    }

    // Validate cards_reading has exactly 3 cards
    if (result.cards_reading.length !== 3) {
      throw new Error('Invalid cards_reading length')
    }

    return result
  } catch (error) {
    console.error('Mystic agent error:', error)

    // Fallback reading
    const cardReadings: CardReading[] = selectedCards.map((card, index) => ({
      position: index + 1,
      name_en: CARD_NAMES[card]?.en || 'Unknown',
      name_th: CARD_NAMES[card]?.th || 'ไม่ทราบ',
      image: `cards/major/${card}.jpg`,
      keywords: ['ความหมายทั่วไป'],
      interpretation: 'ไพ่ใบนี้บ่งบอกถึงการเปลี่ยนแปลง'
    }))

    return {
      header: 'สวัสดีค่ะ มาดูไพ่กัน',
      cards_reading: cardReadings,
      reading: 'จากการสละไพ่ทั้ง 3 ใบ พบว่าอนาคตของคุณมีโอกาสดีๆ เข้ามา',
      suggestions: ['มั่นใจในตัวเอง', 'เปิดใจรับสิ่งใหม่'],
      next_questions: ['สิ่งที่คุณต้องการคืออะไร?'],
      final_summary: 'อนาคตสดใสรออยู่ข้างหน้า',
      disclaimer: 'โปรดใช้วิจารณญาณในการตัดสินใจ'
    }
  }
}