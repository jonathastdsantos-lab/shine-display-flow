import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  color: string;
}

const INITIAL_DATA: CryptoData[] = [
  { symbol: "BTC", name: "Bitcoin", price: 65432.10, change24h: 2.5, color: "text-orange-400" },
  { symbol: "ETH", name: "Ethereum", price: 3456.75, change24h: -1.2, color: "text-blue-400" },
  { symbol: "SOL", name: "Solana", price: 145.20, change24h: 5.8, color: "text-purple-400" },
];

export default function CryptoProWidget({ fontSize }: { fontSize?: number }) {
  const [data, setData] = useState<CryptoData[]>(INITIAL_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [data.length]);

  // Simulate price fluctuations for a "Live" feel
  useEffect(() => {
    const interval = setInterval(() => {
      setData(current => current.map(item => ({
        ...item,
        price: item.price * (1 + (Math.random() * 0.002 - 0.001))
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = data[currentIndex];
  const isUp = current.change24h >= 0;

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-[#0A0D14] border border-white/5 rounded-xl overflow-hidden relative">
      <div className="absolute top-2 right-4 flex items-center gap-1 opacity-20">
        <Coins className="w-4 h-4" />
        <span className="text-[8px] font-bold uppercase tracking-widest">Live Crypto</span>
      </div>

      <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 ${current.color}`}>
          {current.name}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-white/40 text-sm font-light">$</span>
          <span 
            className="font-display font-black text-white tracking-tighter"
            style={{ fontSize: fontSize ? `${fontSize}px` : "2.5rem" }}
          >
            {current.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className={`flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="text-xs font-black tabular-nums">{Math.abs(current.change24h)}%</span>
          <span className="text-[10px] uppercase font-bold opacity-60">24h</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <div 
          className="h-full bg-indigo-500 transition-all duration-[8000ms] ease-linear"
          style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
