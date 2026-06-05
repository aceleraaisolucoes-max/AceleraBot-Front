export function createClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ data: { user: {} }, error: null }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: { id: 'demo' } }, error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: 'demo' }, error: null }),
          order: () => ({
            then: (cb: any) => cb({ data: [] })
          })
        })
      })
    })
  } as any;
}
