import React from "react";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface ExperienceBarProps {
  experience: number;
  requiredExperience: number;
}

export const ExperienceBar = ({ experience, requiredExperience }: ExperienceBarProps) => {
  const experiencePercentage = (experience / requiredExperience) * 100;

  return (
    <div className="flex items-center gap-2">
      <Star className="w-5 h-5 text-yellow-500" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-game-accent">Опыт</span>
          <span className="text-sm text-game-accent">
            {experience}/{requiredExperience}
          </span>
        </div>
        <Progress value={experiencePercentage} className="h-2" />
      </div>
    </div>
  );
};