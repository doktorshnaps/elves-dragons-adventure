

## Fix: Box Opening Error & Error Logging Not Capturing API Errors

### Problem 1: Box Opening Fails with 401
The `open-elleonor-box` Edge Function requires JWT authentication via `userClient.auth.getUser()` and then looks up `profiles.wallet_address` by `user_id`. NEAR wallet users don't have a Supabase Auth session, so the function returns 401 ("Unauthorized" or "Invalid token") before any processing occurs. The logs confirm: the function boots but never reaches the "Opening Elleonor Box" log line.

**Fix**: Add a dual-auth fallback — try JWT first, and if it fails, accept `wallet_address` from the request body (same pattern used by other edge functions in this project). Validate the wallet exists in `game_data` to prevent spoofing.

### Problem 2: Errors Not Logged to `client_error_logs`
The `reportError` function is only called from `ErrorBoundary` for: component crashes, unhandled rejections, and window errors. But the box opening error is **caught and handled** in `useElleonorBoxOpening.ts` — it shows a toast but never calls `reportError`. So API/edge function errors are silently swallowed.

**Fix**: Add `reportError` calls in the catch blocks of `useElleonorBoxOpening.ts` and also in `useErrorHandler.ts` (the centralized error handler) so all handled API errors get logged too.

### Changes

#### 1. `supabase/functions/open-elleonor-box/index.ts`
Replace the strict JWT-only auth with a dual strategy:
- Try JWT auth first (existing logic)
- If JWT fails (no token or invalid), fall back to `wallet_address` from request body
- Validate the wallet exists in `game_data` table to prevent spoofing
- Keep rate limiting and all other security checks

#### 2. `src/hooks/useElleonorBoxOpening.ts`
Add `reportError` calls in both catch blocks (single box and multi-box) to log API errors to `client_error_logs`.

#### 3. `src/hooks/useErrorHandler.ts`
Add `reportError` call inside `handleError` so any component using `useErrorHandler` automatically logs errors to the database.

### Files
1. **`supabase/functions/open-elleonor-box/index.ts`** — Dual auth (JWT + wallet fallback)
2. **`src/hooks/useElleonorBoxOpening.ts`** — Add `reportError` for API errors
3. **`src/hooks/useErrorHandler.ts`** — Add `reportError` for centralized error logging

