import { useQuery } from '@tanstack/react-query';
import { getFamilyMembers } from '../services/settings';

const HOURS_12 = 1000 * 60 * 60 * 12;
const HOURS_24 = 1000 * 60 * 60 * 24;

export function useFamilyMembers(userId: string | undefined) {
  return useQuery({
    queryKey: ['settings', 'family_members', userId],
    queryFn: () => getFamilyMembers(userId!),
    enabled: !!userId,
    staleTime: HOURS_12,
    gcTime: HOURS_24,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
