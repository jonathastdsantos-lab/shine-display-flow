import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Currency {
  code: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
}

// Simulated data as a bridge before API connection
const MOCK_FINANCE: Currency[] = [
  { code: "USD", name: "Dólar", value: 5.15, change: 0.12, trend: 'up' },
  { code: "EUR", name: "Euro", value: 5.62, change: -0.05, trend: 'down' },
  { code: "BTC", name: "Bitcoin", value: 345000, change: 2.4, trend: 'up' },
];

export default function FinanceWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCK_FINANCE.length);
    }, 7000); // Rotate every 7 seconds
    return () => clearInterval(timer);
  }, []);

  const current = MOCK_FINANCE[currentIndex];
  const isUp = current.trend === 'up';

  return (
    <div className="flex flex-col items-center px-4 py-5 w-full bg-black/20 animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-1 opacity-20">
         <DollarSign className="w-16 h-16" />
      </div>

      <div className="flex items-center gap-2 mb-1 z-10 w-full justify-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-player-muted/60">{current.name}</span>
      </div>

      <div className="flex items-end gap-1 z-10">
        <span className="text-xl font-display font-medium text-player-text">
          {current.code === 'BTC' ? '' : 'R$ '}{current.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className={`flex items-center gap-1 z-10 px-2 py-0.5 mt-2 rounded bg-black/40 text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{isUp ? '+' : ''}{current.change}%</span>
      </div>

      <div className="w-full flex justify-center gap-1 mt-3">
         {MOCK_FINANCE.map((_, idx) => (
           <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-3 bg-primary' : 'w-1 bg-player-muted/20'}`} />
         ))}
      </div>
    </div>
  );
}
