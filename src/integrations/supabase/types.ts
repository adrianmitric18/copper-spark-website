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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist_items: {
        Row: {
          checklist_type: string
          created_at: string
          id: string
          is_checked: boolean
          item_key: string
          item_label: string
          item_order: number
          lead_id: string
          updated_at: string
        }
        Insert: {
          checklist_type: string
          created_at?: string
          id?: string
          is_checked?: boolean
          item_key: string
          item_label: string
          item_order?: number
          lead_id: string
          updated_at?: string
        }
        Update: {
          checklist_type?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          item_key?: string
          item_label?: string
          item_order?: number
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string
          client_type: string
          code_postal: string | null
          commune: string | null
          created_at: string
          email: string
          gdpr_consent: boolean
          id: string
          message: string
          name: string
          notes: string | null
          notes_internes: string | null
          numero: string | null
          phone: string
          photo_urls: string[] | null
          rue: string | null
          services: string[]
          source: string | null
          status: string
          timing: string | null
        }
        Insert: {
          address: string
          client_type: string
          code_postal?: string | null
          commune?: string | null
          created_at?: string
          email: string
          gdpr_consent: boolean
          id?: string
          message: string
          name: string
          notes?: string | null
          notes_internes?: string | null
          numero?: string | null
          phone: string
          photo_urls?: string[] | null
          rue?: string | null
          services: string[]
          source?: string | null
          status?: string
          timing?: string | null
        }
        Update: {
          address?: string
          client_type?: string
          code_postal?: string | null
          commune?: string | null
          created_at?: string
          email?: string
          gdpr_consent?: boolean
          id?: string
          message?: string
          name?: string
          notes?: string | null
          notes_internes?: string | null
          numero?: string | null
          phone?: string
          photo_urls?: string[] | null
          rue?: string | null
          services?: string[]
          source?: string | null
          status?: string
          timing?: string | null
        }
        Relationships: []
      }
      project_images: {
        Row: {
          caption: string | null
          created_at: string
          height: number | null
          id: string
          is_cover: boolean
          kind: string
          project_id: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          kind?: string
          project_id: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          kind?: string
          project_id?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          project_id: string
          tag: string
        }
        Insert: {
          project_id: string
          tag: string
        }
        Update: {
          project_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_range: string | null
          completed_at: string
          created_at: string
          deleted_at: string | null
          duration_days: number | null
          faq: Json | null
          featured: boolean
          id: string
          location: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: string
          story: string | null
          summary: string
          title: string
          updated_at: string
          zone: string
        }
        Insert: {
          budget_range?: string | null
          completed_at: string
          created_at?: string
          deleted_at?: string | null
          duration_days?: number | null
          faq?: Json | null
          featured?: boolean
          id?: string
          location: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: string
          story?: string | null
          summary: string
          title: string
          updated_at?: string
          zone: string
        }
        Update: {
          budget_range?: string | null
          completed_at?: string
          created_at?: string
          deleted_at?: string | null
          duration_days?: number | null
          faq?: Json | null
          featured?: boolean
          id?: string
          location?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: string
          story?: string | null
          summary?: string
          title?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      rendez_vous: {
        Row: {
          created_at: string
          date_rdv: string
          duree_minutes: number
          heure_rdv: string
          id: string
          lead_id: string
          notes_internes: string | null
          rappel_envoye_at: string | null
          statut: string
          type_visite: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_rdv: string
          duree_minutes?: number
          heure_rdv: string
          id?: string
          lead_id: string
          notes_internes?: string | null
          rappel_envoye_at?: string | null
          statut?: string
          type_visite: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_rdv?: string
          duree_minutes?: number
          heure_rdv?: string
          id?: string
          lead_id?: string
          notes_internes?: string | null
          rappel_envoye_at?: string | null
          statut?: string
          type_visite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          approved: boolean
          city: string | null
          created_at: string
          id: string
          message: string
          name: string
          rating: number
          service: string | null
        }
        Insert: {
          approved?: boolean
          city?: string | null
          created_at?: string
          id?: string
          message: string
          name: string
          rating?: number
          service?: string | null
        }
        Update: {
          approved?: boolean
          city?: string | null
          created_at?: string
          id?: string
          message?: string
          name?: string
          rating?: number
          service?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
