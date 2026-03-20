'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'

export function useClientServices() {
  const user = useAuthStore((state) => state.user)
  const [hasSocialMedia, setHasSocialMedia] = useState(false)
  const [hasWebPage, setHasWebPage] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const userId = user.id

    async function checkServices() {
      try {
        const supabase = createClient()

        // Get client's active subscription with plan features
        const { data: subscription } = await supabase
          .from('client_subscriptions')
          .select(`
            subscription_plans(
              features,
              name
            )
          `)
          .eq('client_id', userId)
          .eq('status', 'active')
          .single()

        if (subscription?.subscription_plans?.features) {
          const features = subscription.subscription_plans.features as string[]
          
          // Check if features include social media or web page services
          setHasSocialMedia(
            features.some(feature => 
              feature.toLowerCase().includes('redes') ||
              feature.toLowerCase().includes('social') ||
              feature.toLowerCase().includes('instagram') ||
              feature.toLowerCase().includes('facebook') ||
              feature.toLowerCase().includes('twitter') ||
              feature.toLowerCase().includes('linkedin')
            )
          )
          
          setHasWebPage(
            features.some(feature => 
              feature.toLowerCase().includes('página') ||
              feature.toLowerCase().includes('web') ||
              feature.toLowerCase().includes('sitio') ||
              feature.toLowerCase().includes('pagina')
            )
          )
        }
      } catch (error) {
        console.error('Error checking client services:', error)
      } finally {
        setLoading(false)
      }
    }

    checkServices()
  }, [user?.id])

  return { hasSocialMedia, hasWebPage, loading }
}
