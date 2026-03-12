

## Diagnosis: White Screen on /menu

### Root Cause Analysis

After thorough code review, I identified **two critical issues** that cause the white screen:

### Issue 1: `useQueryClient()` called outside `QueryClientProvider`

In `src/main.tsx`, `WalletConnectProvider` wraps `App`, but `QueryProvider` (which provides `QueryClientProvider`) is inside `App`. This means `WalletConnectProvider` renders **before** `QueryClientProvider` is available.

In `src/contexts/WalletConnectContext.tsx` (lines 52-56), `useQueryClient()` is called during render with a try/catch:
```typescript
try {
  queryClientRef.current = useQueryClient();
} catch {
  // QueryClient not available yet
}
```

While this seems safe, `useQueryClient()` internally calls `React.useContext()` then throws. In React 18 concurrent mode, this can cause silent render failures because React tracks the context subscription but the component doesn't properly handle the missing provider. The `ErrorBoundary` in `App.tsx` cannot catch this since it's a child of `WalletConnectProvider`.

### Issue 2: Missing React deduplication in Vite config

`vite.config.ts` lacks `resolve.dedupe` for React. With NEAR wallet selector packages and other dependencies, Vite can bundle multiple React copies, causing hooks to fail silently (context returns `null`, hooks throw "invalid hook call").

### Plan

**Step 1: Fix provider hierarchy in `src/main.tsx`**
- Move `QueryProvider` to wrap `WalletConnectProvider`, so `useQueryClient()` has access to the query client.

```
Before: BrowserRouter → WalletConnectProvider → App → QueryProvider → ...
After:  BrowserRouter → QueryProvider → WalletConnectProvider → App → ...
```

**Step 2: Add React deduplication in `vite.config.ts`**
- Add `resolve.dedupe: ['react', 'react-dom', 'react/jsx-runtime']` to force a single React instance across all dependencies.

**Step 3: Update `src/App.tsx`**
- Remove `QueryProvider` wrapper from `App` since it's now in `main.tsx`.

These three changes are minimal and targeted — they fix the render crash without altering any game logic.

