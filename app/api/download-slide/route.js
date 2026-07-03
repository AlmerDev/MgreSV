import { NextResponse } from "next/server"

export async function POST(req) {
  const payload = await req.json()
  const workerUrl = cleanEnvValue(process.env.DOWNLOADER_WORKER_URL)
  const workerToken = cleanEnvValue(process.env.DOWNLOADER_WORKER_TOKEN)

  if (!workerUrl) {
    return NextResponse.json({
      ok: false,
      error: "Worker belum tersambung. Isi DOWNLOADER_WORKER_URL di Vercel."
    }, { status: 412 })
  }

  try {
    const endpoint = makeWorkerEndpoint(workerUrl, "/api/download-slide")
    const response = await fetch(endpoint, {
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
        error: data?.error || "Worker gagal memproses slide."
      }, { status: response.status || 500 })
    }

    return NextResponse.json(data, {
      headers: { "cache-control": "no-store" }
    })
  } catch {
    return NextResponse.json({
      ok: false,
      error: "Website tidak bisa menghubungi worker."
    }, { status: 502 })
  }
}

function makeWorkerEndpoint(workerUrl, path) {
  const clean = String(workerUrl || "").replace(/\/$/, "")
  if (clean.endsWith("/api/download")) return clean.replace(/\/api\/download$/, path)
  return clean + path
}


function cleanEnvValue(value) {
  return String(value || "").trim().replace(/^[\'"]|[\'"]$/g, "")
}
