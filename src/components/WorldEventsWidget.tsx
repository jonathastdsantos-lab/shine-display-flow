import { useState, useEffect } from "react";
import { Globe2 } from "lucide-react";

interface WorldEvent {
  id: string;
  category: string;
  title: string;
  location: string;
  time: string;
}

const mockEvents: WorldEvent[] = [
  { id: "1", category: "Geopolítica", title: "Cúpula global discute novas metas de emissão de carbono para 2030.", location: "Genebra, Suíça", time: "Há 10 min" },
  { id: "2", category: "Economia", title: "Mercados asiáticos fecham em alta recorde após anúncio de estímulos.", location: "Tóquio, Japão", time: "Há 45 min" },
  { id: "3", category: "Tecnologia", title: "Avanço revolucionário em computação quântica anunciado por pesquisadores.", location: "Vale do Silício, EUA", time: "Há 1 hora" },
  { id: "4", category: "Ciência", title: "Novo telescópio espacial captura imagens inéditas de exoplanetas habitáveis.", location: "Agência Espacial", time: "Há 2 horas" },
];

export default function WorldEventsWidget() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % mockEvents.length);
        setAnimating(false);
      }, 600); // fade out duration
    }, 10000); // 10 seconds per event
    return () => clearInterval(interval);
  }, []);

  const event = mockEvents[index];

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[4rem] -translate-y-1/2 translate-x-1/2 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-[4rem] translate-y-1/2 -translate-x-1/2 mix-blend-screen" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/20 relative z-10">
        <div className="relative flex items-center justify-center p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <Globe2 className="w-5 h-5 text-blue-400" />
          <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full animate-pulse" />
        </div>
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">Eventos no Mundo</h3>
          <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase">Atualizações em Tempo Real</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-5 relative z-10">
        <div className={`transition-all duration-700 ease-in-out ${animating ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
              {event.category}
            </span>
            <span className="text-[10px] text-white/40 font-semibold tracking-wider">
              {event.time} • {event.location}
            </span>
          </div>
          
          <h2 className="text-lg font-bold text-white/90 leading-snug tracking-wide">
            {event.title}
          </h2>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="px-6 pb-5 flex gap-1.5 relative z-10">
        {mockEvents.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
            {i === index && (
              <div 
                className="h-full bg-blue-400 rounded-full" 
                style={{ animation: 'progressFill 10s linear forwards' }}
              />
            )}
            {i < index && <div className="h-full bg-blue-400/50 rounded-full" />}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
