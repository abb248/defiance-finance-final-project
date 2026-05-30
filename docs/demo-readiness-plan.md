# Demo Readiness Plan

This document keeps the senior project demo focused, repeatable, and safe from external service surprises.

## Product Story

Defiance Finance helps users manage everyday money from one place. The demo should show one clear journey: a user signs in, reviews connected accounts, checks recent transactions, sends a transfer, tracks budgets and goals, sees upcoming bills, and uses reports or the assistant to understand their financial picture.

The main message is not that the app has many pages. The main message is that the app connects common personal finance tasks into one usable workflow.

## Demo User And Data Plan

Create one reliable demo user that can be used before and during the presentation. Do not store its password in the repository, docs, commit messages, or issue text.

The planned demo user is Ayse Yazici with the email `ayse1@gmail.com`. Passwords are intentionally not documented here.

The demo user should have predictable data:

1. At least two connected accounts with different balances.
2. A transaction history with income, spending, transfers, and several categories.
3. One recent transfer that appears correctly in transaction history.
4. A few budgets with one healthy category and one category close to its limit.
5. Two savings goals, one on track and one behind.
6. Two subscriptions, one due soon and one scheduled later.
7. Enough report data to make charts and summaries meaningful.

Stripe and Sentry do not replace this data plan. Stripe supports payment related behavior, and Sentry monitors runtime errors. Demo seed data is the app state that makes the dashboard, transactions, budgets, goals, subscriptions, reports, and assistant screens look complete and reliable.

For safety, demo fallback data should be scoped to the demo email. If Salt Edge returns real connected accounts, the app should use the real accounts. If Salt Edge returns no accounts or fails for the demo user, the app can show committed fallback accounts, transactions, budgets, goals, and subscriptions so the presentation does not depend on a live bank connection.

## Demo Checklist

Run this checklist before the presentation:

1. Start from a clean dev server by deleting `.next` if a production build was run recently.
2. Open `/sign-in` and confirm the auth page loads without chunk errors.
3. Sign in with the demo user and confirm MFA opens on the first valid password attempt if MFA is enabled.
4. Open the home dashboard and confirm balances, accounts, right sidebar insights, and recent transactions render.
5. Open transaction history and confirm filters, account switching, and transaction details work.
6. Open payment transfer and confirm recipient verification, transfer limit validation, large transfer review, checkout entry, and receipt states are understandable.
7. Open budgets, goals, subscriptions, alerts, insights, reports, and assistant pages to confirm they show meaningful data.
8. Check browser console and server logs for visible runtime errors.

## Integration Test Targets

Keep the first test set small and focused on the flows that would hurt the demo most if they broke.

1. Sign in with MFA enabled should show the 2FA step after the first valid password submit.
2. Sign up should reject incomplete or invalid data before creating a user.
3. Transfer amount validation should block amounts above the configured limit.
4. Transfer balance validation should compare amounts using the selected transfer currency.
5. Transaction history should sort new transfers by newest date and show transfer details.

These tests do not need to cover every UI detail. Their job is to protect the main demo path.

## External Service Fallbacks

The app should never look broken because one external service is slow or unavailable. Each external dependency should have a user friendly fallback:

1. Salt Edge unavailable: show saved or empty account state with a retry action and a clear bank connection message.
2. Stripe unavailable: keep the transfer review visible and show that checkout could not be prepared yet.
3. Supabase unavailable: show a sign in or data loading error that asks the user to try again.
4. Assistant API unavailable: show a calm assistant unavailable state and keep the rest of the finance dashboard usable.
5. Sentry unavailable: do not block the app, because monitoring should not affect the user workflow.

## External Service Background

Supabase is the source for authentication, user profile data, and stored transactions. If Supabase fails, the app should show a clear sign in or data loading error instead of a blank screen.

Salt Edge is the bank aggregation layer. It creates the customer, connect session, account list, and bank transaction feed. If Salt Edge is unavailable or no bank is connected for the demo user, the app should fall back to demo accounts and transactions.

Stripe is used for the payment checkout step in transfers. If Stripe cannot create a payment intent, the app should keep the transfer review visible and explain that checkout could not be prepared yet.

Sentry is for monitoring and debugging runtime errors. It should help the team diagnose failures, but the app should never depend on Sentry to render a user workflow.

The assistant API powers financial guidance and summaries. If it fails, the app should keep the dashboard usable and show a calm unavailable state for the assistant feature only.

## Presentation Flow

Use a short story during the demo:

1. The user signs in securely.
2. The dashboard gives a quick view of total money and recent account activity.
3. Transaction history explains where money moved.
4. Payment transfer shows a controlled and reviewed money movement.
5. Budgets, goals, and subscriptions turn raw transactions into planning.
6. Reports and assistant summarize what the user should pay attention to next.

End by explaining that the project is an MVP for a daily money hub, with future work focused on stronger bank integrations, more automated testing, and richer financial recommendations.
