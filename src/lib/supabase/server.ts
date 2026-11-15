import { createMockSupabaseClient } from '@/lib/mock/mockSupabase';

export async function createClient() {
  return createMockSupabaseClient();
}
