import { db } from '@/lib/server/db';

export interface SuggestedQuestion {
  id: string;
  text: string;
  category: string;
  isActive: boolean;
}

export class SuggestedQuestionService {
  /**
   * Get all active suggested questions
   * This method is designed to be cached by the caller or ISR
   */
  static async getActiveQuestions(): Promise<SuggestedQuestion[]> {
    try {
      const questions = await db.suggestedQuestion.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          text: true,
          category: true,
          isActive: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
      
      return questions;
    } catch (error) {
      console.error('Failed to fetch suggested questions:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  /**
   * Seed default questions if none exist
   * Should be called primarily during initialization or manual trigger
   */
  static async seedDefaults(): Promise<void> {
    const count = await db.suggestedQuestion.count();
    if (count > 0) return;

    const defaults = [
      { text: 'วันนี้ไพ่อยากบอกอะไรฉันเป็นพิเศษไหม?', category: 'general' },
      { text: 'การงานในช่วง 7 วันนี้จะมีทิศทางอย่างไร?', category: 'career' },
      { text: 'สิ่งที่ฉันควรระวังในช่วงนี้คืออะไร?', category: 'warning' },
      { text: 'ความรักของฉันในช่วงนี้เป็นอย่างไรบ้าง?', category: 'love' },
      { text: 'โอกาสทางการเงินที่จะเข้ามาเร็วๆ นี้', category: 'finance' },
      { text: 'มีอะไรที่ฉันมองข้ามไปในตอนนี้ไหม?', category: 'insight' },
      { text: 'สุขภาพกายและใจช่วงนี้ต้องดูแลอะไรเป็นพิเศษ?', category: 'health' },
      { text: 'ทางเลือกที่กำลังตัดสินใจอยู่ ควรไปทางไหนดี?', category: 'decision' },
      { text: 'คนรอบข้างรู้สึกอย่างไรกับฉันในตอนนี้?', category: 'relationship' },
      { text: 'ศักยภาพที่ซ่อนอยู่ของฉันคืออะไร?', category: 'self' },
    ];

    await db.suggestedQuestion.createMany({
      data: defaults.map(q => ({
        ...q,
        isActive: true,
      })),
    });
  }
}
