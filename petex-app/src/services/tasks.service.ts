import { mockTaskMessages } from '@/lib/mock-data';
import type { TaskMessage } from '@/types';

const STORAGE_KEY = 'petex_task_messages';
let memoryMessages: TaskMessage[] = [...mockTaskMessages];

const sortByDateDesc = (messages: TaskMessage[]) =>
  [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const getStoredMessages = (): TaskMessage[] => {
  if (typeof window === 'undefined') {
    return memoryMessages;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryMessages));
    return memoryMessages;
  }

  try {
    const parsed = JSON.parse(raw) as TaskMessage[];
    if (!Array.isArray(parsed)) return memoryMessages;
    memoryMessages = parsed;
    return memoryMessages;
  } catch {
    return memoryMessages;
  }
};

const saveMessages = (messages: TaskMessage[]) => {
  memoryMessages = messages;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }
};

export async function getMessages(userId: string): Promise<TaskMessage[]> {
  return sortByDateDesc(
    getStoredMessages().filter((message) => message.toUserId === userId || message.fromUserId === userId)
  );
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
  const message: TaskMessage = {
    id: `local-${Date.now()}`,
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    subject: data.subject,
    text: data.text,
    priority: data.priority ?? 'normal',
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  saveMessages([message, ...getStoredMessages()]);
  return message;
}

export async function markAsRead(messageId: string): Promise<TaskMessage | null> {
  let updated: TaskMessage | null = null;
  const messages = getStoredMessages().map((message) => {
    if (message.id !== messageId) return message;
    updated = {
      ...message,
      status: 'read',
      readAt: new Date().toISOString(),
    };
    return updated;
  });

  saveMessages(messages);
  return updated;
}

export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  console.info(`[tasks.service] WhatsApp pendiente de integración. ${phone}: ${message}`);
  return true;
}
