// Analyst Agent Prompts
// Phase 4: GREEN - Database-backed prompts

import { AgentService } from '@/lib/server/ai/agent-service';

export async function getAnalystSystemPrompt(): Promise<string> {
  return AgentService.getPrompt('analyst');
}

export const ANALYST_USER_PROMPT_TEMPLATE = (question: string, userName?: string) => {
  const greeting = userName ? `ผู้ถามชื่อ: ${userName}` : ''
  
  return `${greeting}
คำถามจากผู้ใช้: "${question}"

โปรดวิเคราะห์คำถามนี้อย่างละเอียดและตอบกลับในรูปแบบ JSON ตามที่กำหนด
`
}