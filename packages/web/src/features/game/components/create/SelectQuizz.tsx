import type { Quizz, QuizzWithId } from "@mindbuzz/common/types/game"
import Button from "@mindbuzz/web/features/game/components/Button"
import Input from "@mindbuzz/web/features/game/components/Input"
import clsx from "clsx"
import { type KeyboardEvent, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"

type Props = {
  quizzList: QuizzWithId[]
  onSelect: (_id: string, _answersOnly: boolean) => void
  onCreate: (_subject: string) => void
  onDelete: (_id: string) => void
  onEdit: (_id: string) => void
  onTogglePublic: (_id: string, _isPublic: boolean) => void
  isAdmin?: boolean
  onImport: (_subject: string, _quizz: Quizz) => void
  onExport: (_id: string) => void
}

const LANGUAGE_CODES: Record<string, string> = {
  English: "EN",
  Italian: "IT",
  French: "FR",
  Spanish: "ES",
  German: "DE",
}

const getLanguageFlag = (language: string) => LANGUAGE_CODES[language] || language.slice(0, 2).toUpperCase()

const SelectQuizz = ({
  quizzList,
  onCreate,
  onDelete,
  onEdit,
  onTogglePublic,
  isAdmin,
  onSelect,
  onImport,
  onExport,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [answersOnly, setAnswersOnly] = useState(false)
  const [subject, setSubject] = useState("")
  const [search, setSearch] = useState("")
  const [languageFilter, setLanguageFilter] = useState("All")
  const [visibilityFilter, setVisibilityFilter] = useState("All")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedQuizzList = useMemo(
    () => [...quizzList]
      .filter((q) => q.subject.toLowerCase().includes(search.toLowerCase()))
      .filter((q) => languageFilter === "All" || (q.language || "English") === languageFilter)
      .filter((q) => visibilityFilter === "All" || (visibilityFilter === "Public" ? q.isPublic : !q.isPublic))
      .sort((a, b) => a.subject.localeCompare(b.subject)),
    [quizzList, search, languageFilter, visibilityFilter],
  )

  const handleSelect = (id: string) => () => {
    if (selected === id) {
      setSelected(null)
    } else {
      setSelected(id)
    }
  }

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select a quizz")
      return
    }
    onSelect(selected, answersOnly)
  }

  const handleCreate = () => {
    const trimmedSubject = subject.trim()
    if (!trimmedSubject) {
      toast.error("Please enter a quiz name")
      return
    }
    onCreate(trimmedSubject)
    setSubject("")
  }

  const handleDelete = (id: string) => () => {
    const quizz = quizzList.find((item) => item.id === id)
    if (!quizz) {
      return
    }
    const confirmed = window.confirm(
      `Delete "${quizz.subject}"? This removes it from your account.`,
    )
    if (!confirmed) {
      return
    }
    if (selected === id) {
      setSelected(null)
    }
    onDelete(id)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleCreate()
    }
  }

  const handleExport = (quizz: QuizzWithId) => (event: React.MouseEvent) => {
    event.stopPropagation()
    const payload = {
      public: true,
      title: quizz.subject,
      description: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: quizz.questions.map((q) => ({
        question: q.question,
        time: String(q.time),
        type: "ABCD",
        answers: q.answers.map((a, i) => ({
          right: q.solutions.includes(i),
          answer: a,
          color: "#cccccc",
        })),
        image: 0,
        hide_results: false,
      })),
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${quizz.subject}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported "${quizz.subject}"`)
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      let data: any
      const filename = file.name.toLowerCase()

      if (filename.endsWith(".json")) {
        const text = await file.text()
        data = JSON.parse(text)
      } else {
        toast.error("Unsupported file format. Use .json")
        return
      }

      let quizz: Quizz
      let title: string

      if (data.title && data.questions && data.questions[0]?.answers?.[0]?.answer !== undefined) {
        title = data.title
        quizz = {
          subject: title,
          questions: data.questions.map((q: any) => ({
            question: q.question,
            answers: q.answers.map((a: any) => a.answer),
            solutions: q.answers.reduce((acc: number[], a: any, i: number) => {
              if (a.right) acc.push(i)
              return acc
            }, []),
            cooldown: 5,
            time: parseInt(q.time),
          })),
        }
      } else if (data.name && data.questionList) {
        title = data.name
        quizz = {
          subject: title,
          questions: data.questionList.map((q: any) => ({
            question: q.questionText,
            answers: q.answerOptionList.map((a: any) => a.answerText),
            solutions: q.answerOptionList.reduce((acc: number[], a: any, i: number) => {
              if (a.isCorrect) acc.push(i)
              return acc
            }, []),
            cooldown: 5,
            time: parseInt(q.timer),
          })),
        }
      } else {
        toast.error("Unrecognised file format")
        return
      }

      onImport(title, quizz)
      toast.success(`Imported "${title}"`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to import file")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="z-10 flex w-full max-w-2xl flex-col gap-5 rounded-md bg-white p-4 shadow-sm md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Manage quizzes</h1>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

      <div className="flex flex-col items-center justify-center">
        <div className="mb-2 flex w-full items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Available quizzes <span className="text-base font-normal text-Light-Slate">(Click on quiz to select)</span></h2>
          <span className="text-sm font-semibold text-Light-Slate">
            {sortedQuizzList.length} total
          </span>
        </div>
        <div className="flex gap-2 mb-2 w-full">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search quizzes..." className="flex-1 rounded-sm p-2 text-sm font-semibold outline-2 outline-Power-Gray" />
          <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="rounded-md border border-Power-Gray px-3 py-2 text-sm font-semibold text-Graphite bg-white">
            <option value="All">All</option>
            <option value="English">English</option>
            <option value="Italian">Italian</option>
            <option value="French">French</option>
            <option value="Spanish">Spanish</option>
            <option value="German">German</option>
            <option value="Other">Other</option>
          </select>
          <div className="flex rounded-md border border-Power-Gray overflow-hidden text-sm font-semibold">
            {["All", "Public", "Private"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={(e) => { e.stopPropagation(); setVisibilityFilter(v); }}
                className={clsx("px-3 py-2", visibilityFilter === v ? "bg-primary text-white" : "bg-white !text-Dark-Slate")}
              >
                {v === "Public" ? "🌐 Public" : v === "Private" ? "🔒 Private" : "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full space-y-2">
          {sortedQuizzList.length === 0 && (
            <div className="rounded-md border border-dashed border-Power-Gray p-4 text-center text-Light-Slate">
              No quizzes yet. Create one to get started.
            </div>
          )}

          {sortedQuizzList.map((quizz) => (
            <div
              key={quizz.id}
              className={clsx(
                "flex w-full items-center gap-3 rounded-md p-3 text-left outline outline-Power-Gray",
                selected === quizz.id && "bg-red-50 outline-red-400",
              )}
              role="button"
              tabIndex={0}
              onClick={handleSelect(quizz.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  handleSelect(quizz.id)()
                }
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {quizz.isPublic ? "🌐" : "🔒"} {quizz.subject}
                </p>
                <p className="text-sm text-Light-Slate">
                  {quizz.questions.length} questions · {getLanguageFlag(quizz.language || "English")}
                  {!quizz.ownedByCurrentManager && " · shared"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {quizz.ownedByCurrentManager !== false && (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-Power-Gray">{quizz.isPublic ? "Public" : "Private"}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onTogglePublic(quizz.id, !quizz.isPublic); }}
                      className={clsx("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", quizz.isPublic ? "bg-primary" : "bg-Power-Gray")}
                    >
                      <span className={clsx("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform", quizz.isPublic ? "translate-x-4" : "translate-x-1")} />
                    </button>
                  </div>
                )}
                {quizz.ownedByCurrentManager !== false && (
                  <Button
                    type="button"
                    className="bg-white px-3 py-1 text-sm !text-black"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(quizz.id)
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  className="bg-white px-3 py-1 text-sm !text-black"
                  onClick={handleExport(quizz)}
                >
                  Export
                </Button>
                {(quizz.ownedByCurrentManager !== false || isAdmin) && (
                  <Button
                    type="button"
                    className={clsx("px-3 py-1 text-sm", selected === quizz.id ? "bg-Dark-Slate !text-white" : "bg-primary")}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDelete(quizz.id)()
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onCreate("New quiz")}
          className="flex-1 px-4"
        >
          + Create quiz
        </Button>
        <Button
          type="button"
          className="flex-1 bg-white !text-black px-4"
          onClick={() => fileInputRef.current?.click()}
        >
          📥 Import quiz
        </Button>
      </div>
      {selected && (
        <div className="rounded-md border border-Power-Gray bg-gray-50 p-4">
          <p className="mb-1 font-semibold text-Graphite">
            Player display
          </p>
          <p className="mb-3 text-sm text-Light-Slate">
            Choose what participants see on their own devices for this session.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAnswersOnly(false)}
              className={clsx(
                "rounded-md border p-3 text-left transition-colors",
                !answersOnly
                  ? "border-primary bg-red-50"
                  : "border-Power-Gray bg-white",
              )}
            >
              <span className="block font-semibold">
                📱 Full player view
              </span>
              <span className="mt-1 block text-xs text-Light-Slate">
                Players see the question, media and answer choices.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAnswersOnly(true)}
              className={clsx(
                "rounded-md border p-3 text-left transition-colors",
                answersOnly
                  ? "border-primary bg-red-50"
                  : "border-Power-Gray bg-white",
              )}
            >
              <span className="block font-semibold">
                🔢 Answers only
              </span>
              <span className="mt-1 block text-xs text-Light-Slate">
                Players use their device as a response pad. The question and media stay on the presenter screen.
              </span>
            </button>
          </div>
        </div>
      )}

      <Button onClick={handleSubmit}>Start selected quiz</Button>
    </div>
  )
}

export default SelectQuizz
