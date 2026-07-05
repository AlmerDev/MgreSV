"use client";

import SiteNav from "./components/SiteNav";
import { recordDownloadEvent } from "../lib/downloadTracker";
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



const DEFAULT_SUPPORTED_ROWS = {
  audio: new Set([
    "320k|mp3",
    "256k|m4a",
    "192k|mp3",
    "160k|aac",
    "128k|mp3",
    "best|wav",
    "best|ogg",
    "96k|opus",
  ]),
  video: new Set([
    "1080p|mp4",
    "720p|mp4",
    "480p|mp4",
    "360p|mp4",
  ]),
  photo: new Set([
    "original|jpg",
    "original|png",
    "original|webp",
    "large|jpeg",
  ]),
};

function rowKey(row) {
  return `${row.quality}|${row.fileType}`;
}

function getSupportedRows(tab, analysis) {
  const rows = Array.isArray(tab?.rows) ? tab.rows : [];

  return rows.filter((row) => {
    const mediaGroup = row.mediaGroup || tab.id;
    const serverRows = analysis?.supportedFormats?.[mediaGroup];

    if (Array.isArray(serverRows) && serverRows.length) {
      return serverRows.some(
        (item) =>
          item?.quality === row.quality && item?.fileType === row.fileType,
      );
    }

    const supported = DEFAULT_SUPPORTED_ROWS[mediaGroup];
    return supported ? supported.has(rowKey(row)) : false;
  });
}

function normalizeSlidesForUi(slides, platform) {
  const list = Array.isArray(slides) ? slides : [];
  const output = [];
  const seen = new Set();

  for (const slide of list) {
    const url = slide?.url || slide?.thumbnail || "";
    const thumbnail = slide?.thumbnail || slide?.url || "";
    const safeUrl = isHttpUrl(url) ? url : isHttpUrl(thumbnail) ? thumbnail : "";
    const safeThumbnail = isHttpUrl(thumbnail) ? thumbnail : safeUrl;
    const lower = String(safeUrl || safeThumbnail).toLowerCase();

    if (!lower) continue;
    if (
      lower.includes("mime_type=audio") ||
      lower.includes("audio_mpeg") ||
      lower.includes("/video/tos/")
    )
      continue;

    const identity =
      platform === "instagram"
        ? instagramUiIdentity(safeUrl || safeThumbnail)
        : platform === "tiktok"
          ? tiktokUiIdentity(safeUrl || safeThumbnail)
          : uiIdentity(safeUrl || safeThumbnail);
    if (seen.has(identity)) continue;

    seen.add(identity);
    output.push({
      ...slide,
      index: output.length,
      url: safeUrl,
      thumbnail: safeThumbnail,
      filename:
        slide?.filename || `${platform || "slide"}-${output.length + 1}.jpg`,
    });
  }

  return output;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function instagramUiIdentity(value) {
  const clean = String(value || "")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .split("?")[0]
    .toLowerCase();

  const file = clean.split("/").pop() || clean;
  const numeric = file.match(/(\d{8,})/);
  if (numeric?.[1]) return numeric[1];

  const named = file.match(/([^/]+?)\.(jpg|jpeg|png|webp|avif|heic)$/i);
  if (named?.[1]) return named[1];

  return clean;
}

function tiktokUiIdentity(value) {
  return String(value || "")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .replaceAll("\\/", "/")
    .trim()
    .toLowerCase();
}

function previewImageUrl(value, sourceUrl) {
  if (!isHttpUrl(value)) return "";

  try {
    const parsed = new URL(String(value));
    const host = parsed.hostname.toLowerCase();
    const shouldProxy =
      host.includes("tiktokcdn") ||
      host.includes("byteimg") ||
      host.includes("ibyteimg") ||
      host.includes("ibytedtos") ||
      host.includes("bytegecko") ||
      host.includes("muscdn") ||
      host.includes("tiktokv") ||
      host.includes("tikwm.com") ||
      host.includes("bytegd") ||
      host.startsWith("p16-") ||
      host.startsWith("p19-") ||
      host.startsWith("p26-") ||
      host.startsWith("p9-") ||
      host.startsWith("p77-") ||
      host.includes("cdninstagram") ||
      host.includes("fbcdn") ||
      host.includes("scontent");

    if (!shouldProxy) return value;

    const params = new URLSearchParams({ url: value });
    if (sourceUrl) params.set("source", sourceUrl);
    return `/api/image-proxy?${params.toString()}`;
  } catch {
    return value;
  }
}

function uiIdentity(value) {
  return String(value || "")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .split("?")[0]
    .toLowerCase();
}

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

  const isVideoMode =
    analysis?.linkKind === "video" ||
    analysis?.suggestedGroup === "video";

  const availableTabs = useMemo(() => {
    const rawAllowedTabs =
      Array.isArray(analysis?.allowedTabs) && analysis.allowedTabs.length
        ? analysis.allowedTabs
        : RESULT_TABS.map((tab) => tab.id);

    const allowedTabs = isVideoMode
      ? rawAllowedTabs.filter((tab) => tab !== "photo")
      : rawAllowedTabs;

    return RESULT_TABS.filter(
      (tab) => allowedTabs.includes(tab.id) && getSupportedRows(tab, analysis).length,
    );
  }, [analysis, isVideoMode]);

  const activeTabData = useMemo(() => {
    return (
      availableTabs.find((tab) => tab.id === activeTab) ||
      availableTabs[0] ||
      RESULT_TABS[1]
    );
  }, [activeTab, availableTabs]);

  const activeRows = useMemo(() => {
    return getSupportedRows(activeTabData, analysis);
  }, [activeTabData, analysis]);

  const slides = useMemo(() => {
    if (isVideoMode) return [];

    const rawSlides = Array.isArray(analysis?.slides)
      ? analysis.slides.filter((item) => item?.url || item?.thumbnail)
      : [];
    return normalizeSlidesForUi(rawSlides, analysis?.platform);
  }, [analysis, isVideoMode]);

  const primaryThumbnail = useMemo(() => {
    const candidate =
      (isHttpUrl(analysis?.thumbnail) ? analysis.thumbnail : "") ||
      slides.find((item) => isHttpUrl(item.thumbnail))?.thumbnail ||
      slides.find((item) => item.type === "photo" && isHttpUrl(item.url))?.url ||
      "";

    return previewImageUrl(candidate, analysis?.source || url);
  }, [analysis, slides, url]);

  const isPhotoOnlyMode =
    !isVideoMode &&
    analysis?.suggestedGroup === "photo" &&
    Array.isArray(analysis?.allowedTabs) &&
    analysis.allowedTabs.length === 1 &&
    analysis.allowedTabs[0] === "photo";

  const shouldShowSlides = !isVideoMode && slides.length > 0;

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
        const supportedTabs = RESULT_TABS.filter(
          (tab) => allowedTabs.includes(tab.id) && getSupportedRows(tab, data).length,
        ).map((tab) => tab.id);
        const preferredTab = supportedTabs[0] || allowedTabs[0] || data.suggestedGroup || "video";

        const dataIsVideo =
          data.linkKind === "video" ||
          data.suggestedGroup === "video";

        setAnalysis(data);

        if (dataIsVideo) {
          setActiveTab("video");
        } else if (supportedTabs.includes(data.suggestedGroup)) {
          setActiveTab(data.suggestedGroup);
        } else {
          setActiveTab(preferredTab);
        }
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
          sourceUrl: url,
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
        await recordDownloadEvent({
          sourceUrl: url,
          platform: analysis?.platform || platform,
          mediaGroup: "photo",
          fileType: slide.type || "photo",
        });
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

    try {
      const res = await fetch("/api/download-slides", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceUrl: url,
          slides: slides.map((slide, index) => ({
            url: slide.url,
            sourceUrl: url,
            filename: slide.filename || `slide-${index + 1}`,
            type: slide.type || "photo",
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Download semua slide gagal.");
      } else {
        setLastFile(data);
        await triggerDownload(
          data.downloadUrl,
          data.title || `${analysis?.platform || "slides"}-slides.zip`,
        );
        await recordDownloadEvent({
          sourceUrl: url,
          platform: analysis?.platform || platform,
          mediaGroup: "photo",
          fileType: "zip",
        });
      }
    } catch {
      setError("Gagal mengunduh semua slide.");
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
          url: getPreferredDownloadSource(mediaGroup),
          originalUrl: url,
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
        await recordDownloadEvent({
          sourceUrl: url,
          platform: analysis?.platform || platform,
          mediaGroup,
          fileType: row.fileType,
        });
      }
    } catch {
      setError("Gagal mengunduh file.");
    }

    setDownloadingKey("");
  }

  function getPreferredDownloadSource(mediaGroup) {
    if (mediaGroup === "video" && analysis?.directVideoUrl) return analysis.directVideoUrl;
    if (mediaGroup === "audio" && analysis?.directAudioUrl) return analysis.directAudioUrl;
    return url;
  }

  function triggerDownload(downloadUrl, filename) {
    if (!downloadUrl) {
      setError("Download URL kosong. Silakan convert ulang.");
      return;
    }

    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = sanitizeDownloadFilename(filename || "menginasv-download");
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.location.href = downloadUrl;
    }
  }

  function sanitizeDownloadFilename(value) {
    return String(value || "menginasv-download")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "menginasv-download";
  }

  function resetConvert() {
    setAnalysis(null);
    setLastFile(null);
    setError("");
    setActiveTab("video");
  }

  return (
    <main className="page">
      <SiteNav />

      <section className="hero">
        <div className="navGlowPill">
          <Sparkles size={15} />
          Downloader • Photo • Video • Audio
        </div>
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
        <section className="resultLayout">
          <aside className="previewCard">
            <div className="thumbWrap">
              {primaryThumbnail ? (
                <img src={primaryThumbnail} alt="Media thumbnail" referrerPolicy="no-referrer" />
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

            {shouldShowSlides && !isPhotoOnlyMode ? (
              <div className="slideBox">
                <div className="slideBoxHead">
                  <div>
                    <b>{slides.length} slide/media</b>
                    <span>Download per slide atau langsung semua foto.</span>
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
                      {downloadingSlideKey === "all" ? "Membuat ZIP..." : "ZIP Semua"}
                    </button>
                  ) : null}
                </div>

                <div className="slideGrid">
                  {slides.map((slide, index) => {
                    const key = `slide-${index}`;
                    const rawThumb =
                      slide.thumbnail ||
                      (slide.type === "photo" ? slide.url : primaryThumbnail);
                    const thumb = previewImageUrl(rawThumb, analysis?.source || url);

                    return (
                      <div className="slideCard" key={`${slide.url}-${index}`}>
                        <div className="slideThumb">
                          {thumb ? (
                            <img src={thumb} alt={`Slide ${index + 1}`} referrerPolicy="no-referrer" />
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
                    download={sanitizeDownloadFilename(lastFile.title || "menginasv-download")}
                    rel="noopener noreferrer"
                  >
                    Download manual
                  </a>
                </div>
              </div>
            ) : null}
          </aside>

          {!isVideoMode && isPhotoOnlyMode ? (
            slides.length ? (
              <section className="downloadPanel slideOnlyPanel">
                <div className="slideBox slideBoxInPanel">
                  <div className="slideBoxHead">
                    <div>
                      <b>{slides.length} slide/media</b>
                      <span>Download per slide atau langsung semua foto.</span>
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
                          ? "Downloading"
                          : "Semua"}
                      </button>
                    ) : null}
                  </div>

                  <div className="slideGrid">
                    {slides.map((slide, index) => {
                      const key = `slide-${index}`;
                      const rawThumb =
                        slide.thumbnail ||
                        (slide.type === "photo" ? slide.url : primaryThumbnail);
                      const thumb = previewImageUrl(rawThumb, analysis?.source || url);

                      return (
                        <div
                          className="slideCard"
                          key={`${slide.url}-${index}`}
                        >
                          <div className="slideThumb">
                            {thumb ? (
                              <img src={thumb} alt={`Slide ${index + 1}`} referrerPolicy="no-referrer" />
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
              </section>
            ) : null
          ) : (
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
                {!activeRows.length ? (
                  <div className="tr emptyFormatRow">
                    <div>
                      <b>Format belum tersedia</b>
                      <em>Pilih link lain yang didukung.</em>
                    </div>
                    <span>-</span>
                    <span>-</span>
                  </div>
                ) : null}
                {activeRows.map((row) => {
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
          )}
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
