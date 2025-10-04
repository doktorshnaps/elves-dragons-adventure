import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, DollarSign, Users, Target } from 'lucide-react';

interface SimulationResult {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  roi: number;
  playerRetention: number;
  averageLifetimeValue: number;
}

export const BalanceEmulator = () => {
  const [initialPlayers, setInitialPlayers] = useState(1000);
  const [avgSpending, setAvgSpending] = useState(10);
  const [retentionRate, setRetentionRate] = useState(0.7);
  const [acquisitionCost, setAcquisitionCost] = useState(5);
  const [operationalCost, setOperationalCost] = useState(2000);
  const [timeMonths, setTimeMonths] = useState(12);
  
  const [result, setResult] = useState<SimulationResult | null>(null);

  const calculateSimulation = () => {
    let players = initialPlayers;
    let totalRevenue = 0;
    let totalCosts = operationalCost * timeMonths;
    
    // Симуляция по месяцам
    for (let month = 0; month < timeMonths; month++) {
      // Доход от текущих игроков
      const monthlyRevenue = players * avgSpending;
      totalRevenue += monthlyRevenue;
      
      // Стоимость привлечения для первого месяца
      if (month === 0) {
        totalCosts += initialPlayers * acquisitionCost;
      }
      
      // Уменьшение игроков из-за оттока
      players = Math.floor(players * retentionRate);
    }
    
    const profit = totalRevenue - totalCosts;
    const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;
    const averageLifetimeValue = initialPlayers > 0 ? totalRevenue / initialPlayers : 0;

    setResult({
      totalRevenue,
      totalCosts,
      profit,
      roi,
      playerRetention: (players / initialPlayers) * 100,
      averageLifetimeValue
    });
  };

  useEffect(() => {
    calculateSimulation();
  }, [initialPlayers, avgSpending, retentionRate, acquisitionCost, operationalCost, timeMonths]);

  return (
    <Card className="bg-game-surface border-game-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-game-accent">
          <Calculator className="w-5 h-5" />
          Эмулятор игровой экономики
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="initialPlayers" className="text-game-accent">
              Начальное количество игроков
            </Label>
            <Input
              id="initialPlayers"
              type="number"
              value={initialPlayers}
              onChange={(e) => setInitialPlayers(Number(e.target.value))}
              className="bg-game-surface/50 border-game-accent text-game-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avgSpending" className="text-game-accent">
              Средний расход на игрока ($/мес)
            </Label>
            <Input
              id="avgSpending"
              type="number"
              value={avgSpending}
              onChange={(e) => setAvgSpending(Number(e.target.value))}
              className="bg-game-surface/50 border-game-accent text-game-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retentionRate" className="text-game-accent">
              Уровень удержания (0-1)
            </Label>
            <Input
              id="retentionRate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={retentionRate}
              onChange={(e) => setRetentionRate(Number(e.target.value))}
              className="bg-game-surface/50 border-game-accent text-game-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquisitionCost" className="text-game-accent">
              Стоимость привлечения ($/игрок)
            </Label>
            <Input
              id="acquisitionCost"
              type="number"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(Number(e.target.value))}
              className="bg-game-surface/50 border-game-accent text-game-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operationalCost" className="text-game-accent">
              Операционные расходы ($/мес)
            </Label>
            <Input
              id="operationalCost"
              type="number"
              value={operationalCost}
              onChange={(e) => setOperationalCost(Number(e.target.value))}
              className="bg-game-surface/50 border-game-accent text-game-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeMonths" className="text-game-accent">
              Период симуляции (месяцев)
            </Label>
            <Input
              id="timeMonths"
              type="number"
              value={timeMonths}
              onChange={(e) => setTimeMonths(Number(e.target.value))}
              className="bg-game-surface/50 border-game-accent text-game-accent"
            />
          </div>
        </div>

        <Button 
          onClick={calculateSimulation}
          className="w-full bg-game-accent hover:bg-game-accent/80 text-white"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Пересчитать
        </Button>

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card className="bg-game-surface/50 border-game-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-game-accent/60">Общий доход</p>
                    <p className="text-2xl font-bold text-green-500">
                      ${result.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-game-surface/50 border-game-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-game-accent/60">Общие расходы</p>
                    <p className="text-2xl font-bold text-red-500">
                      ${result.totalCosts.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-game-surface/50 border-game-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-game-accent/60">Прибыль</p>
                    <p className={`text-2xl font-bold ${result.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${result.profit.toFixed(2)}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-game-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-game-surface/50 border-game-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-game-accent/60">ROI</p>
                    <p className={`text-2xl font-bold ${result.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {result.roi.toFixed(2)}%
                    </p>
                  </div>
                  <Calculator className="w-8 h-8 text-game-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-game-surface/50 border-game-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-game-accent/60">Удержание игроков</p>
                    <p className="text-2xl font-bold text-game-accent">
                      {result.playerRetention.toFixed(2)}%
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-game-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-game-surface/50 border-game-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-game-accent/60">LTV на игрока</p>
                    <p className="text-2xl font-bold text-game-accent">
                      ${result.averageLifetimeValue.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-game-accent" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
