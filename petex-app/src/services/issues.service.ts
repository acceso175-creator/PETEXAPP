import { getSupabaseClient } from '@/lib/supabase/client';
import { mockIssues } from '@/lib/mock-data';
import type { Issue } from '@/types';

const mapIssue = (row: Record<string, unknown>): Issue => ({
  id: String(row.id ?? ''),
  scope: String(row.scope ?? 'general') as Issue['scope'],
  scopeId: (row.scope_id as string | undefined) ?? (row.scopeId as string | undefined),
  type: String(row.type ?? 'other') as Issue['type'],
  note: String(row.note ?? ''),
  photoUrl: (row.photo_url as string | undefined) ?? (row.photoUrl as string | undefined),
  status: String(row.status ?? 'open') as Issue['status'],
  reportedBy: String(row.reported_by ?? row.reportedBy ?? ''),
  createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  resolvedAt: (row.resolved_at as string | undefined) ?? (row.resolvedAt as string | undefined),
});

const fallbackIssues = () => {
  console.warn('[issues.service] fallback explícito a mockIssues.');
  return [...mockIssues];
};

export async function getIssues(filters?: { status?: string; scope?: string; reportedBy?: string }): Promise<Issue[]> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('issues').select('*').order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.scope) query = query.eq('scope', filters.scope);
    if (filters?.reportedBy) query = query.eq('reported_by', filters.reportedBy);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => mapIssue(row as Record<string, unknown>));
  } catch {
    let result = fallbackIssues();
    if (filters?.status) result = result.filter((issue) => issue.status === filters.status);
    if (filters?.scope) result = result.filter((issue) => issue.scope === filters.scope);
    if (filters?.reportedBy) result = result.filter((issue) => issue.reportedBy === filters.reportedBy);
    return result;
  }
}

export async function getIssueById(id: string): Promise<Issue | null> {
  const issues = await getIssues();
  return issues.find((issue) => issue.id === id) ?? null;
}

export async function createIssue(data: {
  scope: Issue['scope'];
  scopeId?: string;
  type: Issue['type'];
  note: string;
  photoUrl?: string;
  reportedBy: string;
}): Promise<Issue> {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      scope: data.scope,
      scope_id: data.scopeId ?? null,
      type: data.type,
      note: data.note,
      photo_url: data.photoUrl ?? null,
      status: 'open',
      reported_by: data.reportedBy,
    };
    const { data: inserted, error } = await supabase.from('issues').insert(payload).select('*').single();
    if (error) throw error;
    return mapIssue(inserted as Record<string, unknown>);
  } catch {
    const mock = {
      ...data,
      id: `issue-${Date.now()}`,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };
    return mock;
  }
}

export async function updateIssueStatus(id: string, status: Issue['status']): Promise<Issue | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('issues')
    .update({ status, resolved_at: status === 'closed' ? new Date().toISOString() : null })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar el issue: ${error.message}`);
  return data ? mapIssue(data as Record<string, unknown>) : null;
}

export async function getIssuesByPackage(packageId: string): Promise<Issue[]> {
  return getIssues({ scope: 'package' }).then((issues) => issues.filter((issue) => issue.scopeId === packageId));
}

export async function getIssuesByRoute(routeId: string): Promise<Issue[]> {
  return getIssues({ scope: 'route' }).then((issues) => issues.filter((issue) => issue.scopeId === routeId));
}
