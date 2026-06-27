import { NextResponse } from "next/server"

export async function POST(req) {
  const body = await req.json()
  const url = String(body.url || "").trim()
  const selectedPlatform = String(body.platform || "auto").trim()

  if (!isValidUrl(url)) {
    return NextResponse.json({ ok: false, error: "Link tidak valid." }, { status: 400 })
  }

  const platform = selectedPlatform === "auto" ? detectPlatform(url) : selectedPlatform
  const directType = detectDirectMedia(url)
  const blockReason = getConvertBlockReason(url, platform, directType)

  if (blockReason) {
    return NextResponse.json({
      ok: false,
      blocked: true,
      platform,
      error: blockReason
    }, { status: 422 })
  }

  const youtubeId = getYoutubeId(url)
  const profile = detectMediaProfile(url, platform, directType)

  let title = profile.title || "Media siap dicoba"
  let thumbnail = null
  let slides = []

  if (youtubeId) {
    thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    title = profile.linkKind === "music" ? "YouTube audio/music" : "YouTube media"
  }

  if (directType === "photo") {
    thumbnail = url
    title = "Direct image file"
    slides = [{
      index: 0,
      type: "photo",
      url,
      thumbnail: url,
      filename: "direct-image"
    }]
  }

  if (directType === "video") title = "Direct video file"
  if (directType === "audio") title = "Direct audio file"

  const inspected = await inspectFromWorker(url)

  if (inspected?.ok) {
    if (inspected.title) title = inspected.title
    const normalizedSlides = normalizeSlides(inspected.slides || [])
    slides = normalizedSlides.length ? normalizedSlides : slides
    thumbnail = inspected.thumbnail || slides.find((item) => item.thumbnail)?.thumbnail || thumbnail
  }

  const hasPhotoSlides = slides.some((item) => item.type === "photo")
  const hasManySlides = slides.length > 1

  const allowedTabs = hasPhotoSlides
    ? unique(["photo", ...profile.allowedTabs])
    : profile.allowedTabs

  const suggestedGroup = hasPhotoSlides ? "photo" : profile.suggestedGroup
  const note = hasManySlides
    ? `Terdeteksi ${slides.length} media/slide. Kamu bisa download per slide atau download semua slide sekaligus.`
    : profile.note

  return NextResponse.json({
    ok: true,
    title,
    platform,
    source: url,
    directType,
    linkKind: hasManySlides ? "carousel" : profile.linkKind,
    allowedTabs,
    thumbnail,
    slides,
    suggestedGroup,
    note
  }, {
    headers: { "cache-control": "no-store" }
  })
}

async function inspectFromWorker(url) {
  const workerUrl = process.env.DOWNLOADER_WORKER_URL
  const workerToken = process.env.DOWNLOADER_WORKER_TOKEN

  if (!workerUrl) return null

  try {
    const inspectUrl = makeWorkerEndpoint(workerUrl, "/api/inspect")
    const response = await fetch(inspectUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(workerToken ? { authorization: `Bearer ${workerToken}` } : {})
      },
      body: JSON.stringify({ url }),
      cache: "no-store"
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) return null
    return data
  } catch {
    return null
  }
}

function makeWorkerEndpoint(workerUrl, path) {
  const clean = String(workerUrl || "").replace(/\/$/, "")
  if (clean.endsWith("/api/download")) return clean.replace(/\/api\/download$/, path)
  return clean + path
}

function normalizeSlides(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item, index) => {
      const type = normalizeSlideType(item?.type)
      const url = typeof item?.url === "string" ? item.url : ""
      const thumbnail = item?.thumbnail || item?.thumb || (type === "photo" ? url : "")

      return {
        index,
        type,
        url,
        thumbnail,
        filename: item?.filename || `slide-${index + 1}`
      }
    })
    .filter((item) => isValidUrl(item.url))
}

function normalizeSlideType(value) {
  const type = String(value || "").toLowerCase()
  if (type === "image" || type === "photo" || type === "gif") return "photo"
  if (type === "video") return "video"
  if (type === "audio") return "audio"
  return "photo"
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value)
    return ["http:", "https:"].includes(parsed.protocol)
  } catch {
    return false
  }
}

function detectMediaProfile(value, platform, directType) {
  const lower = value.toLowerCase()

  if (directType === "audio") {
    return {
      linkKind: "audio",
      allowedTabs: ["audio"],
      suggestedGroup: "audio",
      title: "Audio file",
      note: "Link ini terdeteksi sebagai audio. Format yang ditampilkan hanya Audio."
    }
  }

  if (directType === "photo") {
    return {
      linkKind: "photo",
      allowedTabs: ["photo"],
      suggestedGroup: "photo",
      title: "Image file",
      note: "Link ini terdeteksi sebagai foto/gambar. Format yang ditampilkan hanya Foto."
    }
  }

  if (directType === "video") {
    return {
      linkKind: "video",
      allowedTabs: ["video", "audio"],
      suggestedGroup: "video",
      title: "Video file",
      note: "Link ini terdeteksi sebagai video. Kamu bisa download Video atau ambil Audionya."
    }
  }

  if (isTikTokMusicUrl(value) || isYouTubeMusicUrl(value) || isInstagramAudioUrl(value) || isSpotifyUrl(value) || isAppleMusicUrl(value) || platform === "soundcloud") {
    return {
      linkKind: "music",
      allowedTabs: ["audio"],
      suggestedGroup: "audio",
      title: platform === "soundcloud" ? "SoundCloud audio" : "Music / sound link",
      note: "Link ini terdeteksi sebagai musik/audio. Format yang ditampilkan hanya Audio."
    }
  }

  if (platform === "youtube" || platform === "tiktok" || platform === "facebook" || platform === "x" || platform === "vimeo") {
    return {
      linkKind: "video",
      allowedTabs: ["video", "audio"],
      suggestedGroup: "video",
      title: "Video media",
      note: "Link ini terdeteksi sebagai video. Kamu bisa download Video atau ambil Audionya."
    }
  }

  if (platform === "instagram") {
    if (lower.includes("/reel/") || lower.includes("/reels/")) {
      return {
        linkKind: "video",
        allowedTabs: ["video", "audio"],
        suggestedGroup: "video",
        title: "Instagram Reel",
        note: "Link ini terdeteksi sebagai Reel/video. Kamu bisa download Video atau ambil Audionya."
      }
    }

    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video", "audio"],
      suggestedGroup: "photo",
      title: "Instagram post",
      note: "Post Instagram bisa berupa foto, video, atau carousel. Pilih format sesuai isi post."
    }
  }

  if (platform === "pinterest") {
    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video"],
      suggestedGroup: "photo",
      title: "Pinterest media",
      note: "Pinterest bisa berupa foto atau video. Pilih format sesuai isi pin."
    }
  }

  if (platform === "reddit" || platform === "threads") {
    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video", "audio"],
      suggestedGroup: "video",
      title: "Social media post",
      note: "Link ini bisa berisi foto, video, atau media campuran. Pilih format sesuai isi post."
    }
  }

  return {
    linkKind: "mixed",
    allowedTabs: ["video", "audio", "photo"],
    suggestedGroup: "video",
    title: "Media siap dicoba",
    note: "Sistem akan menyesuaikan hasil berdasarkan isi link yang bisa dibaca provider."
  }
}

function detectPlatform(value) {
  const url = value.toLowerCase()
  if (url.includes("music.youtube.com")) return "youtube"
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("tiktok.com")) return "tiktok"
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook"
  if (url.includes("twitter.com") || url.includes("x.com")) return "x"
  if (url.includes("threads.net")) return "threads"
  if (url.includes("pinterest.") || url.includes("pin.it")) return "pinterest"
  if (url.includes("soundcloud.com")) return "soundcloud"
  if (url.includes("reddit.com")) return "reddit"
  if (url.includes("vimeo.com")) return "vimeo"
  return "direct"
}

function detectDirectMedia(value) {
  const clean = value.split("?")[0].toLowerCase()
  if (clean.match(/\.(mp4|webm|mkv|mov|avi|m4v|3gp|flv)$/)) return "video"
  if (clean.match(/\.(mp3|m4a|wav|aac|flac|ogg|opus)$/)) return "audio"
  if (clean.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff|avif)$/)) return "photo"
  return null
}

function isTikTokMusicUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.includes("tiktok.com") && parsed.pathname.includes("/music/")
  } catch {
    return false
  }
}

function isYouTubeMusicUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.includes("music.youtube.com")
  } catch {
    return false
  }
}

function isInstagramAudioUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.includes("instagram.com") &&
      (parsed.pathname.includes("/reels/audio/") || parsed.pathname.includes("/audio/"))
  } catch {
    return false
  }
}

function isSpotifyUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.includes("spotify.com")
  } catch {
    return false
  }
}

function isAppleMusicUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.includes("music.apple.com")
  } catch {
    return false
  }
}

function getConvertBlockReason(value, platform, directType) {
  if (directType) return null

  if (isTikTokMusicUrl(value)) {
    return "Link TikTok Music/Sound belum bisa diunduh langsung. Buka sound tersebut, pilih salah satu video yang memakai sound itu, lalu paste link videonya dan pilih tab Audio."
  }

  if (isInstagramAudioUrl(value)) {
    return "Link halaman audio Instagram belum bisa diunduh langsung. Pakai link Reel/Post yang memakai audio tersebut, lalu pilih tab Audio."
  }

  if (isSpotifyUrl(value)) {
    return "Spotify tidak didukung untuk download langsung karena butuh login/DRM. Gunakan link audio publik lain atau direct MP3."
  }

  if (isAppleMusicUrl(value)) {
    return "Apple Music tidak didukung untuk download langsung karena butuh login/DRM. Gunakan link audio publik lain atau direct MP3."
  }

  if (isYouTubeMusicUrl(value) && !getYoutubeId(value)) {
    return "Link YouTube Music ini tidak punya video ID yang bisa diproses. Pakai link lagu yang ada parameter v= atau link YouTube video biasa."
  }

  return null
}

function getYoutubeId(value) {
  try {
    const parsed = new URL(value)
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.replace("/", "").split("?")[0] || null
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v")
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/)
      if (shortsMatch) return shortsMatch[1]
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/)
      if (embedMatch) return embedMatch[1]
    }
    return null
  } catch {
    return null
  }
}
