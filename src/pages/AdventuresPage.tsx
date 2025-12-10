
import { useNavigate } from "react-router-dom";
import { AdventuresTab } from "@/components/game/adventures/AdventuresTab";
import { usePageMeta } from "@/hooks/usePageTitle";

export const AdventuresPage = () => {
  usePageMeta({ 
    title: 'Приключения', 
    description: 'Отправляйся в бесконечные приключения и сражайся с монстрами. Прокачивай героев и получай награды!' 
  });
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/0fb6e9e6-c143-470a-87c8-adf54800851d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10">
        <AdventuresTab />
      </div>
    </div>
  );
};
