import { BarChart3, Target, ArrowUp } from "lucide-react";

interface KPIDashboardProps {
  label?: string;
  value?: number;
  target?: number;
  suffix?: string;
  fontSize?: number;
}

export default function KPIDashboard({ 
  label = "Meta de Vendas", 
  value = 75000, 
  target = 100000, 
  suffix = "R$", 
  fontSize 
}: KPIDashboardProps) {
  const percentage = Math.min(100, Math.round((value / target) * 100));

  return (
    <div className="flex flex-col p-5 w-full h-full bg-[#0D111A] border border-white/5 rounded-xl justify-center relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <BarChart3 className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">{label}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span 
          className="font-display font-black text-white tracking-tighter"
          style={{ fontSize: fontSize ? `${fontSize}px` : "2.5rem" }}
        >
          {suffix === "R$" ? "R$ " : ""}{value.toLocaleString('pt-BR')}
          {suffix !== "R$" ? ` ${suffix}` : ""}
        </span>
        <div className="flex items-center text-emerald-400 text-[10px] font-bold">
          <ArrowUp className="w-3 h-3" />
          <span>{percentage}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/20">
          <span>Progresso</span>
          <span>Meta: {suffix === "R$" ? "R$ " : ""}{target.toLocaleString('pt-BR')}</span>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
