export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          key_type: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          key_type: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          key_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_access: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dashboard_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string | null
          sender_id: string | null
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          id: string
          mood: Database["public"]["Enums"]["mood_type"]
          notes: string | null
          trade_id: string | null
          user_id: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          mood: Database["public"]["Enums"]["mood_type"]
          notes?: string | null
          trade_id?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"]
          notes?: string | null
          trade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          closed_at: string | null
          created_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          lot_size: number
          notes: string | null
          opened_at: string | null
          pair: string
          pnl: number | null
          screenshot_urls: string[] | null
          status: Database["public"]["Enums"]["trade_status"] | null
          stop_loss: number | null
          tags: string[] | null
          take_profit: number | null
          trade_type: Database["public"]["Enums"]["trade_type"]
          trading_account_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          lot_size: number
          notes?: string | null
          opened_at?: string | null
          pair: string
          pnl?: number | null
          screenshot_urls?: string[] | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          stop_loss?: number | null
          tags?: string[] | null
          take_profit?: number | null
          trade_type: Database["public"]["Enums"]["trade_type"]
          trading_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          lot_size?: number
          notes?: string | null
          opened_at?: string | null
          pair?: string
          pnl?: number | null
          screenshot_urls?: string[] | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          stop_loss?: number | null
          tags?: string[] | null
          take_profit?: number | null
          trade_type?: Database["public"]["Enums"]["trade_type"]
          trading_account_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          account_name: string
          account_type: string
          broker: string
          created_at: string | null
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          account_name: string
          account_type: string
          broker: string
          created_at?: string | null
          current_balance?: number
          id?: string
          initial_balance: number
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          account_name?: string
          account_type?: string
          broker?: string
          created_at?: string | null
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      trading_strategies: {
        Row: {
          avg_pnl: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rules: string[] | null
          total_trades: number | null
          updated_at: string | null
          user_id: string | null
          win_rate: number | null
        }
        Insert: {
          avg_pnl?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rules?: string[] | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Update: {
          avg_pnl?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: string[] | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      mood_type: "confident" | "neutral" | "anxious" | "excited" | "frustrated"
      request_status: "pending" | "approved" | "rejected"
      trade_status: "open" | "closed"
      trade_type: "buy" | "sell"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mood_type: ["confident", "neutral", "anxious", "excited", "frustrated"],
      request_status: ["pending", "approved", "rejected"],
      trade_status: ["open", "closed"],
      trade_type: ["buy", "sell"],
      user_role: ["user", "admin"],
    },
  },
} as const
