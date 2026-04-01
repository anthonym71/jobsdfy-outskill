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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      application_assets: {
        Row: {
          approved: boolean | null
          asset_type: string
          content: string | null
          created_at: string
          id: string
          job_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          asset_type: string
          content?: string | null
          created_at?: string
          id?: string
          job_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          asset_type?: string
          content?: string | null
          created_at?: string
          id?: string
          job_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_blockers: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          job_id: string
          job_value: string | null
          label: string
          severity: Database["public"]["Enums"]["blocker_severity"]
          user_id: string
          user_value: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          job_id: string
          job_value?: string | null
          label: string
          severity?: Database["public"]["Enums"]["blocker_severity"]
          user_id: string
          user_value?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string
          job_value?: string | null
          label?: string
          severity?: Database["public"]["Enums"]["blocker_severity"]
          user_id?: string
          user_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_blockers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          created_at: string
          fit_confidence: number | null
          fit_score: number
          gaps: string[] | null
          id: string
          job_id: string
          location_summary: string | null
          recommendation: string | null
          salary_summary: string | null
          strengths: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fit_confidence?: number | null
          fit_score?: number
          gaps?: string[] | null
          id?: string
          job_id: string
          location_summary?: string | null
          recommendation?: string | null
          salary_summary?: string | null
          strengths?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          fit_confidence?: number | null
          fit_score?: number
          gaps?: string[] | null
          id?: string
          job_id?: string
          location_summary?: string | null
          recommendation?: string | null
          salary_summary?: string | null
          strengths?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_url: string | null
          company: string | null
          created_at: string
          description: string | null
          employment_type: string | null
          fit_confidence: number | null
          fit_score: number | null
          id: string
          language_requirements: string | null
          location: string | null
          recruiter_name: string | null
          requirements_summary: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          source_input: string | null
          source_type: Database["public"]["Enums"]["job_source_type"] | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          user_id: string
          verdict: Database["public"]["Enums"]["job_verdict"] | null
          visa_policy: string | null
          work_model: string | null
        }
        Insert: {
          application_url?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          fit_confidence?: number | null
          fit_score?: number | null
          id?: string
          language_requirements?: string | null
          location?: string | null
          recruiter_name?: string | null
          requirements_summary?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source_input?: string | null
          source_type?: Database["public"]["Enums"]["job_source_type"] | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          user_id: string
          verdict?: Database["public"]["Enums"]["job_verdict"] | null
          visa_policy?: string | null
          work_model?: string | null
        }
        Update: {
          application_url?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          fit_confidence?: number | null
          fit_score?: number | null
          id?: string
          language_requirements?: string | null
          location?: string | null
          recruiter_name?: string | null
          requirements_summary?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source_input?: string | null
          source_type?: Database["public"]["Enums"]["job_source_type"] | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["job_verdict"] | null
          visa_policy?: string | null
          work_model?: string | null
        }
        Relationships: []
      }
      user_non_negotiables: {
        Row: {
          allowed_countries: string[] | null
          created_at: string
          employment_type_preferences: string[] | null
          id: string
          industry_exclusions: string[] | null
          max_travel_percent: number | null
          min_salary: number | null
          remote_preference: string | null
          requires_visa_sponsorship: boolean | null
          salary_currency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_countries?: string[] | null
          created_at?: string
          employment_type_preferences?: string[] | null
          id?: string
          industry_exclusions?: string[] | null
          max_travel_percent?: number | null
          min_salary?: number | null
          remote_preference?: string | null
          requires_visa_sponsorship?: boolean | null
          salary_currency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_countries?: string[] | null
          created_at?: string
          employment_type_preferences?: string[] | null
          id?: string
          industry_exclusions?: string[] | null
          max_travel_percent?: number | null
          min_salary?: number | null
          remote_preference?: string | null
          requires_visa_sponsorship?: boolean | null
          salary_currency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          full_name: string
          headline: string | null
          id: string
          industries: string[] | null
          languages_spoken: string[] | null
          location: string | null
          summary: string | null
          top_skills: string[] | null
          updated_at: string
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          headline?: string | null
          id?: string
          industries?: string[] | null
          languages_spoken?: string[] | null
          location?: string | null
          summary?: string | null
          top_skills?: string[] | null
          updated_at?: string
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string
          full_name?: string
          headline?: string | null
          id?: string
          industries?: string[] | null
          languages_spoken?: string[] | null
          location?: string | null
          summary?: string | null
          top_skills?: string[] | null
          updated_at?: string
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      blocker_severity: "confirmed" | "likely" | "unclear"
      job_source_type: "url" | "text" | "screenshot" | "voice"
      job_status:
        | "new"
        | "blocked"
        | "reviewing"
        | "saved"
        | "applied"
        | "archived"
      job_verdict: "go" | "review" | "stop"
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
      blocker_severity: ["confirmed", "likely", "unclear"],
      job_source_type: ["url", "text", "screenshot", "voice"],
      job_status: [
        "new",
        "blocked",
        "reviewing",
        "saved",
        "applied",
        "archived",
      ],
      job_verdict: ["go", "review", "stop"],
    },
  },
} as const
