import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { useBanStatus } from '@/hooks/useBanStatus';

export const ComingSoon = () => {
  const { disconnectWallet } = useWallet();
  const { toast } = useToast();
  const { isBanned, loading: banLoading } = useBanStatus();

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      toast({
        title: 'Кошелек отключен',
        description: 'Вы успешно отключили кошелек',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить кошелек',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent)]" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto p-4 md:p-8"
      >
        {/* Conditional Image Based on Ban Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex-shrink-0 mb-4 md:mb-8"
        >
          {banLoading ? (
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto h-48 md:h-64 bg-game-surface/20 rounded-lg animate-pulse" />
          ) : isBanned ? (
            <img 
              src="/blocked-player.png" 
              alt="Заблокированный игрок"
              className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto max-h-[30vh] md:max-h-[40vh] object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <img 
              src="/coming-soon.png" 
              alt="Coming Soon"
              className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto max-h-[30vh] md:max-h-[40vh] object-contain rounded-lg shadow-2xl"
            />
          )}
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-3 md:space-y-6 flex-shrink-0"
        >
          {isBanned ? (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
                Доступ Ограничен
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed px-4">
                Ваш аккаунт заблокирован за нарушение правил игры.
              </p>
              
              <p className="text-base md:text-lg text-gray-400 px-4">
                Обратитесь к администратору для разблокировки аккаунта.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                Скоро Открытие!
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed px-4">
                Игра находится в разработке. Доступ предоставляется только участникам закрытого тестирования.
              </p>
              
              <p className="text-base md:text-lg text-gray-400 px-4">
                Следите за обновлениями в наших социальных сетях, чтобы не пропустить официальный запуск!
              </p>
            </>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-4 md:mt-8 relative z-10 flex-shrink-0 space-y-4"
          style={{ pointerEvents: 'auto' }}
        >
          <Button
            onClick={() => window.open('https://hotcraft.art/drop/golden_ticket', '_blank')}
            variant="default"
            size="lg"
            className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-700 text-black font-semibold transition-all duration-300 px-6 md:px-8 py-2 md:py-3 text-base md:text-lg cursor-pointer shadow-lg hover:shadow-xl"
            style={{ pointerEvents: 'auto' }}
          >
            Белый лист
          </Button>

          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="lg"
            className="bg-game-surface/20 border-game-accent text-game-accent hover:bg-game-accent hover:text-game-background transition-all duration-300 px-6 md:px-8 py-2 md:py-3 text-base md:text-lg cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            Отключить кошелек
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};