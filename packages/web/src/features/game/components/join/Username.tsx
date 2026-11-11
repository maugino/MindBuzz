import { STATUS } from "@mindbuzz/common/types/game/status"
import Button from "@mindbuzz/web/features/game/components/Button"
import Form from "@mindbuzz/web/features/game/components/Form"
import Input from "@mindbuzz/web/features/game/components/Input"
import {
  useEvent,
  useSocket,
} from "@mindbuzz/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@mindbuzz/web/features/game/stores/player"
import { t } from "@mindbuzz/web/features/game/utils/translations"
import { type KeyboardEvent, useState } from "react"
import { useNavigate } from "react-router"

const adjectives = ["Swift", "Clever", "Brave", "Mighty", "Lucky", "Fierce", "Witty", "Bold", "Calm", "Eager", "Sharp", "Daring", "Noble", "Wise", "Agile", "Proud", "Keen", "Lively", "Nimble", "Sunny", "Crafty", "Vivid", "Stoic", "Radiant", "Fearless", "Playful", "Spirited", "Graceful", "Tenacious", "Resilient"]
const nouns = ["Tiger", "Eagle", "Panda", "Falcon", "Shark", "Wolf", "Fox", "Bear", "Lion", "Hawk", "Jaguar", "Cheetah", "Dolphin", "Otter", "Lynx", "Bison", "Cobra", "Osprey", "Panther", "Stallion", "Meerkat", "Mongoose", "Condor", "Narwhal", "Gazelle", "Pelican", "Wombat", "Macaw", "Dingo", "Viper"]

const animalEmoji: Record<string, string> = {
  Tiger: "🐯", Eagle: "🦅", Panda: "🐼", Falcon: "🦅", Shark: "🦈",
  Wolf: "🐺", Fox: "🦊", Bear: "🐻", Lion: "🦁", Hawk: "🦅",
  Jaguar: "🐆", Cheetah: "🐆", Dolphin: "🐬", Otter: "🦦", Lynx: "🐱",
  Bison: "🦬", Cobra: "🐍", Osprey: "🦅", Panther: "🐆", Stallion: "🐴",
  Meerkat: "🐾", Mongoose: "🐾", Condor: "🦅", Narwhal: "🐳", Gazelle: "🦌",
  Pelican: "🐦", Wombat: "🐨", Macaw: "🦜", Dingo: "🐕", Viper: "🐍"
}

const getEmojiFromUsername = (name: string) => {
  const noun = nouns.find((n) => name.endsWith(n))
  return noun ? animalEmoji[noun] : "🎮"
}

const generateUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}`
}

const Username = () => {
  const { socket } = useSocket()
  const { gameId, login, setStatus, player } = usePlayerStore()
  const lang = player?.quizLanguage
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const handleLogin = () => {
    if (!gameId) {
      return
    }
    socket?.emit("player:login", { gameId, data: { username, emoji: getEmojiFromUsername(username) } })
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  }
  const handleGenerate = () => {
    setUsername(generateUsername())
  }
  useEvent("game:successJoin", (gameId) => {
    setStatus(STATUS.WAIT, { text: t(lang, "waitingForPlayers") })
    login(username, getEmojiFromUsername(username)); console.log("emoji:", getEmojiFromUsername(username))
    navigate(`/party/${gameId}`)
  })
  return (
    <Form>
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t(lang, "usernamePlaceholder")}
      />
      <Button type="button" onClick={handleGenerate} className="bg-white !text-black px-4">
        🎲 Random
      </Button>
      <Button onClick={handleLogin}>Submit</Button>
    </Form>
  )
}
export default Username
