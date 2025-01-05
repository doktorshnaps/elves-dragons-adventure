import { GameTitle } from "@/components/GameTitle";

const Index = () => {
  return (
    <div className="min-h-screen bg-game-background flex items-center justify-center">
      <div className="relative w-full max-w-7xl mx-auto px-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-game-primary/20 rounded-full filter blur-3xl animate-pulse" />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-8 py-12">
          <div className="w-full md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
              alt="Эльфийский герой" 
              className="rounded-lg shadow-2xl w-full max-w-xl mx-auto animate-float"
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <GameTitle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;