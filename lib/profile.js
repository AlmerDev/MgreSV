import { isSupabaseConfigured, supabase } from "./supabaseClient";

export function sanitizeUsername(value) {
  return String(value || "User")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40) || "User";
}

export function usernameFromUser(user) {
  if (!user) return "Guest";

  const metaUsername = user.user_metadata?.username;
  if (metaUsername) return sanitizeUsername(metaUsername);

  const emailName = user.email?.split("@")?.[0];
  return sanitizeUsername(emailName || "User");
}

export async function ensureProfile(user) {
  if (!isSupabaseConfigured || !supabase || !user) return null;

  const fallbackUsername = usernameFromUser(user);

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const payload = {
    id: user.id,
    username: fallbackUsername,
    display_name: null,
    avatar_url: user.user_metadata?.avatar_url || null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return payload;
  return data;
}

export function publicName(profile, user) {
  return profile?.username || usernameFromUser(user);
}

export function publicAvatar(profile) {
  return profile?.avatar_url || "";
}
