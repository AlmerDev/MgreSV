"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  Info,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { ensureProfile, publicName } from "../../lib/profile";

const NAV_ITEMS = [
  { href: "/", alt: "/download", label: "Download", icon: Download },
  { href: "/tentang", label: "Tentang Website", icon: Info },
  {
    href: "/review",
    alt: "/komentar",
    label: "Review",
    icon: MessageSquareText,
  },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/credit", label: "Credit", icon: UsersRound },
];

export default function SiteNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function handleToggleMenu() {
    const scrollY =
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    lastScrollYRef.current = scrollY;
    setOpen((value) => !value);

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });

    setTimeout(() => {
      window.scrollTo(0, scrollY);
    }, 0);
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;

      if (!mounted) return;

      setSessionUser(user);

      if (user) {
        const profileData = await ensureProfile(user);
        if (mounted) setProfile(profileData);
      } else {
        setProfile(null);
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user || null;
        setSessionUser(user);

        if (user) setProfile(await ensureProfile(user));
        else setProfile(null);
      },
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
    setOpen(false);
    router.push("/");
  }

  function renderNavItems() {
    return NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const active = pathname === item.href || pathname === item.alt;

      return (
        <Link
          href={item.href}
          key={item.href}
          className={active ? "navItem active" : "navItem"}
        >
          <Icon size={16} />
          <span>{item.label}</span>
        </Link>
      );
    });
  }

  return (
    <header className="siteNav">
      <Link href="/" className="siteBrand" aria-label="MgreSV Home">
        <img src="/logo.png" alt="MgreSV" />
        <div>
          <b>MgreSV</b>
          <span>Fast Media Downloader</span>
        </div>
      </Link>

      <nav
        className="navLinks desktopNavLinks"
        aria-label="Navigasi utama desktop"
      >
        {renderNavItems()}
      </nav>

      <div className="navAuth desktopNavAuth">
        {sessionUser ? (
          <>
            <Link href="/account" className="navAccount">
              <UserRound size={15} />
              {publicName(profile, sessionUser)}
            </Link>
            <button
              type="button"
              className="navLogout"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <Link href="/login" className="navLogin">
            <LogIn size={15} />
            Login
          </Link>
        )}
      </div>

      <button
        type="button"
        className="navToggle"
        aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
        aria-expanded={open}
        onClick={handleToggleMenu}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div
        className={open ? "navBackdrop show" : "navBackdrop"}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        className={open ? "mobileNavPanel show" : "mobileNavPanel"}
        role="dialog"
        aria-label="Menu navigasi mobile"
      >
        <nav className="mobileNavList" aria-label="Navigasi utama mobile">
          {renderNavItems()}
        </nav>

        <div className="mobileNavPill">
          <Sparkles size={15} />
          Downloader • Photo • Video • Audio
        </div>

        <div className="mobileAuthActions">
          {sessionUser ? (
            <>
              <Link href="/account" className="navAccountMini">
                <UserRound size={16} />
                {publicName(profile, sessionUser)}
              </Link>
              <button type="button" className="navLogoutMini" onClick={logout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="navAccountMini">
              <LogIn size={16} />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
