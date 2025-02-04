import { GameTitle } from "@/components/GameTitle";
import { NavigationBar } from "@/components/navigation/NavigationBar";

const Index = () => {
  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/86b5334c-bb41-4222-9077-09521913b631.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <NavigationBar />

      <div 
        className="relative z-10 flex-grow flex items-center justify-center"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4">
          <GameTitle />
        </div>
      </div>
    </div>
  );
};

export default Index;