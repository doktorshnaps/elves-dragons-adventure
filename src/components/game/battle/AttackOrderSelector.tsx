import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Sword, Shield } from 'lucide-react';
import { TeamPair } from '@/types/teamBattle';

interface AttackOrderSelectorProps {
  playerPairs: TeamPair[];
  attackOrder: string[];
  onOrderChange: (newOrder: string[]) => void;
  onStartBattle: () => void;
}

export const AttackOrderSelector: React.FC<AttackOrderSelectorProps> = ({
  playerPairs,
  attackOrder,
  onOrderChange,
  onStartBattle
}) => {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newOrder = Array.from(attackOrder);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    onOrderChange(newOrder);
  };

  const getOrderedPairs = () => {
    return attackOrder.map(id => playerPairs.find(pair => pair.id === id)).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-primary">
              Настройка порядка атаки
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Перетащите карты, чтобы изменить порядок атаки ваших пар
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sword className="w-5 h-5" />
              Порядок атаки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="attackOrder">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {getOrderedPairs().map((pair, index) => (
                      <Draggable key={pair.id} draggableId={pair.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              snapshot.isDragging
                                ? 'bg-primary/20 border-primary shadow-lg'
                                : 'bg-card border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-grab"
                              >
                                <GripVertical className="w-5 h-5" />
                                <span className="font-bold text-lg bg-primary/20 px-3 py-1 rounded">
                                  #{index + 1}
                                </span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-semibold text-lg">
                                    {pair.hero.name}
                                  </span>
                                  {pair.dragon && (
                                    <span className="text-muted-foreground">
                                      + {pair.dragon.name}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Sword className="w-4 h-4 text-primary" />
                                    <span>Сила: {pair.power}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-4 h-4 text-accent" />
                                    <span>Защита: {pair.defense}</span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    Здоровье: {pair.health}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            onClick={onStartBattle}
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
            disabled={playerPairs.length === 0}
          >
            Начать бой!
          </Button>
        </div>
      </div>
    </div>
  );
};