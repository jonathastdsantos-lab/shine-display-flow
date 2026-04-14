import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClockWidgetProps {
  compact?: boolean;
}

export default function ClockWidget({ compact = false }: ClockWidgetProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="text-center px-2 py-3">
        <p className="text-2xl font-bold font-display tabular-nums text-player-text tracking-tight">
          {format(now, "HH:mm")}
        </p>
        <p className="text-[10px] text-player-muted mt-0.5">{format(now, "dd/MM", { locale: ptBR })}</p>
      </div>
    );
  }

  return (
    <div className="text-center px-4 py-6">
      <p className="text-4xl font-bold font-display tabular-nums text-player-text tracking-tight">
        {format(now, "HH:mm")}
      </p>
      <p className="text-xs text-player-muted mt-1">{format(now, "EEEE", { locale: ptBR })}</p>
      <p className="text-xs text-player-muted">{format(now, "d 'de' MMMM", { locale: ptBR })}</p>
    </div>
  );
}
