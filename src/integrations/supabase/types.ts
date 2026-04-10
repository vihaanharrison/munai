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
      chat_messages: {
        Row: {
          channel: string | null
          conference_id: string
          content: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          sender_name: string
          sender_user_id: string | null
        }
        Insert: {
          channel?: string | null
          conference_id: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          sender_name: string
          sender_user_id?: string | null
        }
        Update: {
          channel?: string | null
          conference_id?: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          sender_name?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_agendas: {
        Row: {
          ai_summary: string | null
          committee_id: string
          conference_id: string
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_crisis_trigger: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          ai_summary?: string | null
          committee_id: string
          conference_id: string
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_crisis_trigger?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          ai_summary?: string | null
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_crisis_trigger?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_agendas_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_agendas_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_files: {
        Row: {
          committee_id: string
          conference_id: string
          created_at: string | null
          file_name: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          committee_id: string
          conference_id: string
          created_at?: string | null
          file_name: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_files_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_files_conference_id_fkey"
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
          crisis_enabled: boolean | null
          delegations: string | null
          id: string
          name: string
          topic: string | null
        }
        Insert: {
          chair_code?: string | null
          conference_id: string
          created_at?: string | null
          crisis_enabled?: boolean | null
          delegations?: string | null
          id?: string
          name: string
          topic?: string | null
        }
        Update: {
          chair_code?: string | null
          conference_id?: string
          created_at?: string | null
          crisis_enabled?: boolean | null
          delegations?: string | null
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
      conference_updates: {
        Row: {
          author_name: string
          author_role: string
          body: string
          committee_id: string | null
          conference_id: string
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          image_url: string | null
          title: string | null
        }
        Insert: {
          author_name: string
          author_role: string
          body: string
          committee_id?: string | null
          conference_id: string
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          title?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string
          body?: string
          committee_id?: string | null
          conference_id?: string
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conference_updates_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_updates_conference_id_fkey"
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
      delegate_blocs: {
        Row: {
          bloc_name: string
          committee_id: string
          conference_id: string
          created_at: string | null
          delegate_id: string
          id: string
        }
        Insert: {
          bloc_name: string
          committee_id: string
          conference_id: string
          created_at?: string | null
          delegate_id: string
          id?: string
        }
        Update: {
          bloc_name?: string
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          delegate_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegate_blocs_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegate_blocs_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegate_blocs_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
        ]
      }
      delegate_documents: {
        Row: {
          ai_check_result: Json | null
          committee_id: string
          conference_id: string
          content: string | null
          created_at: string | null
          delegate_id: string
          doc_type: string
          file_url: string | null
          id: string
          status: string | null
        }
        Insert: {
          ai_check_result?: Json | null
          committee_id: string
          conference_id: string
          content?: string | null
          created_at?: string | null
          delegate_id: string
          doc_type: string
          file_url?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          ai_check_result?: Json | null
          committee_id?: string
          conference_id?: string
          content?: string | null
          created_at?: string | null
          delegate_id?: string
          doc_type?: string
          file_url?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegate_documents_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegate_documents_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegate_documents_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
        ]
      }
      delegates: {
        Row: {
          active: boolean | null
          approved: boolean | null
          committee_id: string
          conference_id: string
          country: string
          created_at: string | null
          device_id: string | null
          expires_at: string | null
          id: string
          marks: Json | null
          name: string
        }
        Insert: {
          active?: boolean | null
          approved?: boolean | null
          committee_id: string
          conference_id: string
          country: string
          created_at?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          marks?: Json | null
          name: string
        }
        Update: {
          active?: boolean | null
          approved?: boolean | null
          committee_id?: string
          conference_id?: string
          country?: string
          created_at?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          marks?: Json | null
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
      pois: {
        Row: {
          committee_id: string
          conference_id: string
          content: string
          created_at: string | null
          from_delegate_id: string
          id: string
          to_delegate_id: string
        }
        Insert: {
          committee_id: string
          conference_id: string
          content: string
          created_at?: string | null
          from_delegate_id: string
          id?: string
          to_delegate_id: string
        }
        Update: {
          committee_id?: string
          conference_id?: string
          content?: string
          created_at?: string | null
          from_delegate_id?: string
          id?: string
          to_delegate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pois_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_from_delegate_id_fkey"
            columns: ["from_delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_to_delegate_id_fkey"
            columns: ["to_delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
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
      secretariat_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          conference_id: string
          created_at: string | null
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          conference_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          conference_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretariat_tasks_conference_id_fkey"
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
