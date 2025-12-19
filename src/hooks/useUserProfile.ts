import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../services/settings';

const HOURS_6 = 1000 * 60 * 60 * 6;
const HOURS_24 = 1000 * 60 * 60 * 24;

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['settings', 'user_profiles', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: HOURS_6,
    gcTime: HOURS_24,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
