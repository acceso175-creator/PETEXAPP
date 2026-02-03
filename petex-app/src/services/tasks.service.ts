// Tasks/Messages Service - Mock Implementation
// TODO: Replace with Supabase queries + WhatsApp API

import type { TaskMessage } from '@/types';
import { mockTaskMessages } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const messages = [...mockTaskMessages];

export async function getMessages(userId: string): Promise<TaskMessage[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  return messages
    .filter(m => m.toUserId === userId || m.fromUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getInboxMessages(userId: string): Promise<TaskMessage[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  return messages
    .filter(m => m.toUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSentMessages(userId: string): Promise<TaskMessage[]> {
  // TODO: Replace with Supabase query
  await delay(300);

  return messages
    .filter(m => m.fromUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUnreadCount(userId: string): Promise<number> {
  // TODO: Replace with Supabase count query
  await delay(100);
  return messages.filter(m => m.toUserId === userId && m.status !== 'read').length;
}

export async function createMessage(data: {
  fromUserId: string;
  toUserId: string;
  subject?: string;
  text: string;
  priority?: 'low' | 'normal' | 'high';
}): Promise<TaskMessage> {
  // TODO: Replace with Supabase insert + WhatsApp sending
  await delay(400);

  const newMessage: TaskMessage = {
    id: `msg-${Date.now()}`,
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    subject: data.subject,
    text: data.text,
    priority: data.priority || 'normal',
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  messages.push(newMessage);

  // Simulate sending to WhatsApp
  // TODO: Replace with WhatsApp sending API
  setTimeout(() => {
    const index = messages.findIndex(m => m.id === newMessage.id);
    if (index !== -1) {
      messages[index].status = 'sent';
    }
  }, 1000);

  return newMessage;
}

export async function markAsRead(messageId: string): Promise<TaskMessage | null> {
  // TODO: Replace with Supabase update
  await delay(200);

  const index = messages.findIndex(m => m.id === messageId);
  if (index === -1) return null;

  messages[index] = {
    ...messages[index],
    status: 'read',
    readAt: new Date().toISOString(),
  };

  return messages[index];
}

export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  // TODO: Replace with WhatsApp Business API
  await delay(500);
  console.log(`[MOCK] WhatsApp to ${phone}: ${message}`);
  return true;
}
