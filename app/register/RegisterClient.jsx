"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteNav from "../components/SiteNav";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { ensureProfile, sanitizeUsername } from "../../lib/profile";
import { Eye, EyeOff, Loader2, Mail, Sparkles, UserPlus, UserRound, LockKeyhole } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event) {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      setNotice("Supabase belum dikonfigurasi. Isi ENV Supabase dulu.");
      return;
    }

    const cleanUsername = sanitizeUsername(username);

    if (cleanUsername.length < 2) {
      setNotice("Username minimal 2 karakter.");
      return;
    }

    if (password.length < 6) {
      setNotice("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setNotice("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setLoading(false);
      setNotice(error.message);
      return;
    }

    if (data?.user) await ensureProfile(data.user);

    setLoading(false);
    setNotice("Akun berhasil dibuat. Kalau email confirmation aktif, cek email dulu.");

    if (data?.session) router.push("/account");
  }

  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="authShell">
        <div className="authVisual">
          <div className="heroBadge">
            <Sparkles size={16} />
            Register
          </div>
          <h1>Buat akun MgreSV untuk review realtime.</h1>
          <p>
            Username bebas ditulis pakai spasi, huruf besar, atau huruf kecil.
            Username ini yang akan tampil di profile dan review.
          </p>
        </div>

        <form className="authCard" onSubmit={register}>
          <h2>Daftar Akun</h2>
          <p>Buat akun baru untuk memakai fitur review.</p>

          <label>
            Username
            <div className="authInput">
              <UserRound size={18} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Contoh: Almer Dev"
                required
                minLength={2}
                maxLength={40}
              />
            </div>
          </label>

          <label>
            Email
            <div className="authInput">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@domain.com"
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="authInput">
              <LockKeyhole size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
              <button
                type="button"
                className="passwordEyeBtn"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button className="authSubmit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <UserPlus size={18} />}
            {loading ? "Membuat akun..." : "Daftar"}
          </button>

          {notice ? <p className="authNotice">{notice}</p> : null}

          <p className="authSwitch">
            Sudah punya akun? <Link href="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
