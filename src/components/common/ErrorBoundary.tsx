import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { reportError } from '@/utils/errorReporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Функция для сброса боя через Zustand (вызывается из class component)
const clearBattleFromZustand = () => {
  const { clearTeamBattleState, clearBattleState } = useGameStore.getState();
  clearTeamBattleState();
  clearBattleState();
};

export class ErrorBoundary extends Component<Props, State> {
  private unhandledRejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null;
  private windowErrorHandler: ((e: ErrorEvent) => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidMount() {
    this.unhandledRejectionHandler = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message || e.reason || '');
      console.error('🔴 [ErrorBoundary] Unhandled rejection:', msg);
      // Suppress known non-critical wallet errors
      if (msg.includes('No wallet selected') || msg.includes('no wallet')) {
        e.preventDefault();
        console.warn('⚠️ Suppressed HotConnector "No wallet selected" rejection');
        return;
      }
      reportError(
        e.reason instanceof Error ? e.reason : new Error(msg),
        'unhandled_rejection'
      );
    };
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);

    this.windowErrorHandler = (e: ErrorEvent) => {
      reportError(
        e.error instanceof Error ? e.error : new Error(e.message || 'Unknown window error'),
        'window_error',
        { filename: e.filename, lineno: e.lineno, colno: e.colno }
      );
    };
    window.addEventListener('error', this.windowErrorHandler);
  }

  componentWillUnmount() {
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
    if (this.windowErrorHandler) {
      window.removeEventListener('error', this.windowErrorHandler as any);
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Auto-recover from chunk-load failures (common on iOS WKWebView /
    // Telegram WebApp on flaky networks). Soft-reload once per session.
    const message = String(error?.message || '');
    const isChunkError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module') ||
      message.includes('ChunkLoadError');

    if (isChunkError && typeof window !== 'undefined') {
      try {
        const flag = 'lazyChunkReloadAttempted';
        if (!sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, '1');
          console.warn('🔄 [ErrorBoundary] Chunk load failure detected, clearing caches and reloading');

          // Best-effort: unregister any service workers and purge caches so
          // the next reload pulls a fresh bundle. Critical for iOS WebKit /
          // Telegram WebApp where stale chunks cause repeated reload loops.
          const cleanupAndReload = async () => {
            try {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
              }
            } catch {}
            try {
              if (typeof caches !== 'undefined') {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
              }
            } catch {}
            window.location.reload();
          };

          cleanupAndReload();
          // Hard fallback in case async cleanup hangs.
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
      } catch {
        // sessionStorage unavailable — fall through to normal error UI
      }
    }

    reportError(error, 'error_boundary', {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-game-background p-4">
          <Card className="max-w-md w-full p-6 bg-game-surface border-game-accent">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-game-accent">Что-то пошло не так</h2>
              <p className="text-gray-400">
                Произошла ошибка в игре. Попробуйте перезагрузить страницу.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    clearBattleFromZustand();
                    this.setState({ hasError: false });
                  }}
                >
                  Сбросить состояние
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false })}
                  className="bg-game-primary hover:bg-game-primary/80"
                >
                  Попробовать снова
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
