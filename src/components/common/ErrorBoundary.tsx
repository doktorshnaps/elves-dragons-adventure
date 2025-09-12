import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-game-background">
          <Card className="p-6 bg-game-surface border-game-accent max-w-md w-full">
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
                    try {
                      localStorage.removeItem('teamBattleState');
                      localStorage.removeItem('activeBattleInProgress');
                    } catch {}
                  }}
                >
                  Сбросить бой
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-game-primary hover:bg-game-primary/80"
                >
                  Перезагрузить
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