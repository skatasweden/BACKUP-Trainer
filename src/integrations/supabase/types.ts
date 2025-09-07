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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      auth_failed_attempts: {
        Row: {
          attempt_count: number | null
          email: string | null
          first_attempt: string | null
          ip_address: string | null
          last_attempt: string | null
        }
        Insert: {
          attempt_count?: number | null
          email?: string | null
          first_attempt?: string | null
          ip_address?: string | null
          last_attempt?: string | null
        }
        Update: {
          attempt_count?: number | null
          email?: string | null
          first_attempt?: string | null
          ip_address?: string | null
          last_attempt?: string | null
        }
        Relationships: []
      }
      auth_otp_tracking: {
        Row: {
          attempt_time: string
          email: string
          id: string
          ip_address: string
          is_successful: boolean
        }
        Insert: {
          attempt_time?: string
          email: string
          id?: string
          ip_address: string
          is_successful?: boolean
        }
        Update: {
          attempt_time?: string
          email?: string
          id?: string
          ip_address?: string
          is_successful?: boolean
        }
        Relationships: []
      }
      auth_suspicious_activity: {
        Row: {
          attempt_count: number | null
          email: string | null
          first_attempt: string | null
          ip_address: string | null
          last_attempt: string | null
        }
        Insert: {
          attempt_count?: number | null
          email?: string | null
          first_attempt?: string | null
          ip_address?: string | null
          last_attempt?: string | null
        }
        Update: {
          attempt_count?: number | null
          email?: string | null
          first_attempt?: string | null
          ip_address?: string | null
          last_attempt?: string | null
        }
        Relationships: []
      }
      block_items: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          protocol_id: string
          sort_order: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          protocol_id: string
          sort_order?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          protocol_id?: string
          sort_order?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_items_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "block_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      block_variants: {
        Row: {
          block_id: string
          created_at: string
          id: string
          name: string | null
          notes: string | null
          sort_order: number
          updated_at: string
          variant_label: string
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          sort_order?: number
          updated_at?: string
          variant_label: string
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          sort_order?: number
          updated_at?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_variants_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          coach_id: string | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          rounds: number | null
          updated_at: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          rounds?: number | null
          updated_at?: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          rounds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          coach_id: string | null
          created_at: string
          id: string
          is_archived: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      child_categories: {
        Row: {
          category_id: string
          coach_id: string | null
          created_at: string
          id: string
          is_archived: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          coach_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          coach_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category_id: string | null
          child_category_id: string | null
          coach_id: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_archived: boolean
          long_description: string | null
          short_description: string | null
          sort_order: number
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          category_id?: string | null
          child_category_id?: string | null
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          long_description?: string | null
          short_description?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          category_id?: string | null
          child_category_id?: string | null
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          long_description?: string | null
          short_description?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_child_category_id_fkey"
            columns: ["child_category_id"]
            isOneToOne: false
            referencedRelation: "child_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_log: {
        Row: {
          amount_total: number | null
          created_at: string
          currency: string | null
          event_id: string
          program_id: string | null
          stripe_session_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          event_id: string
          program_id?: string | null
          stripe_session_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          event_id?: string
          program_id?: string | null
          stripe_session_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_access: {
        Row: {
          access_type: string
          coach_id: string | null
          created_at: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          program_id: string
          source: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type: string
          coach_id?: string | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          program_id: string
          source?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: string
          coach_id?: string | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          program_id?: string
          source?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_access_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_access_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_items: {
        Row: {
          created_at: string
          id: string
          program_id: string
          show_video: boolean
          sort_order: number
          updated_at: string
          video_url: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          show_video?: boolean
          sort_order?: number
          updated_at?: string
          video_url?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          show_video?: boolean
          sort_order?: number
          updated_at?: string
          video_url?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_items_workout"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          billing_interval: string | null
          billing_interval_count: number | null
          coach_id: string | null
          cover_image_url: string | null
          created_at: string
          currency: string | null
          id: string
          is_archived: boolean
          is_purchasable: boolean | null
          long_description: string | null
          name: string
          price: number | null
          short_description: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          billing_interval?: string | null
          billing_interval_count?: number | null
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_archived?: boolean
          is_purchasable?: boolean | null
          long_description?: string | null
          name: string
          price?: number | null
          short_description?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          billing_interval?: string | null
          billing_interval_count?: number | null
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_archived?: boolean
          is_purchasable?: boolean | null
          long_description?: string | null
          name?: string
          price?: number | null
          short_description?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      protocols: {
        Row: {
          coach_id: string | null
          created_at: string
          description: string | null
          id: string
          intensity_type: string | null
          intensity_value: number | null
          name: string
          repetitions: number | null
          sets: number | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          intensity_type?: string | null
          intensity_value?: number | null
          name: string
          repetitions?: number | null
          sets?: number | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          intensity_type?: string | null
          intensity_value?: number | null
          name?: string
          repetitions?: number | null
          sets?: number | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      session_schedules: {
        Row: {
          block_id: string
          created_at: string
          id: string
          session_number: number
          updated_at: string
          variant_label: string
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          session_number: number
          updated_at?: string
          variant_label: string
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          session_number?: number
          updated_at?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_schedules_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          item_id: string | null
          item_type: string
          show_video: boolean
          sort_order: number
          updated_at: string
          video_url: string | null
          workout_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_type: string
          show_video?: boolean
          sort_order?: number
          updated_at?: string
          video_url?: string | null
          workout_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_type?: string
          show_video?: boolean
          sort_order?: number
          updated_at?: string
          video_url?: string | null
          workout_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          coach_id: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_archived: boolean
          long_description: string | null
          short_description: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          long_description?: string | null
          short_description?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          long_description?: string | null
          short_description?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      athlete_workout_access: {
        Row: {
          access_type: string | null
          coach_id: string | null
          expires_at: string | null
          user_id: string | null
          workout_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_access_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_program_items_workout"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_protocol: {
        Args: { p_protocol_id: string }
        Returns: boolean
      }
      can_access_workout: {
        Args: { p_workout_id: string }
        Returns: boolean
      }
      can_access_workout_fast: {
        Args: { workout_id_param: string }
        Returns: boolean
      }
      can_access_workout_optimized: {
        Args: { workout_id_param: string }
        Returns: boolean
      }
      check_otp_rate_limit: {
        Args: { p_email: string; p_ip_address: string }
        Returns: boolean
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_cached: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_exercise_with_context: {
        Args:
          | {
              exercise_id_param?: string
              plan_item_id_param: string
              program_id_param?: string
              protocol_id_param?: string
            }
          | {
              exercise_id_param?: string
              plan_item_id_param: string
              protocol_id_param?: string
            }
        Returns: Json
      }
      get_upcoming_workouts_fast: {
        Args: { user_id_param: string }
        Returns: {
          cover_image_url: string
          id: string
          long_description: string
          program_cover_image_url: string
          program_id: string
          program_name: string
          short_description: string
          sort_order: number
          title: string
          video_url: string
        }[]
      }
      get_user_accessible_programs: {
        Args: Record<PropertyKey, never>
        Returns: {
          program_id: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_workout_with_details: {
        Args:
          | {
              program_id_param?: string
              sort_order_param?: number
              user_id_param?: string
              workout_id_param: string
            }
          | {
              program_id_param?: string
              user_id_param?: string
              workout_id_param: string
            }
          | { user_id_param?: string; workout_id_param: string }
        Returns: Json
      }
      has_program_access: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      is_athlete: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_coach: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_coach_cached: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_otp_success: {
        Args: { p_email: string }
        Returns: undefined
      }
      owns_program: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      refresh_athlete_workout_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_auth_monitoring: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      metric_type: "REPS" | "TIME" | "DISTANCE"
      protocol_type:
        | "strength"
        | "cardio"
        | "interval"
        | "time_based"
        | "amrap"
        | "emom"
      rest_mode: "ACTIVE" | "PASSIVE"
      user_role: "coach" | "athlete"
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
      metric_type: ["REPS", "TIME", "DISTANCE"],
      protocol_type: [
        "strength",
        "cardio",
        "interval",
        "time_based",
        "amrap",
        "emom",
      ],
      rest_mode: ["ACTIVE", "PASSIVE"],
      user_role: ["coach", "athlete"],
    },
  },
} as const
