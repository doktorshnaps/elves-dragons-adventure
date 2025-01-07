import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
  onUpgrade: () => void;
  readonly?: boolean;
}

export const InventoryHeader = ({ onUpgrade, readonly = false }: InventoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-game-accent">Инвентарь</h2>
      {!readonly && (
        <Button 
          variant="outline" 
          onClick={onUpgrade}
          className="text-game-accent border-game-accent"
        >
          Улучшить предметы
        </Button>
      )}
    </div>
  );
};