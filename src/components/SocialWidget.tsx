import { Instagram } from "lucide-react";

export default function SocialWidget() {
  return (
    <div className="flex flex-col items-center px-4 py-5 w-full bg-black/20 animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-1 opacity-10">
         <Instagram className="w-16 h-16" />
      </div>

      <div className="flex items-center gap-2 mb-2 z-10 w-full justify-center">
        <Instagram className="w-3 h-3 text-pink-500" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-player-muted/60">@suaempresa</span>
      </div>

      <div className="w-16 h-16 rounded-full border-2 border-pink-500/50 p-1 mb-2 z-10">
        <div className="w-full h-full bg-muted rounded-full overflow-hidden">
          <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop" alt="Social" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="text-center z-10 w-full">
        <p className="text-[10px] text-player-text/90 line-clamp-2 leading-relaxed">Confira nossas novas promoções de verão em nosso perfil oficial! ✨</p>
      </div>

      <div className="w-full flex justify-center gap-1 mt-3 z-10">
         <span className="text-[8px] font-mono text-player-muted/40">Há 2 horas</span>
      </div>
    </div>
  );
}
