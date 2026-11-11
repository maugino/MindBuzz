import { useState } from "react"

type MediaType = "image" | "video"

type Props = {
  type: MediaType
  onSelect: (url: string) => void
}

type PexelsPhoto = {
  id: number
  src: { medium: string; original: string }
  alt: string
  photographer: string
}

type PexelsVideo = {
  id: number
  image: string
  video_files: { link: string; quality: string; file_type: string }[]
  user: { name: string }
}

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY || ""

const PexelsSearch = ({ type, onSelect }: Props) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<(PexelsPhoto | PexelsVideo)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError("")
    try {
      const endpoint = type === "image"
        ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`
        : `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=12`
      const res = await fetch(endpoint, { headers: { Authorization: PEXELS_KEY } })
      const data = await res.json()
      setResults(type === "image" ? data.photos : data.videos)
    } catch {
      setError("Search failed. Please try again.")
    }
    setLoading(false)
  }

  const handleSelect = (item: PexelsPhoto | PexelsVideo) => {
    if (type === "image") {
      const photo = item as PexelsPhoto
      onSelect(photo.src.original)
    } else {
      const video = item as PexelsVideo
      const hd = video.video_files.find(f => f.quality === "hd" && f.file_type === "video/mp4")
        || video.video_files[0]
      onSelect(hd.link)
    }
    setOpen(false)
    setResults([])
    setQuery("")
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-Dark-Slate font-semibold hover:underline"
      >
        🔍 Search Pexels {type === "image" ? "Photos" : "Videos"}
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-Power-Gray bg-white p-3">
          <div className="flex gap-2 mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder={`Search ${type === "image" ? "photos" : "videos"}...`}
              className="flex-1 rounded-sm p-2 text-sm font-semibold outline-2 outline-Power-Gray"
            />
            <button
              type="button"
              onClick={search}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-Dark-Slate border border-Power-Gray"
            >
              Close
            </button>
          </div>

          {loading && <p className="text-sm text-Light-Slate">Searching...</p>}
          {error && <p className="text-sm text-primary">{error}</p>}

          {results.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {results.map((item) => {
                  const thumb = type === "image"
                    ? (item as PexelsPhoto).src.medium
                    : (item as PexelsVideo).image
                  const credit = type === "image"
                    ? (item as PexelsPhoto).photographer
                    : (item as PexelsVideo).user.name
                  return (
                    <div
                      key={item.id}
                      className="cursor-pointer rounded overflow-hidden border border-Power-Gray hover:border-primary"
                      onClick={() => handleSelect(item)}
                    >
                      <img src={thumb} alt="" className="w-full h-20 object-cover" />
                      <p className="text-xs text-Light-Slate truncate px-1 py-0.5">{credit}</p>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-Light-Slate mt-2">Photos/Videos provided by <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="text-primary">Pexels</a></p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PexelsSearch
