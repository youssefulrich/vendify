import { createClient } from '../supabase/client'

const FREE_LIMITS = {
  orders_per_month: 20,
  products: 5,
}

export async function checkOrderLimit(userId: string) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  if (profile?.plan === 'premium') {
    return { allowed: true, remaining: Infinity, isPremium: true }
  }

  const { data } = await supabase
    .from('orders_this_month')
    .select('nb_commandes_mois')
    .eq('user_id', userId)
    .single()

  const used = data?.nb_commandes_mois || 0
  const remaining = FREE_LIMITS.orders_per_month - used

  return {
    allowed: remaining > 0,
    remaining,
    used,
    limit: FREE_LIMITS.orders_per_month,
    isPremium: false,
  }
}

export async function checkProductLimit(userId: string) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  if (profile?.plan === 'premium') {
    return { allowed: true, isPremium: true }
  }

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('actif', true)

  return {
    allowed: (count || 0) < FREE_LIMITS.products,
    used: count || 0,
    limit: FREE_LIMITS.products,
    isPremium: false,
  }
}
