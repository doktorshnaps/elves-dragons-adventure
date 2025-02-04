import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MarketplaceHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button 
        variant="outline" 
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={() => navigate('/menu')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      <h1 className="text-2xl font-bold text-game-accent">Торговая площадка</h1>
    </div>
  );
};