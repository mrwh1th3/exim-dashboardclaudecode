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

        // Get client's active subscriptions with plan features
        const { data: subscriptions, error } = await supabase
          .from('client_subscriptions')
          .select(`
            subscription_plans(
              features,
              name
            )
          `)
          .eq('client_id', userId)
          .eq('status', 'active')

        if (error) {
          console.error('Supabase error checking client services:', error)
          return
        }

        if (subscriptions && subscriptions.length > 0) {
          const allFeatures: string[] = []

          subscriptions.forEach((sub: any) => {
            // sub.subscription_plans could be an array or an object depending on the relation
            const plans = Array.isArray(sub.subscription_plans)
              ? sub.subscription_plans
              : [sub.subscription_plans]

            plans.forEach((plan: any) => {
              // Also consider the plan name itself as a "feature" keyword
              if (plan?.name && typeof plan.name === 'string') {
                allFeatures.push(plan.name)
              }
              if (plan?.features && Array.isArray(plan.features)) {
                allFeatures.push(...(plan.features as string[]))
              }
            })
          })

          // Check if aggregated features include social media or web page services
          setHasSocialMedia(
            allFeatures.some(feature => {
              const f = typeof feature === 'string' ? feature.toLowerCase() : ''
              return f.includes('redes') ||
                f.includes('social') ||
                f.includes('instagram') ||
                f.includes('facebook') ||
                f.includes('twitter') ||
                f.includes('linkedin') ||
                f.includes('tiktok') ||
                f.includes('growth') ||
                f.includes('contenido') ||
                f.includes('community') ||
                f.includes('post')
            })
          )

          setHasWebPage(
            allFeatures.some(feature => {
              const f = typeof feature === 'string' ? feature.toLowerCase() : ''
              return f.includes('página') ||
                f.includes('web') ||
                f.includes('sitio') ||
                f.includes('pagina') ||
                f.includes('landing') ||
                f.includes('ecommerce')
            })
          )
        } else {
          // If no active subscriptions, they don't have these services by default.
          setHasSocialMedia(false)
          setHasWebPage(false)
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
