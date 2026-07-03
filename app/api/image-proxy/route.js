import { NextResponse } from "next/server"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const targetUrl = cleanUrl(searchParams.get("url"))
  const sourceUrl = cleanUrl(searchParams.get("source"))

  if (!targetUrl || !isAllowedImageUrl(targetUrl)) {
    return previewFallback("URL gambar tidak valid.")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: imageHeaders(targetUrl, sourceUrl)
    })

    if (!response.ok || !response.body) {
      return previewFallback(`Gambar gagal diambil (${response.status}).`)
    }

    const upstreamContentType = response.headers.get("content-type") || ""
    const contentType = upstreamContentType.toLowerCase().startsWith("image/")
      ? upstreamContentType
      : "image/jpeg"

    return new Response(response.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store, no-cache, must-revalidate",
        "access-control-allow-origin": "*",
        "cross-origin-resource-policy": "cross-origin"
      }
    })
  } catch {
    return previewFallback("Proxy gambar gagal.")
  } finally {
    clearTimeout(timeout)
  }
}

function imageHeaders(targetUrl, sourceUrl) {
  const referer = sourceUrl || guessReferer(targetUrl)
  return {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9,id;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "referer": referer,
    "origin": originFromUrl(referer),
    "sec-fetch-dest": "image",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "cross-site"
  }
}

function isAllowedImageUrl(value) {
  try {
    const parsed = new URL(value)
    if (!["http:", "https:"].includes(parsed.protocol)) return false

    const host = parsed.hostname.toLowerCase()
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local")
    ) {
      return false
    }

    return [
      "tiktokcdn",
      "byteimg",
      "ibyteimg",
      "ibytedtos",
      "bytegecko",
      "muscdn",
      "tiktokv",
      "bytegd",
      "tikwm",
      "cdninstagram",
      "fbcdn",
      "scontent",
      "pinimg",
      "twimg",
      "redditmedia",
      "redd.it",
      "imgur",
      "api.apify.com"
    ].some((part) => host.includes(part)) ||
      /^(p16-|p19-|p26-|p9-|p77-)/i.test(host)
  } catch {
    return false
  }
}

function guessReferer(value) {
  try {
    const host = new URL(String(value || "")).hostname.toLowerCase()
    if (host.includes("tikwm")) return "https://www.tikwm.com/"
    if (host.includes("tiktok") || host.includes("byte") || host.includes("muscdn") || /^(p16-|p19-|p26-|p9-|p77-)/i.test(host)) {
      return "https://www.tiktok.com/"
    }
    if (host.includes("cdninstagram") || host.includes("fbcdn") || host.includes("scontent")) {
      return "https://www.instagram.com/"
    }
    if (host.includes("pinimg")) return "https://www.pinterest.com/"
    if (host.includes("twimg")) return "https://x.com/"
    if (host.includes("api.apify.com")) return "https://api.apify.com/"
    return "https://www.google.com/"
  } catch {
    return "https://www.google.com/"
  }
}

function originFromUrl(value) {
  try {
    const parsed = new URL(String(value || ""))
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return "https://www.google.com"
  }
}

function cleanUrl(value) {
  return String(value || "").trim().replace(/^[\'"]|[\'"]$/g, "")
}

function previewFallback(reason) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" rx="18" fill="#0f172a"/><text x="160" y="84" fill="#94a3b8" font-family="Arial,sans-serif" font-size="13" font-weight="700" text-anchor="middle">Preview belum bisa dimuat</text><text x="160" y="106" fill="#64748b" font-family="Arial,sans-serif" font-size="10" text-anchor="middle">${escapeXml(String(reason || "").slice(0, 80))}</text></svg>`

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  })
}

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
