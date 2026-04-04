import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

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
    };
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  componentWillUnmount() {
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
