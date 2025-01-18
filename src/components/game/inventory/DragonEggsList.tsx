import { DragonEggTimer } from "../DragonEggTimer";
import { useToast } from "@/hooks/use-toast";
import { DragonEgg } from "@/contexts/DragonEggContext";

interface DragonEggsListProps {
  eggs: DragonEgg[];
}

export const DragonEggsList = ({ eggs }: DragonEggsListProps) => {
  const { toast } = useToast();

  if (eggs.length === 0) return null;

  return (
    <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {eggs.map((egg) => (
        <DragonEggTimer
          key={egg.id}
          rarity={egg.rarity}
          petName={egg.petName}
          createdAt={egg.createdAt}
          onHatch={() => {
            const eggToRemove = eggs.find(e => e.id === egg.id);
            if (eggToRemove) {
              toast({
                title: "Питомец получен!",
                description: `${eggToRemove.petName} теперь доступен в вашей коллекции`,
              });
            }
          }}
        />
      ))}
    </div>
  );
};