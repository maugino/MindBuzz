export type Lang = "English" | "Italian" | "French" | "Spanish" | "German"

type Translations = {
  leaderboard: string
  usernamePlaceholder: string
  pinPlaceholder: string
  playersJoined: string
  nice: string
  tooBad: string
  youAreTop: string
  behind: string
  waitingForPlayers: string
  waitingForAnswers: string
  multipleCorrect: string
  selectAnswer: string
}

const translations: Record<string, Translations> = {
  English: {
    leaderboard: "Leaderboard",
    usernamePlaceholder: "Username here",
    pinPlaceholder: "PIN Code here",
    playersJoined: "Players Joined",
    nice: "Nice!",
    tooBad: "Too bad",
    youAreTop: "You are top",
    behind: "behind",
    waitingForPlayers: "Waiting for players",
    waitingForAnswers: "Waiting for the players to answer",
    multipleCorrect: "Multiple correct answers",
    selectAnswer: "Select an answer",
  },
  Italian: {
    leaderboard: "Classifica",
    usernamePlaceholder: "Nome utente",
    pinPlaceholder: "Codice PIN",
    playersJoined: "Giocatori connessi",
    nice: "Ottimo!",
    tooBad: "Peccato",
    youAreTop: "Sei al",
    behind: "dietro a",
    waitingForPlayers: "In attesa dei giocatori",
    waitingForAnswers: "In attesa delle risposte",
    multipleCorrect: "Risposte multiple corrette",
    selectAnswer: "Seleziona una risposta",
  },
  French: {
    leaderboard: "Classement",
    usernamePlaceholder: "Nom d'utilisateur",
    pinPlaceholder: "Code PIN",
    playersJoined: "Joueurs connectés",
    nice: "Bravo !",
    tooBad: "Dommage",
    youAreTop: "Vous êtes",
    behind: "derrière",
    waitingForPlayers: "En attente des joueurs",
    waitingForAnswers: "En attente des réponses",
    multipleCorrect: "Plusieurs bonnes réponses",
    selectAnswer: "Choisissez une réponse",
  },
  Spanish: {
    leaderboard: "Clasificación",
    usernamePlaceholder: "Nombre de usuario",
    pinPlaceholder: "Código PIN",
    playersJoined: "Jugadores conectados",
    nice: "¡Bien!",
    tooBad: "Qué lástima",
    youAreTop: "Estás en el",
    behind: "detrás de",
    waitingForPlayers: "Esperando jugadores",
    waitingForAnswers: "Esperando respuestas",
    multipleCorrect: "Múltiples respuestas correctas",
    selectAnswer: "Selecciona una respuesta",
  },
  German: {
    leaderboard: "Rangliste",
    usernamePlaceholder: "Benutzername",
    pinPlaceholder: "PIN-Code",
    playersJoined: "Verbundene Spieler",
    nice: "Super!",
    tooBad: "Schade",
    youAreTop: "Du bist auf Platz",
    behind: "hinter",
    waitingForPlayers: "Warte auf Spieler",
    waitingForAnswers: "Warte auf Antworten",
    multipleCorrect: "Mehrere richtige Antworten",
    selectAnswer: "Wähle eine Antwort",
  },
}

export const t = (language: string | undefined, key: keyof Translations): string => {
  const lang = language && translations[language] ? language : "English"
  return translations[lang][key]
}
