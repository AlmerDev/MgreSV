"use client";

import { useEffect, useMemo, useState } from "react";
import SiteNav from "../components/SiteNav";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import {
  Award,
  Crown,
  DownloadCloud,
  Loader2,
  Medal,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";

const DEMO_LEADERS = [
  {
    rank: 1,
    user_id: "demo-1",
    username: "AlmerDev",
    avatar_url: "",
    total_downloads: 128,
  },
  {
    rank: 2,
    user_id: "demo-2",
    username: "Ciyan Design",
    avatar_url: "",
    total_downloads: 96,
  },
  {
    rank: 3,
    user_id: "demo-3",
    username: "Guest Downloader",
    avatar_url: "",
    total_downloads: 64,
  },
];

function rankIcon(rank) {
  if (rank === 1) return <Crown size={22} />;
  if (rank === 2) return <Medal size={22} />;
  if (rank === 3) return <Award size={22} />;
  return <Trophy size={20} />;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState(DEMO_LEADERS);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const topThree = useMemo(() => leaders.slice(0, 3), [leaders]);
  const rest = useMemo(() => leaders.slice(3), [leaders]);
  const totalDownloads = useMemo(
    () => leaders.reduce((sum, item) => sum + Number(item.total_downloads || 0), 0),
    [leaders],
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setNotice("Supabase belum dikonfigurasi. Leaderboard tampil dalam mode demo/local.");
      return;
    }

    let mounted = true;

    async function loadLeaderboard() {
      setLoading(true);
      setNotice("");

      const { data, error } = await supabase.rpc("get_download_leaderboard", {
        limit_count: 50,
      });

      if (!mounted) return;

      if (error) {
        setNotice(`Gagal load leaderboard: ${error.message}. Jalankan SQL leaderboard dulu.`);
        setLeaders([]);
      } else {
        setLeaders(
          (data || []).map((item, index) => ({
            ...item,
            rank: index + 1,
            total_downloads: Number(item.total_downloads || 0),
          })),
        );
      }

      setLoading(false);
    }

    loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="innerHero leaderboardHero">
        <div className="heroBadge">
          <Trophy size={16} />
          Leaderboard
        </div>
        <h1>Peringkat pengguna paling aktif download di MgreSV.</h1>
        <p>
          Ranking ini dihitung dari jumlah download yang berhasil dilakukan oleh akun yang sedang login.
          Semakin sering download, semakin tinggi posisi kamu.
        </p>
      </section>

      <section className="leaderboardStats">
        <div>
          <DownloadCloud size={26} />
          <span>Total Download Tercatat</span>
          <strong>{totalDownloads}</strong>
        </div>
        <div>
          <UserRound size={26} />
          <span>User Masuk Ranking</span>
          <strong>{leaders.length}</strong>
        </div>
        <div>
          <Sparkles size={26} />
          <span>Top Rank</span>
          <strong>{leaders[0]?.username || "-"}</strong>
        </div>
      </section>

      {loading ? (
        <section className="leaderboardLoading">
          <Loader2 className="spin" size={24} />
          Memuat leaderboard...
        </section>
      ) : null}

      {notice ? <p className="leaderboardNotice">{notice}</p> : null}

      <section className="podiumGrid">
        {topThree.map((item) => (
          <article className={`podiumCard rank${item.rank}`} key={item.user_id || item.rank}>
            <div className="podiumRank">
              {rankIcon(item.rank)}
              #{item.rank}
            </div>

            <div className="leaderAvatar">
              {item.avatar_url ? (
                <img src={item.avatar_url} alt={item.username} />
              ) : (
                <span>{String(item.username || "U").slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <h2>{item.username || "Unknown User"}</h2>
            <p>{item.total_downloads} download</p>
          </article>
        ))}
      </section>

      <section className="leaderboardTableCard">
        <div className="leaderboardTableHead">
          <h2>Daftar Ranking</h2>
          <span>{leaders.length} user</span>
        </div>

        <div className="leaderboardRows">
          {leaders.length ? (
            leaders.map((item) => (
              <article className="leaderboardRow" key={`${item.user_id}-${item.rank}`}>
                <div className="leaderRank">#{item.rank}</div>

                <div className="leaderUser">
                  <div className="leaderAvatar small">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.username} />
                    ) : (
                      <span>{String(item.username || "U").slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  <div>
                    <b>{item.username || "Unknown User"}</b>
                    <span>{item.rank <= 3 ? "Top downloader" : "MgreSV user"}</span>
                  </div>
                </div>

                <div className="leaderDownloads">
                  <DownloadCloud size={18} />
                  <strong>{item.total_downloads}</strong>
                  <span>download</span>
                </div>
              </article>
            ))
          ) : (
            <div className="emptyLeaderboard">
              <Trophy size={30} />
              <b>Belum ada data leaderboard.</b>
              <span>Login lalu download file agar akunmu masuk ranking.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
