import type { CommonStatusDataMap } from "@mindbuzz/common/types/game/status"
import AnswerButton from "@mindbuzz/web/features/game/components/AnswerButton"
import {
  useEvent,
  useSocket,
} from "@mindbuzz/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@mindbuzz/web/features/game/stores/player"
import {
  ANSWERS_COLORS,
  ANSWERS_ICONS,
  SFX_ANSWERS_MUSIC,
  SFX_ANSWERS_SOUND,
} from "@mindbuzz/web/features/game/utils/constants"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import { t } from "@mindbuzz/web/features/game/utils/translations"
import { useParams } from "react-router"
import useSound from "use-sound"

type Props = {
  data: CommonStatusDataMap["SELECT_ANSWER"]
}

const Answers = ({
  data: { question, answers, multipleCorrect, image, audio, video, time, totalPlayer, subtitles, language },
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const setVideoRef = (el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
  }
  const { gameId }: { gameId?: string } = useParams()
  const { socket } = useSocket()
  const { player } = usePlayerStore()

  const [cooldown, setCooldown] = useState(time)
  const [totalAnswer, setTotalAnswer] = useState(0)

  const [sfxPop] = useSound(SFX_ANSWERS_SOUND, {
    volume: 0.1,
  })

  const [playMusic, { stop: stopMusic }] = useSound(SFX_ANSWERS_MUSIC, {
    volume: 0.2,
    interrupt: true,
    loop: true,
  })

  const handleAnswer = (answerKey: number) => () => {
    if (!player) {
      return
    }

    socket?.emit("player:selectedAnswer", {
      gameId,
      data: {
        answerKey,
      },
    })
    sfxPop()
  }

  useEffect(() => {
    if (video || audio) {
      return
    }

    playMusic()

    // eslint-disable-next-line consistent-return
    return () => {
      stopMusic()
    }
  }, [audio, playMusic, stopMusic, video])

  useEffect(() => {
    console.log("Subtitle effect:", { video: !!video, subtitles, language, videoRef: !!videoRef.current })
    if (!videoRef.current || !subtitles || !language) return
    const langMap: Record<string, string> = { English: "en", Italian: "it", French: "fr", Spanish: "es", German: "de" }
    const targetLang = langMap[language] || "en"

    const applySubtitles = () => {
      const tracks = videoRef.current?.textTracks
      if (!tracks) return
      console.log("Applying subtitles, targetLang:", targetLang, "tracks:", tracks.length)
      for (let i = 0; i < tracks.length; i++) {
        console.log("Track:", tracks[i].language, tracks[i].mode)
        tracks[i].mode = tracks[i].language === targetLang ? "showing" : "hidden"
        console.log("Track after:", tracks[i].language, tracks[i].mode)
      }
    }

    setTimeout(applySubtitles, 1000)

    const videoEl = videoRef.current
    videoEl.addEventListener("loadedmetadata", applySubtitles)
    applySubtitles()

    return () => videoEl.removeEventListener("loadedmetadata", applySubtitles)
  }, [video, subtitles, language])

  useEvent("game:cooldown", (sec) => {
    setCooldown(sec)
  })

  useEvent("game:playerAnswer", (count) => {
    setTotalAnswer(count)
    sfxPop()
  })

  useEffect(() => {
    if (video == null) return
    const timer = setTimeout(() => {
      if (iframeRef.current == null) return
      const script = document.createElement("script")
      script.src = "https://unpkg.com/@peertube/embed-api/build/player.min.js"
      script.onload = () => {
        const PeerTubePlayer = (window as any)["PeerTubePlayer"]
        if (iframeRef.current == null) return
        const player = new PeerTubePlayer(iframeRef.current)
        player.ready.then(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "KeyE") {
              player.setVolume(1)
            }
          }
          window.addEventListener("keydown", handleKeyDown)
        })
      }
      document.head.appendChild(script)
    }, 500)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("keydown", () => {})
    }
  }, [video])

  return (
    <div className="flex h-full flex-1 flex-col justify-between pb-3 sm:pb-4">
      <div className="mx-auto inline-flex h-full w-full max-w-7xl flex-1 flex-col items-center justify-center gap-4 px-3 sm:gap-5 sm:px-4">
        <h2 className="text-center text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
          {question}
        </h2>

        {multipleCorrect && (
          <p className="rounded-full bg-black/40 px-4 py-2 text-sm font-semibold text-white sm:text-base">
            More than one answer may be correct.
          </p>
        )}

        {Boolean(audio) && !player && (
          <audio
            className="mb-2 w-full max-w-md rounded-md"
            src={audio}
            autoPlay
            controls
          />
        )}

        {Boolean(video) && !player && (
          video && (video.includes("sharepoint.com") || video.includes("youtube.com") || video.includes("youtu.be") || video.includes("vimeo.com") || video.includes("embed")) ? (
            <iframe
              className="mb-2 aspect-video max-h-60 w-full max-w-3xl rounded-md"
              src={video && !video.includes("youtube.com") && !video.includes("youtu.be") && !video.includes("vimeo.com") && !video.includes("sharepoint.com") ? video + (video.includes("?") ? "&muted=1&api=1" : "?muted=1&api=1") : video}
              frameBorder="0"
              ref={iframeRef}
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          ) : (
            <video
              className="mb-2 aspect-video max-h-60 w-full max-w-3xl rounded-md sm:max-h-100"
              src={video ?? ""}
              autoPlay
              controls
            >
              {subtitles && Object.entries(subtitles).map(([lang, url]) => url ? (
                <track
                  key={lang}
                  kind="subtitles"
                  src={url}
                  srcLang={lang}
                  label={lang.toUpperCase()}
                  default={language ? lang === ({ English: "en", Italian: "it", French: "fr", Spanish: "es", German: "de" } as Record<string,string>)[language] : lang === "en"}
                />
              ) : null)}
            </video>
          )
        )}

        {Boolean(image) && (
          <img
            alt={question}
            src={image}
            className="mb-2 max-h-60 w-full max-w-3xl rounded-md object-contain sm:max-h-100"
          />
        )}
      </div>

      <div>
        <div className="mx-auto mb-3 flex w-full max-w-7xl justify-between gap-2 px-3 text-base font-bold text-white sm:mb-4 sm:px-4 sm:text-lg md:text-xl">
          <div className="flex min-w-0 flex-col items-center rounded-full bg-black/40 px-3 py-1 text-base font-bold sm:px-4 sm:text-lg">
            <span className="translate-y-1 text-sm">Time</span>
            <span>{cooldown}</span>
          </div>
          <div className="flex min-w-0 flex-col items-center rounded-full bg-black/40 px-3 py-1 text-base font-bold sm:px-4 sm:text-lg">
            <span className="translate-y-1 text-sm">Answers</span>
            <span>
              {totalAnswer}/{totalPlayer}
            </span>
          </div>
        </div>

        <div className="mx-auto mb-1 grid w-full max-w-7xl grid-cols-2 gap-2 px-3 text-lg font-bold text-white sm:mb-4 sm:px-4 md:text-xl">
          {answers.map((answer, key) => (
            <AnswerButton
              key={key}
              className={clsx(ANSWERS_COLORS[key])}
              icon={ANSWERS_ICONS[key]}
              onClick={handleAnswer(key)}
            >
              {answer}
            </AnswerButton>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Answers

