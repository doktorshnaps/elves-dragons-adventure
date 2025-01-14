import { GameTitle } from "@/components/GameTitle";

const Index = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/9dedb845-d564-4666-b1ef-2bc1d8289353.png")'
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-7xl mx-auto px-4">
        <GameTitle />
      </div>
    </div>
  );
};

export default Index;