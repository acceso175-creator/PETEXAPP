// Issues Service - Mock Implementation
// TODO: Replace with Supabase queries

import type { Issue } from '@/types';
import { mockIssues } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const issues = [...mockIssues];

export async function getIssues(filters?: {
  status?: string;
  scope?: string;
  reportedBy?: string;
}): Promise<Issue[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  let result = [...issues];

  if (filters?.status) {
    result = result.filter(i => i.status === filters.status);
  }

  if (filters?.scope) {
    result = result.filter(i => i.scope === filters.scope);
  }

  if (filters?.reportedBy) {
    result = result.filter(i => i.reportedBy === filters.reportedBy);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getIssueById(id: string): Promise<Issue | null> {
  // TODO: Replace with Supabase query
  await delay(200);
  return issues.find(i => i.id === id) || null;
}

export async function createIssue(data: {
  scope: Issue['scope'];
  scopeId?: string;
  type: Issue['type'];
  note: string;
  photoUrl?: string;
  reportedBy: string;
}): Promise<Issue> {
  // TODO: Replace with Supabase insert
  await delay(400);

  const newIssue: Issue = {
    id: `issue-${Date.now()}`,
    scope: data.scope,
    scopeId: data.scopeId,
    type: data.type,
    note: data.note,
    photoUrl: data.photoUrl,
    status: 'open',
    reportedBy: data.reportedBy,
    createdAt: new Date().toISOString(),
  };

  issues.push(newIssue);
  return newIssue;
}

export async function updateIssueStatus(
  id: string,
  status: Issue['status']
): Promise<Issue | null> {
  // TODO: Replace with Supabase update
  await delay(300);

  const index = issues.findIndex(i => i.id === id);
  if (index === -1) return null;

  issues[index] = {
    ...issues[index],
    status,
    resolvedAt: status === 'closed' ? new Date().toISOString() : undefined,
  };

  return issues[index];
}

export async function getIssuesByPackage(packageId: string): Promise<Issue[]> {
  // TODO: Replace with Supabase query
  await delay(200);
  return issues.filter(i => i.scope === 'package' && i.scopeId === packageId);
}

export async function getIssuesByRoute(routeId: string): Promise<Issue[]> {
  // TODO: Replace with Supabase query
  await delay(200);
  return issues.filter(i => i.scope === 'route' && i.scopeId === routeId);
}
