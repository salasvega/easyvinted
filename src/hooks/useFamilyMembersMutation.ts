import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  type FamilyMember
} from '../services/settings';

export function useFamilyMembersMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (member: Omit<FamilyMember, 'id'>) => {
      if (!userId) throw new Error('User ID required');
      return createFamilyMember(userId, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'family_members', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ memberId, member }: { memberId: string; member: Partial<Omit<FamilyMember, 'id'>> }) => {
      return updateFamilyMember(memberId, member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'family_members', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => {
      return deleteFamilyMember(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'family_members', userId] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
