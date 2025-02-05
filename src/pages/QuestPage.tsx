import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const QuestPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 bg-game-surface">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-4 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/menu')}
        >
          Вернуться в меню
        </Button>
        
        <h1 className="text-2xl text-game-accent mb-4">Квесты</h1>
        
        <div className="grid gap-4">
          <div className="p-4 bg-game-surface/80 border border-game-accent rounded-lg">
            <h2 className="text-xl text-game-accent mb-2">Скоро будут доступны новые квесты!</h2>
            <p className="text-gray-300">Следите за обновлениями.</p>
          </div>
        </div>
      </div>
    </div>
  );
};