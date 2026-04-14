

## Error Logging System for Admin Panel

### Overview
Create a client-side error reporting system that captures errors from players' browsers and stores them in the database, with a new admin panel tab to view and manage them.

### 1. Database Table: `client_error_logs`

New migration to create the table:

```sql
CREATE TABLE public.client_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  wallet_address TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_source TEXT, -- 'error_boundary', 'unhandled_rejection', 'window_error', 'api_error'
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert errors (even unauthenticated)
CREATE POLICY "Anyone can insert errors" ON public.client_error_logs FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read errors" ON public.client_error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-cleanup: delete errors older than 30 days
CREATE INDEX idx_client_error_logs_created ON public.client_error_logs(created_at DESC);
```

### 2. Error Reporter Utility: `src/utils/errorReporter.ts`

A lightweight module that sends errors to `client_error_logs` via Supabase. Includes:
- Deduplication (same error message within 10 seconds is skipped)
- Rate limiting (max 5 reports per minute per session)
- `reportError(error, source, metadata?)` function

### 3. Update `ErrorBoundary.tsx`

In `componentDidCatch`, call `reportError()` to log the error with source `'error_boundary'` and `errorInfo.componentStack` in metadata.

In the `unhandledrejection` handler, also call `reportError()` for non-suppressed rejections with source `'unhandled_rejection'`.

### 4. Global Window Error Handler

Add a `window.onerror` listener in `ErrorBoundary.componentDidMount` to capture uncaught JS errors with source `'window_error'`.

### 5. Admin Component: `src/components/admin/ErrorLogsViewer.tsx`

A new tab in AdminSettings showing:
- Table of recent errors (last 200) with columns: time, wallet, source, message, page
- Expandable rows to see full stack trace and metadata
- Auto-refresh every 30 seconds
- Filter by source type and search by message
- Button to clear old errors (> 7 days)

### 6. Add Tab to `AdminSettings.tsx`

Add a new `TabsTrigger` "🐛 Ошибки" and `TabsContent` with the `ErrorLogsViewer` component, visible only for super admins.

### Files to Change
1. **New SQL migration** — `client_error_logs` table with RLS
2. **New `src/utils/errorReporter.ts`** — error reporting utility
3. **Edit `src/components/common/ErrorBoundary.tsx`** — integrate error reporting
4. **New `src/components/admin/ErrorLogsViewer.tsx`** — admin viewer component
5. **Edit `src/pages/AdminSettings.tsx`** — add the new tab

