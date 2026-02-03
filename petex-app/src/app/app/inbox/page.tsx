// Driver inbox page
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/state';
import { MessageCard } from '@/components/domain/message-card';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { getInboxMessages, markAsRead } from '@/services/tasks.service';
import { getUserById } from '@/lib/mock-data';
import { Inbox } from 'lucide-react';
import type { TaskMessage } from '@/types';

export default function DriverInboxPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      try {
        const data = await getInboxMessages(user.id);
        setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [user]);

  const handleMessageClick = async (message: TaskMessage) => {
    if (message.status !== 'read') {
      await markAsRead(message.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, status: 'read' as const } : m
        )
      );
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando mensajes..." />;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Mensajes</h1>

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500">No tienes mensajes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              sender={getUserById(message.fromUserId)}
              onClick={() => handleMessageClick(message)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
