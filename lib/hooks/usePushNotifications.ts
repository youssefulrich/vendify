// lib/hooks/usePushNotifications.ts
// Hook pour gérer les push notifications côté livreur

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

export function usePushNotifications(driverId: string, ville: string) {
  const [permission, setPermission]   = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [swReady, setSwReady]         = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setPermission(Notification.permission)
    registerSW()
  }, [])

  async function registerSW() {
    try {
      const reg = await navigator.serviceWorker.register('/sw-livraison.js')
      await navigator.serviceWorker.ready
      setSwReady(true)

      // Vérifier si déjà abonné
      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) setSubscribed(true)
    } catch (err) {
      console.error('SW registration failed:', err)
    }
  }

  async function subscribe() {
    if (!driverId || !ville) return
    setLoading(true)

    try {
      // 1. Demander la permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return }

      // 2. Obtenir le Service Worker
      const reg = await navigator.serviceWorker.ready

      // 3. S'abonner aux push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const subJson = sub.toJSON()

      // 4. Sauvegarder dans Supabase
      await (supabase as any).from('driver_push_subscriptions').upsert({
        driver_id: driverId,
        endpoint:  subJson.endpoint,
        p256dh:    subJson.keys?.p256dh,
        auth:      subJson.keys?.auth,
        ville:     ville,
      }, { onConflict: 'driver_id,endpoint' })

      setSubscribed(true)
    } catch (err) {
      console.error('Subscribe error:', err)
    }

    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await (supabase as any).from('driver_push_subscriptions')
          .delete()
          .eq('driver_id', driverId)
          .eq('endpoint', sub.endpoint)
      }
      setSubscribed(false)
    } catch (err) {
      console.error('Unsubscribe error:', err)
    }
    setLoading(false)
  }

  return { permission, subscribed, loading, swReady, subscribe, unsubscribe }
}

// Convertir la clé VAPID base64 en Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output  = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}