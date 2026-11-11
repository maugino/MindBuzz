import Button from "@mindbuzz/web/features/game/components/Button"
import { useSocket } from "@mindbuzz/web/features/game/contexts/socketProvider"
import { useEffect, useState } from "react"

const SHOW_AFTER_MS = 1500
const LOST_AFTER_MS = 10000

const PlayerConnectionStatus = () => {
  const { isConnected, reconnect } = useSocket()
  const [stage, setStage] = useState<"none" | "reconnecting" | "lost">("none")

  useEffect(() => {
    if (isConnected) {
      setStage("none")
      return
    }

    const reconnectingTimer = setTimeout(() => {
      setStage("reconnecting")
    }, SHOW_AFTER_MS)

    const lostTimer = setTimeout(() => {
      setStage("lost")
    }, LOST_AFTER_MS)

    return () => {
      clearTimeout(reconnectingTimer)
      clearTimeout(lostTimer)
    }
  }, [isConnected])

  if (stage === "none") {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div className="flex max-w-md items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {stage === "reconnecting"
              ? "Connection lost. Reconnecting..."
              : "Unable to reconnect"}
          </p>

          {stage === "lost" && (
            <p className="mt-1 text-sm text-gray-300">
              Check your connection, then try again.
            </p>
          )}
        </div>

        {stage === "lost" && (
          <Button
            type="button"
            className="shrink-0 px-3 py-1 text-sm"
            onClick={() => {
              setStage("reconnecting")
              reconnect()
            }}
          >
            Reconnect now
          </Button>
        )}
      </div>
    </div>
  )
}

export default PlayerConnectionStatus
