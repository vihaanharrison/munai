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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_type: string
          committee_id: string | null
          conference_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type: string
          committee_id?: string | null
          conference_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string
          committee_id?: string | null
          conference_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      blocs: {
        Row: {
          committee_id: string
          conference_id: string
          created_at: string | null
          discussion_status: string | null
          file_name: string | null
          file_url: string | null
          id: string
          name: string
        }
        Insert: {
          committee_id: string
          conference_id: string
          created_at?: string | null
          discussion_status?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
        }
        Update: {
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          discussion_status?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocs_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocs_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocs_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "chair_sessions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "chat_messages_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "committee_agendas_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "committee_files_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          scoring_columns: Json | null
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
          scoring_columns?: Json | null
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
          scoring_columns?: Json | null
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
          {
            foreignKeyName: "committees_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_custom_questions: {
        Row: {
          conference_id: string
          created_at: string | null
          id: string
          question_text: string
          sort_order: number | null
        }
        Insert: {
          conference_id: string
          created_at?: string | null
          id?: string
          question_text: string
          sort_order?: number | null
        }
        Update: {
          conference_id?: string
          created_at?: string | null
          id?: string
          question_text?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conference_custom_questions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_custom_questions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "conference_days_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "conference_updates_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          published: boolean | null
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
          published?: boolean | null
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
          published?: boolean | null
          secgen_code?: string
          secgen_user_id?: string | null
          secretariat_code?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crisis_triggers: {
        Row: {
          ai_summary: string | null
          committee_id: string
          conference_id: string
          content: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
        }
        Insert: {
          ai_summary?: string | null
          committee_id: string
          conference_id: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
        }
        Update: {
          ai_summary?: string | null
          committee_id?: string
          conference_id?: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crisis_triggers_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crisis_triggers_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crisis_triggers_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delegate_blocs: {
        Row: {
          bloc_id: string | null
          bloc_name: string
          committee_id: string
          conference_id: string
          created_at: string | null
          delegate_id: string
          id: string
          is_leader: boolean | null
        }
        Insert: {
          bloc_id?: string | null
          bloc_name: string
          committee_id: string
          conference_id: string
          created_at?: string | null
          delegate_id: string
          id?: string
          is_leader?: boolean | null
        }
        Update: {
          bloc_id?: string | null
          bloc_name?: string
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          delegate_id?: string
          id?: string
          is_leader?: boolean | null
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
            foreignKeyName: "delegate_blocs_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
            foreignKeyName: "delegate_documents_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "delegates_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          conference_id: string
          created_at: string | null
          custom_responses: Json | null
          email: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          conference_id: string
          created_at?: string | null
          custom_responses?: Json | null
          email: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          conference_id?: string
          created_at?: string | null
          custom_responses?: Json | null
          email?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_caucus: {
        Row: {
          active: boolean | null
          committee_id: string
          conference_id: string
          created_at: string | null
          id: string
          topic: string
        }
        Insert: {
          active?: boolean | null
          committee_id: string
          conference_id: string
          created_at?: string | null
          id?: string
          topic: string
        }
        Update: {
          active?: boolean | null
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_caucus_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_caucus_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_caucus_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_notes: {
        Row: {
          committee_id: string | null
          conference_id: string | null
          content: string | null
          created_at: string | null
          id: string
          owner_id: string
          owner_type: string
          updated_at: string | null
        }
        Insert: {
          committee_id?: string | null
          conference_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          owner_id: string
          owner_type: string
          updated_at?: string | null
        }
        Update: {
          committee_id?: string | null
          conference_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string
          owner_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pois: {
        Row: {
          committee_id: string
          conference_id: string
          content: string
          created_at: string | null
          from_delegate_id: string
          id: string
          marked: boolean | null
          status: string | null
          to_delegate_id: string
        }
        Insert: {
          committee_id: string
          conference_id: string
          content: string
          created_at?: string | null
          from_delegate_id: string
          id?: string
          marked?: boolean | null
          status?: string | null
          to_delegate_id: string
        }
        Update: {
          committee_id?: string
          conference_id?: string
          content?: string
          created_at?: string | null
          from_delegate_id?: string
          id?: string
          marked?: boolean | null
          status?: string | null
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
            foreignKeyName: "pois_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "schedule_sessions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
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
          {
            foreignKeyName: "secretariat_tasks_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers_list: {
        Row: {
          ai_score: number | null
          chair_feedback: string | null
          committee_id: string
          conference_id: string
          created_at: string | null
          delegate_id: string
          duration_seconds: number | null
          id: string
          list_type: string
          position: number
          speech_text: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          ai_score?: number | null
          chair_feedback?: string | null
          committee_id: string
          conference_id: string
          created_at?: string | null
          delegate_id: string
          duration_seconds?: number | null
          id?: string
          list_type?: string
          position?: number
          speech_text?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          ai_score?: number | null
          chair_feedback?: string | null
          committee_id?: string
          conference_id?: string
          created_at?: string | null
          delegate_id?: string
          duration_seconds?: number | null
          id?: string
          list_type?: string
          position?: number
          speech_text?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "speakers_list_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_list_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_list_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_list_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
        ]
      }
      standalone_committees: {
        Row: {
          chair_code: string
          committee_code: string
          created_at: string | null
          created_by_device_id: string | null
          crisis_enabled: boolean | null
          delegations: string | null
          id: string
          name: string
          scoring_columns: Json | null
          topic: string | null
        }
        Insert: {
          chair_code: string
          committee_code: string
          created_at?: string | null
          created_by_device_id?: string | null
          crisis_enabled?: boolean | null
          delegations?: string | null
          id?: string
          name: string
          scoring_columns?: Json | null
          topic?: string | null
        }
        Update: {
          chair_code?: string
          committee_code?: string
          created_at?: string | null
          created_by_device_id?: string | null
          crisis_enabled?: boolean | null
          delegations?: string | null
          id?: string
          name?: string
          scoring_columns?: Json | null
          topic?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "user_roles_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conferences_public: {
        Row: {
          banner_url: string | null
          created_at: string | null
          email: string | null
          end_date: string | null
          id: string | null
          location: string | null
          logo_url: string | null
          name: string | null
          payment_amount: string | null
          payment_details: string | null
          payment_link: string | null
          public_code: string | null
          published: boolean | null
          secgen_user_id: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          email?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string | null
          payment_amount?: string | null
          payment_details?: string | null
          payment_link?: string | null
          public_code?: string | null
          published?: boolean | null
          secgen_user_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          email?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string | null
          payment_amount?: string | null
          payment_details?: string | null
          payment_link?: string | null
          public_code?: string | null
          published?: boolean | null
          secgen_user_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_code: { Args: { length?: number }; Returns: string }
      get_committee_chair_code: { Args: { comm_id: string }; Returns: string }
      get_conference_codes: { Args: { conf_id: string }; Returns: Json }
      has_role: {
        Args: {
          _conference_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action?: string
          p_actor_id?: string
          p_actor_name?: string
          p_actor_type?: string
          p_committee_id?: string
          p_conference_id?: string
          p_details?: Json
          p_target_id?: string
          p_target_table?: string
        }
        Returns: undefined
      }
      lookup_code: { Args: { input_code: string }; Returns: Json }
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
