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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      api_cache: {
        Row: {
          error: string | null
          key: string
          meta: Json | null
          payload: Json | null
          status: string
          ttl_seconds: number
          updated_at: string
        }
        Insert: {
          error?: string | null
          key: string
          meta?: Json | null
          payload?: Json | null
          status?: string
          ttl_seconds?: number
          updated_at?: string
        }
        Update: {
          error?: string | null
          key?: string
          meta?: Json | null
          payload?: Json | null
          status?: string
          ttl_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      gdelt_day_counts: {
        Row: {
          attack: number
          conflict: number
          country: string
          day: string
          military: number
          protest: number
          unrest: number
        }
        Insert: {
          attack?: number
          conflict?: number
          country: string
          day: string
          military?: number
          protest?: number
          unrest?: number
        }
        Update: {
          attack?: number
          conflict?: number
          country?: string
          day?: string
          military?: number
          protest?: number
          unrest?: number
        }
        Relationships: []
      }
      gdelt_events: {
        Row: {
          cameo_root: string
          country: string | null
          data: Json
          id: string
          num_articles: number
          region: string | null
          severity: number
          stamp: string
          time: string
          type: string
          url: string
        }
        Insert: {
          cameo_root: string
          country?: string | null
          data: Json
          id: string
          num_articles?: number
          region?: string | null
          severity: number
          stamp: string
          time: string
          type: string
          url: string
        }
        Update: {
          cameo_root?: string
          country?: string | null
          data?: Json
          id?: string
          num_articles?: number
          region?: string | null
          severity?: number
          stamp?: string
          time?: string
          type?: string
          url?: string
        }
        Relationships: []
      }
      gdelt_files: {
        Row: {
          loaded_at: string
          n: number
          stamp: string
        }
        Insert: {
          loaded_at?: string
          n?: number
          stamp: string
        }
        Update: {
          loaded_at?: string
          n?: number
          stamp?: string
        }
        Relationships: []
      }
      hq_secrets: {
        Row: {
          name: string
          value: string
        }
        Insert: {
          name: string
          value: string
        }
        Update: {
          name?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_travel_data: {
        Row: {
          bucket_list: string[] | null
          created_at: string
          flight_history: Json
          held_visas: string[] | null
          id: string
          lived_countries: string[]
          passport_code: string | null
          trips: Json
          updated_at: string
          user_id: string
          visited_cities: string[] | null
          visited_countries: string[] | null
        }
        Insert: {
          bucket_list?: string[] | null
          created_at?: string
          flight_history?: Json
          held_visas?: string[] | null
          id?: string
          lived_countries?: string[]
          passport_code?: string | null
          trips?: Json
          updated_at?: string
          user_id: string
          visited_cities?: string[] | null
          visited_countries?: string[] | null
        }
        Update: {
          bucket_list?: string[] | null
          created_at?: string
          flight_history?: Json
          held_visas?: string[] | null
          id?: string
          lived_countries?: string[]
          passport_code?: string | null
          trips?: Json
          updated_at?: string
          user_id?: string
          visited_cities?: string[] | null
          visited_countries?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email_is_allowed: { Args: { p_email: string }; Returns: boolean }
      gdelt_country_stats: { Args: never; Returns: Json }
      gdelt_window: { Args: { _hours: number; _limit: number }; Returns: Json }
      hq_refresh: { Args: { job: string; part?: number }; Returns: number }
      is_allowed: { Args: never; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
