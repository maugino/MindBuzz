import type { CommonStatusDataMap } from "@mindbuzz/common/types/game/status"
import CricleCheck from "@mindbuzz/web/features/game/components/icons/CricleCheck"
import CricleXmark from "@mindbuzz/web/features/game/components/icons/CricleXmark"
import { usePlayerStore } from "@mindbuzz/web/features/game/stores/player"
import { t } from "@mindbuzz/web/features/game/utils/translations"
import { SFX_RESULTS_SOUND } from "@mindbuzz/web/features/game/utils/constants"
import { useEffect } from "react"
import useSound from "use-sound"

type Props = {
  data: CommonStatusDataMap["SHOW_RESULT"]
}

const Result = ({
  data: { correct, message, points, myPoints, rank, aheadOfMe },
}: Props) => {
  const { player, updatePoints } = usePlayerStore()
  const lang = player?.quizLanguage

  const [sfxResults] = useSound(SFX_RESULTS_SOUND, {
    volume: 0.2,
  })

  useEffect(() => {
    updatePoints(myPoints)

    sfxResults()
  }, [sfxResults])

  return (
    <section className="anim-show relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 text-center">
      {correct ? (
        <CricleCheck className="aspect-square max-h-60 w-full" />
      ) : (
        <CricleXmark className="aspect-square max-h-60 w-full" />
      )}
      <h2 className="mt-1 text-3xl font-bold text-white drop-shadow-lg sm:text-4xl">
        {message}
      </h2>
      <p className="mt-1 text-lg font-bold text-white drop-shadow-lg sm:text-xl">
        {`${t(lang, "youAreTop")} ${rank}${aheadOfMe ? `, ${t(lang, "behind")} ${aheadOfMe}` : ""}`}
      </p>
      {correct && (
        <span className="mt-2 rounded bg-black/40 px-4 py-2 text-xl font-bold text-white drop-shadow-lg sm:text-2xl">
          +{points}
        </span>
      )}
    </section>
  )
}

export default Result

