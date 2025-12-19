import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUserProfile, getFamilyMembers, getNotificationPreferences } from '../services/settings';

export function useBootstrapSettings(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const prefetchSettings = async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['settings', 'user_profiles', userId],
            queryFn: () => getUserProfile(userId),
          }),
          queryClient.prefetchQuery({
            queryKey: ['settings', 'family_members', userId],
            queryFn: () => getFamilyMembers(userId),
          }),
          queryClient.prefetchQuery({
            queryKey: ['settings', 'notification_preferences', userId],
            queryFn: () => getNotificationPreferences(userId),
          }),
        ]);
      } catch (error) {
        console.error('Error prefetching settings:', error);
      }
    };

    prefetchSettings();
  }, [userId, queryClient]);
}
