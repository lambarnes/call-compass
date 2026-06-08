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
      after_call_outputs: {
        Row: {
          call_id: string
          client_provided_information: string | null
          client_situation: string | null
          created_at: string
          decisions_made: string | null
          diagnosed_root_issue: string | null
          exclusions: string | null
          follow_up_email_draft: string | null
          id: string
          key_risks_constraints: string | null
          meeting_purpose: string | null
          open_questions: string | null
          potential_scope: string | null
          recommended_next_step: string | null
          stated_problem: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          call_id: string
          client_provided_information?: string | null
          client_situation?: string | null
          created_at?: string
          decisions_made?: string | null
          diagnosed_root_issue?: string | null
          exclusions?: string | null
          follow_up_email_draft?: string | null
          id?: string
          key_risks_constraints?: string | null
          meeting_purpose?: string | null
          open_questions?: string | null
          potential_scope?: string | null
          recommended_next_step?: string | null
          stated_problem?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          call_id?: string
          client_provided_information?: string | null
          client_situation?: string | null
          created_at?: string
          decisions_made?: string | null
          diagnosed_root_issue?: string | null
          exclusions?: string | null
          follow_up_email_draft?: string | null
          id?: string
          key_risks_constraints?: string | null
          meeting_purpose?: string | null
          open_questions?: string | null
          potential_scope?: string | null
          recommended_next_step?: string | null
          stated_problem?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "after_call_outputs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: true
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          accuracy_rating: number | null
          clarity_rating: number | null
          comments: string | null
          company: string | null
          confusing_parts: string | null
          created_at: string
          email: string | null
          id: string
          least_useful_button: string | null
          missing_features: string | null
          most_useful_button: string | null
          name: string | null
          role: string | null
          scenario_tested: string | null
          usefulness_rating: number | null
          user_id: string
          would_pay: string | null
          would_use_again: string | null
        }
        Insert: {
          accuracy_rating?: number | null
          clarity_rating?: number | null
          comments?: string | null
          company?: string | null
          confusing_parts?: string | null
          created_at?: string
          email?: string | null
          id?: string
          least_useful_button?: string | null
          missing_features?: string | null
          most_useful_button?: string | null
          name?: string | null
          role?: string | null
          scenario_tested?: string | null
          usefulness_rating?: number | null
          user_id: string
          would_pay?: string | null
          would_use_again?: string | null
        }
        Update: {
          accuracy_rating?: number | null
          clarity_rating?: number | null
          comments?: string | null
          company?: string | null
          confusing_parts?: string | null
          created_at?: string
          email?: string | null
          id?: string
          least_useful_button?: string | null
          missing_features?: string | null
          most_useful_button?: string | null
          name?: string | null
          role?: string | null
          scenario_tested?: string | null
          usefulness_rating?: number | null
          user_id?: string
          would_pay?: string | null
          would_use_again?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          authority_status: string | null
          budget_status: string | null
          business_context: string | null
          call_datetime: string | null
          call_type: string | null
          company_name: string | null
          contact_name: string | null
          contact_role: string | null
          created_at: string
          deal_stage: string | null
          desired_outcome: string | null
          id: string
          known_concerns: string | null
          meeting_objective: string | null
          notes: string | null
          planned_questions: string | null
          risks_to_watch: string | null
          status: Database["public"]["Enums"]["call_status"]
          title: string
          transcript_session_text: string | null
          updated_at: string
          user_id: string
          what_i_need_to_learn: string | null
          zoom_meeting_link: string | null
        }
        Insert: {
          authority_status?: string | null
          budget_status?: string | null
          business_context?: string | null
          call_datetime?: string | null
          call_type?: string | null
          company_name?: string | null
          contact_name?: string | null
          contact_role?: string | null
          created_at?: string
          deal_stage?: string | null
          desired_outcome?: string | null
          id?: string
          known_concerns?: string | null
          meeting_objective?: string | null
          notes?: string | null
          planned_questions?: string | null
          risks_to_watch?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          title: string
          transcript_session_text?: string | null
          updated_at?: string
          user_id: string
          what_i_need_to_learn?: string | null
          zoom_meeting_link?: string | null
        }
        Update: {
          authority_status?: string | null
          budget_status?: string | null
          business_context?: string | null
          call_datetime?: string | null
          call_type?: string | null
          company_name?: string | null
          contact_name?: string | null
          contact_role?: string | null
          created_at?: string
          deal_stage?: string | null
          desired_outcome?: string | null
          id?: string
          known_concerns?: string | null
          meeting_objective?: string | null
          notes?: string | null
          planned_questions?: string | null
          risks_to_watch?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          title?: string
          transcript_session_text?: string | null
          updated_at?: string
          user_id?: string
          what_i_need_to_learn?: string | null
          zoom_meeting_link?: string | null
        }
        Relationships: []
      }
      live_insights: {
        Row: {
          action_button: string
          call_id: string
          created_at: string
          emotional_signal: string | null
          hidden_risk: string | null
          id: string
          likely_true_intent: string | null
          question_to_avoid: string | null
          recommended_next_move: string | null
          recommended_question: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          sequence_number: number
          signal_type: string | null
          transcript_chunk_id: string | null
          user_id: string
          what_im_hearing: string | null
        }
        Insert: {
          action_button: string
          call_id: string
          created_at?: string
          emotional_signal?: string | null
          hidden_risk?: string | null
          id?: string
          likely_true_intent?: string | null
          question_to_avoid?: string | null
          recommended_next_move?: string | null
          recommended_question?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          sequence_number: number
          signal_type?: string | null
          transcript_chunk_id?: string | null
          user_id: string
          what_im_hearing?: string | null
        }
        Update: {
          action_button?: string
          call_id?: string
          created_at?: string
          emotional_signal?: string | null
          hidden_risk?: string | null
          id?: string
          likely_true_intent?: string | null
          question_to_avoid?: string | null
          recommended_next_move?: string | null
          recommended_question?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          sequence_number?: number
          signal_type?: string | null
          transcript_chunk_id?: string | null
          user_id?: string
          what_im_hearing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_insights_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_insights_transcript_chunk_id_fkey"
            columns: ["transcript_chunk_id"]
            isOneToOne: false
            referencedRelation: "transcript_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transcript_chunks: {
        Row: {
          call_id: string
          created_at: string
          id: string
          source: Database["public"]["Enums"]["transcript_source"]
          transcript_text: string
          user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["transcript_source"]
          transcript_text: string
          user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["transcript_source"]
          transcript_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_chunks_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      call_status: "draft" | "ready" | "live" | "completed" | "follow_up_done"
      risk_level: "green" | "yellow" | "red"
      transcript_source: "manual" | "zoom_transcript_future"
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
      call_status: ["draft", "ready", "live", "completed", "follow_up_done"],
      risk_level: ["green", "yellow", "red"],
      transcript_source: ["manual", "zoom_transcript_future"],
    },
  },
} as const
