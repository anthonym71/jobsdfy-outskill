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
      affiliate_conversions: {
        Row: {
          affiliate_id: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          id: string
          purchase_amount: number | null
          referred_user_id: string
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          purchase_amount?: number | null
          referred_user_id: string
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          purchase_amount?: number | null
          referred_user_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_partners: {
        Row: {
          created_at: string | null
          id: string
          paying_signups: number | null
          payout_details: string | null
          payout_method: string | null
          referral_code: string
          slug: string | null
          total_earned: number | null
          total_signups: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          paying_signups?: number | null
          payout_details?: string | null
          payout_method?: string | null
          referral_code: string
          slug?: string | null
          total_earned?: number | null
          total_signups?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          paying_signups?: number | null
          payout_details?: string | null
          payout_method?: string | null
          referral_code?: string
          slug?: string | null
          total_earned?: number | null
          total_signups?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      application_assets: {
        Row: {
          approved: boolean | null
          asset_type: string
          content: string | null
          created_at: string
          id: string
          is_draft: boolean
          job_id: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          approved?: boolean | null
          asset_type: string
          content?: string | null
          created_at?: string
          id?: string
          is_draft?: boolean
          job_id: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          approved?: boolean | null
          asset_type?: string
          content?: string | null
          created_at?: string
          id?: string
          is_draft?: boolean
          job_id?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          version?: number
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          created_at: string
          date_issued: string | null
          file_url: string | null
          id: string
          issuer: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_issued?: string | null
          file_url?: string | null
          id?: string
          issuer?: string | null
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_issued?: string | null
          file_url?: string | null
          id?: string
          issuer?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          achievement_level: string | null
          category: string | null
          certificate_url: string | null
          completed_at: string | null
          created_at: string
          grade: string | null
          id: string
          is_recommended: boolean
          notes: string | null
          provider: string | null
          recommended_by: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_level?: string | null
          category?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          is_recommended?: boolean
          notes?: string | null
          provider?: string | null
          recommended_by?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_level?: string | null
          category?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          is_recommended?: boolean
          notes?: string | null
          provider?: string | null
          recommended_by?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action: Database["public"]["Enums"]["credit_action"]
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["credit_action"]
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["credit_action"]
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_versions: {
        Row: {
          ats_keywords: Json | null
          content: Json
          created_at: string
          id: string
          job_id: string | null
          user_id: string
          version_name: string
        }
        Insert: {
          ats_keywords?: Json | null
          content?: Json
          created_at?: string
          id?: string
          job_id?: string | null
          user_id: string
          version_name?: string
        }
        Update: {
          ats_keywords?: Json | null
          content?: Json
          created_at?: string
          id?: string
          job_id?: string | null
          user_id?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_versions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_year: number | null
          field: string | null
          id: string
          institution: string
          start_year: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field?: string | null
          id?: string
          institution?: string
          start_year?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field?: string | null
          id?: string
          institution?: string
          start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      generated_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          credit_cost: number
          id: string
          job_id: string | null
          output_json: Json | null
          user_id: string
          version_label: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string
          credit_cost?: number
          id?: string
          job_id?: string | null
          output_json?: Json | null
          user_id: string
          version_label?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string
          credit_cost?: number
          id?: string
          job_id?: string | null
          output_json?: Json | null
          user_id?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          answers: Json | null
          created_at: string
          feedback: Json | null
          id: string
          job_id: string | null
          questions: Json | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          feedback?: Json | null
          id?: string
          job_id?: string | null
          questions?: Json | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          feedback?: Json | null
          id?: string
          job_id?: string | null
          questions?: Json | null
          user_id?: string
        }
        Relationships: []
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
      knowledgebase_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_relevant: boolean
          source_name: string | null
          source_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_relevant?: boolean
          source_name?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_relevant?: boolean
          source_name?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_dump: {
        Row: {
          content: string | null
          created_at: string
          entry_type: string
          id: string
          image_url: string | null
          source: string | null
          tags: string[] | null
          title: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          image_url?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          image_url?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      movies: {
        Row: {
          comments: string | null
          created_at: string
          genre: string | null
          id: string
          rating: number | null
          takeaway: string | null
          title: string
          updated_at: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          rating?: number | null
          takeaway?: string | null
          title?: string
          updated_at?: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          rating?: number | null
          takeaway?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string | null
          id: string
          ip_hash: string | null
          page: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          page?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          page?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      phone_change_requests: {
        Row: {
          created_at: string
          current_phone: string | null
          id: string
          new_phone: string
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_phone?: string | null
          id?: string
          new_phone: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_phone?: string | null
          id?: string
          new_phone?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      recommended_training: {
        Row: {
          category: string | null
          created_at: string
          id: string
          provider: string | null
          reason: string | null
          recommended_by: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          provider?: string | null
          reason?: string | null
          recommended_by?: string | null
          title?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          provider?: string | null
          reason?: string | null
          recommended_by?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recruiter_job_posts: {
        Row: {
          application_email: string | null
          application_url: string | null
          benefits: string[] | null
          city: string
          company: string
          country: string
          created_at: string
          description: string
          employee_provides: string | null
          employer_provides: string | null
          employment_type: string
          id: string
          is_active: boolean
          job_category: string
          job_level: string
          job_subcategory: string
          language_other: string | null
          language_primary: string | null
          language_secondary: string | null
          phone_extension: string | null
          phone_type: string | null
          qualifications: string | null
          recruiter_email: string | null
          recruiter_name: string | null
          recruiter_phone: string | null
          relocation_offered: boolean | null
          requirements: string
          salary_basic: number | null
          salary_currency: string
          salary_ote: number | null
          show_email: boolean
          show_phone: boolean
          special_requirements: string | null
          title: string
          travel_percent: number | null
          travel_required: boolean
          updated_at: string
          user_id: string
          work_model: string
        }
        Insert: {
          application_email?: string | null
          application_url?: string | null
          benefits?: string[] | null
          city?: string
          company?: string
          country?: string
          created_at?: string
          description?: string
          employee_provides?: string | null
          employer_provides?: string | null
          employment_type?: string
          id?: string
          is_active?: boolean
          job_category?: string
          job_level?: string
          job_subcategory?: string
          language_other?: string | null
          language_primary?: string | null
          language_secondary?: string | null
          phone_extension?: string | null
          phone_type?: string | null
          qualifications?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          relocation_offered?: boolean | null
          requirements?: string
          salary_basic?: number | null
          salary_currency?: string
          salary_ote?: number | null
          show_email?: boolean
          show_phone?: boolean
          special_requirements?: string | null
          title?: string
          travel_percent?: number | null
          travel_required?: boolean
          updated_at?: string
          user_id: string
          work_model?: string
        }
        Update: {
          application_email?: string | null
          application_url?: string | null
          benefits?: string[] | null
          city?: string
          company?: string
          country?: string
          created_at?: string
          description?: string
          employee_provides?: string | null
          employer_provides?: string | null
          employment_type?: string
          id?: string
          is_active?: boolean
          job_category?: string
          job_level?: string
          job_subcategory?: string
          language_other?: string | null
          language_primary?: string | null
          language_secondary?: string | null
          phone_extension?: string | null
          phone_type?: string | null
          qualifications?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          recruiter_phone?: string | null
          relocation_offered?: boolean | null
          requirements?: string
          salary_basic?: number | null
          salary_currency?: string
          salary_ote?: number | null
          show_email?: boolean
          show_phone?: boolean
          special_requirements?: string | null
          title?: string
          travel_percent?: number | null
          travel_required?: boolean
          updated_at?: string
          user_id?: string
          work_model?: string
        }
        Relationships: []
      }
      references: {
        Row: {
          consent_given: boolean
          created_at: string
          document_url: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          testimonial_text: string | null
          user_id: string
          video_url: string | null
          work_history_id: string | null
        }
        Insert: {
          consent_given?: boolean
          created_at?: string
          document_url?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          testimonial_text?: string | null
          user_id: string
          video_url?: string | null
          work_history_id?: string | null
        }
        Update: {
          consent_given?: boolean
          created_at?: string
          document_url?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          testimonial_text?: string | null
          user_id?: string
          video_url?: string | null
          work_history_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "references_work_history_id_fkey"
            columns: ["work_history_id"]
            isOneToOne: false
            referencedRelation: "work_history"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          credits_earned: number
          id: string
          slug: string | null
          user_id: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          credits_earned?: number
          id?: string
          slug?: string | null
          user_id: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          credits_earned?: number
          id?: string
          slug?: string | null
          user_id?: string
          uses?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          credits_awarded: number
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          created_at: string
          followers: number | null
          friends: number | null
          id: string
          platform: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          followers?: number | null
          friends?: number | null
          id?: string
          platform?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          followers?: number | null
          friends?: number | null
          id?: string
          platform?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string | null
          created_at: string
          due_date: string | null
          follow_up_done: boolean | null
          follow_up_task: string | null
          id: string
          image_urls: string[] | null
          platforms: Json | null
          post_type: string
          posted_at: string | null
          to_be_posted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          due_date?: string | null
          follow_up_done?: boolean | null
          follow_up_task?: string | null
          id?: string
          image_urls?: string[] | null
          platforms?: Json | null
          post_type?: string
          posted_at?: string | null
          to_be_posted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          due_date?: string | null
          follow_up_done?: boolean | null
          follow_up_task?: string | null
          id?: string
          image_urls?: string[] | null
          platforms?: Json | null
          post_type?: string
          posted_at?: string | null
          to_be_posted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          source_id: string | null
          source_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          completed_at: string
          created_at: string
          details: Json | null
          id: string
          score: number | null
          test_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          details?: Json | null
          id?: string
          score?: number | null
          test_type?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          details?: Json | null
          id?: string
          score?: number | null
          test_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_key: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_key: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          first_job_used: boolean | null
          id: string
          last_active_date: string | null
          level: number
          lifetime_earned: number
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          balance?: number
          created_at?: string
          first_job_used?: boolean | null
          id?: string
          last_active_date?: string | null
          level?: number
          lifetime_earned?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          balance?: number
          created_at?: string
          first_job_used?: boolean | null
          id?: string
          last_active_date?: string | null
          level?: number
          lifetime_earned?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
          email: string | null
          full_name: string
          headline: string | null
          hobbies: string[] | null
          id: string
          industries: string[] | null
          interests: string[] | null
          languages_spoken: string[] | null
          location: string | null
          phone_number: string | null
          phone_verified: boolean | null
          photo_url: string | null
          referral_link: string | null
          sports: string[] | null
          status: string
          status_reason: string | null
          status_updated_at: string | null
          summary: string | null
          top_skills: string[] | null
          updated_at: string
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          headline?: string | null
          hobbies?: string[] | null
          id?: string
          industries?: string[] | null
          interests?: string[] | null
          languages_spoken?: string[] | null
          location?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          photo_url?: string | null
          referral_link?: string | null
          sports?: string[] | null
          status?: string
          status_reason?: string | null
          status_updated_at?: string | null
          summary?: string | null
          top_skills?: string[] | null
          updated_at?: string
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          headline?: string | null
          hobbies?: string[] | null
          id?: string
          industries?: string[] | null
          interests?: string[] | null
          languages_spoken?: string[] | null
          location?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          photo_url?: string | null
          referral_link?: string | null
          sports?: string[] | null
          status?: string
          status_reason?: string | null
          status_updated_at?: string | null
          summary?: string | null
          top_skills?: string[] | null
          updated_at?: string
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tags: {
        Row: {
          created_at: string
          id: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          user_id?: string
        }
        Relationships: []
      }
      work_history: {
        Row: {
          achievements: string | null
          awards: string | null
          company: string
          created_at: string
          description: string | null
          employment_type: string
          end_month: number | null
          end_year: number | null
          id: string
          is_concurrent: boolean
          is_current: boolean
          location: string | null
          location_type: string | null
          performance: string | null
          skills: string[] | null
          sort_order: number
          start_month: number | null
          start_year: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string | null
          awards?: string | null
          company?: string
          created_at?: string
          description?: string | null
          employment_type?: string
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_concurrent?: boolean
          is_current?: boolean
          location?: string | null
          location_type?: string | null
          performance?: string | null
          skills?: string[] | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string | null
          awards?: string | null
          company?: string
          created_at?: string
          description?: string | null
          employment_type?: string
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_concurrent?: boolean
          is_current?: boolean
          location?: string | null
          location_type?: string | null
          performance?: string | null
          skills?: string[] | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_history_media: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          sort_order: number
          user_id: string
          work_history_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          sort_order?: number
          user_id: string
          work_history_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          sort_order?: number
          user_id?: string
          work_history_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_history_media_work_history_id_fkey"
            columns: ["work_history_id"]
            isOneToOne: false
            referencedRelation: "work_history"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recruiter_job_posts_public: {
        Row: {
          application_email: string | null
          application_url: string | null
          benefits: string[] | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          description: string | null
          employee_provides: string | null
          employer_provides: string | null
          employment_type: string | null
          id: string | null
          is_active: boolean | null
          job_category: string | null
          job_level: string | null
          job_subcategory: string | null
          language_other: string | null
          language_primary: string | null
          language_secondary: string | null
          phone_extension: string | null
          phone_type: string | null
          qualifications: string | null
          recruiter_email: string | null
          recruiter_name: string | null
          recruiter_phone: string | null
          relocation_offered: boolean | null
          requirements: string | null
          salary_basic: number | null
          salary_currency: string | null
          salary_ote: number | null
          show_email: boolean | null
          show_phone: boolean | null
          special_requirements: string | null
          title: string | null
          travel_percent: number | null
          travel_required: boolean | null
          updated_at: string | null
          user_id: string | null
          work_model: string | null
        }
        Insert: {
          application_email?: string | null
          application_url?: string | null
          benefits?: string[] | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          employee_provides?: string | null
          employer_provides?: string | null
          employment_type?: string | null
          id?: string | null
          is_active?: boolean | null
          job_category?: string | null
          job_level?: string | null
          job_subcategory?: string | null
          language_other?: string | null
          language_primary?: string | null
          language_secondary?: string | null
          phone_extension?: never
          phone_type?: never
          qualifications?: string | null
          recruiter_email?: never
          recruiter_name?: never
          recruiter_phone?: never
          relocation_offered?: boolean | null
          requirements?: string | null
          salary_basic?: number | null
          salary_currency?: string | null
          salary_ote?: number | null
          show_email?: boolean | null
          show_phone?: boolean | null
          special_requirements?: string | null
          title?: string | null
          travel_percent?: number | null
          travel_required?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          work_model?: string | null
        }
        Update: {
          application_email?: string | null
          application_url?: string | null
          benefits?: string[] | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          employee_provides?: string | null
          employer_provides?: string | null
          employment_type?: string | null
          id?: string | null
          is_active?: boolean | null
          job_category?: string | null
          job_level?: string | null
          job_subcategory?: string | null
          language_other?: string | null
          language_primary?: string | null
          language_secondary?: string | null
          phone_extension?: never
          phone_type?: never
          qualifications?: string | null
          recruiter_email?: never
          recruiter_name?: never
          recruiter_phone?: never
          relocation_offered?: boolean | null
          requirements?: string | null
          salary_basic?: number | null
          salary_currency?: string | null
          salary_ote?: number | null
          show_email?: boolean | null
          show_phone?: boolean | null
          special_requirements?: string | null
          title?: string | null
          travel_percent?: number | null
          travel_required?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          work_model?: string | null
        }
        Relationships: []
      }
      support_tickets_user_view: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      earn_credits: {
        Args: {
          _credits: number
          _reason: string
          _user_id: string
          _xp: number
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_user_credits: {
        Args: { _user_id: string }
        Returns: undefined
      }
      spend_credits: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: boolean
      }
      validate_referral_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      blocker_severity: "confirmed" | "likely" | "unclear"
      credit_action:
        | "earned"
        | "spent"
        | "expired"
        | "purchased"
        | "referral_bonus"
      job_source_type: "url" | "text" | "screenshot" | "voice"
      job_status:
        | "new"
        | "blocked"
        | "reviewing"
        | "saved"
        | "applied"
        | "archived"
        | "listed"
        | "in_progress"
        | "interview"
        | "closed"
        | "pending_decision"
        | "lost"
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
      app_role: ["admin", "moderator", "user"],
      blocker_severity: ["confirmed", "likely", "unclear"],
      credit_action: [
        "earned",
        "spent",
        "expired",
        "purchased",
        "referral_bonus",
      ],
      job_source_type: ["url", "text", "screenshot", "voice"],
      job_status: [
        "new",
        "blocked",
        "reviewing",
        "saved",
        "applied",
        "archived",
        "listed",
        "in_progress",
        "interview",
        "closed",
        "pending_decision",
        "lost",
      ],
      job_verdict: ["go", "review", "stop"],
    },
  },
} as const
