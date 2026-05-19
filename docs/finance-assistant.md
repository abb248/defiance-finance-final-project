# Finance Assistant Notes

The finance assistant was added in three steps so the feature stays easy to explain and safe to test.

## Phase 1

The first version added a new Assistant page. It reads the signed-in user's accounts, recent transactions, monthly spending, income, top categories, and account balances.

The important part is that the money calculations are handled in the app code. The assistant does not guess totals or percentages by itself.

## Phase 2

The next step added a small planner layer:

- category budgets
- savings goals
- budget usage
- remaining budget
- goal progress

These planner values are saved in the browser for now. This keeps the feature simple while still letting the assistant answer more personal questions like budget risk and savings progress.

## Phase 3

Gemini 2.5 Flash was connected as the language layer. The app still calculates the finance summary first, then sends a clean summary to Gemini so the answer sounds more natural.

If `GEMINI_API_KEY` is not available, the assistant still works with the app's own computed answer. This makes the feature safer during demos and local testing.

## Current behavior

The assistant can answer questions about:

- top spending categories
- recent transactions
- account balances
- monthly spending projection
- budget status
- savings goal progress

The design goal is to make SpendWise feel less like a passive dashboard and more like a personal finance guide.
