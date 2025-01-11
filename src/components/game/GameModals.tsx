import { DungeonSearch } from "../DungeonSearch";
import { Shop } from "../Shop";

interface GameModalsProps {
  showDungeonSearch: boolean;
  showShop: boolean;
  onCloseDungeon: () => void;
  onCloseShop: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const GameModals = ({
  showDungeonSearch,
  showShop,
  onCloseDungeon,
  onCloseShop,
  balance,
  onBalanceChange
}: GameModalsProps) => {
  return (
    <>
      {showDungeonSearch && (
        <DungeonSearch 
          onClose={onCloseDungeon} 
          balance={balance}
          onBalanceChange={onBalanceChange}
        />
      )}

      {showShop && (
        <Shop 
          onClose={onCloseShop} 
          balance={balance}
          onBalanceChange={onBalanceChange}
        />
      )}
    </>
  );
};