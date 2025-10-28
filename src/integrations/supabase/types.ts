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
      algorithm_impacts: {
        Row: {
          id: string;
          user_id: string;
          detected_at: string;
          severity: string;
          affected_keywords: string[];
          avg_position_drop: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          detected_at?: string;
          severity?: string;
          affected_keywords?: string[];
          avg_position_drop?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          detected_at?: string;
          severity?: string;
          affected_keywords?: string[];
          avg_position_drop?: number | null;
        };
        Relationships: [];
      };
      chatbot_conversations: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          messages: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          messages: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          messages?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          company_name: string | null;
          website_url: string | null;
          job_title: string | null;
          industry: string | null;
          team_size: string | null;
          monthly_traffic: string | null;
          primary_goals: string | null;
          bio: string | null;
          twitter_handle: string | null;
          linkedin_url: string | null;
          onboarding_completed: boolean | null;
          onboarding_step: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          website_url?: string | null;
          job_title?: string | null;
          industry?: string | null;
          team_size?: string | null;
          monthly_traffic?: string | null;
          primary_goals?: string | null;
          bio?: string | null;
          twitter_handle?: string | null;
          linkedin_url?: string | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          website_url?: string | null;
          job_title?: string | null;
          industry?: string | null;
          team_size?: string | null;
          monthly_traffic?: string | null;
          primary_goals?: string | null;
          bio?: string | null;
          twitter_handle?: string | null;
          linkedin_url?: string | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          total_credits: number;
          used_credits: number;
          available_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_credits?: number;
          used_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_credits?: number;
          used_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_usage_history: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          credits_used: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feature: string;
          credits_used: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          feature?: string;
          credits_used?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_oauth_tokens: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          access_token: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          access_token?: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ga4_properties: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          property_name: string;
          website_url: string | null;
          industry_category: string | null;
          time_zone: string | null;
          currency_code: string | null;
          is_active: boolean;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          property_name: string;
          website_url?: string | null;
          industry_category?: string | null;
          time_zone?: string | null;
          currency_code?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          property_name?: string;
          website_url?: string | null;
          industry_category?: string | null;
          time_zone?: string | null;
          currency_code?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ga4_reports_cache: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          report_type: string;
          date_range: string;
          report_data: Json;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          report_type: string;
          date_range: string;
          report_data: Json;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          report_type?: string;
          date_range?: string;
          report_data?: Json;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          stripe_product_id: string | null;
          stripe_price_id: string | null;
          price_monthly: number;
          price_yearly: number | null;
          credits_included: number;
          credits_monthly: number;
          features: Json;
          limits: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          credits_per_month: number;
          max_projects: number;
          max_team_members: number;
        };
        Insert: {
          id?: string;
          name: string;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          price_monthly: number;
          price_yearly?: number | null;
          credits_included?: number;
          credits_monthly?: number;
          features?: Json;
          limits?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          credits_per_month?: number;
          max_projects?: number;
          max_team_members?: number;
        };
        Update: {
          id?: string;
          name?: string;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          credits_included?: number;
          credits_monthly?: number;
          features?: Json;
          limits?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          credits_per_month?: number;
          max_projects?: number;
          max_team_members?: number;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          billing_cycle: string;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          billing_cycle?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          billing_cycle?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seo_projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          domain: string;
          gsc_property_url: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          domain: string;
          gsc_property_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          domain?: string;
          gsc_property_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_usage_log: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          feature: string;
          credits_used: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          feature: string;
          credits_used?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          feature?: string;
          credits_used?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_history: {
        Row: {
          id: string;
          user_id: string;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          amount: number;
          currency?: string;
          status: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      credit_packages: {
        Row: {
          id: string;
          name: string;
          stripe_price_id: string | null;
          credits: number;
          price: number;
          bonus_credits: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stripe_price_id?: string | null;
          credits: number;
          price: number;
          bonus_credits?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stripe_price_id?: string | null;
          credits?: number;
          price?: number;
          bonus_credits?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credits_with_transaction: {
        Args: {
          p_user_id: string;
          p_feature_name: string;
          p_credits_amount: number;
          p_project_id: string | null;
          p_metadata: Json;
        };
        Returns: Json;
      };
      has_feature_access: {
        Args: {
          p_user_id: string;
          p_feature_key: string;
        };
        Returns: boolean;
      };
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
