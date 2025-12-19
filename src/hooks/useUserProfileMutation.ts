import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserProfile } from '../services/settings';
import type { UserProfile } from '../services/settings';

export function useUserProfileMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => {
      if (!userId) throw new Error('User ID required');
      return updateUserProfile(userId, profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'user_profiles', userId] });
    },
  });
}
