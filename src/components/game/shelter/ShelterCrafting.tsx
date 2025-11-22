import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CraftRecipe } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { Hammer, Clock } from "lucide-react";
import { useItemTemplates } from "@/hooks/useItemTemplates";
import { itemImagesByItemId } from "@/constants/itemImages";

interface ShelterCraftingProps {
  recipes: CraftRecipe[];
  canAffordCraft: (recipe: CraftRecipe) => boolean;
  handleCraft: (recipe: CraftRecipe) => void;
  workshopLevel: number;
  inventoryCounts: Record<string, number>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "weapon": return "⚔️";
    case "armor": return "🛡️";
    case "potion": return "🧪";
    default: return "📦";
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "weapon": return "text-red-500";
    case "armor": return "text-blue-500";
    case "potion": return "text-green-500";
    default: return "text-gray-500";
  }
};

export const ShelterCrafting = ({
  recipes,
  canAffordCraft,
  handleCraft,
  workshopLevel,
  inventoryCounts
}: ShelterCraftingProps) => {
  const { language } = useLanguage();
  const { getItemName, getTemplate } = useItemTemplates();

  if (workshopLevel === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardContent className="p-8 text-center">
          <Hammer className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">{t(language, 'shelter.workshopRequired')}</h3>
          <p className="text-muted-foreground">
            {t(language, 'shelter.workshopRequiredDesc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((recipe) => {
        const canCraft = canAffordCraft(recipe);
        const itemTemplate = getTemplate(recipe.result_item_id.toString());
        const itemImage = itemTemplate?.image_url || itemImagesByItemId[recipe.result_item_id.toString()];
        
        return (
          <Card 
            key={recipe.id} 
            className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
          >
            <CardHeader>
              <div className="flex flex-col gap-3 mb-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className={`${getCategoryColor(recipe.category)} shrink-0 mt-0.5`}>
                      {getCategoryIcon(recipe.category)}
                    </span>
                    <CardTitle className="text-xl word-break break-words whitespace-normal">{recipe.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="capitalize shrink-0">
                    {recipe.category}
                  </Badge>
                </div>
                {itemImage && (
                  <div className="flex justify-center">
                    <img 
                      src={itemImage} 
                      alt={recipe.name}
                      className="w-48 h-48 object-contain rounded border border-primary/20"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
              <CardDescription className="text-sm">{recipe.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">{t(language, 'shelter.requirements')}:</div>
                <div className="space-y-1.5">
                  {recipe.requirements.wood > 0 && (
                    <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <span>🪵</span>
                        <span className="text-sm">{t(language, 'resources.wood')}</span>
                      </div>
                      <span className="text-sm font-semibold">{recipe.requirements.wood}</span>
                    </div>
                  )}
                  {recipe.requirements.stone > 0 && (
                    <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <span>🪨</span>
                        <span className="text-sm">{t(language, 'resources.stone')}</span>
                      </div>
                      <span className="text-sm font-semibold">{recipe.requirements.stone}</span>
                    </div>
                  )}
                  {recipe.requirements.balance > 0 && (
                    <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span className="text-sm">ELL</span>
                      </div>
                      <span className="text-sm font-semibold">{recipe.requirements.balance}</span>
                    </div>
                  )}
                  {recipe.requirements.materials && recipe.requirements.materials.length > 0 && (
                    recipe.requirements.materials
                      .filter(mat => mat && mat.item_id)
                      .map((mat, idx) => {
                        const playerHas = inventoryCounts[mat.item_id] || 0;
                        const hasEnough = playerHas >= mat.quantity;
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between px-2 py-1 rounded border ${
                              hasEnough 
                                ? 'border-green-500/50 bg-green-500/10' 
                                : 'border-red-500/50 bg-red-500/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span>📦</span>
                              <span className={`text-sm font-medium truncate ${hasEnough ? 'text-green-500' : 'text-red-500'}`}>
                                {getItemName(mat.item_id)}
                              </span>
                            </div>
                            <span className={`text-sm font-semibold ml-2 ${hasEnough ? 'text-green-500' : 'text-red-500'}`}>
                              {playerHas}/{mat.quantity}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {recipe.craftingTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{t(language, 'shelter.craftingTime')}: {recipe.craftingTime}ч</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                <strong>{t(language, 'shelter.result')}:</strong> {recipe.result}
              </div>

              <Button
                className="w-full"
                onClick={() => handleCraft(recipe)}
                disabled={!canCraft}
                variant={canCraft ? "default" : "secondary"}
              >
                <Hammer className="w-4 h-4 mr-2" />
                {t(language, 'shelter.craft')}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
