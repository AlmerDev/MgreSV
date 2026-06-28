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
  const [downloadingSlideKey, setDownloadingSlideKey] = useState("");
  const [error, setError] = useState("");
  const [lastFile, setLastFile] = useState(null);

  const availableTabs = useMemo(() => {
    const allowedTabs =
      Array.isArray(analysis?.allowedTabs) && analysis.allowedTabs.length
        ? analysis.allowedTabs
        : RESULT_TABS.map((tab) => tab.id);

    return RESULT_TABS.filter((tab) => allowedTabs.includes(tab.id));
  }, [analysis]);

  const activeTabData = useMemo(() => {
    return (
      availableTabs.find((tab) => tab.id === activeTab) ||
      availableTabs[0] ||
      RESULT_TABS[1]
    );
  }, [activeTab, availableTabs]);

  const slides = useMemo(() => {
    return Array.isArray(analysis?.slides)
      ? analysis.slides.filter((item) => item?.url)
      : [];
  }, [analysis]);

  const primaryThumbnail = useMemo(() => {
    return (
      analysis?.thumbnail ||
      slides.find((item) => item.thumbnail)?.thumbnail ||
      slides.find((item) => item.type === "photo")?.url ||
      ""
    );
  }, [analysis, slides]);

  const hasCarouselSlides = slides.length > 0;
  const hasOnlyPhotoSlides =
    hasCarouselSlides &&
    slides.every((item) => (item.type || "photo") === "photo");
  const shouldShowFormatList = !hasOnlyPhotoSlides;

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
        setError(data.error || "Link ini belum bisa diproses.");
      } else {
        const allowedTabs =
          Array.isArray(data.allowedTabs) && data.allowedTabs.length
            ? data.allowedTabs
            : [];
        const preferredTab = allowedTabs[0] || data.suggestedGroup || "video";

        setAnalysis(data);

        if (allowedTabs.includes(data.suggestedGroup))
          setActiveTab(data.suggestedGroup);
        else setActiveTab(preferredTab);
      }
    } catch {
      setError("Gagal menghubungi server.");
    }

    setLoadingAnalyze(false);
  }

  async function downloadSlide(slide, index) {
    if (!slide?.url) return;

    const key = `slide-${index}`;
    setError("");
    setLastFile(null);
    setDownloadingSlideKey(key);

    try {
      const res = await fetch("/api/download-slide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slideUrl: slide.url,
          index,
          filename: slide.filename || `slide-${index + 1}`,
          slideType: slide.type || "photo",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Download slide gagal.");
      } else {
        setLastFile(data);
        await triggerDownload(
          data.downloadUrl,
          data.title || `slide-${index + 1}`,
        );
      }
    } catch {
      setError("Gagal mengunduh slide.");
    }

    setDownloadingSlideKey("");
  }

  async function downloadAllSlides() {
    if (!slides.length) return;

    setError("");
    setLastFile(null);
    setDownloadingSlideKey("all");

    let successCount = 0;
    let failCount = 0;

    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index];
      if (!slide?.url) continue;

      try {
        const res = await fetch("/api/download-slide", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            slideUrl: slide.url,
            index,
            filename: slide.filename || `slide-${index + 1}`,
            slideType: slide.type || "photo",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          failCount += 1;
          continue;
        }

        successCount += 1;
        setLastFile(data);
        await triggerDownload(
          data.downloadUrl,
          data.title || `slide-${index + 1}`,
        );

        // Small delay so browsers can process multiple file downloads from one click.
        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch {
        failCount += 1;
      }
    }

    if (!successCount) {
      setError("Semua slide gagal diunduh.");
    } else if (failCount) {
      setError(
        `${successCount} slide berhasil diunduh, ${failCount} slide gagal.`,
      );
    }

    setDownloadingSlideKey("");
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
          <img src="/logo.png" alt="MgreSV Logo" />
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
          Simpan konten dari Youtube, Tiktok, Instagram, dan platform lainnya
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
        <section
          className={
            shouldShowFormatList
              ? "resultLayout"
              : "resultLayout resultLayoutSingle"
          }
        >
          <aside className="previewCard">
            <div className="thumbWrap">
              {primaryThumbnail ? (
                <img src={primaryThumbnail} alt="Media thumbnail" />
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
              {hasOnlyPhotoSlides ? (
                <em className="autoDetectNote">
                  Foto terdeteksi otomatis. Daftar format disembunyikan supaya
                  hasil convert tidak numpuk.
                </em>
              ) : null}
            </div>

            {slides.length ? (
              <div className="slideBox">
                <div className="slideBoxHead">
                  <div>
                    <b>{slides.length} slide/media</b>
                    <span>
                      File foto sudah terdeteksi otomatis. Pilih slide atau
                      download semua.
                    </span>
                  </div>
                  {slides.length > 1 ? (
                    <button
                      onClick={downloadAllSlides}
                      disabled={Boolean(downloadingSlideKey)}
                    >
                      {downloadingSlideKey === "all" ? (
                        <Loader2 className="spin" size={15} />
                      ) : (
                        <Download size={15} />
                      )}
                      {downloadingSlideKey === "all"
                        ? "Mengunduh"
                        : "Download Semua"}
                    </button>
                  ) : null}
                </div>

                <div className="slideGrid">
                  {slides.map((slide, index) => {
                    const key = `slide-${index}`;
                    const thumb =
                      slide.thumbnail ||
                      (slide.type === "photo" ? slide.url : primaryThumbnail);

                    return (
                      <div className="slideCard" key={`${slide.url}-${index}`}>
                        <div className="slideThumb">
                          {thumb ? (
                            <img src={thumb} alt={`Slide ${index + 1}`} />
                          ) : (
                            <FileImage size={28} />
                          )}
                        </div>
                        <div className="slideMeta">
                          <b>Slide {index + 1}</b>
                          <span>{slide.type || "media"}</span>
                        </div>
                        <button
                          onClick={() => downloadSlide(slide, index)}
                          disabled={Boolean(downloadingSlideKey)}
                        >
                          {downloadingSlideKey === key ? (
                            <Loader2 className="spin" size={14} />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

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

          {shouldShowFormatList ? (
            <section className="downloadPanel">
              <div className="tabs">
                {availableTabs.map((tab) => {
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
          ) : null}
        </section>
      )}

      <footer className="footerNote">
        Harap gunakan dengan bijak. Hargai hak cipta kreator.
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
