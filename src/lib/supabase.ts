// Temporary: MongoDB migration in progress
export const supabase = {
  from: () => ({
    insert: async () => ({ error: null }),
    select: async () => ({ data: [], error: null }),
  }),
};
