import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const NFTTransferModal = () => {
  const [open, setOpen] = useState(false);
  const [missingNftIds, setMissingNftIds] = useState<string[]>([]);

  useEffect(() => {
    const handleNFTTransferred = (event: CustomEvent) => {
      setMissingNftIds(event.detail.missingNftIds || []);
      setOpen(true);
    };

    window.addEventListener('nftTransferredDuringBattle', handleNFTTransferred as EventListener);

    return () => {
      window.removeEventListener('nftTransferredDuringBattle', handleNFTTransferred as EventListener);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    setMissingNftIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-gradient-to-br from-game-surface/95 via-game-background/90 to-game-surface/95 backdrop-blur-md border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <DialogTitle className="text-xl font-bold text-red-500">
              NFT карта передана
            </DialogTitle>
          </div>
          <DialogDescription className="text-game-primary space-y-3">
            <p>
              Во время активного подземелья одна или несколько NFT карт были переданы из вашего кошелька.
            </p>
            <p className="font-medium text-red-400">
              Подземелье было автоматически завершено, так как карты больше не доступны в вашей команде.
            </p>
            {missingNftIds.length > 0 && (
              <div className="text-sm text-game-primary/70">
                <p className="font-medium mb-1">Переданные карты:</p>
                <ul className="list-disc list-inside">
                  {missingNftIds.map((id, index) => (
                    <li key={index}>{id}</li>
                  ))}
                </ul>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-game-primary to-game-accent hover:from-game-accent hover:to-game-primary"
          >
            Закрыть подземелье
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
