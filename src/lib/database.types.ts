// Generated types for Supabase database
export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          owner: string;
          title: string;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner: string;
          title?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner?: string;
          title?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      nodes: {
        Row: {
          id: string;
          workspace_id: string;
          owner: string;
          type: 'action' | 'knowledge' | 'custom';
          title: string | null;
          content: Record<string, any>;
          position: Record<string, any>;
          style: Record<string, any>;
          properties: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          owner: string;
          type: 'action' | 'knowledge' | 'custom';
          title?: string | null;
          content?: Record<string, any>;
          position?: Record<string, any>;
          style?: Record<string, any>;
          properties?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          owner?: string;
          type?: 'action' | 'knowledge' | 'custom';
          title?: string | null;
          content?: Record<string, any>;
          position?: Record<string, any>;
          style?: Record<string, any>;
          properties?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          workspace_id: string;
          owner: string;
          from_node: string;
          to_node: string;
          label: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          owner: string;
          from_node: string;
          to_node: string;
          label?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          owner?: string;
          from_node?: string;
          to_node?: string;
          label?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string | null;
          workspace_id: string | null;
          action: string;
          payload: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          workspace_id?: string | null;
          action: string;
          payload?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          workspace_id?: string | null;
          action?: string;
          payload?: Record<string, any>;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
