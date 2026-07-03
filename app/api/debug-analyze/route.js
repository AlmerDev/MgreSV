import { NextResponse } from "next/server"

export async function POST(req) {
  const payload = await req.json()
  const base = new URL(req.url)
  const analyzeUrl = `${base.origin}/api/analyze`

  const response = await fetch(analyzeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const data = await response.json().catch(() => null)

  return NextResponse.json({
    status: response.status,
    ok: response.ok,
    data,
    debug: {
      thumbnail: data?.thumbnail || null,
      slideCount: Array.isArray(data?.slides) ? data.slides.length : 0,
      firstSlides: Array.isArray(data?.slides) ? data.slides.slice(0, 5) : []
    }
  }, { status: response.status })
}
