/**
 * Template Registry — map templateId → ContentTemplate
 * เพิ่มแบบใหม่: import + ใส่ใน TEMPLATES (ไม่แตะ engine)
 */
import type { ContentTemplate } from "./types";
import { financeDaily } from "./finance-daily";
import { daily7 } from "./daily7";
import { randomCardsTemplate } from "./random-cards";

const TEMPLATES: Record<string, ContentTemplate> = {
  [financeDaily.id]: financeDaily,
  [daily7.id]: daily7,
  [randomCardsTemplate.id]: randomCardsTemplate,
};

/** @throws Error ถ้า templateId ไม่รู้จัก */
export function getTemplate(id: string): ContentTemplate {
  const t = TEMPLATES[id];
  if (!t) {
    throw new Error(`unknown templateId: ${id} (มี: ${Object.keys(TEMPLATES).join(", ")})`);
  }
  return t;
}

export function listTemplateIds(): string[] {
  return Object.keys(TEMPLATES);
}

export type { ContentTemplate } from "./types";
