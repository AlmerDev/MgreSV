import { NextResponse } from "next/server"

export async function POST(req) {
  const payload = await req.json()
  const url = String(payload.url || "").trim()

  if (!isValidUrl(url)) {
    return NextResponse.json({ ok: false, error: "Link tidak valid." }, { status: 400 })
  }

  const workerUrl = process.env.DOWNLOADER_WORKER_URL
  const workerToken = process.env.DOWNLOADER_WORKER_TOKEN

  if (!workerUrl) {
    return NextResponse.json({
      ok: false,
      error: "Worker belum tersambung. Isi DOWNLOADER_WORKER_URL di Vercel."
    }, { status: 412 })
  }

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(workerToken ? { authorization: `Bearer ${workerToken}` } : {})
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.ok) {
      return NextResponse.json({
        ok: false,
        error: data?.error || "Worker gagal memproses file."
      }, { status: response.status || 500 })
    }

    return NextResponse.json(data, {
      headers: { "cache-control": "no-store" }
    })
  } catch {
    return NextResponse.json({
      ok: false,
      error: "Website tidak bisa menghubungi worker. Cek URL worker dan redeploy."
    }, { status: 502 })
  }
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value)
    return ["http:", "https:"].includes(parsed.protocol)
  } catch {
    return false
  }
}
