import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Gift } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

interface ItemTemplate {
  id: number;
  item_id: string;
  name: string;
  type: string;
  rarity: string;
  description: string | null;
  image_url: string | null;
}

export const ItemGiveawayManager = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemTemplate | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isGiving, setIsGiving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('item_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список предметов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGiveItem = async () => {
    if (!selectedItem || !walletAddress.trim() || quantity < 1 || !accountId) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля корректно",
        variant: "destructive",
      });
      return;
    }

    // Защита от повторных вызовов
    if (isGiving) return;

    try {
      setIsGiving(true);
      console.log('🎁 [Admin] Giving items - quantity:', quantity, 'item:', selectedItem.name, 'to:', walletAddress.trim());

      // Подготовка предметов для RPC
      const itemsToAdd = Array.from({ length: quantity }, () => ({
        name: selectedItem.name,
        type: selectedItem.type,
        template_id: selectedItem.id.toString(),
        item_id: selectedItem.item_id
      }));

      // Используем RPC функцию для выдачи предметов (обходим RLS)
      const { data, error } = await supabase.rpc('add_item_instances', {
        p_wallet_address: walletAddress.trim(),
        p_items: itemsToAdd
      });

      if (error) throw error;
      console.log('✅ [Admin] RPC add_item_instances completed, returned:', data);

      // НЕ инвалидируем кеш вручную - Real-time подписка сделает это автоматически
      // Это предотвращает дублирование из-за двойной инвалидации
      
      toast({
        title: "Предметы выданы!",
        description: `Игрок ${walletAddress} получил ${quantity}x ${selectedItem.name}`,
      });

      // Сброс формы
      setWalletAddress("");
      setQuantity(1);
      setSelectedItem(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('❌ [Admin] Error giving item:', error);
      toast({
        title: "Ошибка выдачи",
        description: error.message || "Не удалось выдать предмет",
        variant: "destructive",
      });
    } finally {
      setIsGiving(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'epic': return 'bg-purple-500/20 text-purple-500 border-purple-500';
      case 'rare': return 'bg-blue-500/20 text-blue-500 border-blue-500';
      case 'uncommon': return 'bg-green-500/20 text-green-500 border-green-500';
      case 'common': return 'bg-gray-500/20 text-gray-500 border-gray-500';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-black/50 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Выдать предметы игрокам
          </CardTitle>
          <p className="text-sm text-white/70">
            Просмотр всех предметов и выдача их игрокам вручную
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Поиск по названию, ID или типу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-black/30">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">ID</TableHead>
                  <TableHead className="text-white/70">Название</TableHead>
                  <TableHead className="text-white/70">Тип</TableHead>
                  <TableHead className="text-white/70">Редкость</TableHead>
                  <TableHead className="text-white/70">Item ID</TableHead>
                  <TableHead className="text-white/70 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-white/50 py-8">
                      Предметы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-mono text-xs">{item.id}</TableCell>
                      <TableCell className="text-white font-medium">{item.name}</TableCell>
                      <TableCell className="text-white/70">{item.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/70 font-mono text-xs">{item.item_id}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) setSelectedItem(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedItem(item)}
                              className="bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
                            >
                              <Gift className="h-4 w-4 mr-1" />
                              Выдать
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/95 border-white/20 text-white">
                            <DialogHeader>
                              <DialogTitle>Выдать предмет: {item.name}</DialogTitle>
                              <DialogDescription className="text-white/70">
                                ID: {item.item_id} | Тип: {item.type}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="wallet" className="text-white">Wallet Address игрока</Label>
                                <Input
                                  id="wallet"
                                  placeholder="mr_bruts.tg"
                                  value={walletAddress}
                                  onChange={(e) => setWalletAddress(e.target.value)}
                                  className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-white">Количество</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={quantity}
                                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                  className="bg-black/30 border-white/20 text-white"
                                />
                              </div>
                              <Button
                                onClick={handleGiveItem}
                                disabled={isGiving || !walletAddress.trim()}
                                className="w-full"
                              >
                                {isGiving ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Выдаю...
                                  </>
                                ) : (
                                  <>
                                    <Gift className="mr-2 h-4 w-4" />
                                    Выдать {quantity}x {item.name}
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-white/50 text-center">
            Всего предметов: {filteredItems.length} из {items.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
