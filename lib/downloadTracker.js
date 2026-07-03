import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function recordDownloadEvent(payload = {}) {
  try {
    if (!isSupabaseConfigured || !supabase) return false;

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return false;

    await supabase.from("download_events").insert({
      user_id: user.id,
      source_url: String(payload.sourceUrl || "").slice(0, 1000),
      platform: String(payload.platform || "unknown").slice(0, 40),
      media_group: String(payload.mediaGroup || "unknown").slice(0, 40),
      file_type: String(payload.fileType || "").slice(0, 20),
    });

    return true;
  } catch {
    return false;
  }
}
