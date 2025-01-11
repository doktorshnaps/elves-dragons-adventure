import { GameTitle } from "@/components/GameTitle";

const Index = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/b8a49d16-bf80-4363-90d6-7c244e46ca02.png")'
      }}
    >
      <div className="absolute inset-0 bg-black/30" /> {/* Затемнение для лучшей читаемости текста */}
      <div className="relative w-full max-w-7xl mx-auto px-4">
        <GameTitle />
      </div>
    </div>
  );
};

export default Index;