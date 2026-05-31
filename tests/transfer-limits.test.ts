import { describe, expect, it } from "vitest";

import {
  getTransferLimit,
  isLargeTransferAmount,
  normalizeTransferCurrency,
  validateTransferAmount,
} from "@/lib/transfer-limits";

describe("transfer limits", () => {
  it("normalizes unsupported or lowercase currencies safely", () => {
    expect(normalizeTransferCurrency("try")).toBe("TRY");
    expect(normalizeTransferCurrency("eur")).toBe("EUR");
    expect(normalizeTransferCurrency("not-real")).toBe("USD");
    expect(normalizeTransferCurrency()).toBe("USD");
  });

  it("converts the single transfer limit into the selected currency", () => {
    expect(getTransferLimit("USD").maxAmount).toBe(5000);
    expect(getTransferLimit("TRY").maxAmount).toBe(161250);
    expect(getTransferLimit("EUR").warningAmount).toBe(920);
  });

  it("rejects invalid and over-limit transfer amounts", () => {
    expect(validateTransferAmount(0, "USD").allowed).toBe(false);
    expect(validateTransferAmount(Number.NaN, "USD").allowed).toBe(false);

    const overLimit = validateTransferAmount(5000.01, "USD");
    expect(overLimit.allowed).toBe(false);
    expect(overLimit.message).toContain("$5,000.00");
  });

  it("marks review sized transfers without blocking them", () => {
    const reviewTransfer = validateTransferAmount(1000, "USD");

    expect(reviewTransfer.allowed).toBe(true);
    expect(reviewTransfer.isLarge).toBe(true);
    expect(isLargeTransferAmount(999.99, "USD")).toBe(false);
  });
});
