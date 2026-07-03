"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import SiteNav from "../components/SiteNav";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { ensureProfile, publicAvatar, publicName } from "../../lib/profile";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import {
  AlertTriangle,
  Edit3,
  Loader2,
  LogIn,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const PAGE_SLUG = "mgresv-home";
const AUTO_REFRESH_MS = 8000;

const DEMO_REVIEWS = [
  {
    id: "demo-1",
    user_id: "demo-almer",
    username: "AlmerDev",
    body: "UI-nya makin rapi, tinggal stabilin tiap platform biar makin enak dipakai.",
    rating: 5,
    avatar_url: "",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo-guest",
    username: "Guest",
    body: "Simple, tinggal paste link terus download. Konsepnya sudah pas.",
    rating: 4,
    avatar_url: "",
    created_at: new Date().toISOString(),
  },
];

function RatingStars({ value = 0, size = "normal" }) {
  const numericValue = Number(value || 0);

  function renderStar(item) {
    const difference = numericValue - (item - 1);

    if (difference >= 0.75) {
      return <FaStar className="faRatingStarIcon filled" />;
    }

    if (difference >= 0.25) {
      return <FaStarHalfAlt className="faRatingStarIcon half" />;
    }

    return <FaRegStar className="faRatingStarIcon empty" />;
  }

  return (
    <div
      className={`halfStarRow ${size === "large" ? "large" : ""}`}
      aria-label={`${numericValue.toFixed(1)} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((item) => (
        <span className="faRatingStar" key={item} aria-hidden="true">
          {renderStar(item)}
        </span>
      ))}
    </div>
  );
}

function RatingSummary({
  averageRating,
  reviews,
  lastRefreshAt,
  refreshing,
  onRefresh,
}) {
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter(
      (item) => Math.round(Number(item.rating || 0)) === star,
    ).length,
  }));

  const maxCount = Math.max(1, ...ratingCounts.map((item) => item.count));
  const totalReviews = reviews.length;

  return (
    <section className="ratingDashboard">
      <div className="ratingDashboardScore">
        <strong>{averageRating ? averageRating.toFixed(1) : "0.0"}</strong>
        <RatingStars value={averageRating} size="large" />
        <span>{totalReviews} review</span>
      </div>

      <div className="ratingBars">
        {ratingCounts.map((item) => (
          <div className="ratingBarRow" key={item.star}>
            <span className="ratingBarLabel">{item.star} ★</span>
            <div className="ratingBarTrack">
              <div
                className="ratingBarFill"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="ratingBarCount">{item.count}</span>
          </div>
        ))}

        <div className="autoRefreshRow">
          <button type="button" onClick={onRefresh} disabled={refreshing}>
            Refresh
          </button>
          <small>
            Terakhir update:{" "}
            {lastRefreshAt ? lastRefreshAt.toLocaleTimeString("id-ID") : "-"}
          </small>
        </div>
      </div>
    </section>
  );
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState(DEMO_REVIEWS);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [editingReviewId, setEditingReviewId] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeleteReview, setPendingDeleteReview] = useState(null);
  const [notice, setNotice] = useState("");

  const isLoggedIn = Boolean(sessionUser);
  const username = publicName(profile, sessionUser);
  const avatarUrl = publicAvatar(profile);

  const ownReview = useMemo(() => {
    if (!sessionUser?.id) return null;
    return reviews.find((item) => item.user_id === sessionUser.id) || null;
  }, [reviews, sessionUser]);

  const isEditing = Boolean(editingReviewId || ownReview);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0,
    );
    return total / reviews.length;
  }, [reviews]);

  const loadReviews = useCallback(async ({ silent = false } = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      setLastRefreshAt(new Date());
      if (!silent) {
        setNotice(
          "Supabase belum dikonfigurasi. Review berjalan mode demo/local dan login belum aktif.",
        );
      }
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id,user_id,username,avatar_url,body,rating,created_at,status,page_slug",
      )
      .eq("page_slug", PAGE_SLUG)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (!silent) setNotice(`Gagal load review Supabase: ${error.message}`);
    } else {
      setReviews(data || []);
      setLastRefreshAt(new Date());
      if (!silent) setNotice("");
    }

    if (silent) setRefreshing(false);
    else setLoading(false);
  }, []);

  const loadAuth = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user || null;

    setSessionUser(user);
    setProfile(user ? await ensureProfile(user) : null);
  }, []);

  useEffect(() => {
    loadAuth();
    loadReviews();

    if (!isSupabaseConfigured || !supabase) return;

    const authListener = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user || null;
        setSessionUser(user);
        setProfile(user ? await ensureProfile(user) : null);
      },
    );

    const channel = supabase
      .channel(`reviews-${PAGE_SLUG}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `page_slug=eq.${PAGE_SLUG}`,
        },
        (payload) => {
          setLastRefreshAt(new Date());

          if (payload.eventType === "INSERT") {
            if (payload.new?.status && payload.new.status !== "approved")
              return;

            setReviews((prev) => {
              if (prev.some((item) => item.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          }

          if (payload.eventType === "UPDATE") {
            if (payload.new?.status && payload.new.status !== "approved") {
              setReviews((prev) =>
                prev.filter((item) => item.id !== payload.new.id),
              );
              return;
            }

            setReviews((prev) => {
              const exists = prev.some((item) => item.id === payload.new.id);
              if (!exists) return [payload.new, ...prev];
              return prev.map((item) =>
                item.id === payload.new.id ? payload.new : item,
              );
            });
          }

          if (payload.eventType === "DELETE") {
            setReviews((prev) =>
              prev.filter((item) => item.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      authListener.data?.subscription?.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [loadAuth, loadReviews]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadReviews({ silent: true });
      }
    }, AUTO_REFRESH_MS);

    function refreshWhenActive() {
      if (document.visibilityState === "visible") {
        loadReviews({ silent: true });
      }
    }

    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [loadReviews]);

  useEffect(() => {
    if (!ownReview || editingReviewId) return;

    setRating(Number(ownReview.rating || 5));
    setBody(ownReview.body || "");
  }, [ownReview, editingReviewId]);

  function startEdit(review) {
    if (!review || review.user_id !== sessionUser?.id) return;

    setEditingReviewId(review.id);
    setRating(Number(review.rating || 5));
    setBody(review.body || "");
    setNotice("Mode edit aktif. Ubah isi review lalu klik Update Review.");
  }

  function cancelEdit() {
    setEditingReviewId("");
    if (ownReview) {
      setRating(Number(ownReview.rating || 5));
      setBody(ownReview.body || "");
    } else {
      setRating(5);
      setBody("");
    }
    setNotice("");
  }

  async function sendReview(event) {
    event.preventDefault();

    const cleanBody = body.trim();

    if (!cleanBody) {
      setNotice("Isi review dulu.");
      return;
    }

    if (!isLoggedIn || !sessionUser) {
      setNotice("Login dulu untuk menulis review.");
      return;
    }

    setSending(true);
    setNotice("");

    const payload = {
      page_slug: PAGE_SLUG,
      user_id: sessionUser.id,
      username,
      avatar_url: avatarUrl || null,
      body: cleanBody.slice(0, 500),
      rating: Number(rating),
      status: "approved",
    };

    const currentReviewId = editingReviewId || ownReview?.id;

    if (!isSupabaseConfigured || !supabase) {
      if (currentReviewId) {
        setReviews((prev) =>
          prev.map((item) =>
            item.id === currentReviewId
              ? {
                  ...item,
                  ...payload,
                  created_at: item.created_at || new Date().toISOString(),
                }
              : item,
          ),
        );
      } else {
        setReviews((prev) => [
          {
            id: `local-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setEditingReviewId("");
      setSending(false);
      setLastRefreshAt(new Date());
      setNotice(
        currentReviewId
          ? "Review mode demo berhasil diupdate."
          : "Review masuk mode demo/local. Supabase belum aktif.",
      );
      return;
    }

    if (currentReviewId) {
      const { error } = await supabase
        .from("reviews")
        .update({
          username: payload.username,
          avatar_url: payload.avatar_url,
          body: payload.body,
          rating: payload.rating,
          status: payload.status,
        })
        .eq("id", currentReviewId)
        .eq("user_id", sessionUser.id);

      if (error) {
        setNotice(`Gagal update review: ${error.message}`);
      } else {
        setEditingReviewId("");
        setNotice("Review berhasil diupdate.");
        await loadReviews({ silent: true });
      }

      setSending(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert(payload);

    if (error) {
      if (
        String(error.message || "")
          .toLowerCase()
          .includes("duplicate")
      ) {
        setNotice(
          "Akun ini sudah pernah membuat review. Gunakan tombol Edit untuk mengubah review kamu.",
        );
      } else {
        setNotice(`Gagal kirim review: ${error.message}`);
      }
    } else {
      setNotice(
        "Review berhasil dikirim. Satu akun hanya bisa membuat satu review.",
      );
      await loadReviews({ silent: true });
    }

    setSending(false);
  }

  function askDeleteReview(review) {
    if (!review || review.user_id !== sessionUser?.id) return;
    setPendingDeleteReview(review);
  }

  function closeDeletePopup() {
    if (deletingId) return;
    setPendingDeleteReview(null);
  }

  async function confirmDeleteReview() {
    const review = pendingDeleteReview;
    if (!review || review.user_id !== sessionUser?.id) return;

    setDeletingId(review.id);
    setNotice("");

    if (!isSupabaseConfigured || !supabase) {
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
      setBody("");
      setRating(5);
      setEditingReviewId("");
      setDeletingId("");
      setPendingDeleteReview(null);
      setLastRefreshAt(new Date());
      setNotice("Review mode demo berhasil dihapus.");
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", review.id)
      .eq("user_id", sessionUser.id);

    if (error) {
      setNotice(`Gagal hapus review: ${error.message}`);
    } else {
      setBody("");
      setRating(5);
      setEditingReviewId("");
      setPendingDeleteReview(null);
      setNotice("Review berhasil dihapus. Kamu bisa membuat review baru lagi.");
      await loadReviews({ silent: true });
    }

    setDeletingId("");
  }

  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="innerHero reviewHero">
        <div className="heroBadge">
          <MessageSquareText size={16} />
          Review MgreSV
        </div>
        <h1>Komentar dan rating pengguna MgreSV.</h1>
        <p>
          Lihat pendapat pengguna lain tentang pengalaman mereka pakai MgreSV.
        </p>
      </section>

      <RatingSummary
        averageRating={averageRating}
        reviews={reviews}
        lastRefreshAt={lastRefreshAt}
        refreshing={refreshing}
        onRefresh={() => loadReviews({ silent: true })}
      />

      <section className="reviewLayout">
        <form className="reviewForm" onSubmit={sendReview}>
          <div className="formHead">
            <Sparkles size={18} />
            <b>{isEditing ? "Edit Review" : "Tulis Review"}</b>
          </div>

          {isLoggedIn ? (
            <div className="reviewLoggedUser">
              <div className="reviewAvatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} />
                ) : (
                  <span>{username.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <b>{username}</b>
                <span>
                  {ownReview
                    ? "Akun ini sudah punya review. Kamu bisa update atau hapus."
                    : "Akun ini belum punya review. Kamu bisa membuat."}
                </span>
              </div>
            </div>
          ) : (
            <div className="loginRequiredBox">
              <UserRound size={22} />
              <div>
                <b>Login dulu untuk review.</b>
                <span>Review wajib login.</span>
              </div>
              <Link href="/login?redirect=/review">
                <LogIn size={16} />
                Login
              </Link>
            </div>
          )}

          <label>
            Rating
            <div className="ratingPicker">
              {[1, 2, 3, 4, 5].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    item <= rating ? "ratingPick active" : "ratingPick"
                  }
                  onClick={() => setRating(item)}
                  aria-label={`${item} bintang`}
                  disabled={!isLoggedIn}
                >
                  <FaStar size={18} />
                </button>
              ))}
            </div>
          </label>

          <label>
            Review
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={
                isLoggedIn
                  ? "Tulis komentar atau masukan untuk MgreSV..."
                  : "Login dulu untuk menulis review."
              }
              maxLength={500}
              disabled={!isLoggedIn}
            />
          </label>

          <div className="reviewFormActions">
            <button className="reviewSubmit" disabled={sending || !isLoggedIn}>
              {sending ? (
                <Loader2 className="spin" size={17} />
              ) : (
                <Send size={17} />
              )}
              {sending
                ? "Menyimpan..."
                : isEditing
                  ? "Update Review"
                  : "Kirim Review"}
            </button>

            {isEditing ? (
              <button
                type="button"
                className="reviewCancelBtn"
                onClick={cancelEdit}
              >
                <X size={17} />
                Batal
              </button>
            ) : null}
          </div>

          {notice ? <p className="reviewNotice">{notice}</p> : null}
        </form>

        <div className="reviewList">
          {loading ? (
            <div className="reviewLoading">
              <Loader2 className="spin" size={22} />
              Memuat review...
            </div>
          ) : null}

          {reviews.map((review) => {
            const reviewName = review.username || review.name || "Guest";
            const isMine = Boolean(
              sessionUser?.id && review.user_id === sessionUser.id,
            );

            return (
              <article
                className={isMine ? "reviewItem mine" : "reviewItem"}
                key={review.id}
              >
                <div className="reviewItemTop">
                  <div className="reviewAvatar">
                    {review.avatar_url ? (
                      <img src={review.avatar_url} alt={reviewName} />
                    ) : (
                      <span>{reviewName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <b>{reviewName}</b>
                    <span>
                      {new Date(review.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {isMine ? (
                    <span className="mineBadge">Review kamu</span>
                  ) : null}
                </div>

                <RatingStars value={Number(review.rating || 0)} />

                <p>{review.body}</p>

                {isMine ? (
                  <div className="reviewOwnerActions">
                    <button type="button" onClick={() => startEdit(review)}>
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => askDeleteReview(review)}
                      disabled={deletingId === review.id}
                    >
                      {deletingId === review.id ? (
                        <Loader2 className="spin" size={15} />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Hapus
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {pendingDeleteReview ? (
        <div
          className="appModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi hapus review"
        >
          <div className="appModalCard deleteReviewModal">
            <button
              type="button"
              className="appModalClose"
              onClick={closeDeletePopup}
              aria-label="Tutup popup"
              disabled={Boolean(deletingId)}
            >
              <X size={18} />
            </button>

            <div className="appModalIcon danger">
              <AlertTriangle size={30} />
            </div>

            <h2>Hapus review kamu?</h2>
            <p>
              Review ini akan dihapus dari halaman MgreSV. Setelah dihapus, kamu
              bisa membuat review baru lagi dari akun ini.
            </p>

            <div className="deletePreviewBox">
              <b>{pendingDeleteReview.username || "Review kamu"}</b>
              <span>{pendingDeleteReview.body}</span>
            </div>

            <div className="appModalActions">
              <button
                type="button"
                className="modalGhostBtn"
                onClick={closeDeletePopup}
                disabled={Boolean(deletingId)}
              >
                Batal
              </button>

              <button
                type="button"
                className="modalDangerBtn"
                onClick={confirmDeleteReview}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? (
                  <Loader2 className="spin" size={17} />
                ) : (
                  <Trash2 size={17} />
                )}
                {deletingId ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
