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
  const youtubeId = getYoutubeId(url)

  let title = directType ? "Direct media file" : "Media siap dicoba"
  let thumbnail = null

  if (youtubeId) {
    thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    title = "YouTube media"
  }

  if (directType === "photo") {
    thumbnail = url
    title = "Direct image file"
  }

  if (directType === "video") title = "Direct video file"
  if (directType === "audio") title = "Direct audio file"

  return NextResponse.json({
    ok: true,
    title,
    platform,
    source: url,
    directType,
    thumbnail,
    suggestedGroup: directType || "video",
    note: "Provider utama: Cobalt API jika diset. Fallback: direct file dan yt-dlp worker."
  })
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value)
    return ["http:", "https:"].includes(parsed.protocol)
  } catch {
    return false
  }
}

function detectPlatform(value) {
  const url = value.toLowerCase()
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
