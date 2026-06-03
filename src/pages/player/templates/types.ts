import type { MediaItem, RemoteIntervention } from "@/pages/player/shared";

export interface TemplateProps {
  playlistId: string | undefined;
  clientId: string | null;
  mediaItems: MediaItem[];
  current: MediaItem | undefined;
  currentIndex: number;
  fading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  city: string;
  headlines: string[];
  widgetConfig: any;
  layoutConfig: any;
  igHandle: string;
  currentQrLink?: string;
  remoteIntervention: RemoteIntervention;
  paused: boolean;
  showAdOverlay: boolean;
  adWidgetUrl: string | undefined;
}
