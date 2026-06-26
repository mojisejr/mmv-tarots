import fs from "fs";

export interface SeedConfig {
  packages: Array<{
    name: string;
    description: string;
    stars: number;
    prices: Array<{
      amount: number;
      isPromo: boolean;
      promoLabel: string | null;
    }>;
  }>;
  suggestedQuestions: Array<{
    text: string;
    category: string;
  }>;
}

export const DEFAULT_LOCAL_SEED_CONFIG: SeedConfig = {
  packages: [
    {
      name: "Local Starter",
      description: "Safe local development package",
      stars: 120,
      prices: [
        {
          amount: 99,
          isPromo: false,
          promoLabel: null,
        },
      ],
    },
    {
      name: "Local Plus",
      description: "Safe local development package with promo price",
      stars: 300,
      prices: [
        {
          amount: 199,
          isPromo: true,
          promoLabel: "Local dev",
        },
      ],
    },
  ],
  suggestedQuestions: [
    {
      text: "ช่วงนี้ฉันควรโฟกัสเรื่องอะไร",
      category: "general",
    },
    {
      text: "งานที่กำลังทำควรเดินต่อแบบไหน",
      category: "work",
    },
    {
      text: "ความสัมพันธ์นี้ควรระวังอะไร",
      category: "relationship",
    },
  ],
};

export function loadSeedConfig(configPath: string): {
  config: SeedConfig;
  source: "file" | "default";
} {
  if (fs.existsSync(configPath)) {
    return {
      config: JSON.parse(fs.readFileSync(configPath, "utf-8")),
      source: "file",
    };
  }

  return {
    config: DEFAULT_LOCAL_SEED_CONFIG,
    source: "default",
  };
}
