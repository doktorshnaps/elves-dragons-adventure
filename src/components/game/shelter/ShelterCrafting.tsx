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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {itemImage && (
                    <img 
                      src={itemImage} 
                      alt={recipe.name}
                      className="w-12 h-12 object-contain rounded border border-primary/20"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <span className={getCategoryColor(recipe.category)}>
                      {getCategoryIcon(recipe.category)}
                    </span>
                    <CardTitle className="text-xl">{recipe.name}</CardTitle>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {recipe.category}
                </Badge>
              </div>
              <CardDescription className="text-sm">{recipe.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">{t(language, 'shelter.requirements')}:</div>
                <div className="grid grid-cols-2 gap-2">
                  {recipe.requirements.wood && (
                    <div className="flex items-center gap-2">
                      <span>🪵</span>
                      <span className="text-sm">{recipe.requirements.wood}</span>
                    </div>
                  )}
                  {recipe.requirements.stone && (
                    <div className="flex items-center gap-2">
                      <span>🪨</span>
                      <span className="text-sm">{recipe.requirements.stone}</span>
                    </div>
                  )}
                  {recipe.requirements.iron && (
                    <div className="flex items-center gap-2">
                      <span>⛏️</span>
                      <span className="text-sm">{recipe.requirements.iron}</span>
                    </div>
                  )}
                  {recipe.requirements.balance && (
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span className="text-sm">{recipe.requirements.balance} ELL</span>
                    </div>
                  )}
                  {recipe.requirements.materials && recipe.requirements.materials.length > 0 && (
                    recipe.requirements.materials.map((mat, idx) => {
                      const playerHas = inventoryCounts[mat.item_id] || 0;
                      const hasEnough = playerHas >= mat.quantity;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span>📦</span>
                          <span className={`text-sm ${hasEnough ? '' : 'text-destructive'}`}>
                            {getItemName(mat.item_id)} ({playerHas}/{mat.quantity})
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
