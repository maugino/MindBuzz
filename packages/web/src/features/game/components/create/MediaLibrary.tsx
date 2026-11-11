import { useState } from "react"
import clsx from "clsx"

type MediaFile = { filename: string; url: string }

type Props = {
  type: "image" | "video" | "audio"
  mediaList: MediaFile[]
  onSelect: (url: string) => void
  onUpload: (data: { filename: string; content: string }) => void
}

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|svg)$/i
const VIDEO_EXTS = /\.(mp4|webm)$/i
const AUDIO_EXTS = /\.(mp3|wav|ogg)$/i

const MediaLibrary = ({ type, mediaList, onSelect, onUpload }: Props) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = mediaList.filter((f) => {
    if (type === "image") return IMAGE_EXTS.test(f.filename)
    if (type === "video") return VIDEO_EXTS.test(f.filename)
    return AUDIO_EXTS.test(f.filename)
  })

  const accept = type === "image" ? "image/*" : type === "video" ? "video/*" : "audio/*"

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      onUpload({ filename: file.name, content: base64 })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleSelect = () => {
    if (!selected) return
    onSelect(selected)
    setOpen(false)
    setSelected(null)
  }

  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-Dark-Slate font-semibold hover:underline"
      >
        📁 {label} library
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-Power-Gray bg-white p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-Graphite">{label} library</p>
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-md border border-primary px-3 py-1 text-sm font-semibold text-primary hover:bg-red-50">
                + Upload new
                <input type="file" accept={accept} className="hidden" onChange={handleUpload} />
              </label>
              <button
                type="button"
                onClick={() => { setOpen(false); setSelected(null); }}
                className="rounded-md border border-Power-Gray px-3 py-1 text-sm font-semibold text-Dark-Slate"
              >
                Close
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-Light-Slate py-4 text-center">No {type} files uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-3">
              {filtered.map((file) => (
                <div
                  key={file.url}
                  className={clsx(
                    "cursor-pointer rounded overflow-hidden border-2 transition-colors",
                    selected === file.url ? "border-primary" : "border-Power-Gray hover:border-Graphite"
                  )}
                  onClick={() => setSelected(file.url)}
                >
                  {type === "image" && (
                    <img src={file.url} alt={file.filename} className="w-full h-16 object-cover" />
                  )}
                  {type === "video" && (
                    <div className="w-full h-16 bg-Dark-Slate flex items-center justify-center">
                      <span className="text-white text-xl">▶</span>
                    </div>
                  )}
                  {type === "audio" && (
                    <div className="w-full h-16 bg-Graphite flex items-center justify-center">
                      <span className="text-white text-xl">♪</span>
                    </div>
                  )}
                  <p className="text-xs text-Light-Slate truncate px-1 py-0.5">{file.filename}</p>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <button
              type="button"
              onClick={handleSelect}
              className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-white"
            >
              Use selected {type}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default MediaLibrary
