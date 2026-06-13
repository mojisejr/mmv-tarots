import { describe, expect, it } from "vitest";
import { getTemplate, listTemplateIds } from "../templates";
import { financeDailySchema } from "../templates/finance-daily";

describe("Template Registry", () => {
  it("getTemplate('finance-daily') คืน template", () => {
    const t = getTemplate("finance-daily");
    expect(t.id).toBe("finance-daily");
    expect(t.name).toBeTruthy();
  });

  it("getTemplate(unknown) throw", () => {
    expect(() => getTemplate("nope")).toThrow(/unknown templateId/);
  });

  it("listTemplateIds มี finance-daily", () => {
    expect(listTemplateIds()).toContain("finance-daily");
  });
});

describe("finance-daily template", () => {
  const t = getTemplate("finance-daily");
  const valid = { card: "8 of Wands", meaning: "การเงินลื่นไหล" };

  it("inputSchema: valid ผ่าน, invalid throw", () => {
    expect(financeDailySchema.parse(valid)).toEqual(valid);
    expect(() => financeDailySchema.parse({ card: "x" })).toThrow(); // ขาด meaning
    expect(() => financeDailySchema.parse({ card: "", meaning: "y" })).toThrow(); // card ว่าง
  });

  it("buildCaptionPrompt: มี card/meaning + tone หมอมี่ + hashtag", () => {
    const c = t.buildCaptionPrompt(valid);
    expect(c.prompt).toContain("8 of Wands");
    expect(c.prompt).toContain("การเงินลื่นไหล");
    expect(c.system).toContain("หมอมี่");
    expect(c.system).toContain("#ดูดวงการเงิน");
  });

  it("buildImagePrompt: มีชื่อไพ่", () => {
    expect(t.buildImagePrompt(valid)).toContain("8 of Wands");
  });
});
