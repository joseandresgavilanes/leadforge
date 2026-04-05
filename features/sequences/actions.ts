'use server'

import { revalidatePath } from 'next/cache'
import { addHours, addDays } from 'date-fns'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { ActionResult } from '@/types'
import type { SequencesRow, SequenceStepsRow, SequenceEnrollmentsRow } from '@/types/supabase'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function listSequences(): Promise<SequencesRow[]> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'sequences:read')
  const supabase = await tryCreateClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('sequences')
    .select('*')
    .eq('organization_id', org.id)
    .order('name')
  return (data ?? []) as SequencesRow[]
}

export async function getSequenceWithSteps(
  sequenceId: string
): Promise<{ sequence: SequencesRow; steps: SequenceStepsRow[] } | null> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'sequences:read')
  const supabase = await tryCreateClient()
  if (!supabase) return null
  const { data: sequence } = await supabase
    .from('sequences')
    .select('*')
    .eq('id', sequenceId)
    .eq('organization_id', org.id)
    .single()
  if (!sequence) return null
  const { data: steps } = await supabase
    .from('sequence_steps')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('position', { ascending: true })
  return { sequence: sequence as SequencesRow, steps: (steps ?? []) as SequenceStepsRow[] }
}

export async function createSequence(input: {
  name: string
  description?: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'sequences:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { data, error } = await supabase
      .from('sequences')
      .insert({
        organization_id: org.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        created_by: user.id,
        active: true,
        exit_on_terminal_stage: true,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.SEQUENCE_CREATED,
      entityType: 'sequence',
      entityId: data.id,
    })
    revalidatePath('/[locale]/app/sequences', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateSequenceSettings(
  sequenceId: string,
  input: { exitOnTerminalStage: boolean }
): Promise<ActionResult<void>> {
  try {
    const { org, membership } = await getContext()
    requirePermission(membership.role, 'sequences:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { error } = await supabase
      .from('sequences')
      .update({
        exit_on_terminal_stage: input.exitOnTerminalStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sequenceId)
      .eq('organization_id', org.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/sequences', 'page')
    revalidatePath(`/[locale]/app/sequences/${sequenceId}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function addSequenceStep(input: {
  sequenceId: string
  position: number
  stepType: 'email' | 'task' | 'wait'
  emailSubject?: string | null
  emailBody?: string | null
  taskTitle?: string | null
  taskDueDays?: number | null
  waitHours?: number
}): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'sequences:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { data: seq } = await supabase
      .from('sequences')
      .select('id')
      .eq('id', input.sequenceId)
      .eq('organization_id', org.id)
      .single()
    if (!seq) return { success: false, error: 'Sequence not found' }
    const { error } = await supabase.from('sequence_steps').insert({
      sequence_id: input.sequenceId,
      position: input.position,
      step_type: input.stepType,
      email_subject: input.emailSubject ?? null,
      email_body: input.emailBody ?? null,
      task_title: input.taskTitle ?? null,
      task_due_days: input.taskDueDays ?? null,
      wait_hours: input.waitHours ?? 24,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/sequences', 'page')
    revalidatePath(`/[locale]/app/sequences/${input.sequenceId}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function listEnrollments(sequenceId?: string): Promise<SequenceEnrollmentsRow[]> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'sequences:read')
  const supabase = await tryCreateClient()
  if (!supabase) return []
  let q = supabase
    .from('sequence_enrollments')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
  if (sequenceId) q = q.eq('sequence_id', sequenceId)
  const { data } = await q
  return (data ?? []) as SequenceEnrollmentsRow[]
}

export async function enrollInSequence(input: {
  sequenceId: string
  leadId?: string | null
  contactId?: string | null
  opportunityId?: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'sequences:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const targets =
      (input.leadId ? 1 : 0) + (input.contactId ? 1 : 0) + (input.opportunityId ? 1 : 0)
    if (targets !== 1) return { success: false, error: 'Select exactly one record to enroll.' }

    const { data: seq } = await supabase
      .from('sequences')
      .select('id')
      .eq('id', input.sequenceId)
      .eq('organization_id', org.id)
      .single()
    if (!seq) return { success: false, error: 'Sequence not found' }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('sequence_enrollments')
      .insert({
        organization_id: org.id,
        sequence_id: input.sequenceId,
        lead_id: input.leadId ?? null,
        contact_id: input.contactId ?? null,
        opportunity_id: input.opportunityId ?? null,
        status: 'active',
        current_step_index: 0,
        next_run_at: now,
        enrolled_by: user.id,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.SEQUENCE_ENROLLED,
      entityType: 'sequence',
      entityId: input.sequenceId,
      metadata: { enrollmentId: data.id },
    })

    revalidatePath('/[locale]/app/sequences', 'page')
    revalidatePath(`/[locale]/app/sequences/${input.sequenceId}`, 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function enrollmentReachedTerminalStage(
  supabase: NonNullable<Awaited<ReturnType<typeof tryCreateClient>>>,
  enrollment: SequenceEnrollmentsRow,
  exitOnTerminal: boolean
): Promise<boolean> {
  if (!exitOnTerminal || !enrollment.opportunity_id) return false
  const { data: opp } = await supabase
    .from('opportunities')
    .select('stage_id')
    .eq('id', enrollment.opportunity_id)
    .single()
  if (!opp) return false
  const { data: stage } = await supabase
    .from('opportunity_stages')
    .select('is_closed_won, is_closed_lost')
    .eq('id', opp.stage_id)
    .single()
  return !!(stage?.is_closed_won || stage?.is_closed_lost)
}

export async function advanceSequenceEnrollment(enrollmentId: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'sequences:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data: enr } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('organization_id', org.id)
      .single()

    if (!enr || enr.status !== 'active') {
      return { success: false, error: 'Enrollment not active.' }
    }

    if (new Date(enr.next_run_at).getTime() > Date.now()) {
      return { success: false, error: 'Wait step: run again after the scheduled time.' }
    }

    const { data: sequenceRow } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', enr.sequence_id)
      .eq('organization_id', org.id)
      .single()
    const sequence = sequenceRow as SequencesRow | null
    if (!sequence) return { success: false, error: 'Sequence not found.' }
    if (await enrollmentReachedTerminalStage(supabase, enr as SequenceEnrollmentsRow, sequence.exit_on_terminal_stage)) {
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', enrollmentId)
      revalidatePath('/[locale]/app/sequences', 'page')
      revalidatePath(`/[locale]/app/sequences/${enr.sequence_id}`, 'page')
      return { success: true, data: undefined }
    }

    const { data: steps } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', enr.sequence_id)
      .order('position', { ascending: true })

    const ordered = (steps ?? []) as SequenceStepsRow[]
    const idx = enr.current_step_index
    if (idx >= ordered.length) {
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', enrollmentId)
      revalidatePath('/[locale]/app/sequences', 'page')
      revalidatePath(`/[locale]/app/sequences/${enr.sequence_id}`, 'page')
      return { success: true, data: undefined }
    }

    const step = ordered[idx]
    const now = new Date()
    let nextIndex = idx + 1
    let nextRun = now.toISOString()

    if (step.step_type === 'wait') {
      const hours = Math.max(1, step.wait_hours ?? 24)
      nextRun = addHours(now, hours).toISOString()
    } else if (step.step_type === 'task') {
      const title = step.task_title?.trim() || 'Sequence follow-up'
      const due = step.task_due_days != null ? addDays(now, step.task_due_days).toISOString() : addDays(now, 1).toISOString()
      await supabase.from('tasks').insert({
        organization_id: org.id,
        title,
        priority: 'medium',
        due_date: due,
        owner_id: user.id,
        lead_id: enr.lead_id,
        contact_id: enr.contact_id,
        opportunity_id: enr.opportunity_id,
        created_by: user.id,
      })
    } else if (step.step_type === 'email') {
      const subj = step.email_subject?.trim() || 'Follow-up'
      const body = step.email_body?.trim() || ''
      await supabase.from('activities').insert({
        organization_id: org.id,
        type: 'email',
        subject: subj,
        description: body,
        activity_date: now.toISOString(),
        lead_id: enr.lead_id,
        contact_id: enr.contact_id,
        opportunity_id: enr.opportunity_id,
        created_by: user.id,
      })
    }

    if (nextIndex >= ordered.length) {
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'completed',
          current_step_index: nextIndex,
          next_run_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', enrollmentId)
    } else {
      await supabase
        .from('sequence_enrollments')
        .update({
          current_step_index: nextIndex,
          next_run_at: nextRun,
          updated_at: now.toISOString(),
        })
        .eq('id', enrollmentId)
    }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.SEQUENCE_STEP_ADVANCED,
      entityType: 'sequence',
      entityId: enr.sequence_id,
      metadata: { enrollmentId, stepIndex: idx, stepType: step.step_type },
    })

    revalidatePath('/[locale]/app/sequences', 'page')
    revalidatePath(`/[locale]/app/sequences/${enr.sequence_id}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: 'paused' | 'cancelled' | 'active'
): Promise<ActionResult<void>> {
  try {
    const { org, membership } = await getContext()
    requirePermission(membership.role, 'sequences:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { data: enrRow } = await supabase
      .from('sequence_enrollments')
      .select('sequence_id')
      .eq('id', enrollmentId)
      .eq('organization_id', org.id)
      .single()
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', enrollmentId)
      .eq('organization_id', org.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/sequences', 'page')
    if (enrRow?.sequence_id) {
      revalidatePath(`/[locale]/app/sequences/${enrRow.sequence_id}`, 'page')
    }
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
