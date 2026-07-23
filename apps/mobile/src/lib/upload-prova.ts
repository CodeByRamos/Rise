import * as Crypto from "expo-crypto";
import { supabase } from "./supabase";

/**
 * Envia uma foto de prova ao bucket privado `provas`. O caminho segue o padrão
 * `<uid>/<uuid>.<ext>` exigido pela RLS do Storage (cada usuário só escreve na
 * própria pasta). Retorna o path a passar em action.log.photoPath.
 *
 * Lê o arquivo local via fetch→arrayBuffer (padrão Expo SDK 52). Falha explícita
 * se não houver sessão (nunca envia anônimo).
 */
export async function enviarProva(uri: string): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Sessão expirada — entre de novo.");

  const ext = (uri.split(".").pop() ?? "jpg").toLowerCase().split("?")[0] ?? "jpg";
  const tipo = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const path = `${uid}/${Crypto.randomUUID()}.${ext}`;

  const resp = await fetch(uri);
  const bytes = await resp.arrayBuffer();

  const { error } = await supabase.storage
    .from("provas")
    .upload(path, bytes, { contentType: tipo, upsert: false });
  if (error) throw new Error(`Falha no upload da prova: ${error.message}`);
  return path;
}
