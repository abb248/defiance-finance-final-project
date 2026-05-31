import { describe, expect, it } from "vitest";

import {
  DEMO_USER_EMAIL,
  getDemoAccountById,
  getDemoAccounts,
  getDemoPlannerState,
  getDemoTransactionsForAccount,
  isDemoAccountId,
  isDemoUserEmail,
} from "@/lib/demo-data";

describe("demo data fallback", () => {
  it("identifies the scoped demo user without matching other accounts", () => {
    expect(isDemoUserEmail(DEMO_USER_EMAIL)).toBe(true);
    expect(isDemoUserEmail(" AYSE1@GMAIL.COM ")).toBe(true);
    expect(isDemoUserEmail("csezezex@gmail.com")).toBe(false);
  });

  it("provides stable demo accounts with shareable ids", () => {
    const accounts = getDemoAccounts();

    expect(accounts).toHaveLength(2);
    expect(accounts.map((account) => account.shareableId)).toEqual([
      "DEMO-AYSE-CHECKING",
      "DEMO-AYSE-SAVINGS",
    ]);
    expect(accounts.every((account) => account.isDemoFallback)).toBe(true);
  });

  it("resolves demo accounts by all ids used in transfer flows", () => {
    expect(isDemoAccountId("demo-checking")).toBe(true);
    expect(isDemoAccountId("DEMO-AYSE-CHECKING")).toBe(true);
    expect(getDemoAccountById("DEMO-AYSE-SAVINGS")?.supabaseItemId).toBe(
      "demo-savings"
    );
    expect(isDemoAccountId("unknown-account")).toBe(false);
  });

  it("returns account scoped transactions and planning data for the demo", () => {
    const checkingTransactions = getDemoTransactionsForAccount("demo-checking");
    const savingsTransactions = getDemoTransactionsForAccount("DEMO-AYSE-SAVINGS");
    const planner = getDemoPlannerState();

    expect(checkingTransactions.some((transaction) => transaction.type === "debit")).toBe(
      true
    );
    expect(savingsTransactions.some((transaction) => transaction.type === "credit")).toBe(
      true
    );
    expect(planner.budgets.length).toBeGreaterThan(0);
    expect(planner.savingsGoals.length).toBeGreaterThan(0);
    expect(planner.subscriptions.length).toBeGreaterThan(0);
  });
});
