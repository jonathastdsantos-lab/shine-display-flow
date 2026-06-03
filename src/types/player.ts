/**
 * Tipos fortes para campos JSON do Shine Display Flow.
 *
 * O arquivo `src/integrations/supabase/types.ts` é regenerado automaticamente
 * pelo Lovable Cloud e NÃO deve ser editado à mão. Como `widget_config` e
 * `layout_config` são `Json | null` no schema, declaramos aqui as interfaces
 * tipadas e fazemos a interseção com os Row types gerados.
 */
import type { Database, Json } from "@/integrations/supabase/types";
import type { BusinessSegment } from "@/utils/ContentFeed";

// ─────────────────────────── Widgets ───────────────────────────
// Mantemos esta tipagem alinhada com `src/components/dashboard/WidgetStore.tsx`
// (que reexporta `WidgetConfig` daqui). Campos opcionais para permitir
// configurações parciais vindas do banco (Json).

export interface ClockConfig {
  enabled: boolean;
  showWeather: boolean;
}
export interface WeatherConfig {
  enabled: boolean;
}
export interface NewsConfig {
  enabled: boolean;
}
export interface FinanceConfig {
  enabled: boolean;
}
export interface SocialConfig {
  enabled: boolean;
}
export interface QrConfig {
  enabled: boolean;
  default_url: string;
}
export interface CameraConfig {
  enabled: boolean;
  label: string;
  url: string;
}
export interface ContentFeedConfig {
  enabled: boolean;
  segment: BusinessSegment;
}

export interface WidgetConfig {
  clock: ClockConfig;
  weather: WeatherConfig;
  news: NewsConfig;
  finance: FinanceConfig;
  social: SocialConfig;
  qr: QrConfig;
  camera: CameraConfig;
  content_feed: ContentFeedConfig;
}

/** Versão tolerante para dados vindos do banco (campos podem faltar). */
export type StoredWidgetConfig = Partial<WidgetConfig>;

// ─────────────────────────── Layout ───────────────────────────
// `string` para tolerar tipos novos definidos noutros módulos
// (ex.: AILayoutAssistant cria "content_feed", "kpi_dashboard"…).
export type ZoneType = string;

export interface Zone {
  id: string;
  type: ZoneType;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  z_index?: number;
  rotation?: number;
  background?: string;
  config?: Record<string, any>;
}

export interface LayoutConfig {
  is_custom?: boolean;
  zones?: Zone[];
  show_ticker?: boolean;
  sidebar_width?: number;
  sidebar_position?: "left" | "right";
  footer_height?: number;
  split_ratio?: number;
  [key: string]: unknown;
}

// ─── Helpers para converter Json ↔ tipos fortes ───
export const asWidgetConfig = (v: Json | null | undefined): StoredWidgetConfig | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as unknown as StoredWidgetConfig) : null;

export const asLayoutConfig = (v: Json | null | undefined): LayoutConfig | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as unknown as LayoutConfig) : null;

// ─────────────── Row types fortemente tipados ───────────────
type PlaylistRowRaw = Database["public"]["Tables"]["playlists"]["Row"];
type ProfileRowRaw = Database["public"]["Tables"]["profiles"]["Row"];
type MediaRowRaw = Database["public"]["Tables"]["media_library"]["Row"];

export type Playlist = Omit<PlaylistRowRaw, "widget_config" | "layout_config" | "ordem_arquivos"> & {
  widget_config: StoredWidgetConfig | null;
  layout_config: LayoutConfig | null;
  ordem_arquivos: string[];
};

export type ClientProfile = Omit<ProfileRowRaw, "widget_config" | "layout_config"> & {
  widget_config: StoredWidgetConfig | null;
  layout_config: LayoutConfig | null;
};

export type MediaItem = MediaRowRaw;

// Cast utilitário (estreita Row -> tipo forte)
export const toPlaylist = (row: PlaylistRowRaw): Playlist => ({
  ...row,
  widget_config: asWidgetConfig(row.widget_config),
  layout_config: asLayoutConfig(row.layout_config),
  ordem_arquivos: (row.ordem_arquivos as string[]) ?? [],
});

export const toClientProfile = (row: ProfileRowRaw): ClientProfile => ({
  ...row,
  widget_config: asWidgetConfig(row.widget_config),
  layout_config: asLayoutConfig(row.layout_config),
});
