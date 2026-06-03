import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, WifiOff, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PlayerErrorKind =
  | "playlist_not_found"
  | "playlist_fetch"
  | "media_fetch"
  | "profile_fetch";

export interface PlayerErrorInfo {
  kind: PlayerErrorKind;
  message: string;
  detail?: string;
}

interface Props {
  error: PlayerErrorInfo;
  onRetry: () => void;
  /** Segundos para retry automático. Use 0 para desabilitar. */
  autoRetrySeconds?: number;
}

const META: Record<
  PlayerErrorKind,
  { title: string; icon: typeof AlertTriangle; tint: string }
> = {
  playlist_not_found: {
    title: "Tela não encontrada",
    icon: FileQuestion,
    tint: "text-amber-400",
  },
  playlist_fetch: {
    title: "Falha ao carregar configuração da tela",
    icon: WifiOff,
    tint: "text-red-400",
  },
  media_fetch: {
    title: "Falha ao carregar mídias",
    icon: WifiOff,
    tint: "text-red-400",
  },
  profile_fetch: {
    title: "Falha ao carregar perfil do cliente",
    icon: AlertTriangle,
    tint: "text-amber-400",
  },
};

export default function PlayerError({ error, onRetry, autoRetrySeconds = 15 }: Props) {
  const meta = META[error.kind];
  const Icon = meta.icon;
  const [remaining, setRemaining] = useState(autoRetrySeconds);

  useEffect(() => {
    setRemaining(autoRetrySeconds);
  }, [error.kind, error.message, autoRetrySeconds]);

  useEffect(() => {
    if (autoRetrySeconds <= 0) return;
    if (remaining <= 0) {
      onRetry();
      return;
    }
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, autoRetrySeconds, onRetry]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black p-8">
      <div className="max-w-xl w-full text-center space-y-6">
        <div
          className={`mx-auto h-24 w-24 rounded-full border-4 border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.05)] ${meta.tint}`}
        >
          <Icon className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <p className="font-display text-3xl font-bold tracking-wide text-white">
            {meta.title}
          </p>
          <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed">
            {error.message}
          </p>
          {error.detail && (
            <p className="text-[11px] text-white/30 font-mono mt-2 break-all">
              {error.detail}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            onClick={onRetry}
            size="lg"
            className="gap-2 bg-white text-black hover:bg-white/90"
          >
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
          {autoRetrySeconds > 0 && (
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Retry automático em {remaining}s
            </p>
          )}
        </div>

        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/20 pt-6">
          Signage OS
        </p>
      </div>
    </div>
  );
}
