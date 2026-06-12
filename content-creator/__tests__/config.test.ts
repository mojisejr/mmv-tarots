import { describe, expect, it } from "vitest";
import { GRAPH_VERSION, graphUrl, TEXT_MODEL, IMAGE_MODEL } from "../lib/config";

describe("config", () => {
  it("GRAPH_VERSION มีรูปแบบ vNN (default v23.0)", () => {
    expect(GRAPH_VERSION).toMatch(/^v\d+(\.\d+)?$/);
  });

  it("graphUrl ประกอบ URL ถูก + ตัด leading slash", () => {
    expect(graphUrl("123/photos")).toBe(`https://graph.facebook.com/${GRAPH_VERSION}/123/photos`);
    expect(graphUrl("/123/feed")).toBe(`https://graph.facebook.com/${GRAPH_VERSION}/123/feed`);
  });

  it("graphUrl ไม่มี access_token ใน URL", () => {
    expect(graphUrl("123/photos")).not.toContain("access_token");
  });

  it("model defaults (POC verified)", () => {
    expect(TEXT_MODEL).toBeTruthy();
    expect(IMAGE_MODEL).toBeTruthy();
  });
});
