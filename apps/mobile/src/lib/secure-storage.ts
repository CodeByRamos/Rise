import * as SecureStore from "expo-secure-store";

/**
 * Adapter de storage seguro para a sessão do Supabase (docs/18 — segurança).
 *
 * A sessão (JWT + refresh token) fica no Keychain (iOS) / Keystore (Android) via
 * expo-secure-store, em vez do AsyncStorage em texto claro. Como o SecureStore
 * tem limite de ~2048 bytes por valor e o token combinado pode passar disso,
 * fazemos CHUNKING transparente: o valor é fatiado em `<key>.0`, `<key>.1`… e um
 * índice `<key>` guarda a contagem de fatias. Leitura/remoção recompõem/limpam.
 *
 * Implementa a interface mínima que o supabase-js espera (getItem/setItem/removeItem).
 */
const TAMANHO_FATIA = 2000; // margem sob o teto de 2048 do SecureStore

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const meta = await SecureStore.getItemAsync(key);
    if (meta === null) return null;
    // Valor curto legado (não fatiado): o índice guarda o próprio valor.
    const nFatias = Number(meta);
    if (!Number.isInteger(nFatias) || nFatias <= 0) return meta;

    const partes: string[] = [];
    for (let i = 0; i < nFatias; i++) {
      const p = await SecureStore.getItemAsync(`${key}.${i}`);
      if (p === null) return null; // fatia perdida → sessão inválida, força re-login
      partes.push(p);
    }
    return partes.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= TAMANHO_FATIA) {
      await limparFatias(key);
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const nFatias = Math.ceil(value.length / TAMANHO_FATIA);
    await limparFatias(key, nFatias);
    for (let i = 0; i < nFatias; i++) {
      const fatia = value.slice(i * TAMANHO_FATIA, (i + 1) * TAMANHO_FATIA);
      await SecureStore.setItemAsync(`${key}.${i}`, fatia);
    }
    // O índice passa a guardar a contagem (>0 sinaliza valor fatiado).
    await SecureStore.setItemAsync(key, String(nFatias));
  },

  async removeItem(key: string): Promise<void> {
    await limparFatias(key);
    await SecureStore.deleteItemAsync(key);
  },
};

/** Remove fatias antigas de `key`, exceto as `manter` primeiras (evita órfãs). */
async function limparFatias(key: string, manter = 0): Promise<void> {
  const meta = await SecureStore.getItemAsync(key);
  const nAntigo = meta ? Number(meta) : 0;
  if (!Number.isInteger(nAntigo) || nAntigo <= 0) return;
  for (let i = manter; i < nAntigo; i++) {
    await SecureStore.deleteItemAsync(`${key}.${i}`);
  }
}
