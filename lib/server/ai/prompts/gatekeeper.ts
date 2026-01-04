// Gatekeeper Agent Prompts
// Phase 4: GREEN - Database-backed prompts

import { AgentService } from '@/lib/server/ai/agent-service';

export async function getGatekeeperSystemPrompt(): Promise<string> {
  return AgentService.getPrompt('gatekeeper');
}

export const GATEKEEPER_USER_PROMPT_TEMPLATE = (question: string) => `
คำถามจากผู้ใช้: "${question}"

โปรดตรวจสอบว่าคำถามนี้เหมาะสมสำหรับการทำนายไพ่ทาโรต์หรือไม่ตามกฎที่กำหนด
และตอบกลับในรูปแบบ JSON เท่านั้น
`