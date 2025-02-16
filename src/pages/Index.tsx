
import { GameTitle } from "@/components/GameTitle";

const Index = () => {
  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/86b5334c-bb41-4222-9077-09521913b631.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'none',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        height: '100dvh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <div 
        className="relative z-10 flex-grow flex items-center justify-center h-full w-full overflow-hidden"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'none',
          userSelect: 'none'
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-center">
          <GameTitle />
        </div>
      </div>
    </div>
  );
};

export default Index;
