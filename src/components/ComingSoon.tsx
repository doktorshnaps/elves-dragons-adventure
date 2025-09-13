import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

export const ComingSoon = () => {
  const { disconnectWallet } = useWallet();

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
        {/* Coming Soon Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <img 
            src="/coming-soon.png" 
            alt="Coming Soon"
            className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
          />
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 bg-clip-text text-transparent">
            Скоро Открытие!
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            Игра находится в разработке. Доступ предоставляется только участникам закрытого тестирования.
          </p>
          
          <p className="text-lg text-gray-400">
            Следите за обновлениями в наших социальных сетях, чтобы не пропустить официальный запуск!
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8"
        >
          <Button
            onClick={disconnectWallet}
            variant="outline"
            size="lg"
            className="bg-game-surface/20 border-game-accent text-game-accent hover:bg-game-accent hover:text-game-background transition-all duration-300 px-8 py-3 text-lg"
          >
            Отключить кошелек
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};