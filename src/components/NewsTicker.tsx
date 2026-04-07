interface NewsTickerProps {
  headlines: string[];
}

export default function NewsTicker({ headlines }: NewsTickerProps) {
  if (headlines.length === 0) return null;
  const text = headlines.join("   ●   ");

  return (
    <div className="w-full overflow-hidden player-zone-footer py-2.5 border-t border-player-text/5">
      <div className="ticker-animate whitespace-nowrap text-sm font-medium text-player-text/90 tracking-wide">
        {text}   ●   {text}
      </div>
    </div>
  );
}
