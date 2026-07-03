"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteNav from "../components/SiteNav";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { ensureProfile, publicAvatar, publicName, sanitizeUsername } from "../../lib/profile";
import {
  Camera,
  DownloadCloud,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetMode = searchParams.get("reset") === "1";
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const avatarUrl = useMemo(() => publicAvatar(profile), [profile]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setNotice("Supabase belum dikonfigurasi. Isi ENV Supabase dulu.");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadAccount() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const activeUser = data?.user || null;

      if (!activeUser) {
        router.push("/login?redirect=/account");
        return;
      }

      const profileData = await ensureProfile(activeUser);

      if (!mounted) return;

      setUser(activeUser);
      setProfile(profileData);
      setUsername(profileData?.username || "");

      const { count } = await supabase
        .from("download_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", activeUser.id);

      if (mounted) {
        setDownloadCount(count || 0);
        setLoading(false);
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function saveProfile(event) {
    event.preventDefault();
    if (!user || !supabase) return;

    const cleanUsername = sanitizeUsername(username);

    if (cleanUsername.length < 2) {
      setNotice("Username minimal 2 karakter.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
        display_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      setNotice(error.message);
    } else {
      setProfile(data);
      setUsername(data.username || "");
      await supabase.auth.updateUser({
        data: {
          username: data.username,
          avatar_url: data.avatar_url,
        },
      });
      setNotice("Profil berhasil disimpan.");
    }

    setSaving(false);
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file || !user || !supabase) return;

    if (!file.type.startsWith("image/")) {
      setNotice("File harus gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotice("Ukuran foto maksimal 2MB.");
      return;
    }

    setSaving(true);
    setNotice("");

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      setSaving(false);
      setNotice(`Upload gagal: ${uploadError.message}`);
      return;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatar_url = publicData?.publicUrl || "";

    const { data, error } = await supabase
      .from("profiles")
      .update({
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      setNotice(error.message);
    } else {
      setProfile(data);
      await supabase.auth.updateUser({
        data: {
          username: data.username,
          avatar_url: data.avatar_url,
        },
      });
      setNotice("Foto profil berhasil diupload.");
    }

    setSaving(false);
  }

  async function updatePassword(event) {
    event.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setNotice("Password baru minimal 6 karakter.");
      return;
    }

    if (!supabase) return;

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) setNotice(error.message);
    else {
      setNewPassword("");
      setNotice("Password berhasil diubah.");
    }
  }

  async function sendResetEmail() {
    if (!user?.email || !supabase) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/account?reset=1`,
    });

    setNotice(error ? error.message : "Link reset password dikirim ke email akun kamu.");
  }

  if (loading) {
    return (
      <main className="page innerPage">
        <SiteNav />
        <section className="authCard centerCard">
          <Loader2 className="spin" size={24} />
          <p>Memuat akun...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="innerHero accountHero">
        <div className="heroBadge">
          <UserRound size={16} />
          Account
        </div>
        <h1>Profil dan statistik download kamu.</h1>
        <p>
          Edit username, foto profil, reset password, dan lihat berapa kali akun ini memakai download di MgreSV.
        </p>
      </section>

      <section className="accountLayout">
        <aside className="profilePreviewCard">
          <div className="profileAvatarLarge">
            {avatarUrl ? (
              <img src={avatarUrl} alt={publicName(profile, user)} />
            ) : (
              <span>{publicName(profile, user).slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <h2>{publicName(profile, user)}</h2>

          <div className="profileStat">
            <DownloadCloud size={22} />
            <div>
              <strong>{downloadCount}</strong>
              <span>Total download</span>
            </div>
          </div>

          <div className="profileEmail">
            <Mail size={16} />
            {user?.email}
          </div>
        </aside>

        <section className="accountForms">
          <form className="accountCard" onSubmit={saveProfile}>
            <div className="formHead">
              <Sparkles size={18} />
              <b>Edit Profil</b>
            </div>

            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Contoh: Almer Dev"
                minLength={2}
                maxLength={40}
              />
              <small>Username bebas pakai spasi, huruf besar, dan huruf kecil.</small>
            </label>

            <label>
              Foto profil
              <div className="uploadBox">
                <Camera size={18} />
                <input type="file" accept="image/*" onChange={uploadAvatar} />
              </div>
              <small>Format gambar, maksimal 2MB. Butuh bucket Supabase bernama <b>avatars</b>.</small>
            </label>

            <button className="authSubmit" disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Simpan Profil
            </button>
          </form>

          <form className="accountCard" onSubmit={updatePassword}>
            <div className="formHead">
              <ShieldCheck size={18} />
              <b>Reset / Ubah Password</b>
            </div>

            {resetMode ? <p className="authNotice">Kamu masuk dari link reset password. Isi password baru di bawah.</p> : null}

            <label>
              Password baru
              <div className="accountPasswordField">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
                <button
                  type="button"
                  className="passwordEyeBtn"
                  aria-label={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowNewPassword((value) => !value)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button className="authSubmit" disabled={saving}>
              <LockKeyhole size={18} />
              Ubah Password
            </button>

            <button type="button" className="textButton" onClick={sendResetEmail}>
              Kirim link reset ke email
            </button>
          </form>

          {notice ? <p className="authNotice">{notice}</p> : null}
        </section>
      </section>
    </main>
  );
}
