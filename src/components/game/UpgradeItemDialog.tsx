import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@/types/equipment";
import { Item } from "@/components/battle/Inventory";

interface UpgradeItemDialogProps {
  items: (Item | Equipment)[];
  onUpgrade: (items: [Item | Equipment, Item | Equipment]) => void;
  onClose: () => void;
}

export const UpgradeItemDialog = ({ items, onUpgrade, onClose }: UpgradeItemDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedItems, setSelectedItems] = useState<[Item | Equipment, Item | Equipment] | null>(null);

  const findPairs = () => {
    const pairs: [Item | Equipment, Item | Equipment][] = [];
    items.forEach((item1, index1) => {
      items.slice(index1 + 1).forEach(item2 => {
        if (item1.name === item2.name && item1.type === item2.type) {
          pairs.push([item1, item2]);
        }
      });
    });
    return pairs;
  };

  const handleUpgrade = (pair: [Item | Equipment, Item | Equipment]) => {
    onUpgrade(pair);
    toast({
      title: "Предметы улучшены",
      description: "Создан улучшенный предмет",
    });
    setIsOpen(false);
    onClose();
  };

  const pairs = findPairs();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Улучшение предметов</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {pairs.length > 0 ? (
            <div className="space-y-4">
              {pairs.map((pair, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p>{pair[0].name} + {pair[1].name}</p>
                    <p className="text-sm text-gray-500">Создаст улучшенную версию</p>
                  </div>
                  <Button onClick={() => handleUpgrade(pair)}>
                    Улучшить
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет предметов для улучшения</p>
          )}
          <Button variant="outline" onClick={onClose} className="mt-4">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};