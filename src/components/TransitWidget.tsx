import { Bus, Clock, MapPin, ArrowRight } from "lucide-react";

interface TransitLine {
  id: string;
  name: string;
  dest: string;
  time: number;
}

const MOCK_LINES: TransitLine[] = [
  { id: "801", name: "801", dest: "Centro Direto", time: 4 },
  { id: "412", name: "412", dest: "Terminal Oeste", time: 12 },
  { id: "550", name: "550", dest: "Estação Norte", time: 18 },
];

export default function TransitWidget() {
  return (
    <div className="flex flex-col p-4 w-full h-full bg-[#111] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Bus className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Transporte Público</p>
            <p className="text-[8px] text-white/30 uppercase font-bold tracking-wider">Parada: Av. Paulista, 1000</p>
          </div>
        </div>
        <Clock className="w-3.5 h-3.5 text-white/20 animate-pulse" />
      </div>

      <div className="space-y-1.5 flex-1">
        {MOCK_LINES.map((line) => (
          <div 
            key={line.id} 
            className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all cursor-default group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-amber-500 rounded font-black text-black text-sm">
              {line.name}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-white/20" />
                <p className="text-xs font-bold text-white/80 truncate">{line.dest}</p>
              </div>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Em trânsito</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-lg font-black text-amber-500 tabular-nums">{line.time}</span>
                <span className="text-[9px] font-bold text-amber-500/60 uppercase">min</span>
              </div>
              <ArrowRight className="w-3 h-3 text-white/10 ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex justify-center">
        <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/10">Atualizando em tempo real</p>
      </div>
    </div>
  );
}
