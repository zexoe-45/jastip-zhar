// Public browser configuration. Only use the Supabase publishable key here.
window.SUPABASE_URL = "https://anynezlldhucjxzfqfbu.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_viM62mddRAMXtljwg6jbYA_I89r-wB2";
window.supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
