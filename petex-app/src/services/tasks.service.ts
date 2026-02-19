import { getSupabaseClient } from '@/lib/supabase/client';
import type { TaskMessage } from '@/types';

const mapTaskMessage = (row: Record<string, unknown>, userId: string): TaskMessage => ({
  id: String(row.id ?? ''),
  fromUserId: userId,
  toUserId: userId,
  subject: 'Nota rápida',
  text: String(row.body ?? ''),
  priority: 'normal',
  status: 'sent',
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

export async function getMessages(userId: string): Promise<TaskMessage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('task_messages')
    .select('id,user_id,body,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar notas rápidas: ${error.message}`);
  }

  return (data ?? []).map((row) => mapTaskMessage(row as Record<string, unknown>, userId));
}

export async function getInboxMessages(userId: string): Promise<TaskMessage[]> {
  return getMessages(userId);
}

export async function getSentMessages(userId: string): Promise<TaskMessage[]> {
  return getMessages(userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const messages = await getMessages(userId);
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
  const userId = data.toUserId || data.fromUserId;

  const { data: inserted, error } = await supabase
    .from('task_messages')
    .insert({ user_id: userId, body: data.text })
    .select('id,user_id,body,created_at')
    .single();

  if (error) {
    throw new Error(`No se pudo crear la nota rápida: ${error.message}`);
  }

  return mapTaskMessage(inserted as Record<string, unknown>, userId);
}

export async function markAsRead(messageId: string): Promise<TaskMessage | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('task_messages')
    .select('id,user_id,body,created_at')
    .eq('id', messageId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la nota rápida: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...mapTaskMessage(data as Record<string, unknown>, String(data.user_id ?? '')),
    status: 'read',
    readAt: new Date().toISOString(),
  };
}

export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  console.info(`[tasks.service] WhatsApp pendiente de integración. ${phone}: ${message}`);
  return true;
}
