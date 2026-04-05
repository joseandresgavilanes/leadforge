'use server'

import { tryCreateClient } from '@/lib/db/server'
import {
  getDemoDashboardStats,
  getDemoOverdueTasks,
  getDemoRecentActivities,
  getDemoStaleOpportunities,
  getDemoTasksDueToday,
} from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import type { DashboardStats } from '@/types'
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns'

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization')

  const orgId = orgData.organization.id
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoDashboardStats(orgId)

  const now = new Date()
  const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")

  const [
    { count: newLeadsCount },
    { count: lastMonthLeadsCount },
    { data: openOpps },
    { data: lastMonthOpps },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', thisMonthStart),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd),
    supabase
      .from('opportunities')
      .select('value, probability, stage:opportunity_stages(is_closed_won, is_closed_lost)')
      .eq('organization_id', orgId),
    supabase
      .from('opportunities')
      .select('value')
      .eq('organization_id', orgId)
      .lte('created_at', lastMonthEnd),
  ])

  const activeOpps = (openOpps ?? []).filter(
    (o: any) => !o.stage?.is_closed_won && !o.stage?.is_closed_lost
  )

  const pipelineValue = activeOpps.reduce((sum: number, o: any) => sum + (o.value ?? 0), 0)
  const monthlyForecast = activeOpps.reduce(
    (sum: number, o: any) => sum + ((o.value ?? 0) * ((o.probability ?? 0) / 100)),
    0
  )

  const lastMonthPipeline = (lastMonthOpps ?? []).reduce((sum: number, o: any) => sum + (o.value ?? 0), 0)
  const pipelineChange = lastMonthPipeline > 0
    ? Math.round(((pipelineValue - lastMonthPipeline) / lastMonthPipeline) * 100)
    : 0

  const newLeadsThisMonth = newLeadsCount ?? 0
  const newLeadsLastMonth = lastMonthLeadsCount ?? 0
  const newLeadsChange = newLeadsLastMonth > 0
    ? Math.round(((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100)
    : 0

  return {
    newLeads: newLeadsThisMonth,
    openOpportunities: activeOpps.length,
    pipelineValue,
    monthlyForecast,
    newLeadsChange,
    pipelineChange,
  }
}

export async function getTasksDueToday(limit = 8) {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return []

  const supabase = await tryCreateClient()
  if (!supabase) return getDemoTasksDueToday(orgData.organization.id, limit)

  const start = startOfDay(new Date()).toISOString()
  const end = endOfDay(new Date()).toISOString()

  const { data } = await supabase
    .from('tasks')
    .select('*, owner:profiles!tasks_owner_id_fkey(id,first_name,last_name)')
    .eq('organization_id', orgData.organization.id)
    .is('completed_at', null)
    .gte('due_date', start)
    .lte('due_date', end)
    .order('due_date', { ascending: true })
    .limit(limit)

  return data ?? []
}

export async function getOverdueTasks(limit = 5) {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return []

  const supabase = await tryCreateClient()
  if (!supabase) return getDemoOverdueTasks(orgData.organization.id, limit)

  const { data } = await supabase
    .from('tasks')
    .select('*, owner:profiles!tasks_owner_id_fkey(id,first_name,last_name)')
    .eq('organization_id', orgData.organization.id)
    .is('completed_at', null)
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
    .limit(limit)

  return data ?? []
}

export async function getStaleOpportunities(dayThreshold = 14, limit = 5) {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return []

  const supabase = await tryCreateClient()
  if (!supabase) return getDemoStaleOpportunities(orgData.organization.id, dayThreshold, limit)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - dayThreshold)

  const { data } = await supabase
    .from('opportunities')
    .select('*, stage:opportunity_stages(name,is_closed_won,is_closed_lost)')
    .eq('organization_id', orgData.organization.id)
    .lt('updated_at', cutoff.toISOString())
    .order('updated_at', { ascending: true })
    .limit(limit)

  return (data ?? []).filter((o: any) => !o.stage?.is_closed_won && !o.stage?.is_closed_lost)
}

export async function getRecentActivities(limit = 10) {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return []

  const supabase = await tryCreateClient()
  if (!supabase) return getDemoRecentActivities(orgData.organization.id, limit)

  const { data } = await supabase
    .from('activities')
    .select('*, creator:profiles!activities_created_by_fkey(id,first_name,last_name,avatar_url)')
    .eq('organization_id', orgData.organization.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
