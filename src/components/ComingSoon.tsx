import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

export const ComingSoon = () => {
  const { disconnectWallet } = useWallet();
  const { toast } = useToast();

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent)]" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-2xl mx-auto p-8"
      >
        {/* Blocked Player Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <img 
            src="/blocked-player.png" 
            alt="Заблокированный игрок"
            className="w-full max-w-lg mx-auto rounded-lg shadow-2xl"
          />
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
            Доступ Ограничен
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            Ваш аккаунт не находится в списке разрешенных для доступа к игре.
          </p>
          
          <p className="text-lg text-gray-400">
            Обратитесь к администратору для получения доступа к игре.
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="lg"
            className="bg-game-surface/20 border-game-accent text-game-accent hover:bg-game-accent hover:text-game-background transition-all duration-300 px-8 py-3 text-lg cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            Отключить кошелек
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};