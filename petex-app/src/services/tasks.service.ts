import { getSupabaseClient } from '@/lib/supabase/client';
import { mockTaskMessages } from '@/lib/mock-data';
import type { TaskMessage } from '@/types';

const mapMessage = (row: Record<string, unknown>): TaskMessage => ({
  id: String(row.id ?? ''),
  fromUserId: String(row.from_user_id ?? row.fromUserId ?? ''),
  toUserId: String(row.to_user_id ?? row.toUserId ?? ''),
  subject: (row.subject as string | undefined) ?? undefined,
  text: String(row.text ?? ''),
  priority: String(row.priority ?? 'normal') as TaskMessage['priority'],
  status: String(row.status ?? 'queued') as TaskMessage['status'],
  createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  readAt: (row.read_at as string | undefined) ?? (row.readAt as string | undefined),
});

const fallbackMessages = () => {
  console.warn('[tasks.service] fallback explícito a mockTaskMessages.');
  return [...mockTaskMessages];
};

export async function getMessages(userId: string): Promise<TaskMessage[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('task_messages')
      .select('*')
      .or(`to_user_id.eq.${userId},from_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
  } catch {
    return fallbackMessages()
      .filter((message) => message.toUserId === userId || message.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getInboxMessages(userId: string): Promise<TaskMessage[]> {
  const messages = await getMessages(userId);
  return messages.filter((message) => message.toUserId === userId);
}

export async function getSentMessages(userId: string): Promise<TaskMessage[]> {
  const messages = await getMessages(userId);
  return messages.filter((message) => message.fromUserId === userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const messages = await getInboxMessages(userId);
  return messages.filter((message) => message.status !== 'read').length;
}

export async function createMessage(data: {
  fromUserId: string;
  toUserId: string;
  subject?: string;
  text: string;
  priority?: 'low' | 'normal' | 'high';
}): Promise<TaskMessage> {
  const supabase = getSupabaseClient();
  const payload = {
    from_user_id: data.fromUserId,
    to_user_id: data.toUserId,
    subject: data.subject ?? null,
    text: data.text,
    priority: data.priority ?? 'normal',
    status: 'queued',
  };

  const { data: inserted, error } = await supabase.from('task_messages').insert(payload).select('*').single();
  if (error) throw new Error(`No se pudo crear el mensaje: ${error.message}`);
  return mapMessage(inserted as Record<string, unknown>);
}

export async function markAsRead(messageId: string): Promise<TaskMessage | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('task_messages')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`No se pudo marcar como leído: ${error.message}`);
  return data ? mapMessage(data as Record<string, unknown>) : null;
}

export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  console.info(`[tasks.service] WhatsApp pendiente de integración. ${phone}: ${message}`);
  return true;
}
