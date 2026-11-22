import type { SupabaseClient } from "@supabase/supabase-js";

/** Envia a foto (se houver) para o bucket "fotos" e devolve a URL pública. */
export async function uploadFoto(
  supabase: SupabaseClient,
  file: FormDataEntryValue | null,
  pasta: string
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("O arquivo precisa ser uma imagem (JPG ou PNG).");
  if (file.size > 5 * 1024 * 1024) throw new Error("A foto é grande demais (máximo 5 MB).");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("fotos").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Não consegui enviar a foto. Tente de novo.");
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}
