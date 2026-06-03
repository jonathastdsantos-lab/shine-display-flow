/**
 * Tipos fortes para campos JSON do Shine Display Flow.
 *
 * O arquivo `src/integrations/supabase/types.ts` é regenerado automaticamente
 * pelo Lovable Cloud e NÃO deve ser editado à mão. Como `widget_config` e
 * `layout_config` são `Json | null` no schema, declaramos aqui as interfaces
 * tipadas e fazemos a interseção com os Row types gerados.
 */
import type { Database, Json } from "@/integrations/supabase/types";

// ─────────────────────────── Widgets ───────────────────────────
export interface ClockConfig {
  enabled?: boolean;
  format?: "12h" | "24h";
  show_seconds?: boolean;
  show_date?: boolean;
}

export interface WeatherConfig {
  enabled?: boolean;
  city?: string;
  unit?: "C" | "F";
}

export interface FinanceConfig {
  enabled?: boolean;
  tickers?: string[];
  currencies?: string[];
}

export interface SocialConfig {
  enabled?: boolean;
  instagram_handle?: string;
  refresh_minutes?: number;
}

export interface QrConfig {
  enabled?: boolean;
  default_url?: string;
  label?: string;
}

export interface CameraConfig {
  enabled?: boolean;
  stream_url?: string;
  fit?: "cover" | "contain";
}

export interface WidgetConfig {
  clock?: ClockConfig;
  weather?: WeatherConfig;
  finance?: FinanceConfig;
  social?: SocialConfig;
  qr?: QrConfig;
  camera?: CameraConfig;
  // Permite chaves futuras sem quebrar o tipo
  [key: string]: unknown;
}

// ─────────────────────────── Layout ───────────────────────────
export type ZoneType =
  | "media"
  | "news"
  | "weather"
  | "clock"
  | "social"
  | "qr"
  | "finance"
  | "camera"
  | "ad"
  | "custom";

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
  config?: Record<string, unknown>;
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
export const asWidgetConfig = (v: Json | null | undefined): WidgetConfig | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as WidgetConfig) : null;

export const asLayoutConfig = (v: Json | null | undefined): LayoutConfig | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as LayoutConfig) : null;

// ─────────────── Row types fortemente tipados ───────────────
type PlaylistRowRaw = Database["public"]["Tables"]["playlists"]["Row"];
type ProfileRowRaw = Database["public"]["Tables"]["profiles"]["Row"];
type MediaRowRaw = Database["public"]["Tables"]["media_library"]["Row"];

export type Playlist = Omit<PlaylistRowRaw, "widget_config" | "layout_config" | "ordem_arquivos"> & {
  widget_config: WidgetConfig | null;
  layout_config: LayoutConfig | null;
  ordem_arquivos: string[];
};

export type ClientProfile = Omit<ProfileRowRaw, "widget_config" | "layout_config"> & {
  widget_config: WidgetConfig | null;
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
