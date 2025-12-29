import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  marketId: string | null;
  createdAt: string;
  readAt: string | null;
};

type NotificationsResponse = {
  unreadCount: number;
  notifications: NotificationRecord[];
};

const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Unable to load notifications');
  return (await res.json()) as NotificationsResponse;
};

export const useNotifications = (enabled: boolean) => {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled,
    staleTime: 1000 * 30,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error('Unable to mark notifications as read');
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    ...query,
    markAllRead: () => markReadMutation.mutateAsync(),
    isMarkingRead: markReadMutation.isPending,
  };
};
