import { useState, useEffect } from "react";
import { Timer, PartyPopper } from "lucide-react";

interface CountdownWidgetProps {
  targetDate?: string;
  label?: string;
  fontSize?: number;
}

export default function CountdownWidget({ 
  targetDate = "2026-12-31T23:59:59", 
  label = "Grande Inauguração",
  fontSize
}: CountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
        <PartyPopper className="w-12 h-12 text-emerald-400 mb-2" />
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">{label}</h3>
        <p className="text-emerald-400 font-black mt-1">O EVENTO JÁ COMEÇOU!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-5 w-full h-full bg-[#1A1C30] border border-white/5 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      
      <div className="flex items-center gap-2 mb-6">
        <Timer className="w-4 h-4 text-indigo-400" />
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">{label}</span>
      </div>

      <div className="flex items-center gap-4">
        {[
          { v: timeLeft.d, l: "Dias" },
          { v: timeLeft.h, l: "Horas" },
          { v: timeLeft.m, l: "Min" },
          { v: timeLeft.s, l: "Seg" },
        ].map((unit, i) => (
          <div key={unit.l} className="flex flex-col items-center">
            <div className="flex items-center">
              <span 
                className="font-display font-black text-white tracking-tighter tabular-nums leading-none"
                style={{ fontSize: fontSize ? `${fontSize}px` : "2.5rem" }}
              >
                {unit.v.toString().padStart(2, '0')}
              </span>
              {i < 3 && <span className="text-white/20 text-xl font-thin ml-2">:</span>}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/60 mt-2">{unit.l}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-1.5">
         <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
              Data Alvo: {new Date(targetDate).toLocaleDateString('pt-BR')}
            </p>
         </div>
      </div>
    </div>
  );
}
