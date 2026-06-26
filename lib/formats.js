export const PLATFORMS = [
  { id: "auto", label: "Auto", hint: "Detect link" },
  { id: "youtube", label: "YouTube", hint: "Video, audio" },
  { id: "tiktok", label: "TikTok", hint: "Short video" },
  { id: "instagram", label: "Instagram", hint: "Reels, photo" },
  { id: "facebook", label: "Facebook", hint: "Video" },
  { id: "x", label: "X", hint: "Video, photo" },
  { id: "threads", label: "Threads", hint: "Post media" },
  { id: "pinterest", label: "Pinterest", hint: "Photo, video" },
  { id: "soundcloud", label: "SoundCloud", hint: "Audio" },
  { id: "direct", label: "Direct File", hint: "Raw media URL" }
]

export const MEDIA_GROUPS = [
  {
    id: "video",
    label: "Video",
    description: "Untuk YouTube, TikTok, Reels, Short, Facebook video, dan X video.",
    qualities: [
      { id: "best", label: "Best", note: "Kualitas terbaik tersedia" },
      { id: "4320p", label: "8K / 4320p", note: "Sangat besar" },
      { id: "2160p", label: "4K / 2160p", note: "Ultra HD" },
      { id: "1440p", label: "2K / 1440p", note: "QHD" },
      { id: "1080p", label: "Full HD / 1080p", note: "Jernih dan aman" },
      { id: "720p", label: "HD / 720p", note: "Seimbang" },
      { id: "480p", label: "480p", note: "Ukuran sedang" },
      { id: "360p", label: "360p", note: "Ukuran kecil" },
      { id: "240p", label: "240p", note: "Hemat data" }
    ],
    fileTypes: [
      { id: "mp4", label: "MP4", note: "Paling kompatibel" },
      { id: "webm", label: "WEBM", note: "Ringan untuk browser" },
      { id: "mkv", label: "MKV", note: "Container fleksibel" },
      { id: "mov", label: "MOV", note: "Cocok Apple" },
      { id: "avi", label: "AVI", note: "Format klasik" },
      { id: "m4v", label: "M4V", note: "Apple video" },
      { id: "3gp", label: "3GP", note: "Ukuran kecil" },
      { id: "flv", label: "FLV", note: "Legacy video" }
    ]
  },
  {
    id: "audio",
    label: "Audio",
    description: "Untuk ambil lagu, backsound, podcast, atau audio dari video.",
    qualities: [
      { id: "best", label: "Best", note: "Kualitas terbaik tersedia" },
      { id: "320k", label: "320 kbps", note: "High quality" },
      { id: "256k", label: "256 kbps", note: "Jernih" },
      { id: "192k", label: "192 kbps", note: "Seimbang" },
      { id: "160k", label: "160 kbps", note: "Medium" },
      { id: "128k", label: "128 kbps", note: "Ukuran kecil" },
      { id: "96k", label: "96 kbps", note: "Hemat data" },
      { id: "64k", label: "64 kbps", note: "Sangat kecil" }
    ],
    fileTypes: [
      { id: "mp3", label: "MP3", note: "Paling umum" },
      { id: "m4a", label: "M4A", note: "Bagus untuk mobile" },
      { id: "aac", label: "AAC", note: "Efisien dan jernih" },
      { id: "wav", label: "WAV", note: "Lossless besar" },
      { id: "flac", label: "FLAC", note: "Lossless audio" },
      { id: "ogg", label: "OGG", note: "Open format" },
      { id: "opus", label: "OPUS", note: "Modern dan kecil" },
      { id: "webm", label: "WEBM Audio", note: "Audio web" }
    ]
  },
  {
    id: "photo",
    label: "Foto",
    description: "Untuk gambar post, thumbnail, cover, pin, atau foto dari link media.",
    qualities: [
      { id: "original", label: "Original", note: "Ukuran asli jika tersedia" },
      { id: "large", label: "Large", note: "Kualitas besar" },
      { id: "medium", label: "Medium", note: "Seimbang" },
      { id: "small", label: "Small", note: "Ukuran kecil" },
      { id: "thumbnail", label: "Thumbnail", note: "Preview kecil" }
    ],
    fileTypes: [
      { id: "jpg", label: "JPG", note: "Ringan dan umum" },
      { id: "jpeg", label: "JPEG", note: "Sama seperti JPG" },
      { id: "png", label: "PNG", note: "Tajam dan bersih" },
      { id: "webp", label: "WEBP", note: "Modern dan kecil" },
      { id: "gif", label: "GIF", note: "Animasi pendek" },
      { id: "bmp", label: "BMP", note: "Tanpa kompresi" },
      { id: "tiff", label: "TIFF", note: "Arsip gambar" },
      { id: "avif", label: "AVIF", note: "Kompresi modern" }
    ]
  }
]

export function getGroup(id) {
  return MEDIA_GROUPS.find((item) => item.id === id) || MEDIA_GROUPS[0]
}
