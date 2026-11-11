import background2 from "@mindbuzz/web/assets/background2.webp"
import Room from "@mindbuzz/web/features/game/components/join/Room"
import Username from "@mindbuzz/web/features/game/components/join/Username"
import {
  useEvent,
  useSocket,
} from "@mindbuzz/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@mindbuzz/web/features/game/stores/player"
import { useEffect } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router"
const PlayerAuthPage = () => {
  const { isConnected, connect } = useSocket()
  const { player, gameId, reset } = usePlayerStore()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [connect, isConnected])
  useEvent("game:errorMessage", (message) => {
    toast.error(message)
  })
  useEvent("game:reset", (message) => {
    reset()
    toast.error(message)
  })
  useEffect(() => { reset() }, [])
  if (player && gameId) {
    return <Username />
  }
  return (
    <>
      <div style={{position: 'fixed', top: 0, left: 0, height: '100%', width: '100%', zIndex: -1}}>
        <img style={{width: '100%', height: '100%', objectFit: 'cover'}} src={background2} alt="background" />
      </div>
      <button
        onClick={() => navigate("/quizmaster")}
        className="fixed top-4 right-4 z-50 rounded-md bg-white px-3 py-1 text-sm font-semibold text-black shadow hover:bg-gray-100"
      >
        Quizmaster
      </button>
      <Room />
    </>
  )
}
export default PlayerAuthPage
