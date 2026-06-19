import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";
import type { ReactNode } from "react";

export type RenderOgFont = {
  name: string;
  data: ArrayBuffer;
  weight?: number;
  style?: "normal" | "italic";
};

export type RenderOgOptions = {
  width: number;
  height: number;
  fonts: RenderOgFont[];
};

export async function renderOgSvg(element: ReactNode, options: RenderOgOptions): Promise<string> {
  return satori(element, options as SatoriOptions);
}

export async function renderOgImage(element: ReactNode, options: RenderOgOptions): Promise<Uint8Array> {
  const svg = await renderOgSvg(element, options);
  const png = new Resvg(svg, {
    fitTo: { mode: "original" },
  })
    .render()
    .asPng();
  return new Uint8Array(png);
}
