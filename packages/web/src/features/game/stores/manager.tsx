import type { Player } from "@mindbuzz/common/types/game"
import type { StatusDataMap } from "@mindbuzz/common/types/game/status"
import {
  createStatus,
  type Status,
} from "@mindbuzz/web/features/game/utils/createStatus"
import { create } from "zustand"
type ManagerStore<T> = {
  gameId: string | null
  status: Status<T> | null
  players: Player[]
  inviteCode: string | null
  lang: string | null
  setGameId: (_gameId: string | null) => void
  setStatus: <K extends keyof T>(_name: K, _data: T[K]) => void
  resetStatus: () => void
  setPlayers: (_players: Player[]) => void
  setInviteCode: (_inviteCode: string | null) => void
  setLang: (_lang: string | null) => void
  reset: () => void
}
const initialState = {
  gameId: null,
  status: null,
  players: [],
  inviteCode: null,
  lang: null,
}
export const useManagerStore = create<ManagerStore<StatusDataMap>>((set) => ({
  ...initialState,
  setGameId: (gameId) => set({ gameId }),
  setStatus: (name, data) => set({ status: createStatus(name, data) }),
  resetStatus: () => set({ status: null }),
  setPlayers: (players) => set({ players }),
  setInviteCode: (inviteCode) => set({ inviteCode }),
  setLang: (lang) => set({ lang }),
  reset: () => set(initialState),
}))
