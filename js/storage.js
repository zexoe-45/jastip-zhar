const STORAGE_KEYS = {
  customers: "jastip_customers",
  batches: "jastip_batches",
  orders: "jastip_orders",
  settings: "jastip_settings",
  session: "jastip_session",
};

// Separate this browser's local cache by Supabase account.
function scopedStorageKey(key) {
  const userId = window.currentSupabaseUser?.id;
  return userId ? `jastip_user_${userId}_${key}` : key;
}

const Store = {
  get(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(scopedStorageKey(key))) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(scopedStorageKey(key), JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(scopedStorageKey(key));
  },
  clearApp() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(scopedStorageKey(key));
    });
  },
};

function isLoggedIn() {
  return Boolean(window.currentSupabaseUser?.id);
}
