"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import SiteNav from "../components/SiteNav";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      setNotice("Supabase belum dikonfigurasi. Isi ENV Supabase dulu.");
      return;
    }

    setLoading(true);
    setNotice("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    router.push(redirectTo);
  }

  async function sendReset() {
    if (!email.trim()) {
      setNotice("Isi email dulu untuk reset password.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setNotice("Supabase belum dikonfigurasi.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account?reset=1`,
    });

    setNotice(error ? error.message : "Link reset password sudah dikirim ke email.");
  }

  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="authShell">
        <div className="authVisual">
          <div className="heroBadge">
            <Sparkles size={16} />
            Akun MgreSV
          </div>
          <h1>Login untuk review dan statistik download.</h1>
          <p>
            Setelah login, nama review otomatis memakai username akun. Kamu juga bisa edit profil,
            upload foto, reset password, dan melihat jumlah download.
          </p>
        </div>

        <form className="authCard" onSubmit={login}>
          <h2>Login</h2>
          <p>Masuk ke akun MgreSV kamu.</p>

          <label>
            Email
            <div className="authInput">
              <Mail size={18} />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@domain.com" required />
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
                placeholder="Password"
                required
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
            {loading ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            {loading ? "Masuk..." : "Login"}
          </button>

          <button type="button" className="textButton" onClick={sendReset}>
            Lupa password? Kirim link reset
          </button>

          {notice ? <p className="authNotice">{notice}</p> : null}

          <p className="authSwitch">
            Belum punya akun? <Link href="/register">Daftar sekarang</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
