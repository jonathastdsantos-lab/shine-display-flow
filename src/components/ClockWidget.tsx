import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl bg-background/20 px-4 py-2 backdrop-blur-md text-primary-foreground">
      <p className="text-2xl font-bold font-display tabular-nums">{format(now, "HH:mm:ss")}</p>
      <p className="text-xs opacity-70">{format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
    </div>
  );
}
