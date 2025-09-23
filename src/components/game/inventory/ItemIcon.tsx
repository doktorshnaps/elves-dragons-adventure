import { Item } from "@/types/inventory";
import { Sparkles, Heart, TreePine, Leaf, Mountain, Gem, BookOpen, Eye, Flower, Scissors, Droplets, Diamond } from "lucide-react";

interface ItemIconProps {
  type: Item["type"];
}

export const ItemIcon = ({ type }: ItemIconProps) => {
  if (type === "cardPack") {
    return <Sparkles className="w-4 h-4" />;
  }
  if (type === "healthPotion") {
    return <Heart className="w-4 h-4 text-red-500" />;
  }
  if (type === "woodChunks") {
    return <TreePine className="w-4 h-4 text-amber-600" />;
  }
  if (type === "magicalRoots") {
    return <Leaf className="w-4 h-4 text-amber-700" />;
  }
  if (type === "rockStones") {
    return <Mountain className="w-4 h-4 text-gray-600" />;
  }
  if (type === "blackCrystals") {
    return <Gem className="w-4 h-4 text-gray-900" />;
  }
  if (type === "illusionManuscript") {
    return <BookOpen className="w-4 h-4 text-yellow-600" />;
  }
  if (type === "darkMonocle") {
    return <Eye className="w-4 h-4 text-purple-600" />;
  }
  if (type === "etherVine") {
    return <Flower className="w-4 h-4 text-cyan-500" />;
  }
  if (type === "dwarvenTongs") {
    return <Scissors className="w-4 h-4 text-gray-400" />;
  }
  if (type === "healingOil") {
    return <Droplets className="w-4 h-4 text-purple-500" />;
  }
  if (type === "shimmeringCrystal") {
    return <Diamond className="w-4 h-4 text-blue-400" />;
  }
  return null;
};