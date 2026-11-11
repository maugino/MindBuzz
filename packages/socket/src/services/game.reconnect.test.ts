import type {
  ManagerSession,
  QuizzWithId,
} from "@mindbuzz/common/types/game"
import type {
  Server,
  Socket,
} from "@mindbuzz/common/types/game/socket"
import Game from "@mindbuzz/socket/services/game"
import { describe, expect, it, vi } from "vitest"

type RecordedEvent = {
  target: string
  event: string
  data: unknown
}

type FakeSocket = {
  socket: Socket
  events: RecordedEvent[]
  disconnected: boolean
}

const createFakeEnvironment = () => {
  const events: RecordedEvent[] = []
  const disconnectedSocketIds: string[] = []
  const socketMap = new Map<string, Socket>()

  const emitTo = (target: string) => ({
    emit: (event: string, data: unknown) => {
      events.push({ target, event, data })
    },
  })

  const io = {
    sockets: {
      sockets: socketMap,
    },
    to: (target: string) => emitTo(target),
    in: (target: string) => ({
      socketsLeave: vi.fn(),
      disconnectSockets: () => {
        disconnectedSocketIds.push(target)
        const existing = socketMap.get(target) as
          | (Socket & { disconnect?: (close?: boolean) => void })
          | undefined
        existing?.disconnect?.(true)
      },
    }),
  } as unknown as Server

  const createSocket = (
    id: string,
    clientId: string,
  ): FakeSocket => {
    let disconnected = false
    const localEvents: RecordedEvent[] = []

    const socket = {
      id,
      handshake: {
        auth: { clientId },
      },
      join: vi.fn(),
      emit: (event: string, data: unknown) => {
        const recorded = { target: id, event, data }
        localEvents.push(recorded)
        events.push(recorded)
      },
      to: (target: string) => emitTo(target),
      disconnect: vi.fn(() => {
        disconnected = true
        socketMap.delete(id)
      }),
    } as unknown as Socket

    socketMap.set(id, socket)

    return {
      socket,
      events: localEvents,
      get disconnected() {
        return disconnected
      },
    }
  }

  return {
    io,
    events,
    disconnectedSocketIds,
    createSocket,
  }
}

const manager: ManagerSession = {
  id: "manager-account",
  username: "manager",
  role: "admin",
}

const quizz: QuizzWithId = {
  id: "quiz-1",
  subject: "Reconnect test",
  language: "English",
  questions: [
    {
      question: "Which answer is correct?",
      answers: ["Correct", "Wrong"],
      solutions: [0],
      cooldown: 0,
      time: 30,
    },
  ],
}

const setup = () => {
  const environment = createFakeEnvironment()
  const managerSocket = environment.createSocket(
    "manager-socket",
    "manager-client",
  )
  const originalSocket = environment.createSocket(
    "alice-old",
    "alice-client",
  )

  const game = new Game(
    environment.io,
    managerSocket.socket,
    manager,
    quizz,
    {},
  )

  game.join(originalSocket.socket, "Alice", "🐺")

  const player = game.players[0]

  if (!player) {
    throw new Error("Player was not created")
  }

  return {
    ...environment,
    game,
    player,
    originalSocket,
  }
}

describe("player reconnection", () => {
  it("restores a disconnected player on a new socket", () => {
    const { game, player, createSocket } = setup()
    const permanentPlayerId = player.id

    player.connected = false

    const replacement = createSocket(
      "alice-new",
      "alice-client",
    )

    game.reconnect(replacement.socket)

    expect(player.id).toBe(permanentPlayerId)
    expect(player.socketId).toBe("alice-new")
    expect(player.connected).toBe(true)
    expect(
      replacement.events.some(
        ({ event }) => event === "player:successReconnect",
      ),
    ).toBe(true)
  })

  it("lets a new socket replace a connection not closed yet", () => {
    const {
      game,
      player,
      originalSocket,
      disconnectedSocketIds,
      createSocket,
    } = setup()

    expect(player.connected).toBe(true)

    const replacement = createSocket(
      "alice-new",
      "alice-client",
    )

    game.reconnect(replacement.socket)

    expect(player.socketId).toBe("alice-new")
    expect(originalSocket.disconnected).toBe(true)
  })

  it("keeps a submitted answer after reconnection", () => {
    const { game, player, originalSocket, createSocket, events } = setup()

    game.started = true
    game.round.startTime = Date.now()

    game.selectAnswer(originalSocket.socket, 0)

    expect(game.round.playersAnswers).toHaveLength(1)
    expect(game.round.playersAnswers[0]?.playerId).toBe(player.id)

    const replacement = createSocket(
      "alice-new",
      "alice-client",
    )

    game.reconnect(replacement.socket)
    game.showResults(quizz.questions[0])

    const result = events.find(
      ({ target, event }) =>
        target === "alice-new" && event === "game:status",
    )

    expect(game.round.playersAnswers).toHaveLength(0)
    expect(result?.data).toMatchObject({
      name: "SHOW_RESULT",
      data: {
        correct: true,
      },
    })
  })

  it("refuses a second answer after reconnection", () => {
    const { game, player, originalSocket, createSocket } = setup()

    game.started = true
    game.round.startTime = Date.now()

    game.selectAnswer(originalSocket.socket, 0)

    const replacement = createSocket(
      "alice-new",
      "alice-client",
    )

    game.reconnect(replacement.socket)
    game.selectAnswer(replacement.socket, 1)

    expect(game.round.playersAnswers).toHaveLength(1)
    expect(game.round.playersAnswers[0]).toMatchObject({
      playerId: player.id,
      answerId: 0,
    })
  })
})
