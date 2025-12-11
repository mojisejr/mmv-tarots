// Phase 4: Mock Data Generation for Tarot Readings
// GREEN Phase - Minimal implementation to make tests pass

import type { Card } from '@prisma/client'

export interface TarotReadingRequest {
  question: string
  numCards?: number // 3-5 cards
  userIdentifier?: string
}

export interface CardReading {
  position: number
  name_en: string
  name_th: string
  image: string
  keywords: string[]
  interpretation: string
}

export interface CompleteReading {
  header: string
  cards_reading: CardReading[]
  reading: string
  suggestions: string[]
  next_questions: string[]
  final_summary: string
  disclaimer: string
}

export interface PartialReading {
  status: 'PENDING' | 'PROCESSING' | 'ANALYSIS_COMPLETE' | 'FAILED'
  step: string
  cards_selected?: number[]
  reading?: undefined
  error?: string
}

export interface ErrorScenarios {
  [key: string]: {
    status: 'FAILED'
    error: string
  }
}

// Simplified Tarot Cards interface for mock data generation
interface MockTarotCard {
  id: number
  cardId: number
  name: string
  displayName: string
  arcana: string
  keywords: string[]
  imageUrl: string
}

// Complete Tarot Cards Data - All 78 cards for realistic mock readings
const TAROT_CARDS: MockTarotCard[] = [
  // Major Arcana (0-21)
  { id: 0, cardId: 0, name: 'The Fool', displayName: 'คนโง่เผลอ', arcana: 'Major', keywords: ['การเริ่มต้นใหม่', 'ความเชื่อมั่น', 'ความเผ่อผลา', 'โอกาสใหม่'], imageUrl: '/cards/major/00.jpg' },
  { id: 1, cardId: 1, name: 'The Magician', displayName: 'นักมายากล', arcana: 'Major', keywords: ['การสร้างสรรค์', 'พลังความคิด', 'ความสามารถ', 'การนำเสนอ'], imageUrl: '/cards/major/01.jpg' },
  { id: 2, cardId: 2, name: 'The High Priestess', displayName: 'นางพรหมจารีสูงสุด', arcana: 'Major', keywords: ['สติปัญญา', 'ความรู้', 'ลึกลับ', 'สัญชาตญาณ'], imageUrl: '/cards/major/02.jpg' },
  { id: 3, cardId: 3, name: 'The Empress', displayName: 'จักรพรรดินี', arcana: 'Major', keywords: ['ความอุดมสมบูรณ์', 'ความรัก', 'ความสำเร็จ', 'ดุลยภาพ'], imageUrl: '/cards/major/03.jpg' },
  { id: 4, cardId: 4, name: 'The Emperor', displayName: 'จักรพรรดิ', arcana: 'Major', keywords: ['อำนาจ', 'ความเป็นผู้นำ', 'ความมั่นคง', 'โครงสร้าง'], imageUrl: '/cards/major/04.jpg' },
  { id: 5, cardId: 5, name: 'The Hierophant', displayName: 'นักบวชผู้ยิ่งใหญ่', arcana: 'Major', keywords: ['ความเชื่อ', 'ปรัชญา', 'การสอน', 'ธรรมเนียมปฏิบัติ'], imageUrl: '/cards/major/05.jpg' },
  { id: 6, cardId: 6, name: 'The Lovers', displayName: 'คู่รัก', arcana: 'Major', keywords: ['ความรัก', 'ความสัมพันธ์', 'การเลือก', 'ความกลมกลืน'], imageUrl: '/cards/major/06.jpg' },
  { id: 7, cardId: 7, name: 'The Chariot', displayName: 'รถม้า', arcana: 'Major', keywords: ['ชัยชนะ', 'ความมุ่งมั่น', 'การควบคุม', 'การเดินทาง'], imageUrl: '/cards/major/07.jpg' },
  { id: 8, cardId: 8, name: 'Strength', displayName: 'ความแข็งแกร่ง', arcana: 'Major', keywords: ['ความกล้าหาญ', 'ความอดทน', 'พลังภายใน', 'ความเมตตา'], imageUrl: '/cards/major/08.jpg' },
  { id: 9, cardId: 9, name: 'The Hermit', displayName: 'นักบวชสันถวัตย์', arcana: 'Major', keywords: ['การสำรวจตนเอง', 'ความรู้ภายใน', 'ความสันโดษ', 'การแนะนำ'], imageUrl: '/cards/major/09.jpg' },
  { id: 10, cardId: 10, name: 'Wheel of Fortune', displayName: 'วงล้อแห่งโชคชะตา', arcana: 'Major', keywords: ['โชคชะตา', 'การเปลี่ยนแปลง', 'วงจร', 'จังหวะ'], imageUrl: '/cards/major/10.jpg' },
  { id: 11, cardId: 11, name: 'Justice', displayName: 'ความยุติธรรม', arcana: 'Major', keywords: ['ความเป็นธรรม', 'ความสมดุล', 'สติปัญญา', 'การตัดสินใจ'], imageUrl: '/cards/major/11.jpg' },
  { id: 12, cardId: 12, name: 'The Hanged Man', displayName: 'คนแขวนคอ', arcana: 'Major', keywords: ['การเสียสละ', 'มุมมองใหม่', 'การรอ', 'การเปลี่ยนแปลง'], imageUrl: '/cards/major/12.jpg' },
  { id: 13, cardId: 13, name: 'Death', displayName: 'ความตาย', arcana: 'Major', keywords: ['การจบสิ้น', 'การเปลี่ยนแปลงครั้งใหญ่', 'การเกิดใหม่', 'การเปลี่ยนผ่าน'], imageUrl: '/cards/major/13.jpg' },
  { id: 14, cardId: 14, name: 'Temperance', displayName: 'ความสุขุม', arcana: 'Major', keywords: ['ความสมดุล', 'การปรองดอง', 'การเชื่อมโยง', 'ความอดทน'], imageUrl: '/cards/major/14.jpg' },
  { id: 15, cardId: 15, name: 'The Devil', displayName: 'ซาตาน', arcana: 'Major', keywords: ['การพันธน์การ', 'วงล้อม', 'ความติดขัด', 'ความมัวหมอง'], imageUrl: '/cards/major/15.jpg' },
  { id: 16, cardId: 16, name: 'The Tower', displayName: 'หอคอย', arcana: 'Major', keywords: ['การล้มทลาย', 'การเปลี่ยนแปลงฉับพลัน', 'ความจริง', 'การปลดปล่อย'], imageUrl: '/cards/major/16.jpg' },
  { id: 17, cardId: 17, name: 'The Star', displayName: 'ดวงดาว', arcana: 'Major', keywords: ['ความหวัง', 'แรงบันดาลใจ', 'การเยี่ยมรู้', 'การรักษา'], imageUrl: '/cards/major/17.jpg' },
  { id: 18, cardId: 18, name: 'The Moon', displayName: 'พระจันทร์', arcana: 'Major', keywords: ['ภาพลวงตา', 'ความกลัว', 'สัญชาตญาณ', 'จิตใต้สำนึก'], imageUrl: '/cards/major/18.jpg' },
  { id: 19, cardId: 19, name: 'The Sun', displayName: 'พระอาทิตย์', arcana: 'Major', keywords: ['ความสำเร็จ', 'ความสุข', 'ความสว่างไสว', 'พลังงานบวก'], imageUrl: '/cards/major/19.jpg' },
  { id: 20, cardId: 20, name: 'Judgement', displayName: 'การพิพากษา', arcana: 'Major', keywords: ['การปลุกตัวตน', 'การฟื้นตัว', 'การตัดสิน', 'การเรียกร้อง'], imageUrl: '/cards/major/20.jpg' },
  { id: 21, cardId: 21, name: 'The World', displayName: 'โลก', arcana: 'Major', keywords: ['ความสำเร็จ', 'การสำเร็จ', 'วงจรสมบูรณ์', 'ความสามัคคี'], imageUrl: '/cards/major/21.jpg' },

  // Minor Arcana - Wands (22-35)
  { id: 22, cardId: 22, name: 'Ace of Wands', displayName: 'เอซไม้เท้า', arcana: 'Minor', keywords: ['แรงบันดาลใจ', 'พลังงานใหม่', 'ความคิดริเริ่ม', 'โอกาส'], imageUrl: '/cards/wands/01.jpg' },
  { id: 23, cardId: 23, name: 'Two of Wands', displayName: '2 ไม้เท้า', arcana: 'Minor', keywords: ['การวางแผน', 'อนาคต', 'การค้นพบ', 'การตัดสินใจ'], imageUrl: '/cards/wands/02.jpg' },
  { id: 24, cardId: 24, name: 'Three of Wands', displayName: '3 ไม้เท้า', arcana: 'Minor', keywords: ['ความก้าวหน้า', 'การขยายตัว', 'การเดินทางไกล', 'ความสำเร็จเบื้องต้น'], imageUrl: '/cards/wands/03.jpg' },
  { id: 25, cardId: 25, name: 'Four of Wands', displayName: '4 ไม้เท้า', arcana: 'Minor', keywords: ['การเฉลิมฉลอง', 'ความสุข', 'ความสมดุล', 'ชุมชน'], imageUrl: '/cards/wands/04.jpg' },
  { id: 26, cardId: 26, name: 'Five of Wands', displayName: '5 ไม้เท้า', arcana: 'Minor', keywords: ['การแข่งขัน', 'ความขัดแย้ง', 'ความท้าทาย', 'ความต่างความคิด'], imageUrl: '/cards/wands/05.jpg' },
  { id: 27, cardId: 27, name: 'Six of Wands', displayName: '6 ไม้เท้า', arcana: 'Minor', keywords: ['ชัยชนะ', 'การได้รับการยอมรับ', 'ความสำเร็จ', 'การยอมรับ'], imageUrl: '/cards/wands/06.jpg' },
  { id: 28, cardId: 28, name: 'Seven of Wands', displayName: '7 ไม้เท้า', arcana: 'Minor', keywords: ['การป้องกัน', 'ความกล้าหาญ', 'นิสัยดื้อรั้น', 'ตำแหน่งที่แข็งแกร่ง'], imageUrl: '/cards/wands/07.jpg' },
  { id: 29, cardId: 29, name: 'Eight of Wands', displayName: '8 ไม้เท้า', arcana: 'Minor', keywords: ['ความเร็ว', 'การกระทำ', 'การสื่อสาร', 'การเดินทาง'], imageUrl: '/cards/wands/08.jpg' },
  { id: 30, cardId: 30, name: 'Nine of Wands', displayName: '9 ไม้เท้า', arcana: 'Minor', keywords: ['ความอดทน', 'ความทนทาน', 'การป้องกัน', 'พลังสำรอง'], imageUrl: '/cards/wands/09.jpg' },
  { id: 31, cardId: 31, name: 'Ten of Wands', displayName: '10 ไม้เท้า', arcana: 'Minor', keywords: ['ภาระ', 'ความรับผิดชอบ', 'ความเหนื่อยล้า', 'ความมุ่งมั่น'], imageUrl: '/cards/wands/10.jpg' },
  { id: 32, cardId: 32, name: 'Page of Wands', displayName: 'เพจไม้เท้า', arcana: 'Minor', keywords: ['ข่าวดี', 'การสำรวจ', 'ความอยากรู้', 'พลังงานอายุน้อย'], imageUrl: '/cards/wands/page.jpg' },
  { id: 33, cardId: 33, name: 'Knight of Wands', displayName: 'ไนท์ไม้เท้า', arcana: 'Minor', keywords: ['การกระทำ', 'ความกล้าหาญ', 'การผจญภัย', 'ความรีบเร่ง'], imageUrl: '/cards/wands/knight.jpg' },
  { id: 34, cardId: 34, name: 'Queen of Wands', displayName: 'ควีนไม้เท้า', arcana: 'Minor', keywords: ['ความเข้าอกเข้าใจ', 'ความสง่า', 'พลังงานอบอุ่น', 'ความมั่นใจ'], imageUrl: '/cards/wands/queen.jpg' },
  { id: 35, cardId: 35, name: 'King of Wands', displayName: 'คิงไม้เท้า', arcana: 'Minor', keywords: ['ความเป็นผู้นำ', 'วิสัยทัศน์', 'การสร้างสรรค์', 'ความมั่นใจ'], imageUrl: '/cards/wands/king.jpg' },

  // Minor Arcana - Cups (36-49)
  { id: 36, cardId: 36, name: 'Ace of Cups', displayName: 'เอซถ้วย', arcana: 'Minor', keywords: ['ความรัก', 'ความเมตตา', 'อารมณ์', 'จิตใจ'], imageUrl: '/cards/cups/01.jpg' },
  { id: 37, cardId: 37, name: 'Two of Cups', displayName: '2 ถ้วย', arcana: 'Minor', keywords: ['ความสัมพันธ์', 'คู่รัก', 'ความสมดุล', 'การเชื่อมโยง'], imageUrl: '/cards/cups/02.jpg' },
  { id: 38, cardId: 38, name: 'Three of Cups', displayName: '3 ถ้วย', arcana: 'Minor', keywords: ['การเฉลิมฉลอง', 'มิตรภาพ', 'ชุมชน', 'ความสุข'], imageUrl: '/cards/cups/03.jpg' },
  { id: 39, cardId: 39, name: 'Four of Cups', displayName: '4 ถ้วย', arcana: 'Minor', keywords: ['ความเบื่อ', 'การปรับเปลี่ยน', 'การมองข้าม', 'ความไม่พอใจ'], imageUrl: '/cards/cups/04.jpg' },
  { id: 40, cardId: 40, name: 'Five of Cups', displayName: '5 ถ้วย', arcana: 'Minor', keywords: ['ความสูญเสีย', 'ความเสียใจ', 'การเสียใจ', 'ความผิดหวัง'], imageUrl: '/cards/cups/05.jpg' },
  { id: 41, cardId: 41, name: 'Six of Cups', displayName: '6 ถ้วย', arcana: 'Minor', keywords: ['ความทรงจำ', 'อดีต', 'ความไว้วางใจ', 'ความบริสุทธิ์'], imageUrl: '/cards/cups/06.jpg' },
  { id: 42, cardId: 42, name: 'Seven of Cups', displayName: '7 ถ้วย', arcana: 'Minor', keywords: ['ทางเลือก', 'ภาพลวงตา', 'ความฝัน', 'ความไม่แน่นอน'], imageUrl: '/cards/cups/07.jpg' },
  { id: 43, cardId: 43, name: 'Eight of Cups', displayName: '8 ถ้วย', arcana: 'Minor', keywords: ['การจากไป', 'การสละ', 'การค้นหา', 'ความไม่พึงพอใจ'], imageUrl: '/cards/cups/08.jpg' },
  { id: 44, cardId: 44, name: 'Nine of Cups', displayName: '9 ถ้วย', arcana: 'Minor', keywords: ['ความปรารถนา', 'ความสุข', 'ความพอใจ', 'ความสำเร็จส่วนตัว'], imageUrl: '/cards/cups/09.jpg' },
  { id: 45, cardId: 45, name: 'Ten of Cups', displayName: '10 ถ้วย', arcana: 'Minor', keywords: ['ความสุขในครอบครัว', 'ความสมบูรณ์', 'ความสามัคคี', 'ความรัก'], imageUrl: '/cards/cups/10.jpg' },
  { id: 46, cardId: 46, name: 'Page of Cups', displayName: 'เพจถ้วย', arcana: 'Minor', keywords: ['ความอ่อนโยน', 'ความฝัน', 'สัญชาตญาณ', 'ความรู้สึก'], imageUrl: '/cards/cups/page.jpg' },
  { id: 47, cardId: 47, name: 'Knight of Cups', displayName: 'ไนท์ถ้วย', arcana: 'Minor', keywords: ['โรแมนติก', 'ความเอาใจใส่', 'การนำเสนอ', 'ความฝัน'], imageUrl: '/cards/cups/knight.jpg' },
  { id: 48, cardId: 48, name: 'Queen of Cups', displayName: 'ควีนถ้วย', arcana: 'Minor', keywords: ['ความเมตตา', 'สัญชาตญาณ', 'การดูแล', 'ความรู้สึก'], imageUrl: '/cards/cups/queen.jpg' },
  { id: 49, cardId: 49, name: 'King of Cups', displayName: 'คิงถ้วย', arcana: 'Minor', keywords: ['ความสมดุลทางอารมณ์', 'ความเมตตา', 'การควบคุม', 'ความเข้าอกเข้าใจ'], imageUrl: '/cards/cups/king.jpg' },

  // Additional cards for testing variety (50-77)
  { id: 50, cardId: 50, name: 'Ace of Swords', displayName: 'เอซดาบ', arcana: 'Minor', keywords: ['ความคิด', 'ความชัดเจน', 'ความจริง', 'พลัง'], imageUrl: '/cards/swords/01.jpg' },
  { id: 56, cardId: 56, name: 'Five of Swords', displayName: '5 ดาบ', arcana: 'Minor', keywords: ['ความขัดแย้ง', 'การชนะโดยไม่สุจริต', 'ความพ่ายแพ้', 'ความเห็นแก่ตัว'], imageUrl: '/cards/swords/05.jpg' },
  { id: 63, cardId: 63, name: 'Queen of Swords', displayName: 'ควีนดาบ', arcana: 'Minor', keywords: ['ความเป็นอิสระ', 'ความคิด', 'ความซับซ้อน', 'ความเป็นผู้ใหญ่'], imageUrl: '/cards/swords/queen.jpg' },
  { id: 70, cardId: 70, name: 'Five of Pentacles', displayName: '5 เหรียญ', arcana: 'Minor', keywords: ['ความยากจน', 'ความโดดเดี่ยว', 'ความยากลำบาก', 'ความหวัง'], imageUrl: '/cards/pentacles/05.jpg' },
  { id: 77, cardId: 77, name: 'King of Pentacles', displayName: 'คิงเหรียญ', arcana: 'Minor', keywords: ['ความมั่งคั่ง', 'ความประสบความสำเร็จ', 'ความมั่นคง', 'ความเป็นผู้ใหญ่'], imageUrl: '/cards/pentacles/king.jpg' }
]

// Position templates for card readings
const POSITION_TEMPLATES = {
  1: 'อดีตที่ผ่านมา',
  2: 'สถานการณ์ปัจจุบัน',
  3: 'อนาคตที่จะถึง',
  4: 'อุปสรรคที่ต้องเผชิญ',
  5: 'คำแนะนำเพื่อการตัดสินใจ'
}

export function generateMockTarotReading(request: TarotReadingRequest): CompleteReading {
  const numCards = request.numCards || 3
  const selectedCards = getRandomTarotCards(numCards)

  return {
    header: generateHeader(request.question, numCards),
    cards_reading: selectedCards.map((card, index) => ({
      position: index + 1,
      name_en: card.name,
      name_th: card.displayName,
      image: card.imageUrl || `/cards/major/${card.id}.jpg`,
      keywords: card.keywords,
      interpretation: generateInterpretation(card.name, request.question)
    })),
    reading: generateMainReading(selectedCards, request.question),
    suggestions: generateSuggestions(selectedCards, request.question),
    next_questions: generateNextQuestions(selectedCards, request.question),
    final_summary: generateFinalSummary(selectedCards, request.question),
    disclaimer: 'การทำนายนี้เป็นเพียงแนวทางเท่านั้น การตัดสินใจขึ้นอยู่กับคุณ'
  }
}

export function getRandomTarotCards(count: number): MockTarotCard[] {
  // Ensure unique cards selection
  const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, TAROT_CARDS.length))
}

export function generatePartialReading(config: {
  status: 'PENDING' | 'PROCESSING' | 'ANALYSIS_COMPLETE' | 'FAILED'
  step: string
}): PartialReading {
  const partial: PartialReading = {
    status: config.status,
    step: config.step
  }

  if (config.status === 'PROCESSING' || config.status === 'ANALYSIS_COMPLETE') {
    partial.cards_selected = getRandomTarotCards(3).map(c => c.id)
  }

  if (config.status === 'FAILED') {
    partial.error = 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง'
  }

  return partial
}

export function generateErrorScenarios(): ErrorScenarios {
  return {
    INVALID_QUESTION: {
      status: 'FAILED',
      error: 'คำถามไม่เหมาะสำหรับการทำนาย กรุณาถามคำถามที่ชัดเจน'
    },
    CARDS_NOT_FOUND: {
      status: 'FAILED',
      error: 'ไม่พบข้อมูลไพ่ทา๭รต กรุณาลองใหม่อีกครั้ง'
    },
    AI_SERVICE_ERROR: {
      status: 'FAILED',
      error: 'บริการทำนายขัดข้อง กรุณาลองใหม่ในภายหลัง'
    },
    NETWORK_ERROR: {
      status: 'FAILED',
      error: 'เครือข่ายขัดข้อง กรุณาตรวจสอบการเชื่อมต่อและลองใหม่'
    },
    TIMEOUT_ERROR: {
      status: 'FAILED',
      error: 'การทำนายใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง'
    }
  }
}

// Helper functions (minimal implementations for GREEN phase)
function generateHeader(question: string, numCards: number): string {
  const questionType = analyzeQuestionType(question)
  const templates = {
    CAREER: `การทำนายเส้นทางอาชีพ (${numCards} ใบ)`,
    LOVE: `การทำนายเรื่องรักความสัมพันธ์ (${numCards} ใบ)`,
    GENERAL: `การทำนายทั่วไป (${numCards} ใบ)`
  }
  return templates[questionType] || templates.GENERAL
}

function analyzeQuestionType(question: string): 'CAREER' | 'LOVE' | 'GENERAL' {
  const lowerQuestion = question.toLowerCase()
  if (lowerQuestion.includes('career') || lowerQuestion.includes('job') || lowerQuestion.includes('งาน') || lowerQuestion.includes('อาชีพ')) {
    return 'CAREER'
  }
  if (lowerQuestion.includes('love') || lowerQuestion.includes('relationship') || lowerQuestion.includes('รัก') || lowerQuestion.includes('ความสัมพันธ์') || lowerQuestion.includes('soulmate')) {
    return 'LOVE'
  }
  return 'GENERAL'
}

function generateInterpretation(cardName: string, question: string): string {
  // Enhanced realistic interpretations based on specific cards
  const questionType = analyzeQuestionType(question)

  // Card-specific interpretations
  const cardInterpretations: { [key: string]: { [key: string]: string } } = {
    'The Fool': {
      'CAREER': 'ไพ่คนโง่เผลอ: คุณกำลังจะเริ่มต้นเส้นทางอาชีพใหม่ หรืออาจเป็นการเปลี่ยนแปลงสำคัญในการทำงาน ความกล้าที่จะเริ่มต้นใหม่จะนำมาซึ่งโอกาสที่ไม่คาดคิด',
      'LOVE': 'ไพ่คนโง่เผลอ: ในเรื่องรักความสัมพันธ์ คุณกำลังจะเปิดหน้าใหม่ อาจเจอคนใหม่หรือเริ่มความสัมพันธ์ใหม่ๆ ที่ต้องการความกล้าและความเชื่อมั่น',
      'GENERAL': 'ไพ่คนโง่เผลอ: ชีวิตของคุณกำลังจะเข้าสู่บทใหม่ การเริ่มต้นสิ่งใหม่จะนำพาคุณไปสู่ประสบการณ์ที่เติบโตและเรียนรู้'
    },
    'The Magician': {
      'CAREER': 'ไพ่นักมายากล: คุณมีพลังและความสามารถพอที่จะสร้างความสำเร็จในอาชีพ ถึงเวลาที่จะแสดงศักยภาพและเปลี่ยนความคิดเป็นความจริง',
      'LOVE': 'ไพ่นักมายากล: ในความสัมพันธ์ คุณมีพลังในการสร้างสรรค์ความรักที่คุณปรารถนา การสื่อสารและการแสดงความรู้สึกจะเป็นกุญแจสำคัญ',
      'GENERAL': 'ไพ่นักมายากล: คุณมีทุกสิ่งที่จำเป็นในการสร้างการเปลี่ยนแปลง พลังความคิดและการกระทำของคุณจะนำไปสู่ความสำเร็จ'
    },
    'The Lovers': {
      'CAREER': 'ไพ่คู่รัก: คุณอาจต้องตัดสินใจสำคัญเกี่ยวกับเส้นทางอาชีพ การเลือกระหว่างเสถียรภาพและความท้าทายใหม่ๆ จำเป็นต้องฟังใจตัวเอง',
      'LOVE': 'ไพ่คู่รัก: ความรักและความสัมพันธ์กำลังเป็นไปอย่างดี คุณจะพบความกลมกลืนหรือต้องตัดสินใจเรื่องความรักที่สำคัญ',
      'GENERAL': 'ไพ่คู่รัก: การตัดสินใจเรื่องความสัมพันธ์และค่านิยจะเกิดขึ้น การเลือกที่ตรงกับหัวใจจะนำมาซึ่งความสมดุลในชีวิต'
    },
    'The Tower': {
      'CAREER': 'ไพ่หอคอย: การเปลี่ยนแปลงฉับพลันในอาชีพอาจเกิดขึ้น สิ่งที่คุณคิดว่ามั่นคงอาจถูกทำลายเพื่อให้สิ่งที่ดีขึ้นเกิดขึ้น',
      'LOVE': 'ไพ่หอคอย: ความสัมพันธ์อาจเผชิญกับวิกฤตที่จะเปิดเผยความจริงที่ซ่อนอยู่ การล้มทลายจะนำไปสู่การเริ่มต้นใหม่ที่แท้จริง',
      'GENERAL': 'ไพ่หอคอย: การเปลี่ยนแปลงครั้งใหญ่จะเกิดขึ้น สิ่งที่ไม่เสถียรจะถูกทำลายเพื่อสร้างรากฐานที่มั่นคงขึ้น'
    }
  }

  // Return specific interpretation if available, otherwise generate generic one
  if (cardInterpretations[cardName] && cardInterpretations[cardName][questionType]) {
    return cardInterpretations[cardName][questionType]
  }

  // Generic interpretation based on card type and question
  const card = TAROT_CARDS.find(c => c.name === cardName)
  if (!card) {
    return `${cardName}: ไพ่ใบนี้มีความหมายสำคัญในชีวิตของคุณ`
  }

  const isMajor = card.arcana === 'Major'
  const keywords = Array.isArray(card.keywords) ? card.keywords.join(' ') : ''

  if (questionType === 'CAREER') {
    return `${card.displayName}: ${isMajor ? 'ในเส้นทางอาชีพ' : 'ด้านการงาน'}, ไพ่นี้บ่งบอกถึง${keywords} คุณควรให้ความสำคัญกับการพัฒนาตัวเองและเปิดรับโอกาสใหม่ๆ`
  }

  if (questionType === 'LOVE') {
    return `${card.displayName}: ${isMajor ? 'ในเรื่องรักความสัมพันธ์' : 'ด้านความรู้สึก'}, ไพ่นี้ชี้ให้เห็นถึง${keywords} ความจริงใจและการเข้าใจซึ่งกันและกันจะเป็นปัจจัยสำคัญ`
  }

  return `${card.displayName}: ไพ่ใบนี้บ่งบอกถึง${keywords} ในชีวิตของคุณ การมองโลกในแง่บวกและเตรียมพร้อมรับมือกับสิ่งที่จะเกิดขึ้นจะช่วยให้คุณผ่านพ้นไปได้ดี`
}

function generateMainReading(cards: MockTarotCard[], question: string): string {
  const cardNames = cards.map(c => c.name).join(', ')
  const questionType = analyzeQuestionType(question)

  if (questionType === 'CAREER') {
    return `จากการทำนาย ${cards.length} ใบ พบว่าเส้นทางอาชีพของคุณกำลังอยู่ในช่วงเปลี่ยนแปลงสำคัญ โดยมีปัจจัยสำคัญคือ ${cardNames} คุณควรใจเย็นและตัดสินใจอย่างรอบคอบ`
  }

  if (questionType === 'LOVE') {
    return `การทำนายด้วยไพ่ ${cardNames} บ่งบอกว่าเรื่องรักความสัมพันธ์ของคุณจะมีความคืบหน้าในเร็ววันนี้ เตรียมเปิดใจรับความรักใหม่ๆ หรือพัฒนาความสัมพันธ์ปัจจุบัน`
  }

  return `การทำนายด้วยไพ่ ${cardNames} ชี้ให้เห็นว่าคุณกำลังอยู่ในจุดเปลี่ยนที่สำคัญของชีวิต การตัดสินใจในช่วงนี้จะส่งผลต่ออนาคตอย่างมาก`
}

function generateSuggestions(cards: MockTarotCard[], question: string): string[] {
  return [
    'ให้เวลาตัวเองในการตัดสินใจ อย่ารีบร้อน',
    'ฝึกสมาธิและฟังเสียงหัวใจตัวเองมากขึ้น',
    'เปิดใจรับฟังคำแนะนำจากผู้เชี่ยวชาญ',
    'จดบันทึกความรู้สึกและความคิดของคุณเป็นประจำ'
  ]
}

function generateNextQuestions(cards: MockTarotCard[], question: string): string[] {
  return [
    'คุณพร้อมสำหรับการเปลี่ยนแปลงหรือไม่',
    'สิ่งใดที่ยังขัดข้องอยู่ในใจของคุณ',
    'คุณต้องการความช่วยเหลือจากใครในช่วงนี้',
    'ข้อใดที่คุณกลัวที่สุดในการตัดสินใจครั้งนี้'
  ]
}

function generateFinalSummary(cards: MockTarotCard[], question: string): string {
  const cardNames = cards.map(c => c.name).join(', ')
  return `การทำนายด้วยไพ่ ${cardNames} บ่งบอกว่าคุณกำลังอยู่ในจุดสำคัญของชีวิต การตัดสินใจที่จะทำในช่วงนี้จะส่งผลต่ออนาคตอย่างมีนัยสำคัญ เชื่อมั่นในการตัดสินใจของคุณและก้าวไปข้างหน้าด้วยความมั่นใจ`
}