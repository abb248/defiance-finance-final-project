import { describe, expect, it } from "vitest";

import {
  detectTurkishQuestion,
  getAssistantQuestionIntent,
} from "@/lib/assistant-intent";

describe("finance assistant question intent", () => {
  it("detects transfer total questions separately from latest transfer questions", () => {
    const totalIntent = getAssistantQuestionIntent(
      "bu ay transfer olarak ne kadar harcadim"
    );
    const latestIntent = getAssistantQuestionIntent("son transfer islemim ne");

    expect(totalIntent.asksAboutTransfer).toBe(true);
    expect(totalIntent.asksAboutTransferTotal).toBe(true);
    expect(totalIntent.asksAboutLatestTransfer).toBe(false);

    expect(latestIntent.asksAboutTransfer).toBe(true);
    expect(latestIntent.asksAboutLatestTransfer).toBe(true);
    expect(latestIntent.asksAboutTransferTotal).toBe(false);
  });

  it("detects currency clarification without forcing latest transfer intent", () => {
    const intent = getAssistantQuestionIntent("tl cinsinden mi");

    expect(intent.asksAboutCurrency).toBe(true);
    expect(intent.asksAboutTransfer).toBe(false);
    expect(intent.asksAboutLatestTransfer).toBe(false);
  });

  it("keeps English recent transaction questions out of transfer intent", () => {
    const intent = getAssistantQuestionIntent("What are my recent transactions?");

    expect(intent.asksAboutTransfer).toBe(false);
    expect(intent.asksAboutLatestTransfer).toBe(false);
    expect(intent.asksAboutTransferTotal).toBe(false);
  });

  it("detects Turkish questions used in the demo assistant flow", () => {
    expect(detectTurkishQuestion("bu ay toplam ne kadar transfer yaptim")).toBe(
      true
    );
    expect(detectTurkishQuestion("Which account has the highest balance?")).toBe(
      false
    );
  });
});
