import { useToast } from '@/hooks/use-toast';
import { ERROR_MESSAGES, ERROR_TYPES } from '@/utils/constants';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: any, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    let message = 'Произошла неожиданная ошибка';
    let title = 'Ошибка';

    if (error?.type && ERROR_MESSAGES[error.type as keyof typeof ERROR_MESSAGES]) {
      message = ERROR_MESSAGES[error.type as keyof typeof ERROR_MESSAGES];
    } else if (error?.message) {
      message = error.message;
    }

    // Специальная обработка для разных типов ошибок
    if (error?.type === ERROR_TYPES.NETWORK_ERROR) {
      title = 'Проблемы с сетью';
    } else if (error?.type === ERROR_TYPES.INSUFFICIENT_FUNDS) {
      title = 'Недостаточно средств';
    }

    toast({
      title,
      description: message,
      variant: 'destructive',
      duration: 5000
    });
  };

  const handleSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      duration: 3000
    });
  };

  return { handleError, handleSuccess };
};