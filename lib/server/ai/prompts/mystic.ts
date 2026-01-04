// Mystic Agent Prompts for Database Integration
// Phase 4: GREEN - Database-backed prompts

import { AgentService } from '@/lib/server/ai/agent-service';

export async function getMysticSystemPrompt(): Promise<string> {
  return AgentService.getPrompt('mystic');
}

export const MYSTIC_USER_PROMPT_TEMPLATE = (
  question: string,
  analysis: {
    mood: string;
    topic: string;
    period: string;
    context: string;
    cardCount: number
  },
  selectedCards: number[],
  cardMetadata: Array<{
    cardId: number;
    name: string;
    displayName: string;
    arcana: string;
    keywords: string[];
    shortMeaning: string;
    longMeaning: string;
    imageUrl: string;
  }>
) => `
คำถามจากผู้ใช้: "${question}"

ข้อมูลการวิเคราะห์ (Analyst):
- Mood: ${analysis.mood}
- Topic: ${analysis.topic}
- Context: ${analysis.context}

ไพ่ที่เปิดได้ (${selectedCards.length} ใบ):
${cardMetadata.map((card, index) => `[ใบที่ ${index + 1}] ${card.name} (${card.displayName})
   - Keywords: ${Array.isArray(card.keywords) ? card.keywords.join(', ') : card.keywords}
   - Meaning: ${card.shortMeaning || 'N/A'}`).join('\n')}

โปรดสวมบทบาท "แม่หมอมีมี่" (Modern Mystic) และทำนายดวงชะตาตามโครงสร้าง JSON ที่กำหนด
อย่าลืม! 
1. ประโยคแรกของ reading ต้องฟันธงคำตอบให้ชัดเจน
2. ห้ามเอ่ยชื่อไพ่ใน reading เด็ดขาด
3. ใช้ภาษาที่ทันสมัยและเข้าถึงง่าย
`
