import Button from "@mindbuzz/web/features/game/components/Button"
import Form from "@mindbuzz/web/features/game/components/Form"
import Input from "@mindbuzz/web/features/game/components/Input"
import {
  useEvent,
  useSocket,
} from "@mindbuzz/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@mindbuzz/web/features/game/stores/player"
import { t } from "@mindbuzz/web/features/game/utils/translations"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"

const Room = () => {
  const { socket, isConnected } = useSocket()
  const { join, setPlayer, player } = usePlayerStore()
  // const lang = player?.quizLanguage
  const [invitation, setInvitation] = useState("")
  const [searchParams] = useSearchParams()
  const hasJoinedRef = useRef(false)

  const handleJoin = () => {
    socket?.emit("player:join", invitation)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleJoin()
    }
  }

  useEvent("game:successRoom", ({ gameId, language }: { gameId: string; language: string }) => {
    setPlayer({ quizLanguage: language })
    join(gameId)
  })

  useEffect(() => {
    const pinCode = searchParams.get("pin")

    if (!isConnected || !pinCode || hasJoinedRef.current) {
      return
    }

    socket?.emit("player:join", pinCode)
    hasJoinedRef.current = true
  }, [searchParams, isConnected, socket])

  return (
    <Form>
      <Input
        onChange={(e) => setInvitation(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t(undefined, "pinPlaceholder")}
      />
      <Button onClick={handleJoin}>Submit</Button>
    </Form>
  )
}

export default Room

