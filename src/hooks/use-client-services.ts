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

        // Run both queries in parallel for better performance
        const [subscriptionsResult, flowsResult] = await Promise.all([
          // Get client's active subscriptions with plan features
          supabase
            .from('client_subscriptions')
            .select(`
              subscription_plans(
                features,
                name
              )
            `)
            .eq('client_id', userId)
            .eq('status', 'active'),
          // Get client's assigned flows with their types
          supabase
            .from('client_flows')
            .select(`
              flow_templates(
                type
              )
            `)
            .eq('client_id', userId)
        ])

        const { data: subscriptions, error: subError } = subscriptionsResult
        const { data: flows, error: flowError } = flowsResult

        if (subError) {
          console.error('Supabase error checking client subscriptions:', subError)
        }
        if (flowError) {
          console.error('Supabase error checking client flows:', flowError)
        }

        // Check flow types first (more reliable than feature keywords)
        let socialFromFlow = false
        let webFromFlow = false

        if (flows && flows.length > 0) {
          flows.forEach((flow: any) => {
            const template = flow.flow_templates
            if (template?.type === 'social') {
              socialFromFlow = true
            }
            if (template?.type === 'web') {
              webFromFlow = true
            }
          })
        }

        // Then check subscription features as fallback/additional source
        let socialFromFeatures = false
        let webFromFeatures = false

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
          socialFromFeatures = allFeatures.some(feature => {
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
              f.includes('post') ||
              f.includes('ambos')
          })

          webFromFeatures = allFeatures.some(feature => {
            const f = typeof feature === 'string' ? feature.toLowerCase() : ''
            return f.includes('página') ||
              f.includes('web') ||
              f.includes('sitio') ||
              f.includes('pagina') ||
              f.includes('landing') ||
              f.includes('ecommerce') ||
              f.includes('ambos')
          })
        }

        // Client has service if EITHER flow type OR feature keywords match
        setHasSocialMedia(socialFromFlow || socialFromFeatures)
        setHasWebPage(webFromFlow || webFromFeatures)

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
