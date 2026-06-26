"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileAudio,
  FileImage,
  FileVideo,
  Globe2,
  ImageIcon,
  Link2,
  Loader2,
  Music2,
  PlaySquare,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";

const PLATFORMS = [
  { id: "auto", label: "Auto" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "threads", label: "Threads" },
  { id: "pinterest", label: "Pinterest" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "reddit", label: "Reddit" },
  { id: "vimeo", label: "Vimeo" },
  { id: "direct", label: "Direct File" },
];

const RESULT_TABS = [
  {
    id: "audio",
    label: "Audio",
    icon: Music2,
    rows: [
      { quality: "320k", fileType: "mp3", format: "MP3 High" },
      { quality: "256k", fileType: "m4a", format: "M4A" },
      { quality: "192k", fileType: "mp3", format: "MP3" },
      { quality: "160k", fileType: "aac", format: "AAC" },
      { quality: "128k", fileType: "mp3", format: "MP3 Small" },
      { quality: "96k", fileType: "opus", format: "OPUS" },
      { quality: "best", fileType: "wav", format: "WAV" },
      { quality: "best", fileType: "flac", format: "FLAC" },
      { quality: "best", fileType: "ogg", format: "OGG" },
    ],
  },
  {
    id: "video",
    label: "Video",
    icon: PlaySquare,
    rows: [
      { quality: "4320p", fileType: "mp4", format: "8K" },
      { quality: "2160p", fileType: "mp4", format: "4K" },
      { quality: "1440p", fileType: "mp4", format: "2K" },
      { quality: "1080p", fileType: "mp4", format: "Full HD" },
      { quality: "720p", fileType: "mp4", format: "HD" },
      { quality: "480p", fileType: "mp4", format: "SD" },
      { quality: "360p", fileType: "mp4", format: "Small" },
      { quality: "best", fileType: "webm", format: "WEBM" },
      { quality: "best", fileType: "mkv", format: "MKV" },
      { quality: "best", fileType: "mov", format: "MOV" },
      { quality: "best", fileType: "avi", format: "AVI" },
    ],
  },
  {
    id: "photo",
    label: "Foto",
    icon: ImageIcon,
    rows: [
      { quality: "original", fileType: "jpg", format: "JPG" },
      { quality: "original", fileType: "png", format: "PNG" },
      { quality: "original", fileType: "webp", format: "WEBP" },
      { quality: "large", fileType: "jpeg", format: "JPEG" },
      { quality: "medium", fileType: "avif", format: "AVIF" },
      { quality: "thumbnail", fileType: "jpg", format: "Thumbnail" },
      { quality: "original", fileType: "gif", format: "GIF" },
      { quality: "original", fileType: "bmp", format: "BMP" },
      { quality: "original", fileType: "tiff", format: "TIFF" },
    ],
  },
  {
    id: "other",
    label: "Other",
    icon: Globe2,
    rows: [
      {
        mediaGroup: "video",
        quality: "best",
        fileType: "m4v",
        format: "Apple Video",
      },
      {
        mediaGroup: "video",
        quality: "360p",
        fileType: "3gp",
        format: "Mobile Small",
      },
      {
        mediaGroup: "video",
        quality: "best",
        fileType: "flv",
        format: "Legacy Video",
      },
      {
        mediaGroup: "audio",
        quality: "best",
        fileType: "webm",
        format: "Web Audio",
      },
      {
        mediaGroup: "photo",
        quality: "thumbnail",
        fileType: "jpg",
        format: "Cover / Thumbnail",
      },
    ],
  },
];

export default function Home() {
  const [platform, setPlatform] = useState("auto");
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("video");
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState("");
  const [error, setError] = useState("");
  const [lastFile, setLastFile] = useState(null);

  const activeTabData = useMemo(
    () => RESULT_TABS.find((tab) => tab.id === activeTab) || RESULT_TABS[1],
    [activeTab],
  );

  async function analyze() {
    setError("");
    setLastFile(null);
    setAnalysis(null);
    setLoadingAnalyze(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, platform }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Link tidak bisa dibaca.");
      } else {
        setAnalysis(data);
        if (data.suggestedGroup === "audio") setActiveTab("audio");
        else if (data.suggestedGroup === "photo") setActiveTab("photo");
        else setActiveTab("video");
      }
    } catch {
      setError("Gagal menghubungi server.");
    }

    setLoadingAnalyze(false);
  }

  async function downloadRow(row) {
    if (!analysis) return;

    const mediaGroup = row.mediaGroup || activeTab;
    const key = `${mediaGroup}-${row.quality}-${row.fileType}`;

    setError("");
    setLastFile(null);
    setDownloadingKey(key);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          platform: analysis.platform || platform,
          mediaGroup,
          quality: row.quality,
          fileType: row.fileType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Download gagal.");
      } else {
        setLastFile(data);
        await triggerDownload(
          data.downloadUrl,
          data.title || `menginasv.${row.fileType}`,
        );
      }
    } catch {
      setError("Gagal mengunduh file.");
    }

    setDownloadingKey("");
  }

  async function triggerDownload(downloadUrl, filename) {
    try {
      if (!downloadUrl) throw new Error("Download URL kosong.");
      const response = await fetch(downloadUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("File tidak bisa diambil dari worker/provider.");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "menginasv-download";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      setError(
        "File sudah diproses, tapi browser gagal auto-download. Klik Download ulang atau Buka file.",
      );
    }
  }

  function resetConvert() {
    setAnalysis(null);
    setLastFile(null);
    setError("");
    setActiveTab("video");
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="MgreSV" />
          <div>
            <b>MgreSV</b>
            <span>Fast Media Downloader</span>
          </div>
        </div>
        <div className="topPill">
          <Sparkles size={15} /> Downloader • Video • Image • Audio
        </div>
      </header>

      <section className="hero">
        <h1>Download Video, Gambar & Musik Favoritmu Tanpa Ribet.</h1>
        <p>
          Simpan konten dari YouTube, TikTok, Instagram, dan platform lainnya
          dalam hitungan detik. Cukup tempel link dan unduh sekarang!
        </p>
      </section>

      <section className="searchCard">
        <div className="platformNav">
          {PLATFORMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPlatform(item.id)}
              className={platform === item.id ? "platform active" : "platform"}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="searchBox">
          <Link2 size={22} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Paste link video, audio, atau foto di sini"
          />
          {analysis ? (
            <button
              className="clearBtn"
              onClick={resetConvert}
              title="Reset hasil convert"
            >
              <RotateCcw size={18} />
            </button>
          ) : null}
          <button
            className="convertBtn"
            onClick={analyze}
            disabled={loadingAnalyze}
          >
            {loadingAnalyze ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            {loadingAnalyze ? "Processing" : "Convert"}
          </button>
        </div>

        {error ? <div className="errorBox">{error}</div> : null}
      </section>

      {!analysis ? (
        <section className="emptyState">
          <div className="emptyIcon">
            <Download size={30} />
          </div>
          <h2>Belum ada hasil convert</h2>
          <p>
            Paste link lalu klik Convert. Setelah itu thumbnail dan daftar
            download akan muncul.
          </p>
        </section>
      ) : (
        <section className="resultLayout">
          <aside className="previewCard">
            <div className="thumbWrap">
              {analysis.thumbnail ? (
                <img src={analysis.thumbnail} alt="Media thumbnail" />
              ) : (
                <div className="thumbFallback">
                  {activeTab === "audio" ? (
                    <FileAudio size={54} />
                  ) : activeTab === "photo" ? (
                    <FileImage size={54} />
                  ) : (
                    <FileVideo size={54} />
                  )}
                  <span>No thumbnail</span>
                </div>
              )}
            </div>

            <div className="previewInfo">
              <span className="sourceTag">{analysis.platform}</span>
              <h2>{analysis.title}</h2>
              <p>{analysis.note}</p>
            </div>

            {lastFile ? (
              <div className="lastFile">
                <b>File siap.</b>
                <span>{lastFile.title}</span>
                <div>
                  <button
                    onClick={() =>
                      triggerDownload(lastFile.downloadUrl, lastFile.title)
                    }
                  >
                    Download ulang
                  </button>
                  <a
                    href={lastFile.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buka file
                  </a>
                </div>
              </div>
            ) : null}
          </aside>

          <section className="downloadPanel">
            <div className="tabs">
              {RESULT_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={activeTab === tab.id ? "tab active" : "tab"}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={17} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="table">
              <div className="thead">
                <span>File type</span>
                <span>Format</span>
                <span>Action</span>
              </div>
              {activeTabData.rows.map((row) => {
                const mediaGroup = row.mediaGroup || activeTab;
                const key = `${mediaGroup}-${row.quality}-${row.fileType}`;
                const isLoading = downloadingKey === key;
                return (
                  <div className="tr" key={key}>
                    <div>
                      <b>
                        {formatQuality(row.quality)}{" "}
                        <small>({row.fileType.toUpperCase()})</small>
                      </b>
                      <em>{mediaLabel(mediaGroup)}</em>
                    </div>
                    <span>{row.format}</span>
                    <button
                      onClick={() => downloadRow(row)}
                      disabled={Boolean(downloadingKey)}
                    >
                      {isLoading ? (
                        <Loader2 className="spin" size={17} />
                      ) : (
                        <Download size={17} />
                      )}
                      {isLoading ? "Processing" : "Download"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      )}

      <footer className="footerNote">
        Gunakan layanan secara bertanggung jawab dan hargai hak cipta.
      </footer>
    </main>
  );
}

function formatQuality(value) {
  if (value === "best") return "Best";
  if (value === "original") return "Original";
  if (value === "thumbnail") return "Thumbnail";
  if (value === "large") return "Large";
  if (value === "medium") return "Medium";
  return value;
}

function mediaLabel(value) {
  if (value === "audio") return "Audio";
  if (value === "photo") return "Foto";
  return "Video";
}
