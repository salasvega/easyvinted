import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Persona {
  id: string;
  name: string;
  description: string;
  writing_style: string;
  emoji: string;
  color: string;
}

export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Persona[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
