// Base URL of this project's Supabase edge functions (all private: signed-in + allowlisted).
export const FN_BASE = `${String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "")}/functions/v1`;
