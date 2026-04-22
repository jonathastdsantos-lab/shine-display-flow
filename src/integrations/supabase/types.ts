export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_leads: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          mensagem: string | null
          nome: string
          playlist_id: string | null
          source: string | null
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          playlist_id?: string | null
          source?: string | null
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          playlist_id?: string | null
          source?: string | null
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          client_id: string
          created_at: string
          duracao: number
          id: string
          nome: string
          qr_link: string | null
          tipo: string
          url_arquivo: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duracao?: number
          id?: string
          nome?: string
          qr_link?: string | null
          tipo: string
          url_arquivo: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duracao?: number
          id?: string
          nome?: string
          qr_link?: string | null
          tipo?: string
          url_arquivo?: string
        }
        Relationships: []
      }
      play_logs: {
        Row: {
          duration_sec: number | null
          id: string
          media_id: string
          media_name: string | null
          media_type: string | null
          played_at: string | null
          player_id: string
        }
        Insert: {
          duration_sec?: number | null
          id?: string
          media_id: string
          media_name?: string | null
          media_type?: string | null
          played_at?: string | null
          player_id: string
        }
        Update: {
          duration_sec?: number | null
          id?: string
          media_id?: string
          media_name?: string | null
          media_type?: string | null
          played_at?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      playlists: {
        Row: {
          ad_widget_enabled: boolean | null
          ad_widget_url: string | null
          client_id: string
          config_clima: string | null
          config_noticias: string | null
          created_at: string
          id: string
          instagram_handle: string | null
          last_heartbeat: string | null
          last_sync_at: string | null
          layout_config: Json | null
          nome_da_tela: string
          ordem_arquivos: string[] | null
          playback_state: string | null
          remote_command: string | null
          remote_command_at: string | null
          template: string | null
          updated_at: string
          widget_config: Json | null
        }
        Insert: {
          ad_widget_enabled?: boolean | null
          ad_widget_url?: string | null
          client_id: string
          config_clima?: string | null
          config_noticias?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          last_heartbeat?: string | null
          last_sync_at?: string | null
          layout_config?: Json | null
          nome_da_tela?: string
          ordem_arquivos?: string[] | null
          playback_state?: string | null
          remote_command?: string | null
          remote_command_at?: string | null
          template?: string | null
          updated_at?: string
          widget_config?: Json | null
        }
        Update: {
          ad_widget_enabled?: boolean | null
          ad_widget_url?: string | null
          client_id?: string
          config_clima?: string | null
          config_noticias?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          last_heartbeat?: string | null
          last_sync_at?: string | null
          layout_config?: Json | null
          nome_da_tela?: string
          ordem_arquivos?: string[] | null
          playback_state?: string | null
          remote_command?: string | null
          remote_command_at?: string | null
          template?: string | null
          updated_at?: string
          widget_config?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          config_clima: string | null
          config_noticias: string | null
          created_at: string
          id: string
          instagram_handle: string | null
          last_seen: string | null
          layout_config: Json | null
          logo_url: string | null
          nome_empresa: string
          template: string
          updated_at: string
          user_id: string
          widget_config: Json | null
        }
        Insert: {
          config_clima?: string | null
          config_noticias?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          last_seen?: string | null
          layout_config?: Json | null
          logo_url?: string | null
          nome_empresa?: string
          template?: string
          updated_at?: string
          user_id: string
          widget_config?: Json | null
        }
        Update: {
          config_clima?: string | null
          config_noticias?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          last_seen?: string | null
          layout_config?: Json | null
          logo_url?: string | null
          nome_empresa?: string
          template?: string
          updated_at?: string
          user_id?: string
          widget_config?: Json | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          client_id: string | null
          color: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          emoji: string | null
          gradient: string | null
          id: string
          is_global: boolean | null
          label: string
          preview: Json | null
          shadow_color: string | null
          tags: string[] | null
          template: string | null
          widgets: string[] | null
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          gradient?: string | null
          id?: string
          is_global?: boolean | null
          label: string
          preview?: Json | null
          shadow_color?: string | null
          tags?: string[] | null
          template?: string | null
          widgets?: string[] | null
        }
        Update: {
          client_id?: string | null
          color?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          gradient?: string | null
          id?: string
          is_global?: boolean | null
          label?: string
          preview?: Json | null
          shadow_color?: string | null
          tags?: string[] | null
          template?: string | null
          widgets?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client_user: {
        Args: {
          p_email: string
          p_name: string
          p_password: string
          p_plan?: string
          p_template?: string
        }
        Returns: Json
      }
      delete_client_user: { Args: { p_user_id: string }; Returns: Json }
      register_client_public: {
        Args: { p_email: string; p_name: string; p_password: string }
        Returns: Json
      }
      update_client_password: {
        Args: { p_new_password: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
