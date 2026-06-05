import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // ─── MOCK PARA DEMO ──────────────────────────────────────────
  // Retorna um cliente "fake" que sempre diz que o usuário está logado
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'demo-user-id',
            email: 'admin@teste.com',
            user_metadata: { business_name: 'Oficina Demo' }
          }
        },
        error: null
      }),
      signOut: async () => ({ error: null })
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === 'clients') return { data: { id: 'demo-client-id', business_name: 'Oficina Demo' }, error: null };
            return { data: null, error: null };
          },
          order: () => ({
            range: async () => ({ data: [], count: 0, error: null })
          })
        }),
        head: true,
        count: 'exact'
      })
    })
  } as any;
}
