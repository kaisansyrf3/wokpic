/**
 * Hand-written to mirror supabase/migrations/20261001000000_init_schema.sql.
 * Regenerate with `supabase gen types typescript` once a project is linked
 * (see README) and commit the result over this file.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SocialLink = {
  platform: string;
  url: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string | null;
          description: string | null;
          published: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category?: string | null;
          description?: string | null;
          published?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category?: string | null;
          description?: string | null;
          published?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      project_images: {
        Row: {
          id: string;
          project_id: string;
          url: string;
          thumb_url: string | null;
          width: number | null;
          height: number | null;
          blur_data_url: string | null;
          is_cover: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          project_id: string;
          url: string;
          thumb_url?: string | null;
          width?: number | null;
          height?: number | null;
          blur_data_url?: string | null;
          is_cover?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          project_id?: string;
          url?: string;
          thumb_url?: string | null;
          width?: number | null;
          height?: number | null;
          blur_data_url?: string | null;
          is_cover?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      hero_items: {
        Row: {
          id: string;
          project_id: string;
          position: number;
        };
        Insert: {
          id?: string;
          project_id: string;
          position: number;
        };
        Update: {
          id?: string;
          project_id?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "hero_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          price: number;
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          price: number;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          price?: number;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          service_id: string | null;
          service_name: string | null;
          body: string;
          ip: string | null;
          email_sent: boolean;
          is_read: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          service_id?: string | null;
          service_name?: string | null;
          body: string;
          ip?: string | null;
          email_sent?: boolean;
          is_read?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          service_id?: string | null;
          service_name?: string | null;
          body?: string;
          ip?: string | null;
          email_sent?: boolean;
          is_read?: boolean;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: number;
          about_name: string | null;
          about_role: string | null;
          about_bio: string | null;
          about_photo_url: string | null;
          social_links: Json;
        };
        Insert: {
          id?: number;
          about_name?: string | null;
          about_role?: string | null;
          about_bio?: string | null;
          about_photo_url?: string | null;
          social_links?: Json;
        };
        Update: {
          id?: number;
          about_name?: string | null;
          about_role?: string | null;
          about_bio?: string | null;
          about_photo_url?: string | null;
          social_links?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      set_hero_items: {
        Args: { project_ids: string[] };
        Returns: undefined;
      };
      set_project_cover: {
        Args: { image_id: string };
        Returns: undefined;
      };
      set_project_image_order: {
        Args: { target_project_id: string; image_ids: string[] };
        Returns: undefined;
      };
      set_service_order: {
        Args: { service_ids: string[] };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
