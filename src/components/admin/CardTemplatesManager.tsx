import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Database } from 'lucide-react';
import { useCardTemplates } from '@/hooks/useCardTemplates';

export const CardTemplatesManager = () => {
  const [isPopulating, setIsPopulating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { populateTemplates, recalculateAllInstances, templates } = useCardTemplates();

  const handlePopulate = async () => {
    setIsPopulating(true);
    try {
      await populateTemplates();
    } finally {
      setIsPopulating(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateAllInstances();
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Управление шаблонами карт</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Шаблоны карт</h3>
            <p className="text-sm text-muted-foreground">
              Всего шаблонов: {templates?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Заполнить таблицу card_templates из существующих мультипликаторов
            </p>
          </div>
          <Button
            onClick={handlePopulate}
            disabled={isPopulating}
            variant="outline"
            size="sm"
          >
            <Database className="w-4 h-4 mr-2" />
            {isPopulating ? 'Заполнение...' : 'Заполнить шаблоны'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Пересчет карт игроков</h3>
            <p className="text-sm text-muted-foreground">
              Пересчитать характеристики всех карт в card_instances из шаблонов
            </p>
          </div>
          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRecalculating ? 'Пересчет...' : 'Пересчитать все карты'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
