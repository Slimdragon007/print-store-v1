export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      prints: {
        Row: {
          id: string
          title: string
          image_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          image_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      print_variants: {
        Row: {
          id: string
          print_id: string
          label: string
          stripe_price_id: string
          price_cents: number
          created_at: string
        }
        Insert: {
          id: string
          print_id: string
          label: string
          stripe_price_id: string
          price_cents: number
          created_at?: string
        }
        Update: {
          id?: string
          print_id?: string
          label?: string
          stripe_price_id?: string
          price_cents?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}