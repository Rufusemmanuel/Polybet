import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type AlertRecord = {
  marketId: string;
  entryPriceCents: number;
  profitThresholdPct: number | null;
  lossThresholdPct: number | null;
  enabled: boolean;
  triggerOnce: boolean;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AlertsResponse = {
  alerts: AlertRecord[];
};

const parseErrorMessage = async (res: Response) => {
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // ignore json errors
  }
  return `${res.status} ${res.statusText}`.trim();
};

const fetchAlerts = async (): Promise<AlertsResponse> => {
  const res = await fetch('/api/alerts', { credentials: 'include' });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return (await res.json()) as AlertsResponse;
};

type SaveAlertPayload = {
  marketId: string;
  profitThresholdPct: number | null;
  lossThresholdPct: number | null;
  triggerOnce?: boolean;
  cooldownMinutes?: number;
  enabled?: boolean;
};

export const useAlerts = (enabled: boolean) => {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled,
    staleTime: 1000 * 60,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: SaveAlertPayload) => {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (marketId: string) => {
      const res = await fetch(`/api/alerts?marketId=${encodeURIComponent(marketId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  return {
    ...query,
    saveAlert: (payload: SaveAlertPayload) => saveMutation.mutateAsync(payload),
    isSaving: saveMutation.isPending,
    deleteAlert: (marketId: string) => deleteMutation.mutateAsync(marketId),
    isDeleting: deleteMutation.isPending,
  };
};
