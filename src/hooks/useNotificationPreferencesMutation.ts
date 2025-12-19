import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNotificationPreferences, type NotificationPreferences } from '../services/settings';

export function useNotificationPreferencesMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<Omit<NotificationPreferences, 'user_id'>>) => {
      if (!userId) throw new Error('User ID required');
      return updateNotificationPreferences(userId, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notification_preferences', userId] });
    },
  });
}
