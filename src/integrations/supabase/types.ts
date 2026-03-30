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
      badges: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          staff_only: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          staff_only?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          staff_only?: boolean
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          additional_notes: string | null
          annual_revenue: string | null
          biggest_pain: string | null
          budget_defined: boolean | null
          budget_range: string | null
          classification: string | null
          commercial_name: string | null
          company_segment: string | null
          company_size: string | null
          competitor_analysis: string | null
          created_at: string
          current_tools: string | null
          decision_maker: string | null
          decision_process: string | null
          decision_urgency: string | null
          digital_presence_level: string | null
          employees_count: string | null
          growth_timeline: string | null
          has_defined_processes: boolean | null
          has_marketing_strategy: boolean | null
          has_sales_team: boolean | null
          id: string
          investment_capacity: string | null
          lead_id: string
          long_term_goals: string | null
          main_challenges: string[] | null
          meeting_date: string
          meeting_type: string
          next_steps: string | null
          revenue_goal: string | null
          score: number | null
          short_term_goals: string | null
          stakeholders_count: string | null
          summary: string | null
          tried_solutions: string | null
          updated_at: string
          years_in_market: string | null
        }
        Insert: {
          additional_notes?: string | null
          annual_revenue?: string | null
          biggest_pain?: string | null
          budget_defined?: boolean | null
          budget_range?: string | null
          classification?: string | null
          commercial_name?: string | null
          company_segment?: string | null
          company_size?: string | null
          competitor_analysis?: string | null
          created_at?: string
          current_tools?: string | null
          decision_maker?: string | null
          decision_process?: string | null
          decision_urgency?: string | null
          digital_presence_level?: string | null
          employees_count?: string | null
          growth_timeline?: string | null
          has_defined_processes?: boolean | null
          has_marketing_strategy?: boolean | null
          has_sales_team?: boolean | null
          id?: string
          investment_capacity?: string | null
          lead_id: string
          long_term_goals?: string | null
          main_challenges?: string[] | null
          meeting_date?: string
          meeting_type?: string
          next_steps?: string | null
          revenue_goal?: string | null
          score?: number | null
          short_term_goals?: string | null
          stakeholders_count?: string | null
          summary?: string | null
          tried_solutions?: string | null
          updated_at?: string
          years_in_market?: string | null
        }
        Update: {
          additional_notes?: string | null
          annual_revenue?: string | null
          biggest_pain?: string | null
          budget_defined?: boolean | null
          budget_range?: string | null
          classification?: string | null
          commercial_name?: string | null
          company_segment?: string | null
          company_size?: string | null
          competitor_analysis?: string | null
          created_at?: string
          current_tools?: string | null
          decision_maker?: string | null
          decision_process?: string | null
          decision_urgency?: string | null
          digital_presence_level?: string | null
          employees_count?: string | null
          growth_timeline?: string | null
          has_defined_processes?: boolean | null
          has_marketing_strategy?: boolean | null
          has_sales_team?: boolean | null
          id?: string
          investment_capacity?: string | null
          lead_id?: string
          long_term_goals?: string | null
          main_challenges?: string[] | null
          meeting_date?: string
          meeting_type?: string
          next_steps?: string | null
          revenue_goal?: string | null
          score?: number | null
          short_term_goals?: string | null
          stakeholders_count?: string | null
          summary?: string | null
          tried_solutions?: string | null
          updated_at?: string
          years_in_market?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary: {
        Row: {
          category: string | null
          created_at: string
          definition: string
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition: string
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: string
          id?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          lead_id: string
          scheduled_at: string | null
        }
        Insert: {
          activity_type?: string
          created_at?: string
          description: string
          id?: string
          lead_id: string
          scheduled_at?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived: boolean
          archived_at: string | null
          challenge: string | null
          cnpj: string
          company: string
          created_at: string
          email: string
          id: string
          last_contact_at: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          priority: string | null
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          challenge?: string | null
          cnpj: string
          company: string
          created_at?: string
          email: string
          id?: string
          last_contact_at?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          challenge?: string | null
          cnpj?: string
          company?: string
          created_at?: string
          email?: string
          id?: string
          last_contact_at?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          emoji: string
          id: string
          mission_type: string
          target_action: string
          target_count: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          mission_type?: string
          target_action?: string
          target_count?: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          mission_type?: string
          target_action?: string
          target_count?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          pinned?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cnpj: string | null
          company_id: string | null
          company_name: string
          created_at: string
          id: string
          level: number
          name: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cnpj?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string
          id?: string
          level?: number
          name?: string | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cnpj?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          id?: string
          level?: number
          name?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          mission_id: string
          progress: number
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          mission_id: string
          progress?: number
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          mission_id?: string
          progress?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
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
      vault_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          active: boolean
          agency: string | null
          balance: number
          bank_name: string
          company_id: string
          created_at: string
          credit_limit: number | null
          id: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          active?: boolean
          agency?: string | null
          balance?: number
          bank_name: string
          company_id: string
          created_at?: string
          credit_limit?: number | null
          id?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          active?: boolean
          agency?: string | null
          balance?: number
          bank_name?: string
          company_id?: string
          created_at?: string
          credit_limit?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string | null
          company_id: string
          created_at: string
          description: string
          id: string
          reconciled: boolean
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          description: string
          id?: string
          reconciled?: boolean
          transaction_date: string
          transaction_type?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          reconciled?: boolean
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "vault_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_budgets: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          id: string
          year: number
        }
        Insert: {
          amount?: number
          category: string
          company_id: string
          created_at?: string
          id?: string
          year?: number
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vault_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_companies: {
        Row: {
          account_number: string | null
          active: boolean
          address: string | null
          agency: string | null
          aliquota: number
          cnae: string | null
          cnpj: string | null
          color: string
          created_at: string
          dividend_date: string | null
          dividend_fund: number | null
          email: string | null
          emergency_fund: number | null
          emergency_fund_goal: number | null
          founded_at: string | null
          id: string
          ie: string | null
          im: string | null
          investment_fund: number | null
          is_holding: boolean
          main_bank: string | null
          name: string
          phone: string | null
          pix_key: string | null
          regime: string | null
          responsible: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          active?: boolean
          address?: string | null
          agency?: string | null
          aliquota?: number
          cnae?: string | null
          cnpj?: string | null
          color?: string
          created_at?: string
          dividend_date?: string | null
          dividend_fund?: number | null
          email?: string | null
          emergency_fund?: number | null
          emergency_fund_goal?: number | null
          founded_at?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          investment_fund?: number | null
          is_holding?: boolean
          main_bank?: string | null
          name: string
          phone?: string | null
          pix_key?: string | null
          regime?: string | null
          responsible?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          active?: boolean
          address?: string | null
          agency?: string | null
          aliquota?: number
          cnae?: string | null
          cnpj?: string | null
          color?: string
          created_at?: string
          dividend_date?: string | null
          dividend_fund?: number | null
          email?: string | null
          emergency_fund?: number | null
          emergency_fund_goal?: number | null
          founded_at?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          investment_fund?: number | null
          is_holding?: boolean
          main_bank?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          regime?: string | null
          responsible?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      vault_employees: {
        Row: {
          admission_date: string | null
          birth_date: string | null
          company_id: string
          cpf: string | null
          created_at: string
          department: string | null
          email: string | null
          employment_type: string | null
          id: string
          name: string
          pis: string | null
          position: string | null
          salary: number
          status: string
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          birth_date?: string | null
          company_id: string
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employment_type?: string | null
          id?: string
          name: string
          pis?: string | null
          position?: string | null
          salary?: number
          status?: string
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          birth_date?: string | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employment_type?: string | null
          id?: string
          name?: string
          pis?: string | null
          position?: string | null
          salary?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_entries: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string
          description: string
          due_date: string | null
          entry_date: string | null
          entry_type: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          quantity: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          company_id: string
          created_at?: string
          description: string
          due_date?: string | null
          entry_date?: string | null
          entry_type?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quantity?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          entry_date?: string | null
          entry_type?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quantity?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_goals: {
        Row: {
          company_id: string
          created_at: string
          current_value: number
          description: string | null
          goal_type: string
          id: string
          target_value: number
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          current_value?: number
          description?: string | null
          goal_type: string
          id?: string
          target_value?: number
          year?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          current_value?: number
          description?: string | null
          goal_type?: string
          id?: string
          target_value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vault_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_integrations: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      vault_monthly_data: {
        Row: {
          company_id: string
          created_at: string
          expenses: number | null
          id: string
          month_date: string
          revenue: number | null
          sales_count: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          expenses?: number | null
          id?: string
          month_date: string
          revenue?: number | null
          sales_count?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          expenses?: number | null
          id?: string
          month_date?: string
          revenue?: number | null
          sales_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_monthly_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_notifications: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          icon: string | null
          id: string
          message: string
          notification_date: string | null
          notification_type: string
          read: boolean
          sub_message: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          message: string
          notification_date?: string | null
          notification_type?: string
          read?: boolean
          sub_message?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          message?: string
          notification_date?: string | null
          notification_type?: string
          read?: boolean
          sub_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      vault_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          password: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          password: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          password?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      vault_vacations: {
        Row: {
          company_id: string
          created_at: string
          days: number
          employee_id: string
          id: string
          leave_type: string
          return_date: string
          start_date: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          days?: number
          employee_id: string
          id?: string
          leave_type?: string
          return_date: string
          start_date: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          days?: number
          employee_id?: string
          id?: string
          leave_type?: string
          return_date?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_vacations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vault_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "vault_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      check_and_award_badges: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_notification: {
        Args: {
          _actor_id?: string
          _body?: string
          _link?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
