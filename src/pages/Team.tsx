import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Sword, Shield, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: number;
  hero: {
    name: string;
    level: number;
    health: number;
    attack: number;
    defense: number;
    image?: string;
  };
  dragon: {
    name: string;
    level: number;
    health: number;
    attack: number;
    defense: number;
    image?: string;
  };
}

export const Team = () => {
  const navigate = useNavigate();

  // Placeholder team data - will be populated dynamically
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      hero: { name: "Герой 1", level: 5, health: 100, attack: 25, defense: 20, image: undefined },
      dragon: { name: "Дракон 1", level: 3, health: 150, attack: 30, defense: 15, image: undefined }
    },
    {
      id: 2,
      hero: { name: "Герой 2", level: 4, health: 90, attack: 22, defense: 18, image: undefined },
      dragon: { name: "Дракон 2", level: 2, health: 120, attack: 28, defense: 12, image: undefined }
    },
    {
      id: 3,
      hero: { name: "Герой 3", level: 6, health: 110, attack: 28, defense: 22, image: undefined },
      dragon: { name: "Дракон 3", level: 4, health: 160, attack: 32, defense: 18, image: undefined }
    },
    {
      id: 4,
      hero: { name: "Герой 4", level: 3, health: 85, attack: 20, defense: 16, image: undefined },
      dragon: { name: "Дракон 4", level: 1, health: 100, attack: 24, defense: 10, image: undefined }
    },
    {
      id: 5,
      hero: { name: "Герой 5", level: 5, health: 95, attack: 24, defense: 19, image: undefined },
      dragon: { name: "Дракон 5", level: 3, health: 140, attack: 29, defense: 14, image: undefined }
    }
  ];

  // Calculate total stats
  const totalStats = teamMembers.reduce(
    (acc, member) => ({
      power: acc.power + member.hero.attack + member.dragon.attack,
      defense: acc.defense + member.hero.defense + member.dragon.defense,
      health: acc.health + member.hero.health + member.dragon.health
    }),
    { power: 0, defense: 0, health: 0 }
  );

  const handleDeleteMember = (id: number) => {
    // Will be implemented to remove team member
    console.log("Delete member:", id);
  };

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/80" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/menu')}
            className="mb-4 text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться в меню
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              Управление командой
            </h1>
            <p className="text-lg text-muted-foreground">
              Наборочная команда ({teamMembers.length}/5)
            </p>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {teamMembers.map((member) => (
            <Card 
              key={member.id}
              className="bg-card/90 backdrop-blur-sm border-border/50 p-6 relative hover:border-primary/50 transition-all"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteMember(member.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-2 gap-4">
                {/* Hero Card */}
                <div className="space-y-3">
                  <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center border border-border/30 overflow-hidden">
                    {member.hero.image ? (
                      <img src={member.hero.image} alt={member.hero.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground text-sm">Изображение героя</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-center">{member.hero.name}</h3>
                  
                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Уровень</span>
                      </div>
                      <span className="font-medium text-foreground">{member.hero.level}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-destructive" />
                        <span className="text-muted-foreground">Здоровье</span>
                      </div>
                      <span className="font-medium text-foreground">{member.hero.health}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Sword className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Атака</span>
                      </div>
                      <span className="font-medium text-foreground">{member.hero.attack}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">Защита</span>
                      </div>
                      <span className="font-medium text-foreground">{member.hero.defense}</span>
                    </div>
                  </div>
                </div>

                {/* Dragon Card */}
                <div className="space-y-3">
                  <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center border border-border/30 overflow-hidden">
                    {member.dragon.image ? (
                      <img src={member.dragon.image} alt={member.dragon.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground text-sm">Изображение дракона</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-center">{member.dragon.name}</h3>
                  
                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Уровень</span>
                      </div>
                      <span className="font-medium text-foreground">{member.dragon.level}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-destructive" />
                        <span className="text-muted-foreground">Здоровье</span>
                      </div>
                      <span className="font-medium text-foreground">{member.dragon.health}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Sword className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Атака</span>
                      </div>
                      <span className="font-medium text-foreground">{member.dragon.attack}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">Защита</span>
                      </div>
                      <span className="font-medium text-foreground">{member.dragon.defense}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
          <Button
            size="lg"
            className="bg-background hover:bg-background/80 text-foreground border border-primary/50 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20"
            onClick={() => console.log("Open hero deck")}
          >
            Колода героев
          </Button>
          <Button
            size="lg"
            className="bg-background hover:bg-background/80 text-foreground border border-primary/50 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20"
            onClick={() => console.log("Open dragon deck")}
          >
            Колода драконов
          </Button>
        </div>

        {/* Team Statistics Panel */}
        <Card className="bg-card/90 backdrop-blur-sm border-primary/30 p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-primary mb-6">
            Статистика команды
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Sword className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Общая мощь</p>
              <p className="text-3xl font-bold text-foreground">{totalStats.power}</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Общая защита</p>
              <p className="text-3xl font-bold text-foreground">{totalStats.defense}</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Heart className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Общее здоровье</p>
              <p className="text-3xl font-bold text-foreground">{totalStats.health}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
