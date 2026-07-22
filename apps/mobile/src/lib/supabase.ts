import { createClient } from "@supabase/supabase-js";
import { secureStorage } from "./secure-storage";

/**
 * Client Supabase para React Native: sessão persistida no Keychain/Keystore via
 * expo-secure-store (adapter com chunking), refresh automático, sem detecção de
 * URL (deep link de auth é tratado à parte). Tokens NUNCA em texto claro.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, anon, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
