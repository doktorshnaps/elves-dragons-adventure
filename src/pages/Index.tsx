import { GameTitle } from "@/components/GameTitle";

const Index = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/b112d985-e245-445e-85ec-5d0a6e883abc.png")'
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