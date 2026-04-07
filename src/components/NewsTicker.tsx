interface NewsTickerProps {
  headlines: string[];
}

export default function NewsTicker({ headlines }: NewsTickerProps) {
  if (headlines.length === 0) return null;

  const text = headlines.join("  •  ");

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-foreground/90 py-2 overflow-hidden">
      <div className="ticker-animate whitespace-nowrap text-sm font-medium text-background">
        {text}  •  {text}
      </div>
    </div>
  );
}
