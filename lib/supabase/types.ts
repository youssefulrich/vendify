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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          shop_name: string
          phone: string | null
          pays: string
          plan: 'free' | 'premium'
          plan_expires_at: string | null
          created_at: string
          plan_request: string | null
          plan_request_method: string | null
          plan_request_note: string | null
          plan_request_at: string | null

        }
        Insert: {
          id: string
          full_name?: string | null
          shop_name?: string
          phone?: string | null
          pays?: string
          plan?: 'free' | 'premium'
          plan_expires_at?: string | null
          plan_request?: string | null
          plan_request_method?: string | null
          plan_request_note?: string | null
          plan_request_at?: string | null
        }
        Update: {
          full_name?: string | null
          shop_name?: string
          phone?: string | null
          pays?: string
          plan?: 'free' | 'premium'
          plan_expires_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          nom: string
          description: string | null
          prix_achat: number
          prix_vente: number
          stock: number
          stock_alerte: number
          photo_url: string | null
          actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nom: string
          description?: string | null
          prix_achat: number
          prix_vente: number
          stock?: number
          stock_alerte?: number
          photo_url?: string | null
          actif?: boolean
        }
        Update: {
          nom?: string
          description?: string | null
          prix_achat?: number
          prix_vente?: number
          stock?: number
          stock_alerte?: number
          photo_url?: string | null
          actif?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          client_nom: string
          client_phone: string | null
          canal: 'whatsapp' | 'instagram' | 'tiktok' | 'direct'
          statut: 'en_attente' | 'paye' | 'livre' | 'annule'
          mode_paiement: 'wave' | 'orange_money' | 'mtn_momo' | 'cash' | 'autre'
          total: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_nom: string
          client_phone?: string | null
          canal?: 'whatsapp' | 'instagram' | 'tiktok' | 'direct'
          statut?: 'en_attente' | 'paye' | 'livre' | 'annule'
          mode_paiement?: 'wave' | 'orange_money' | 'mtn_momo' | 'cash' | 'autre'
          note?: string | null
          total?: number   

        }
        Update: {
          client_nom?: string
          client_phone?: string | null
          canal?: 'whatsapp' | 'instagram' | 'tiktok' | 'direct'
          statut?: 'en_attente' | 'paye' | 'livre' | 'annule'
          mode_paiement?: 'wave' | 'orange_money' | 'mtn_momo' | 'cash' | 'autre'
          note?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantite: number
          prix_unitaire: number
          prix_achat: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantite: number
          prix_unitaire: number
          prix_achat: number
        }
        Update: {
          quantite?: number
        }
      }
    }
    Views: {
      stats_monthly: {
        Row: {
          user_id: string
          mois: string
          nb_commandes: number
          nb_clients: number
          chiffre_affaires: number
          benefice: number
        }
      }
      top_products: {
        Row: {
          user_id: string
          product_id: string
          nom: string
          photo_url: string | null
          prix_vente: number
          stock: number
          nb_ventes: number
          quantite_vendue: number
          ca_total: number
          benefice_total: number
        }
      }
      orders_this_month: {
        Row: {
          user_id: string
          nb_commandes_mois: number
        }
      }
    }
  }
}

// Helpers
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type StatsMonthly = Database['public']['Views']['stats_monthly']['Row']
export type TopProduct = Database['public']['Views']['top_products']['Row']
