import { NextResponse } from "next/server"

function cleanSlidesForWeb(slides, platform) {
  const items = Array.isArray(slides) ? slides : []
  const output = []
  const seen = new Set()

  for (const item of items) {
    const rawUrl = item?.url || item?.thumbnail || ""
    const rawThumbnail = item?.thumbnail || item?.url || ""
    const url = isValidUrl(rawUrl) ? rawUrl : isValidUrl(rawThumbnail) ? rawThumbnail : ""
    const thumbnail = isValidUrl(rawThumbnail) ? rawThumbnail : url
    if (isSocialPostPageUrl(url) || isSocialPostPageUrl(thumbnail)) continue
    if (!isProbablyImageUrl(url) && !isProbablyImageUrl(thumbnail)) continue

    const identity = mediaIdentity(url || thumbnail, platform)
    if (seen.has(identity)) continue

    seen.add(identity)
    output.push({
      ...item,
      index: output.length,
      url,
      thumbnail,
      filename: item?.filename || `${platform || "slide"}-${output.length + 1}.${guessImageExtForWeb(url || thumbnail)}`
    })
  }

  if (platform === "instagram") {
    const grouped = []
    const groupSeen = new Set()

    for (const item of output) {
      const identity = instagramMediaIdentity(item.url || item.thumbnail)
      if (groupSeen.has(identity)) continue
      groupSeen.add(identity)
      grouped.push({
        ...item,
        index: grouped.length,
        filename: `instagram-${grouped.length + 1}.${guessImageExtForWeb(item.url || item.thumbnail)}`
      })
    }

    return grouped.slice(0, 10)
  }

  if (platform === "tiktok") {
    return output.filter((item) => {
      const value = String(item.url || item.thumbnail || "").toLowerCase()
      return !value.includes("mime_type=audio") &&
        !value.includes("audio_mpeg") &&
        !value.includes("/video/tos/")
    }).map((item, index) => ({
      ...item,
      index,
      filename: `tiktok-${index + 1}.${guessImageExtForWeb(item.url || item.thumbnail)}`
    }))
  }

  return output.slice(0, 12)
}

function mediaIdentity(value, platform) {
  const url = String(value || "")
  if (platform === "instagram") return instagramMediaIdentity(url)
  if (platform === "tiktok") return tiktokMediaIdentity(url)
  return url.replace(/[?#].*$/, "").toLowerCase()
}

function instagramMediaIdentity(value) {
  const clean = String(value || "")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .split("?")[0]
    .toLowerCase()

  const file = clean.split("/").pop() || clean
  const numeric = file.match(/(\d{8,})/)
  if (numeric?.[1]) return numeric[1]

  const named = file.match(/([^/]+?)\.(jpg|jpeg|png|webp|avif|heic)$/i)
  if (named?.[1]) return named[1]

  return clean
}

function tiktokMediaIdentity(value) {
  // TikTok photo-mode CDN URLs can share very similar paths and differ in the
  // signed query. Stripping the query can collapse many slides into one card.
  // Keep the full normalized signed URL as identity so all carousel photos stay visible.
  return String(value || "")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .replaceAll("\\/", "/")
    .trim()
    .toLowerCase()
}

function guessImageExtForWeb(value) {
  const match = String(value || "").toLowerCase().match(/\.(jpg|jpeg|png|webp|avif|heic)(\?|$)/)
  return match?.[1] || "jpg"
}


export async function POST(req) {
  const body = await req.json()
  const url = String(body.url || "").trim()
  const selectedPlatform = String(body.platform || "auto").trim()

  if (!isValidUrl(url)) {
    return NextResponse.json({ ok: false, error: "Link tidak valid." }, { status: 400 })
  }

  const platform = selectedPlatform === "auto" ? detectPlatform(url) : selectedPlatform
  const directType = detectDirectMedia(url)
  const knownPhotoPost = isKnownPhotoPostUrl(url)
  const forceUrlVideoMode = isKnownVideoPostUrl(url, platform)
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
  const extractor = directType ? null : await extractFromExtractor(url)
  const extractorKind = extractor?.kind || null
  const directVideoUrl = firstValidDirectVideoUrl(extractor?.videoUrls || [])
  const directAudioUrl = firstValidDirectAudioUrl(extractor?.audioUrls || [])
  const forceUrlPhotoMode = !forceUrlVideoMode && (knownPhotoPost || directType === "photo")
  const profile = forceUrlVideoMode
    ? videoProfileFromUrl(url, platform)
    : extractor?.ok
      ? profileFromExtractor(extractor)
      : forceUrlPhotoMode
        ? photoProfileFromUrl(url, platform)
        : detectMediaProfile(url, platform, directType)

  let title = extractor?.title || profile.title || "Media siap dicoba"
  let thumbnail = extractor?.thumbnail || null
  let slides = normalizeSlides(extractor?.slides || [])

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

  if (platform === "tiktok" && forceUrlPhotoMode) {
    const providerTikTok = await extractTikTokPhotoViaPublicProviders(url)
    if (providerTikTok?.slides?.length) {
      const providerSlides = normalizeSlides(providerTikTok.slides || [])
      if (providerSlides.length >= slides.length) {
        slides = providerSlides
      }
      if (isProbablyImageUrl(providerTikTok.thumbnail)) {
        thumbnail = providerTikTok.thumbnail
      } else if (!isProbablyImageUrl(thumbnail)) {
        thumbnail = providerSlides[0]?.thumbnail || providerSlides[0]?.url || thumbnail
      }
      if (providerTikTok.title && !isBadMediaTitle(providerTikTok.title)) {
        title = providerTikTok.title
      }
    }
  }

  const shouldInspectWorker =
    !directType &&
    (
      !extractor?.ok ||
      (
        !forceUrlVideoMode &&
        (
          forceUrlPhotoMode ||
          (platform === "tiktok" && (knownPhotoPost || extractorKind === "photo" || profile.linkKind !== "video"))
        ) &&
        (!slides.length || !isProbablyImageUrl(thumbnail))
      ) ||
      (
        !forceUrlVideoMode &&
        !directVideoUrl &&
        !directAudioUrl &&
        !slides.length &&
        !isProbablyImageUrl(thumbnail)
      )
    )

  const inspected = shouldInspectWorker ? await inspectFromWorker(url) : null

  if (inspected?.ok) {
    if (inspected.title) title = inspected.title
    const normalizedSlides = normalizeSlides(inspected.slides || [])
    slides = normalizedSlides.length ? normalizedSlides : slides
    thumbnail = inspected.thumbnail || slides.find((item) => item.thumbnail)?.thumbnail || thumbnail
  }

  const expectedTikTokSlideCount = getExpectedSlideCount(title, extractor?.title, inspected?.title, profile?.title)
  const shouldTryTikTokPageScrape =
    platform === "tiktok" &&
    !forceUrlVideoMode &&
    (knownPhotoPost || extractorKind === "photo" || profile.linkKind !== "video") &&
    (
      !slides.length ||
      slides.length <= 1 ||
      !isProbablyImageUrl(thumbnail) ||
      (expectedTikTokSlideCount && slides.length < expectedTikTokSlideCount)
    )

  if (shouldTryTikTokPageScrape) {
    const scrapedTikTok = await scrapeTikTokPhotoPost(url)

    if (scrapedTikTok) {
      const scrapedSlides = normalizeSlides(scrapedTikTok.slides || [])
      if (scrapedTikTok.title && (!title || title === "Media siap dicoba")) {
        title = scrapedTikTok.title
      }
      if (scrapedSlides.length) {
        slides = scrapedSlides
      }
      if (scrapedTikTok.thumbnail) {
        thumbnail = scrapedTikTok.thumbnail
      }
    }
  }

  slides = cleanSlidesForWeb(slides, platform)

  const profileVideoMode = forceUrlVideoMode || extractorKind === "video" || profile.linkKind === "video" || profile.suggestedGroup === "video"

  if (profileVideoMode) {
    slides = []
  }

  thumbnail = isProbablyImageUrl(thumbnail)
    ? thumbnail
    : slides.find((item) => item.thumbnail)?.thumbnail ||
      slides.find((item) => item.url)?.url ||
      (isSocialPostPageUrl(thumbnail) ? null : thumbnail)

  if (!profileVideoMode && (extractorKind === "photo" || forceUrlPhotoMode) && !slides.length && isProbablyImageUrl(thumbnail)) {
    slides = [{
      index: 0,
      type: "photo",
      url: thumbnail,
      thumbnail,
      filename: `${platform || "photo"}-1.${guessImageExtForWeb(thumbnail)}`
    }]
  }

  title = sanitizeDisplayTitle(title, platform, profileVideoMode ? "video" : (extractorKind === "photo" || forceUrlPhotoMode ? "photo" : "media"))

  const hasPhotoSlides = slides.some((item) => item.type === "photo")
  const hasManySlides = slides.length > 1
  const extractorPhotoMode = !profileVideoMode && (extractorKind === "photo" || forceUrlPhotoMode)

  const allowedTabs = profileVideoMode
    ? (profile.allowedTabs || ["video", "audio"]).filter((tab) => tab !== "photo")
    : extractorPhotoMode
      ? ["photo"]
      : hasPhotoSlides
        ? unique(["photo", ...profile.allowedTabs])
        : profile.allowedTabs

  const suggestedGroup = profileVideoMode ? "video" : extractorPhotoMode ? "photo" : hasPhotoSlides ? "photo" : profile.suggestedGroup
  const note = profileVideoMode
    ? profile.note
    : extractorPhotoMode
    ? slides.length
      ? `Terdeteksi ${slides.length} foto/slide. Kamu bisa download per slide atau semua foto sekaligus.`
      : "Link terdeteksi sebagai foto/slide, tapi foto asli belum bisa dibaca otomatis."
    : hasManySlides
      ? `Terdeteksi ${slides.length} media/slide. Kamu bisa download per slide atau download semua slide sekaligus.`
      : profile.note

  return NextResponse.json({
    ok: true,
    title,
    platform,
    source: url,
    directVideoUrl,
    directAudioUrl,
    directType,
    linkKind: profileVideoMode ? "video" : extractorPhotoMode ? "carousel" : hasManySlides ? "carousel" : profile.linkKind,
    allowedTabs,
    thumbnail,
    slides,
    suggestedGroup,
    note
  }, {
    headers: { "cache-control": "no-store" }
  })
}


function isSocialPostPageUrl(value) {
  try {
    const parsed = new URL(String(value || ""))
    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname.toLowerCase()

    // Never treat public post pages as downloadable images. This was the
    // root cause of TikTok /photo/ links appearing as one broken slide.
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      return path.includes("/@") ||
        path.includes("/photo/") ||
        path.includes("/video/") ||
        path.includes("/embed/") ||
        path.includes("/music/") ||
        path.includes("/tag/")
    }

    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return /^\/(p|reel|reels|tv|stories)\//.test(path)
    }

    if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") {
      return /\/(watch|videos|photo|posts|permalink|story\.php|share)\b/.test(path) || host === "fb.watch"
    }

    if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com")) {
      return /\/status\//.test(path)
    }

    if (host === "pin.it" || host.endsWith(".pinterest.com") || host.includes("pinterest.")) {
      return host === "pin.it" || /\/pin\//.test(path)
    }

    return false
  } catch {
    return false
  }
}


function firstValidDirectVideoUrl(items) {
  const list = Array.isArray(items) ? items : []
  return list.find((item) => detectDirectMedia(item) === "video" || isProbablyVideoUrl(item)) || ""
}

function isProbablyVideoUrl(value) {
  const full = String(value || "").toLowerCase()
  const clean = full.split("?")[0]

  if (!full.startsWith("http")) return false
  if (/mime_type=audio|audio_mpeg|audio_mp4|\.mp3(\?|$)|\.m4a(\?|$)|\.ogg(\?|$)|\.wav(\?|$)/.test(full)) return false
  if (/avatar|profile|emoji|icon|logo|sprite|glyph|favicon/.test(full)) return false

  return /\.(mp4|webm|mkv|mov|avi|m4v|3gp|flv)$/.test(clean) ||
    /mime_type=video|video_mp4|playaddr|downloadaddr|video_versions|video_url|dash_url|\/video\//.test(full) ||
    (/(cdninstagram|fbcdn|fbsbx|scontent|twimg)/.test(full) && /video|\.mp4|\/v\//.test(full)) || (/pinimg/.test(full) && /video|videos|\.mp4|\.m3u8/.test(full))
}

function firstValidDirectAudioUrl(items) {
  const list = Array.isArray(items) ? items : []
  return list.find((item) => detectDirectMedia(item) === "audio") || ""
}

function isKnownPhotoPostUrl(value) {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname.toLowerCase()

    if (host.includes("tiktok.com") && (path.includes("/photo/") || path.includes("/image/") || path.includes("/slide/"))) return true
    // Instagram /p/ can be photo, carousel, OR video. Do not force it to photo from URL only.
    if (host.includes("facebook.com")) {
      if (path.includes("/watch") || path.includes("/videos/") || path.includes("/share/v/")) return false
      if (path.includes("/share/p/") || path.includes("/photo") || path.includes("/posts/") || path.includes("/permalink/") || path.includes("/story.php")) return true
    }

    // Threads /post/ can be photo OR video. Do not force it to photo from URL only.
    if (host.includes("pinterest.") || host.includes("pin.it")) return true

    return false
  } catch {
    return false
  }
}

function isKnownVideoPostUrl(value, platform = "auto") {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname.toLowerCase()

    if (host.includes("tiktok.com")) {
      if (path.includes("/photo/")) return false
      if (path.includes("/video/") || path.includes("/@") && path.includes("/video/")) return true
    }

    if (host.includes("instagram.com")) {
      if (
        path.includes("/reel/") ||
        path.includes("/reels/") ||
        path.includes("/tv/") ||
        path.includes("/share/reel/") ||
        path.includes("/share/reels/")
      ) return true
    }

    if (host.includes("facebook.com") || host.includes("fb.watch")) {
      if (path.includes("/watch") || path.includes("/videos/") || path.includes("/share/v/")) return true
    }

    return false
  } catch {
    return false
  }
}

function videoProfileFromUrl(url, platform) {
  const label = prettyPlatform(platform)
  return {
    linkKind: "video",
    title: platform === "tiktok" ? "TikTok video media" : `${label} video media`,
    allowedTabs: ["video", "audio"],
    suggestedGroup: "video",
    note: "Link ini terdeteksi sebagai video. Kamu bisa download Video atau ambil Audionya."
  }
}

function photoProfileFromUrl(url, platform) {
  const label = prettyPlatform(platform)
  return {
    linkKind: "carousel",
    title: platform === "tiktok" ? "TikTok photo/slide media" : `${label} photo/slide media`,
    allowedTabs: ["photo"],
    suggestedGroup: "photo",
    note: "Link ini terdeteksi sebagai foto/slide."
  }
}


function isProbablyImageUrl(value) {
  const url = String(value || "").toLowerCase()
  if (!url || !isValidUrl(value)) return false
  if (isSocialPostPageUrl(value)) return false
  if (isTikTokNonMediaHost(value)) return false
  if (/pinterest\.[^/]+\/pin\//.test(url) || /pin\.it\//.test(url)) return false
  if (/\/fallbacks\//.test(url)) return false

  const badParts = [
    "mime_type=audio",
    "audio_mpeg",
    "audio_mp4",
    "mime_type=video",
    ".mp4",
    ".mp3",
    ".m4a",
    ".m3u8",
    "/video/tos/"
  ]

  if (badParts.some((part) => url.includes(part))) return false

  const goodParts = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
    ".heic",
    "photomode",
    "tplv-photomode",
    "image",
    "photo",
    "scontent",
    "cdninstagram",
    "fbcdn",
    "tiktokcdn",
    "byteimg",
    "ibytedtos",
    "ibyteimg",
    "bytegd",
    "tiktokv",
    "bytegecko",
    "heic",
    "fbsbx",
    "imgur",
    "preview.redd.it",
    "i.redd.it",
    "redditmedia",
    "pinimg",
    "pbs.twimg",
    "twimg",
    "api.apify.com/v2/key-value-stores",
    "/records/"
  ]

  return goodParts.some((part) => url.includes(part))
}



async function extractFromExtractor(url) {
  const extractorUrl = cleanEnvValue(process.env.MEDIA_EXTRACTOR_URL)
  const extractorToken = cleanEnvValue(process.env.MEDIA_EXTRACTOR_TOKEN)

  if (!extractorUrl) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 28000)

  try {
    const response = await fetch(`${String(extractorUrl).replace(/\/$/, "")}/extract`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(extractorToken ? { authorization: `Bearer ${extractorToken}` } : {})
      },
      body: JSON.stringify({ url }),
      cache: "no-store",
      signal: controller.signal
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) return null
    return data
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function profileFromExtractor(extractor) {
  const kind = extractor?.kind || "video"
  const platform = extractor?.platform || "media"
  const label = prettyPlatform(platform)

  if (kind === "photo") {
    return {
      linkKind: "carousel",
      title: extractor?.title || `${label} photo/slide media`,
      allowedTabs: ["photo"],
      suggestedGroup: "photo",
      note: "Link ini terdeteksi sebagai foto/slide."
    }
  }

  if (kind === "audio") {
    return {
      linkKind: "music",
      title: extractor?.title || `${label} audio media`,
      allowedTabs: ["audio"],
      suggestedGroup: "audio",
      note: "Link ini terdeteksi sebagai audio."
    }
  }

  return {
    linkKind: "video",
    title: extractor?.title || `${label} video media`,
    allowedTabs: ["audio", "video"],
    suggestedGroup: "video",
    note: "Link ini terdeteksi sebagai video. Kamu bisa download Video atau ambil Audionya."
  }
}

function prettyPlatform(value) {
  const map = {
    tiktok: "TikTok",
    instagram: "Instagram",
    youtube: "YouTube",
    facebook: "Facebook",
    pinterest: "Pinterest",
    threads: "Threads",
    x: "X/Twitter"
  }

  return map[value] || "Media"
}


async function inspectFromWorker(url) {
  const workerUrl = cleanEnvValue(process.env.DOWNLOADER_WORKER_URL)
  const workerToken = cleanEnvValue(process.env.DOWNLOADER_WORKER_TOKEN)

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



async function extractTikTokPhotoViaPublicProviders(inputUrl) {
  const attempts = [
    () => extractTikTokPhotoViaTikwm(inputUrl),
    () => extractTikTokPhotoViaApify(inputUrl)
  ]

  for (const attempt of attempts) {
    try {
      const result = await attempt()
      const slides = normalizeSlides(result?.slides || [])
        .filter((item) => isProbablyImageUrl(item.url || item.thumbnail))

      if (slides.length) {
        return {
          title: sanitizeDisplayTitle(result?.title, "tiktok", "photo"),
          thumbnail: isProbablyImageUrl(result?.thumbnail) ? result.thumbnail : slides[0]?.thumbnail || slides[0]?.url || "",
          slides,
          provider: result?.provider || "public-provider"
        }
      }
    } catch {
      // Try next provider.
    }
  }

  return null
}

async function extractTikTokPhotoViaTikwm(inputUrl) {
  const endpoints = [
    `https://www.tikwm.com/api/?url=${encodeURIComponent(inputUrl)}&hd=1`,
    `https://tikwm.com/api/?url=${encodeURIComponent(inputUrl)}&hd=1`,
    `https://www.tikwm.com/api/?url=${encodeURIComponent(inputUrl)}`,
    `https://tikwm.com/api/?url=${encodeURIComponent(inputUrl)}`
  ]

  for (const endpoint of endpoints) {
    const data = await fetchJsonWithTimeout(endpoint, {
      headers: {
        ...tiktokPageHeaders(inputUrl),
        accept: "application/json,text/plain,*/*",
        referer: "https://www.tikwm.com/"
      },
      timeoutMs: 15000
    }).catch(() => null)

    const normalized = normalizeTikTokPhotoProviderData(data?.data || data, "tikwm")
    if (normalized?.slides?.length) return normalized
  }

  return null
}

async function extractTikTokPhotoViaApify(inputUrl) {
  const token = cleanEnvValue(process.env.APIFY_TOKEN || "")
  if (!token) return null

  const actors = unique([
    cleanEnvValue(process.env.APIFY_TIKTOK_SLIDESHOW_ACTOR || "maximedupre/tiktok-slideshow-downloader"),
    cleanEnvValue(process.env.APIFY_TIKTOK_ACTOR || "clockworks/tiktok-scraper"),
    ...String(process.env.APIFY_TIKTOK_ACTOR_BACKUP || "clockworks/tiktok-video-scraper,apidojo/tiktok-scraper")
      .split(",")
      .map((item) => cleanEnvValue(item))
      .filter(Boolean)
  ])

  const inputs = [
    { urls: [inputUrl], postURLs: [inputUrl], shouldDownloadSlideshowImages: true },
    {
      postURLs: [inputUrl],
      resultsPerPage: 1,
      scrapeRelatedVideos: false,
      shouldDownloadVideos: false,
      shouldDownloadCovers: true,
      shouldDownloadSlideshowImages: true,
      shouldDownloadAvatars: false,
      shouldDownloadMusicCovers: false,
      commentsPerPost: 0
    },
    { startUrls: [{ url: inputUrl }], resultsPerPage: 1, shouldDownloadVideos: false, shouldDownloadSlideshowImages: true },
    { urls: [inputUrl], maxItems: 1, shouldDownloadSlideshowImages: true }
  ]

  const timeoutSecs = Number(process.env.APIFY_TIMEOUT_SECS || 70)

  for (const actor of actors) {
    const actorId = actor.replace("/", "~")
    const endpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeoutSecs}&memory=1024`

    for (const input of inputs) {
      const data = await fetchJsonWithTimeout(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(input),
        timeoutMs: (timeoutSecs + 15) * 1000
      }).catch(() => null)

      const normalized = normalizeTikTokPhotoProviderData(data, `apify:${actor}`)
      if (normalized?.slides?.length) return normalized
    }
  }

  return null
}

function normalizeTikTokPhotoProviderData(raw, provider = "provider") {
  if (!raw) return null
  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [raw]
  const first = items.find((item) => item && typeof item === "object") || {}
  const slideCandidates = []

  for (const item of items) {
    slideCandidates.push(
      ...collectImageUrlList(item?.images),
      ...collectImageUrlList(item?.imageUrls),
      ...collectImageUrlList(item?.image_urls),
      ...collectImageUrlList(item?.photoUrls),
      ...collectImageUrlList(item?.photo_urls),
      ...collectImageUrlList(item?.photos),
      ...collectImageUrlList(item?.slides),
      ...collectImageUrlList(item?.mediaUrls),
      ...collectImageUrlList(item?.media_urls),
      ...collectImageUrlList(item?.downloadUrls),
      ...collectImageUrlList(item?.download_urls),
      ...collectImageUrlList(item?.slideshowImageUrls),
      ...collectImageUrlList(item?.slideshow_image_urls),
      ...collectImageUrlList(item?.slideshowImages),
      ...collectImageUrlList(item?.slideshow_images),
      ...collectImageUrlList(item?.slideshowImageDownloadUrls),
      ...collectImageUrlList(item?.slideshow_image_download_urls),
      ...collectImageUrlList(item?.downloadedSlideshowImages),
      ...collectImageUrlList(item?.downloaded_slideshow_images),
      ...collectImageUrlList(item?.imagePost?.images),
      ...collectImageUrlList(item?.image_post?.images),
      ...collectImageUrlList(item?.itemStruct?.imagePost?.images),
      ...collectImageUrlList(item?.itemStruct?.image_post?.images)
    )
  }

  if (!slideCandidates.length) {
    for (const item of items) {
      slideCandidates.push(...collectTikTokProviderImagesDeep(item))
    }
  }

  const imageUrls = unique(slideCandidates)
    .map((item) => normalizeProviderMediaUrl(item, provider))
    .filter((item) => isProbablyImageUrl(item))
    .slice(0, 35)

  const slides = imageUrls.map((item, index) => ({
    index,
    type: "photo",
    url: item,
    thumbnail: item,
    filename: `tiktok-${index + 1}.${guessImageExtForWeb(item)}`
  }))

  const thumbnail = firstCleanUrl([
    first.cover,
    first.origin_cover,
    first.originCover,
    first.dynamicCover,
    first.dynamic_cover,
    first.thumbnail,
    first.thumbnailUrl,
    first.thumbnail_url,
    first.image,
    first.imageUrl,
    first.image_url,
    slides[0]?.thumbnail
  ])

  const title = [
    first.title,
    first.desc,
    first.description,
    first.text,
    first.caption,
    first.video_description,
    first.videoDescription,
    first.aweme_detail?.desc,
    first.itemStruct?.desc
  ].find((item) => typeof item === "string" && item.trim())

  if (!slides.length && !isProbablyImageUrl(thumbnail)) return null

  return {
    provider,
    title: sanitizeDisplayTitle(title, "tiktok", "photo"),
    thumbnail: isProbablyImageUrl(thumbnail) ? thumbnail : slides[0]?.thumbnail || "",
    slides
  }
}

function collectImageUrlList(value) {
  const output = []
  if (!value) return output

  if (typeof value === "string") {
    output.push(value)
    return output
  }

  if (Array.isArray(value)) {
    for (const item of value) output.push(...collectImageUrlList(item))
    return output
  }

  if (typeof value === "object") {
    for (const key of ["url", "src", "image", "imageUrl", "image_url", "displayUrl", "display_url", "downloadUrl", "download_url"]) {
      if (typeof value?.[key] === "string") output.push(value[key])
    }

    for (const key of ["urlList", "url_list", "urls", "images", "photos", "mediaUrls", "downloadUrls", "slideshowImages", "slideshowImageUrls"]) {
      if (Array.isArray(value?.[key])) output.push(...collectImageUrlList(value[key]))
    }
  }

  return output
}

function collectTikTokProviderImagesDeep(node, depth = 0, keyHint = "") {
  const output = []
  if (!node || depth > 6) return output

  if (typeof node === "string") {
    if (/image|photo|slide|slideshow|carousel|media|download|url/i.test(keyHint)) output.push(node)
    return output
  }

  if (Array.isArray(node)) {
    for (const item of node) output.push(...collectTikTokProviderImagesDeep(item, depth + 1, keyHint))
    return output
  }

  if (typeof node !== "object") return output

  for (const [key, value] of Object.entries(node)) {
    if (/avatar|profile|author|owner|user|music|sound|audio|cover|dynamic|origin|icon|logo|emoji|sticker|effect|ad|recommend|related|suggest|comment/i.test(key)) continue
    if (/imagepost|image_post|imageurl|image_url|imagelist|image_list|images|photo|photos|slide|slides|slideshow|carousel|mediaurls|media_urls|downloadurls|download_urls|urllist|url_list|url|src/i.test(key)) {
      output.push(...collectTikTokProviderImagesDeep(value, depth + 1, key))
    }
  }

  return output
}

function normalizeProviderMediaUrl(value, provider = "") {
  let clean = String(value || "")
    .trim()
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .replace(/^"(.*)"$/, "$1")

  if (!clean) return ""
  if (clean.startsWith("//")) clean = `https:${clean}`
  if (clean.startsWith("/") && provider.includes("tikwm")) clean = `https://www.tikwm.com${clean}`

  try {
    const parsed = new URL(clean)
    if (!["http:", "https:"].includes(parsed.protocol)) return ""
    return parsed.toString()
  } catch {
    return ""
  }
}

function firstCleanUrl(values) {
  for (const value of values) {
    const clean = normalizeProviderMediaUrl(value)
    if (clean) return clean
  }
  return ""
}

async function fetchJsonWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000)

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    })

    if (!response.ok) return null
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

function isTikTokNonMediaHost(value) {
  try {
    const parsed = new URL(String(value || ""))
    const host = parsed.hostname.toLowerCase()

    if (!host.includes("tiktok.com")) return false
    if (host.includes("tiktokcdn") || host.includes("muscdn") || host.includes("tiktokv")) return false

    return true
  } catch {
    return false
  }
}

function sanitizeDisplayTitle(value, platform = "media", kind = "media") {
  const title = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/ \| TikTok$/, "")
    .trim()
    .slice(0, 140)

  if (isBadMediaTitle(title)) {
    const label = prettyPlatform(platform)
    if (kind === "photo") return `${label} photo/slide media`
    if (kind === "video") return `${label} video media`
    return `${label} media`
  }

  return title
}

function isBadMediaTitle(value) {
  const title = String(value || "").trim()
  if (!title) return true
  if (title.startsWith("/") || title.startsWith("http://") || title.startsWith("https://")) return true
  if (/\/v\d+\/message\/send/i.test(title) || /message\/send/i.test(title)) return true
  if (/^(api|endpoint|undefined|null|object object)$/i.test(title)) return true
  return false
}


async function scrapeTikTokPhotoPost(inputUrl) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(inputUrl, {
      method: "GET",
      headers: tiktokPageHeaders(inputUrl),
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    })

    if (!response.ok) return null

    const html = await response.text()
    const payloads = extractTikTokJsonPayloads(html)
    const pageImages = extractTikTokPhotoImagesFromPayloads(payloads)
    const keyedImages = extractTikTokPhotoImagesFromKeyedHtml(html)
    const htmlImages = extractTikTokPhotoImagesFromHtml(html)
    const imageUrls = unique([...pageImages, ...keyedImages, ...htmlImages])
      .filter((item) => isProbablyImageUrl(item))
      .slice(0, 35)

    const slides = imageUrls.map((item, index) => ({
      index,
      type: "photo",
      url: item,
      thumbnail: item,
      filename: `tiktok-${index + 1}.${guessImageExtForWeb(item)}`
    }))

    const thumbnail =
      slides[0]?.thumbnail ||
      pickMetaContent(html, "og:image") ||
      pickMetaContent(html, "twitter:image") ||
      pickTikTokTitleOrImage(payloads, /thumbnail|cover|dynamiccover|dynamic_cover/i) ||
      null

    const title =
      pickTikTokTitleOrImage(payloads, /(^|\.)(desc|title|pageTitle|seoTitle)$/i, true) ||
      pickMetaContent(html, "og:title") ||
      pickMetaContent(html, "twitter:title") ||
      "TikTok photo/slide media"

    if (!slides.length && !thumbnail) return null

    return {
      title,
      thumbnail,
      slides
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function tiktokPageHeaders(referer) {
  return {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "accept-language": "en-US,en;q=0.9,id;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "referer": referer,
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
  }
}

function extractTikTokJsonPayloads(html) {
  const payloads = []
  const seen = new Set()
  const regexes = [
    /<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/gi,
    /<script[^>]+id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/gi,
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi,
    /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi,
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    /window\[['"]SIGI_STATE['"]\]\s*=\s*({[\s\S]*?})\s*;/gi,
    /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({[\s\S]*?})\s*;/gi,
    /window\[['"]SIGI_STATE['"]\]\s*=\s*JSON\.parse\((['"`])([\s\S]*?)\1\)\s*;/gi,
    /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*JSON\.parse\((['"`])([\s\S]*?)\1\)\s*;/gi
  ]

  for (const regex of regexes) {
    for (const match of html.matchAll(regex)) {
      const raw = typeof match?.[2] === "string"
        ? decodeJsStringLiteral(match[2], match[1])
        : match?.[1]
      const parsed = safeJsonParseTikTok(raw)
      const key = parsed ? JSON.stringify(parsed).slice(0, 200) : ""
      if (parsed && typeof parsed === "object" && !seen.has(key)) {
        seen.add(key)
        payloads.push(parsed)
      }
    }
  }

  for (const match of String(html || "").matchAll(/JSON\.parse\((['"`])([\s\S]*?)\1\)/gi)) {
    const raw = decodeJsStringLiteral(match?.[2], match?.[1])
    const parsed = safeJsonParseTikTok(raw)
    const key = parsed ? JSON.stringify(parsed).slice(0, 200) : ""
    if (parsed && typeof parsed === "object" && !seen.has(key)) {
      seen.add(key)
      payloads.push(parsed)
    }
  }

  return payloads
}

function decodeJsStringLiteral(value, quote = '"') {
  if (typeof value !== "string") return ""
  try {
    return JSON.parse(`${quote}${value}${quote}`)
  } catch {
    return value
  }
}

function safeJsonParseTikTok(value) {
  if (!value) return null

  let clean = String(value).trim()
  clean = clean
    .replace(/^[\s;]+|[\s;]+$/g, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("\\u002F", "/")
    .replaceAll("\\u0026", "&")
    .replaceAll("\\/", "/")

  const assignment = clean.match(/^[^=]+=\s*({[\s\S]*})$/)
  if (assignment?.[1]) clean = assignment[1]

  const assignmentJsonParse = clean.match(/^[^=]+=\s*JSON\.parse\((['"`])([\s\S]*)\1\)\s*$/)
  if (assignmentJsonParse?.[2]) {
    clean = decodeJsStringLiteral(assignmentJsonParse[2], assignmentJsonParse[1]).trim()
  }

  const directJsonParse = clean.match(/^JSON\.parse\((['"`])([\s\S]*)\1\)$/)
  if (directJsonParse?.[2]) {
    clean = decodeJsStringLiteral(directJsonParse[2], directJsonParse[1]).trim()
  }

  const quotedJson = clean.match(/^(['"`])([\s\S]*)\1$/)
  if (quotedJson?.[2] && /^[\[{]/.test(decodeJsStringLiteral(quotedJson[2], quotedJson[1]).trim())) {
    clean = decodeJsStringLiteral(quotedJson[2], quotedJson[1]).trim()
  }

  try {
    return JSON.parse(clean)
  } catch {
    return null
  }
}

function extractTikTokPhotoImagesFromPayloads(payloads) {
  const output = []

  for (const payload of Array.isArray(payloads) ? payloads : []) {
    output.push(...collectTikTokPhotoImages(payload))
  }

  return unique(output)
}

function collectTikTokPhotoImages(node, depth = 0) {
  const output = []
  if (!node || depth > 7) return output

  function push(value) {
    const clean = cleanTikTokMediaUrl(value)
    if (clean && isProbablyImageUrl(clean)) output.push(clean)
  }

  if (typeof node === "string") {
    push(node)
    return output
  }

  if (Array.isArray(node)) {
    for (const item of node) output.push(...collectTikTokPhotoImages(item, depth + 1))
    return output
  }

  if (typeof node !== "object") return output

  push(node.url)
  push(node.src)
  push(node.image)
  push(node.imageUrl)
  push(node.image_url)
  push(node.displayUrl)
  push(node.display_url)
  push(node.downloadUrl)
  push(node.download_url)

  const arrays = [
    node.urlList,
    node.url_list,
    node.urls,
    node.images,
    node.imageList,
    node.image_list,
    node.photos,
    node.slides,
    node.imagePost?.images,
    node.image_post?.images,
    node.imageURL?.urlList,
    node.imageURL?.url_list,
    node.imageUrl?.urlList,
    node.image_url?.url_list,
    node.displayImage?.urlList,
    node.display_image?.url_list,
    node.image?.urlList,
    node.image?.url_list
  ]

  for (const value of arrays) {
    if (!Array.isArray(value)) continue
    for (const item of value) output.push(...collectTikTokPhotoImages(item, depth + 1))
  }

  for (const [key, value] of Object.entries(node)) {
    if (/avatar|profile|author|owner|user|music|sound|audio|cover|dynamic|originCover|icon|logo|emoji|sticker|effect|ad|recommend|related|suggest/i.test(key)) {
      continue
    }

    if (/imagepost|image_post|imageurl|image_url|imagelist|image_list|images|photo|photos|slide|slides|carousel|urllist|url_list/i.test(key)) {
      output.push(...collectTikTokPhotoImages(value, depth + 1))
    }
  }

  return output
}

function extractTikTokPhotoImagesFromHtml(html) {
  const output = []
  const normalizedHtml = normalizeTikTokHtml(html)

  const patterns = [
    /https:\/\/[^"'<>\\\s]+~tplv-photomode-image[^"'<>\\\s]+/gi,
    /https:\/\/[^"'<>\\\s]+(?:tiktokcdn|byteimg|ibyteimg|ibytedtos|bytegecko|muscdn)[^"'<>\\\s]+\.(?:jpe?g|png|webp|avif)[^"'<>\\\s]*/gi
  ]

  for (const pattern of patterns) {
    for (const match of normalizedHtml.matchAll(pattern)) {
      const clean = cleanTikTokMediaUrl(match?.[0])
      if (clean && isProbablyImageUrl(clean)) output.push(clean)
    }
  }

  return unique(output)
}

function extractTikTokPhotoImagesFromKeyedHtml(html) {
  const output = []
  const normalizedHtml = normalizeTikTokHtml(html)
  const urlPattern = /https:\/\/[^"'<>\\\s]+(?:tiktokcdn|byteimg|ibyteimg|ibytedtos|bytegecko|muscdn|snssdk|p16-|p19-|p26-|tos-)[^"'<>\\\s]*/gi

  for (const match of normalizedHtml.matchAll(urlPattern)) {
    const clean = cleanTikTokMediaUrl(match?.[0])
    if (!clean) continue

    const start = Math.max(0, (match.index || 0) - 220)
    const end = Math.min(normalizedHtml.length, (match.index || 0) + clean.length + 220)
    const context = normalizedHtml.slice(start, end).toLowerCase()

    if (!/(image|photo|slide|carousel|display_image|displayimage|image_url|imageurl|imagepost|photomode|url_list|urllist|images)/.test(context)) continue
    if (/(avatar|profile|author|owner|user|music|sound|audio|emoji|sticker|effect|logo|icon|video\/tos)/.test(context)) continue
    if (isProbablyImageUrl(clean)) output.push(clean)
  }

  return unique(output)
}

function normalizeTikTokHtml(html) {
  return String(html || "")
    .replaceAll("\\u002F", "/")
    .replaceAll("\\u0026", "&")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&")
}

function cleanTikTokMediaUrl(value) {
  const clean = String(value || "")
    .trim()
    .replaceAll("\\u002F", "/")
    .replaceAll("\\u0026", "&")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&")
    .replace(/^"(.*)"$/, "$1")

  if (!isValidUrl(clean)) return ""
  return clean
}

function pickMetaContent(html, name) {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegex(name)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")
  const match = String(html || "").match(regex)
  return match?.[1]
    ? match[1]
        .replaceAll("&amp;", "&")
        .replaceAll("&#39;", "'")
        .trim()
    : ""
}

function pickTikTokTitleOrImage(payloads, keyPattern, wantsString = false) {
  for (const payload of Array.isArray(payloads) ? payloads : []) {
    const found = findFirstMatchingValue(payload, keyPattern, wantsString)
    if (found) return found
  }

  return ""
}

function findFirstMatchingValue(node, keyPattern, wantsString = false, depth = 0) {
  if (!node || depth > 7) return ""

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirstMatchingValue(item, keyPattern, wantsString, depth + 1)
      if (found) return found
    }
    return ""
  }

  if (typeof node !== "object") return ""

  for (const [key, value] of Object.entries(node)) {
    if (keyPattern.test(String(key))) {
      const direct = pickMatchedValue(value, wantsString, depth + 1)
      if (direct) return direct
    }

    if (value && typeof value === "object") {
      const nested = findFirstMatchingValue(value, keyPattern, wantsString, depth + 1)
      if (nested) return nested
    }
  }

  return ""
}

function pickMatchedValue(value, wantsString = false, depth = 0) {
  if (!value || depth > 7) return ""

  if (typeof value === "string") {
    const clean = wantsString ? value.trim() : cleanTikTokMediaUrl(value)
    return clean || ""
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = pickMatchedValue(item, wantsString, depth + 1)
      if (found) return found
    }
    return ""
  }

  if (typeof value === "object") {
    for (const childValue of Object.values(value)) {
      const found = pickMatchedValue(childValue, wantsString, depth + 1)
      if (found) return found
    }
  }

  return ""
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}


function getExpectedSlideCount(...values) {
  for (const value of values) {
    const match = String(value || "").match(/(?:^|\b)(\d{1,2})\s*(?:slide|slides|foto|photo|photos|media)(?:\b|\s|$)/i)
    const count = Number(match?.[1] || 0)
    if (count > 1 && count <= 30) return count
  }

  return 0
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
    .filter((item) => isValidUrl(item.url) && !isSocialPostPageUrl(item.url))
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

  if (isTikTokMusicUrl(value) || isYouTubeMusicUrl(value) || isInstagramAudioUrl(value) || isSpotifyUrl(value) || isAppleMusicUrl(value)) {
    return {
      linkKind: "music",
      allowedTabs: ["audio"],
      suggestedGroup: "audio",
      title: "Music / sound link",
      note: "Link ini terdeteksi sebagai musik/audio. Format yang ditampilkan hanya Audio."
    }
  }

  if (platform === "facebook" && isKnownPhotoPostUrl(value)) {
    return {
      linkKind: "carousel",
      allowedTabs: ["photo"],
      suggestedGroup: "photo",
      title: "Facebook photo/post media",
      note: "Link ini terdeteksi sebagai post/foto Facebook."
    }
  }

  if (platform === "x") {
    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video", "audio"],
      suggestedGroup: "photo",
      title: "X/Twitter post",
      note: "Post X/Twitter bisa berupa foto, video, atau media campuran."
    }
  }

  if (platform === "threads") {
    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video", "audio"],
      suggestedGroup: "photo",
      title: "Threads post",
      note: "Post Threads bisa berupa foto atau video. Sistem akan mengikuti hasil provider: video kalau ada direct video, foto kalau ada slide."
    }
  }

  if (platform === "youtube" || platform === "tiktok" || platform === "facebook") {
    return {
      linkKind: "video",
      allowedTabs: ["video", "audio"],
      suggestedGroup: "video",
      title: "Video media",
      note: "Link ini terdeteksi sebagai video. Kamu bisa download Video atau ambil Audionya."
    }
  }

  if (platform === "instagram") {
    if (
      lower.includes("/reel/") ||
      lower.includes("/reels/") ||
      lower.includes("/tv/") ||
      lower.includes("/share/reel/") ||
      lower.includes("/share/reels/")
    ) {
      return {
        linkKind: "video",
        allowedTabs: ["video", "audio"],
        suggestedGroup: "video",
        title: "Instagram video/Reel",
        note: "Link ini terdeteksi sebagai video Instagram. Kamu bisa download Video atau ambil Audionya."
      }
    }

    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video", "audio"],
      suggestedGroup: "video",
      title: "Instagram post",
      note: "Post Instagram /p/ bisa berupa foto, video, atau carousel. Kalau provider menemukan foto, tab Foto tetap muncul; kalau video, pakai tab Video."
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

  if (platform === "threads") {
    return {
      linkKind: "mixed",
      allowedTabs: ["photo", "video", "audio"],
      suggestedGroup: "video",
      title: "Threads post",
      note: "Post Threads bisa berupa foto atau video. Sistem akan mengikuti hasil provider."
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
  if (url.includes("soundcloud.com")) return "unsupported"
  if (url.includes("reddit.com") || url.includes("redd.it")) return "unsupported"
  if (url.includes("vimeo.com")) return "unsupported"
  return "direct"
}

function detectDirectMedia(value) {
  const full = String(value || "").toLowerCase()
  const clean = full.split("?")[0]
  if (clean.match(/\.(mp4|webm|mkv|mov|avi|m4v|3gp|flv)$/) || /mime_type=video|video_mp4|playaddr|downloadaddr|video_versions|video_url|dash_url|\/video\//.test(full) || (/pinimg/.test(full) && /video|videos|\.mp4|\.m3u8/.test(full)) || (/(cdninstagram|fbcdn|fbsbx|scontent|twimg)/.test(full) && /video|\.mp4|\/v\//.test(full))) return "video"
  if (clean.match(/\.(mp3|m4a|wav|aac|flac|ogg|opus)$/) || /mime_type=audio|audio_mpeg|audio_mp4/.test(full)) return "audio"
  if (clean.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff|avif)$/) || /mime_type=image|image_jpeg|image_webp/.test(full) || (/pinimg/.test(full) && !/video|videos|\.mp4|\.m3u8/.test(full))) return "photo"
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
  if (["unsupported", "reddit", "soundcloud", "vimeo"].includes(platform)) {
    return "Platform ini sudah dimatikan dari MgreSV. Pakai YouTube, TikTok, Instagram, Facebook, X/Twitter, Threads, atau Pinterest."
  }

  if (directType) {
    return "Direct file sudah dimatikan dari MgreSV. Pakai link post/platform yang didukung."
  }

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


function cleanEnvValue(value) {
  return String(value || "").trim().replace(/^[\'"]|[\'"]$/g, "")
}
