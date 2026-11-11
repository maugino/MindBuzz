import type { Quizz, QuizzWithId } from "@mindbuzz/common/types/game"
import Button from "@mindbuzz/web/features/game/components/Button"
import Input from "@mindbuzz/web/features/game/components/Input"
import clsx from "clsx"
import PexelsSearch from "@mindbuzz/web/features/game/components/create/PexelsSearch"
import MediaLibrary from "@mindbuzz/web/features/game/components/create/MediaLibrary"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

type Props = {
  quizz: QuizzWithId
  onBack: () => void
  onSave: (_quizzId: string, _quizz: Quizz) => void
  onUploadMedia: (_data: {
    filename: string
    content: string
    field: "image" | "video" | "audio" | "subtitle"
    questionIndex: number
    lang?: string
  }) => void
  uploadedMedia?: {
    url: string
    field: "image" | "video" | "audio" | "subtitle"
    questionIndex: number
    lang?: string
  } | null
  mediaList?: { filename: string; url: string }[]
}

// Matches ANSWERS_COLORS order: green, red, yellow, blue
const ANSWER_STYLES = [
  { bg: "bg-green-500",  border: "border-green-600",  darkText: false },
  { bg: "bg-red-500",    border: "border-red-600",    darkText: false },
  { bg: "bg-yellow-500", border: "border-yellow-600", darkText: true  },
  { bg: "bg-blue-500",   border: "border-blue-600",   darkText: false },
]

const ANSWER_ICONS = [
  <svg key="tri" viewBox="0 0 12 12" className="h-3 w-3 fill-current"><polygon points="6,1 11,11 1,11" /></svg>,
  <svg key="rho" viewBox="0 0 12 12" className="h-3 w-3 fill-current"><polygon points="6,1 11,6 6,11 1,6" /></svg>,
  <svg key="cir" viewBox="0 0 12 12" className="h-3 w-3 fill-current"><circle cx="6" cy="6" r="5" /></svg>,
  <svg key="sq"  viewBox="0 0 12 12" className="h-3 w-3 fill-current"><rect x="1" y="1" width="10" height="10" /></svg>,
]

// Image=green (Triangle), Video=red (Rhombus), Audio=yellow (Circle)
const MEDIA_BUTTONS = [
  {
    type: "image" as const,
    label: "Image",
    iconBg: "bg-green-500",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-white" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    type: "video" as const,
    label: "Video",
    iconBg: "bg-red-500",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white stroke-none">
        <polygon points="8,5 19,12 8,19" />
      </svg>
    ),
  },
  {
    type: "audio" as const,
    label: "Audio",
    iconBg: "bg-yellow-500",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-black" strokeWidth={2}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
]

const SUBTITLE_LANGS = [
  { label: "English", code: "en" },
  { label: "Italian", code: "it" },
  { label: "French",  code: "fr" },
  { label: "Spanish", code: "es" },
  { label: "German",  code: "de" },
]

const createEmptyQuestion = () => ({
  question: "",
  answers: ["", ""],
  solutions: [0],
  cooldown: 5,
  time: 20,
  image: "",
  video: "",
  audio: "",
})

const QuizzEditor = ({
  quizz,
  onBack,
  onSave,
  onUploadMedia,
  uploadedMedia,
  mediaList = [],
}: Props) => {
  const [draft, setDraft] = useState<Quizz>({
    subject: quizz.subject,
    isPublic: quizz.isPublic || false,
    language: quizz.language || "English",
    questions: quizz.questions.map((q) => ({
      ...q,
      image: q.image ?? "",
      video: q.video ?? "",
      audio: q.audio ?? "",
      subtitles: q.subtitles ?? {},
    })),
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [activeMedia, setActiveMedia] = useState<"image" | "video" | "audio" | null>(null)

  useEffect(() => {
    setDraft({
      subject: quizz.subject,
      isPublic: quizz.isPublic || false,
      language: quizz.language || "English",
      questions: quizz.questions.map((q) => ({
        ...q,
        image: q.image ?? "",
        video: q.video ?? "",
        audio: q.audio ?? "",
        subtitles: q.subtitles ?? {},
      })),
    })
  }, [quizz])

  useEffect(() => {
    if (!uploadedMedia?.url) return
    if (uploadedMedia.field === "subtitle" && uploadedMedia.lang) {
      const lang = uploadedMedia.lang
      updateQuestion(uploadedMedia.questionIndex, (q) => ({
        ...q,
        subtitles: { ...(q.subtitles ?? {}), [lang]: uploadedMedia.url },
      }))
    } else if (uploadedMedia.field !== "subtitle") {
      handleQuestionAssetField(
        uploadedMedia.questionIndex,
        uploadedMedia.field as "image" | "video" | "audio",
        uploadedMedia.url,
      )
    }
  }, [uploadedMedia?.url])

  const safeIndex = Math.min(activeIndex, draft.questions.length - 1)
  const activeQuestion = draft.questions[safeIndex]
  const isCustomLanguage =
    draft.language !== undefined &&
    !["English", "Italian", "French", "Spanish", "German"].includes(draft.language)

  const updateQuestion = (
    index: number,
    updater: (_q: Quizz["questions"][number]) => Quizz["questions"][number],
  ) =>
    setDraft((cur) => ({
      ...cur,
      questions: cur.questions.map((q, i) => (i === index ? updater(q) : q)),
    }))

  const handleQuestionText = (index: number, value: string) =>
    updateQuestion(index, (q) => ({ ...q, question: value }))

  const handleQuestionNumberField = (
    index: number,
    field: "cooldown" | "time",
    value: number,
  ) => updateQuestion(index, (q) => ({ ...q, [field]: value }))

  const handleQuestionAssetField = (
    index: number,
    field: "image" | "video" | "audio",
    value: string,
  ) => updateQuestion(index, (q) => ({ ...q, [field]: value }))

  const handleAnswerChange =
    (qi: number, ai: number) => (value: string) =>
      updateQuestion(qi, (q) => ({
        ...q,
        answers: q.answers.map((a, i) => (i === ai ? value : a)),
      }))

  const handleAddQuestion = () => {
    setDraft((cur) => ({
      ...cur,
      questions: [...cur.questions, createEmptyQuestion()],
    }))
    setActiveIndex(draft.questions.length)
    setActiveMedia(null)
  }

  const handleDeleteQuestion = (index: number) => () => {
    if (draft.questions.length === 1) {
      toast.error("A quiz needs at least one question")
      return
    }
    setDraft((cur) => ({
      ...cur,
      questions: cur.questions.filter((_, i) => i !== index),
    }))
    setActiveIndex((cur) => Math.max(0, cur >= index ? cur - 1 : cur))
  }

  const handleAddAnswer = (qi: number) => () => {
    if (draft.questions[qi].answers.length >= 4) {
      toast.error("Questions can have at most 4 answers")
      return
    }
    updateQuestion(qi, (q) => ({ ...q, answers: [...q.answers, ""] }))
  }

  const handleDeleteAnswer = (qi: number, ai: number) => () => {
    if (draft.questions[qi].answers.length <= 2) {
      toast.error("Questions need at least 2 answers")
      return
    }
    updateQuestion(qi, (q) => {
      const answers = q.answers.filter((_, i) => i !== ai)
      const solutions = q.solutions
        .filter((s) => s !== ai)
        .map((s) => (s > ai ? s - 1 : s))
      return { ...q, answers, solutions: solutions.length ? solutions : [0] }
    })
  }

  const handleToggleCorrectAnswer = (qi: number, ai: number) => () => {
    updateQuestion(qi, (q) => {
      const isSelected = q.solutions.includes(ai)
      if (isSelected && q.solutions.length === 1) {
        toast.error("Each question needs at least one correct answer")
        return q
      }
      const solutions = isSelected
        ? q.solutions.filter((s) => s !== ai)
        : [...q.solutions, ai].sort((a, b) => a - b)
      return { ...q, solutions }
    })
  }

  const handleSave = () => onSave(quizz.id, draft)

  const QuestionThumb = ({
    question,
    index,
  }: {
    question: Quizz["questions"][number]
    index: number
  }) => {
    const isActive = index === safeIndex
    const hasMedia = question.image || question.video || question.audio
    return (
      <button
        type="button"
        onClick={() => { setActiveIndex(index); setActiveMedia(null) }}
        className={clsx(
          "w-full overflow-hidden rounded-lg border-2 text-left transition-all",
          isActive ? "border-primary shadow-md" : "border-transparent hover:border-Power-Gray",
        )}
      >
        <div className="relative flex aspect-video flex-col items-center justify-center gap-1 bg-Dark-Slate p-2">
          {question.image && (
            <div className="absolute inset-0">
              <img src={question.image} className="h-full w-full object-cover opacity-30" alt="" />
            </div>
          )}
          <p className={clsx(
            "relative z-10 text-center font-semibold leading-tight text-white",
            question.question ? "line-clamp-2 text-[9px]" : "text-[8px] italic opacity-40",
          )}>
            {question.question || "No question text"}
          </p>
          <div className="relative z-10 mt-0.5 grid w-full grid-cols-2 gap-[2px]">
            {question.answers.slice(0, 4).map((ans, ai) => {
              const style = ANSWER_STYLES[ai] ?? ANSWER_STYLES[0]
              return (
                <div key={ai} className={clsx(
                  "flex items-center gap-[2px] truncate rounded-[2px] px-1 py-[2px] text-[6px] font-bold",
                  style.bg,
                  style.darkText ? "text-black" : "text-white",
                  question.solutions.includes(ai) && "ring-1 ring-inset ring-white",
                )}>
                  <span className="shrink-0">{ANSWER_ICONS[ai]}</span>
                  <span className="truncate">{ans || "…"}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className={clsx(
          "flex items-center justify-between px-2 py-1 text-[10px] font-semibold",
          isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-500",
        )}>
          <span>Q{index + 1}</span>
          {hasMedia && (
            <span className="text-[9px] opacity-70">
              {question.image ? "🖼" : question.video ? "▶" : "♪"}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-gray-100">

      {/* Top bar */}
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button className="shrink-0 bg-white !text-black px-3 py-1.5 text-sm" onClick={onBack}>
            ← Exit
          </Button>
          <input
            value={draft.subject}
            onChange={(e) => setDraft((cur) => ({ ...cur, subject: e.target.value }))}
            placeholder="Quiz title"
            className="w-48 min-w-0 rounded-md border border-Power-Gray px-3 py-1.5 text-sm font-semibold text-Graphite focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-1 items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={isCustomLanguage ? "Other" : draft.language || "English"}
              onChange={(e) =>
                setDraft((cur) => ({
                  ...cur,
                  language: e.target.value === "Other" ? " " : e.target.value,
                }))
              }
              className="rounded-md border border-Power-Gray bg-white px-3 py-1.5 text-sm font-semibold text-Graphite"
            >
              <option value="English">🇬🇧 English</option>
              <option value="Italian">🇮🇹 Italian</option>
              <option value="French">🇫🇷 French</option>
              <option value="Spanish">🇪🇸 Spanish</option>
              <option value="German">🇩🇪 German</option>
              <option value="Other">Other</option>
            </select>
            {isCustomLanguage && (
              <input
                value={(draft.language || "").trim()}
                onChange={(e) => setDraft((cur) => ({ ...cur, language: e.target.value }))}
                placeholder="Language name…"
                className="w-36 rounded-md border border-Power-Gray px-3 py-1.5 text-sm font-semibold text-Graphite"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft((cur) => ({ ...cur, isPublic: !cur.isPublic }))}
              className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                draft.isPublic ? "bg-primary" : "bg-Power-Gray",
              )}
            >
              <span className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                draft.isPublic ? "translate-x-6" : "translate-x-1",
              )} />
            </button>
            <span className="whitespace-nowrap text-sm text-Light-Slate">
              {draft.isPublic ? "🌐 Public" : "🔒 Private"}
            </span>
          </div>
        </div>

        <Button className="shrink-0 px-5 py-1.5 text-sm" onClick={handleSave}>
          Save
        </Button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left rail */}
        <aside className="flex w-44 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-Light-Slate">
              Questions
            </span>
            <span className="text-[10px] font-semibold text-Light-Slate">
              {draft.questions.length}
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {draft.questions.map((q, i) => (
              <QuestionThumb key={`${quizz.id}-${i}`} question={q} index={i} />
            ))}
          </div>
          <div className="shrink-0 border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full rounded-lg border-2 border-dashed border-Power-Gray py-2 text-[11px] font-semibold text-Light-Slate transition-colors hover:border-primary hover:text-primary"
            >
              + Add question
            </button>
          </div>
        </aside>

        {/* Centre canvas */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2">
            <textarea
              className="min-h-[52px] w-full resize-none rounded-md border border-Power-Gray px-3 py-2 text-base font-semibold text-Graphite focus:outline-none focus:ring-2 focus:ring-primary"
              value={activeQuestion.question}
              onChange={(e) => handleQuestionText(safeIndex, e.target.value)}
              placeholder="Start typing your question…"
              rows={2}
            />
          </div>

          <div className="relative flex flex-1 flex-col overflow-hidden bg-Dark-Slate">

            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={handleDeleteQuestion(safeIndex)}
                className={clsx(
                  "rounded-md bg-black/40 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-black/60",
                  draft.questions.length === 1 && "cursor-not-allowed opacity-40",
                )}
              >
                🗑 Delete question
              </button>
            </div>

            {/* Media display */}
            <div className="flex flex-1 items-center justify-center p-6 min-h-0">
              {activeQuestion.image ? (
                <img
                  src={activeQuestion.image}
                  className="max-h-full max-w-full rounded-lg object-contain shadow-xl"
                  alt="Question media"
                />
              ) : activeQuestion.video ? (
                <video
                  src={activeQuestion.video}
                  className="max-h-full max-w-full rounded-lg shadow-xl"
                  controls
                />
              ) : activeQuestion.audio ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-5xl">🎵</span>
                  <audio src={activeQuestion.audio} controls className="w-64" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-50">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-white/40">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white/50" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p className="text-center text-sm text-white/50">
                    Add an image, video or audio to your question
                  </p>
                </div>
              )}
            </div>

            {/* Media type buttons */}
            <div className="flex shrink-0 justify-center gap-3 pb-3">
              {MEDIA_BUTTONS.map(({ type, label, iconBg, icon }) => {
                const hasVal =
                  type === "image" ? activeQuestion.image
                  : type === "video" ? activeQuestion.video
                  : activeQuestion.audio
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveMedia(activeMedia === type ? null : type)}
                    className={clsx(
                      "flex items-center gap-2 rounded-lg border-2 px-4 py-1.5 text-sm font-semibold transition-all",
                      activeMedia === type
                        ? "border-white bg-white/20 text-white"
                        : "border-white/25 bg-white/10 text-white hover:bg-white/20",
                    )}
                  >
                    <span className={clsx("flex h-5 w-5 shrink-0 items-center justify-center rounded", iconBg)}>
                      {icon}
                    </span>
                    {label}
                    {hasVal ? " ✓" : ""}
                  </button>
                )
              })}
            </div>

            {/* Image panel */}
            {activeMedia === "image" && (
              <div className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold text-white/70">Image URL</p>
                <Input
                  value={activeQuestion.image ?? ""}
                  onChange={(e) => handleQuestionAssetField(safeIndex, "image", e.target.value)}
                  placeholder="Paste image URL…"
                  className="mb-2 w-full"
                />
                <div className="flex gap-2">
                  <MediaLibrary
                    type="image"
                    mediaList={mediaList}
                    onSelect={(url) => handleQuestionAssetField(safeIndex, "image", url)}
                    onUpload={(data) => onUploadMedia({ ...data, field: "image", questionIndex: safeIndex })}
                  />
                  <PexelsSearch
                    type="image"
                    onSelect={(url) => handleQuestionAssetField(safeIndex, "image", url)}
                  />
                </div>
              </div>
            )}

            {/* Video panel */}
            {activeMedia === "video" && (
              <div className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold text-white/70">Video URL</p>
                <Input
                  value={activeQuestion.video ?? ""}
                  onChange={(e) => handleQuestionAssetField(safeIndex, "video", e.target.value)}
                  placeholder="Paste video URL…"
                  className="mb-2 w-full"
                />
                <div className="flex gap-2 mb-3">
                  <MediaLibrary
                    type="video"
                    mediaList={mediaList}
                    onSelect={(url) => handleQuestionAssetField(safeIndex, "video", url)}
                    onUpload={(data) => onUploadMedia({ ...data, field: "video", questionIndex: safeIndex })}
                  />
                  <PexelsSearch
                    type="video"
                    onSelect={(url) => handleQuestionAssetField(safeIndex, "video", url)}
                  />
                </div>
                <p className="mb-1.5 text-xs font-semibold text-white/70">Subtitles</p>
                <div className="flex flex-col gap-1.5">
                  {SUBTITLE_LANGS.map(({ label, code }) => (
                    <div key={code} className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-[11px] font-semibold text-white/60">
                        {label}
                      </span>
                      <Input
                        value={activeQuestion.subtitles?.[code] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          updateQuestion(safeIndex, (q) => ({
                            ...q,
                            subtitles: { ...(q.subtitles ?? {}), [code]: val },
                          }))
                        }}
                        placeholder={`${label} .vtt URL`}
                        className="flex-1 text-xs"
                      />
                      <label className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-white/60 hover:text-white">
                        Upload .vtt
                        <input
                          type="file"
                          accept=".vtt"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => {
                              const base64 = (reader.result as string).split(",")[1]
                              onUploadMedia({
                                filename: `${file.name
                                  .replace(/\.vtt$/i, "")
                                  .replace(/-(?:en|it|fr|es|de)$/i, "")}-${code}.vtt`,
                                content: base64,
                                field: "subtitle",
                                questionIndex: safeIndex,
                                lang: code,
                              })
                            }
                            reader.readAsDataURL(file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio panel */}
            {activeMedia === "audio" && (
              <div className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold text-white/70">Audio URL</p>
                <Input
                  value={activeQuestion.audio ?? ""}
                  onChange={(e) => handleQuestionAssetField(safeIndex, "audio", e.target.value)}
                  placeholder="Paste audio URL…"
                  className="mb-2 w-full"
                />
                <MediaLibrary
                  type="audio"
                  mediaList={mediaList}
                  onSelect={(url) => handleQuestionAssetField(safeIndex, "audio", url)}
                  onUpload={(data) => onUploadMedia({ ...data, field: "audio", questionIndex: safeIndex })}
                />
              </div>
            )}

            {/* Answer tiles */}
            <div className="grid shrink-0 grid-cols-2 gap-2 px-3 pb-3">
              {activeQuestion.answers.map((answer, ai) => {
                const style = ANSWER_STYLES[ai] ?? ANSWER_STYLES[0]
                const isCorrect = activeQuestion.solutions.includes(ai)
                return (
                  <div
                    key={`${quizz.id}-${safeIndex}-${ai}`}
                    className={clsx(
                      "group relative flex min-h-[46px] items-center gap-2 rounded-lg border-b-4 px-3 py-2",
                      style.bg,
                      style.border,
                      isCorrect && "ring-2 ring-white ring-offset-1 ring-offset-Dark-Slate",
                    )}
                  >
                    <span className={clsx("shrink-0", style.darkText ? "text-black" : "text-white")}>
                      {ANSWER_ICONS[ai]}
                    </span>
                    <input
                      value={answer}
                      onChange={(e) => handleAnswerChange(safeIndex, ai)(e.target.value)}
                      placeholder={`Answer ${ai + 1}`}
                      className={clsx(
                        "min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none",
                        style.darkText
                          ? "text-black placeholder-black/40"
                          : "text-white placeholder-white/50",
                      )}
                    />
                    <button
                      type="button"
                      title={isCorrect ? "Mark as incorrect" : "Mark as correct"}
                      onClick={handleToggleCorrectAnswer(safeIndex, ai)}
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isCorrect
                          ? "border-white bg-white"
                          : "border-white/40 bg-white/15 hover:bg-white/30",
                      )}
                    >
                      <svg
                        viewBox="0 0 10 10"
                        className={clsx("h-2.5 w-2.5 fill-none", isCorrect ? "stroke-green-600" : "stroke-white/50")}
                        strokeWidth={2}
                      >
                        <polyline points="2,5 4,8 8,2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Delete answer"
                      onClick={handleDeleteAnswer(safeIndex, ai)}
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/60 opacity-0 transition-all hover:text-white group-hover:opacity-100",
                        activeQuestion.answers.length <= 2 && "pointer-events-none opacity-0",
                      )}
                    >
                      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth={1.5}>
                        <line x1="2" y1="2" x2="8" y2="8" />
                        <line x1="8" y1="2" x2="2" y2="8" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* Right panel */}
        <aside className="flex w-48 shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-200 bg-white p-4">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-Light-Slate">
              Timings
            </p>
            <div className="mb-3 flex flex-col gap-1">
              <label className="text-xs font-semibold text-Graphite">
                Question display (sec)
              </label>
              <Input
                type="number"
                min={0}
                value={activeQuestion.cooldown}
                onChange={(e) =>
                  handleQuestionNumberField(safeIndex, "cooldown", Number(e.target.value))
                }
              />
              <p className="text-[10px] text-Light-Slate">Duration before answers appear</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-Graphite">
                Answer time (sec)
              </label>
              <Input
                type="number"
                min={1}
                value={activeQuestion.time}
                onChange={(e) =>
                  handleQuestionNumberField(safeIndex, "time", Number(e.target.value))
                }
              />
              <p className="text-[10px] text-Light-Slate">Time players have to answer</p>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-Light-Slate">
              Answers
            </p>
            <p className="mb-3 text-[10px] leading-relaxed text-Light-Slate">
              Tap the circle on a tile to mark it correct. Multiple answers can be correct.
            </p>
            <Button
              type="button"
              className="w-full px-3 py-1.5 text-xs"
              onClick={handleAddAnswer(safeIndex)}
            >
              + Add answer
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default QuizzEditor
