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
      chair_sessions: {
        Row: {
          active: boolean | null
          committee_id: string
          conference_id: string
          created_at: string | null
          device_id: string
          display_name: string | null
          id: string
        }
        Insert: {
          active?: boolean | null
          committee_id: string
          conference_id: string
          created_at?: string | null
          device_id: string
          display_name?: string | null
          id?: string
        }
        Update: {
          active?: boolean | null
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          device_id?: string
          display_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chair_sessions_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chair_sessions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          chair_code: string | null
          conference_id: string
          created_at: string | null
          id: string
          name: string
          topic: string | null
        }
        Insert: {
          chair_code?: string | null
          conference_id: string
          created_at?: string | null
          id?: string
          name: string
          topic?: string | null
        }
        Update: {
          chair_code?: string | null
          conference_id?: string
          created_at?: string | null
          id?: string
          name?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committees_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_days: {
        Row: {
          conference_id: string
          day_date: string
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          conference_id: string
          day_date: string
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          conference_id?: string
          day_date?: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_days_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      conferences: {
        Row: {
          banner_url: string | null
          created_at: string | null
          email: string | null
          end_date: string
          id: string
          location: string | null
          logo_url: string | null
          name: string
          payment_amount: string | null
          payment_details: string | null
          payment_link: string | null
          public_code: string
          secgen_code: string
          secgen_user_id: string | null
          secretariat_code: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          email?: string | null
          end_date: string
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          payment_amount?: string | null
          payment_details?: string | null
          payment_link?: string | null
          public_code: string
          secgen_code: string
          secgen_user_id?: string | null
          secretariat_code: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          email?: string | null
          end_date?: string
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          payment_amount?: string | null
          payment_details?: string | null
          payment_link?: string | null
          public_code?: string
          secgen_code?: string
          secgen_user_id?: string | null
          secretariat_code?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      delegates: {
        Row: {
          active: boolean | null
          committee_id: string
          conference_id: string
          country: string
          created_at: string | null
          device_id: string | null
          expires_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          committee_id: string
          conference_id: string
          country: string
          created_at?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          committee_id?: string
          conference_id?: string
          country?: string
          created_at?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegates_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegates_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_sessions: {
        Row: {
          conference_id: string
          day_date: string
          end_time: string
          id: string
          name: string
          sort_order: number | null
          start_time: string
        }
        Insert: {
          conference_id: string
          day_date: string
          end_time: string
          id?: string
          name: string
          sort_order?: number | null
          start_time: string
        }
        Update: {
          conference_id?: string
          day_date?: string
          end_time?: string
          id?: string
          name?: string
          sort_order?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_sessions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          approved: boolean | null
          conference_id: string
          created_at: string | null
          display_name: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          role_title: string | null
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          conference_id: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          role_title?: string | null
          user_id: string
        }
        Update: {
          approved?: boolean | null
          conference_id?: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          role_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_code: { Args: { length?: number }; Returns: string }
      has_role: {
        Args: {
          _conference_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "secgen" | "secretariat" | "chair" | "delegate"
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
    Enums: {
      app_role: ["secgen", "secretariat", "chair", "delegate"],
    },
  },
} as const
