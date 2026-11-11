import type {
  ActiveManagerGame,
  ManagerAccount,
  ManagerSession,
  ManagerSettings,
  ManagerSettingsUpdate,
  OidcConfig,
  OidcConfigInput,
  OidcConfigTestResult,
  OidcStatus,
  Quizz,
  QuizzWithId,
  QuizRunHistorySummary,
} from "@mindbuzz/common/types/game"
import { STATUS } from "@mindbuzz/common/types/game/status"
import background from "@mindbuzz/web/assets/background.webp"
import logo from "@mindbuzz/web/assets/logo.svg"
import Button from "@mindbuzz/web/features/game/components/Button"
import HistoryPanel from "@mindbuzz/web/features/game/components/create/HistoryPanel"
import InitialAdminSetup from "@mindbuzz/web/features/game/components/create/InitialAdminSetup"
import ManagersPanel from "@mindbuzz/web/features/game/components/create/ManagersPanel"
import ManagerPassword from "@mindbuzz/web/features/game/components/create/ManagerPassword"
import QuizzEditor from "@mindbuzz/web/features/game/components/create/QuizzEditor"
import SelectQuizz from "@mindbuzz/web/features/game/components/create/SelectQuizz"
import SsoSettingsPanel from "@mindbuzz/web/features/game/components/create/SsoSettingsPanel"
import SettingsPanel from "@mindbuzz/web/features/game/components/create/SettingsPanel"
import {
  useEvent,
  useSocket,
} from "@mindbuzz/web/features/game/contexts/socketProvider"
import { useManagerStore } from "@mindbuzz/web/features/game/stores/manager"
import { useQuestionStore } from "@mindbuzz/web/features/game/stores/question"
import clsx from "clsx"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useLocation, useNavigate } from "react-router"

const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

const BASE_TABS = [
  { id: "quizzes", label: "Quizzes" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" },
] as const

const ADMIN_TAB = { id: "managers", label: "Quizmasters" } as const
const ADMIN_SSO_TAB = { id: "sso", label: "SSO" } as const

type ManagerTab =
  | (typeof BASE_TABS)[number]["id"]
  | typeof ADMIN_TAB["id"]
  | typeof ADMIN_SSO_TAB["id"]

const MANAGER_AUTH_STORAGE_KEY = "manager_auth"
const DEFAULT_OIDC_CONFIG: OidcConfig = {
  enabled: false,
  autoProvisionEnabled: false,
  discoveryUrl: "",
  clientId: "",
  hasClientSecret: false,
  scopes: ["openid", "profile", "email"],
  roleClaimPath: "groups",
  adminRoleValues: ["mindbuzz-admin"],
  managerRoleValues: ["mindbuzz-manager"],
}
const DEFAULT_OIDC_STATUS: OidcStatus = {
  enabled: false,
  configured: false,
}

const readManagerAuth = () => {
  try {
    return localStorage.getItem(MANAGER_AUTH_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

const persistManagerAuth = (value: boolean) => {
  try {
    if (value) {
      localStorage.setItem(MANAGER_AUTH_STORAGE_KEY, "true")
    } else {
      localStorage.removeItem(MANAGER_AUTH_STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures and fall back to in-memory auth state.
  }
}

const ManagerAuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { socket, clientId, isConnected } = useSocket()
  const { reset, setGameId, setPlayers, setStatus, setInviteCode } = useManagerStore()
  const { setQuestionStates } = useQuestionStore()

  const [isAuth, setIsAuth] = useState(readManagerAuth)
  const [requiresSetup, setRequiresSetup] = useState<boolean | null>(null)
  const [manager, setManager] = useState<ManagerSession | null>(null)
  const [activeTab, setActiveTab] = useState<ManagerTab>("quizzes")
  const [quizzList, setQuizzList] = useState<QuizzWithId[]>([])
  const [history, setHistory] = useState<QuizRunHistorySummary[]>([])
  const [settings, setSettings] = useState<ManagerSettings>({})
  const [editingQuizzId, setEditingQuizzId] = useState<string | null>(null)
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; field: "image" | "video" | "audio" | "subtitle"; questionIndex: number; lang?: string } | null>(null)
  const [mediaList, setMediaList] = useState<{ filename: string; url: string }[]>([])
  const [managers, setManagers] = useState<ManagerAccount[]>([])
  const [activeGame, setActiveGame] = useState<ActiveManagerGame | null>(null)
  const [oidcConfig, setOidcConfig] = useState<OidcConfig>(DEFAULT_OIDC_CONFIG)
  const [oidcStatus, setOidcStatus] = useState<OidcStatus>(DEFAULT_OIDC_STATUS)
  const [oidcTestResult, setOidcTestResult] =
    useState<OidcConfigTestResult | null>(null)
  const [isTestingOidcConfig, setIsTestingOidcConfig] = useState(false)
  const [pendingOidcCompletion, setPendingOidcCompletion] = useState(false)
  const hasAuthenticatedManager = isAuth && manager !== null

  const tabs = useMemo(
    () =>
      manager?.role === "admin"
        ? [...BASE_TABS, ADMIN_TAB, ADMIN_SSO_TAB]
        : [...BASE_TABS],
    [manager?.role],
  )

  useEvent("manager:bootstrapState", ({ requiresSetup }) => {
    setRequiresSetup(requiresSetup)

    if (requiresSetup) {
      persistManagerAuth(false)
      setIsAuth(false)
      setManager(null)
      setActiveGame(null)
      return
    }

    if (!requiresSetup && readManagerAuth() && !manager) {
      socket?.emit("manager:getDashboard")
    }
  })

  useEvent("manager:authSuccess", ({ manager }) => {
    persistManagerAuth(true)
    setIsAuth(true)
    setManager(manager)
    setRequiresSetup(false)

    if (
      manager.role !== "admin" &&
      (activeTab === "managers" || activeTab === "sso")
    ) {
      setActiveTab("quizzes")
    }
  })

  useEvent("manager:quizzList", (nextQuizzList) => {
    setQuizzList(nextQuizzList)
  })

  useEvent("manager:historyList", (nextHistory) => {
    setHistory(nextHistory)
  })

  useEvent("manager:settings", (nextSettings) => {
    setSettings(nextSettings)
  })

  useEvent("manager:managersList", (nextManagers) => {
    setManagers(nextManagers)
  })

  useEvent("manager:activeGame", (game) => {
    setActiveGame(game)
  })

  useEvent("manager:oidcConfig", (config) => {
    setOidcConfig(config)
  })

  useEvent("manager:oidcConfigSaved", (config) => {
    setOidcConfig(config)
    toast.success("SSO settings saved")
  })

  useEvent("manager:oidcConfigTested", (result) => {
    setIsTestingOidcConfig(false)
    setOidcTestResult(result)
    toast.success(`SSO discovery loaded from ${result.issuer}`)
  })

  useEvent("manager:oidcStatus", (status) => {
    setOidcStatus(status)
  })

  useEvent("manager:managerCreated", () => {
    toast.success("Manager created")
  })

  useEvent("manager:managerUpdated", () => {
    toast.success("Manager updated")
  })

  useEvent("manager:errorMessage", (message) => {
    if (message === "Manager authentication required") {
      persistManagerAuth(false)
      setIsAuth(false)
      setManager(null)
      setActiveTab("quizzes")
      setQuizzList([])
      setHistory([])
      setSettings({})
      setEditingQuizzId(null)
      setUploadedAudioUrl(null)
      setManagers([])
      setActiveGame(null)
      setOidcConfig(DEFAULT_OIDC_CONFIG)
      setOidcStatus(DEFAULT_OIDC_STATUS)
      setOidcTestResult(null)
      setIsTestingOidcConfig(false)
      setPendingOidcCompletion(false)
      reset()
      setQuestionStates(null)
    }

    setIsTestingOidcConfig(false)

    toast.error(message)
  })

  useEvent("manager:quizzCreated", (quizz) => {
    setQuizzList((current) => {
      const filtered = current.filter((item) => item.id !== quizz.id)

      return [...filtered, quizz]
    })
    setEditingQuizzId(quizz.id)
    setActiveTab("quizzes")
    toast.success("Quiz created")
  })

  useEvent("manager:quizzDeleted", (quizzId) => {
    setQuizzList((current) => current.filter((quizz) => quizz.id !== quizzId))
    if (editingQuizzId === quizzId) {
      setEditingQuizzId(null)
    }
    toast.success("Quiz deleted")
  })

  useEvent("manager:quizzUpdated", (quizz) => {
    setQuizzList((current) =>
      current.map((item) => (item.id === quizz.id ? quizz : item)),
    )
    setEditingQuizzId(quizz.id)
    toast.success("Quiz saved")
  })

  useEvent("manager:mediaUploaded", ({ url }) => {
    setUploadedMedia((current) => current ? { ...current, url } : null)
    toast.success("Media uploaded")
    setTimeout(() => setUploadedMedia(null), 500)
  })

  useEvent("manager:mediaList", (list: { filename: string; url: string }[]) => {
    setMediaList(list)
  })

  useEvent("manager:historyExportReady", ({ filename, content }) => {
    downloadCsv(filename, content)
  })

  useEvent("manager:gameCreated", ({ gameId, inviteCode }) => {
    setGameId(gameId)
    setInviteCode(inviteCode)
    setStatus(STATUS.SHOW_ROOM, { text: "Waiting for the players", inviteCode })
    navigate(`/party/quizmaster/${gameId}`)
  })

  useEvent(
    "manager:successReconnect",
    ({ gameId, status, players, currentQuestion }) => {
      setGameId(gameId)
      setStatus(status.name, status.data)
      setPlayers(players)
      setQuestionStates(currentQuestion)
      navigate(`/party/quizmaster/${gameId}`)
      toast.success("Game control restored")
    },
  )

  useEvent("connect", () => {
    socket?.emit("manager:getBootstrapState")
  })

  useEffect(() => {
    socket?.emit("manager:getBootstrapState")
  }, [socket])

  const handleAuth = (credentials: { username: string; password: string }) => {
    socket?.emit("manager:auth", credentials)
  }

  const handleCreateInitialAdmin = (data: {
    username: string
    password: string
  }) => {
    socket?.emit("manager:createInitialAdmin", data)
  }

  const handleCreate = (
    quizzId: string,
    answersOnly: boolean,
  ) => {
    socket?.emit("game:create", {
      quizzId,
      answersOnly,
    })
  }

  const handleCreateQuizz = (subject: string) => {
    socket?.emit("manager:createQuizz", { subject })
  }

  const handleDeleteQuizz = (quizzId: string) => {
    socket?.emit("manager:deleteQuizz", { quizzId })
  }
  const handleTogglePublic = (quizzId: string, isPublic: boolean) => {
    socket?.emit("manager:toggleQuizzPublic", { quizzId, isPublic })
  }
  const handleImportQuizz = (subject: string, quizz: Quizz) => {
    socket?.emit("manager:importQuizz", { quizz: { ...quizz, subject } })
  }

  const handleUpdateQuizz = (quizzId: string, quizz: Quizz) => {
    socket?.emit("manager:updateQuizz", { quizzId, quizz })
  }

  const handleEditQuizz = (quizzId: string) => {
    setActiveTab("quizzes")
    setEditingQuizzId(quizzId)
      socket?.emit("manager:listMedia", {})
  }

  const handleSelectTab = (tab: ManagerTab) => {
    setActiveTab(tab)
    setEditingQuizzId(null)

    if (tab === "managers") {
      socket?.emit("manager:listManagers")
    } else if (tab === "sso") {
      setOidcTestResult(null)
      socket?.emit("manager:getOidcConfig")
    }
  }

  const handleSaveSettings = (nextSettings: ManagerSettingsUpdate) => {
    socket?.emit("manager:updateSettings", nextSettings)
  }

  const handleUploadLocalAudio = (data: { filename: string; content: string }) => {
    socket?.emit("manager:uploadMedia", data)
  }

    const handleUploadMedia = (data: { filename: string; content: string; field: "image" | "video" | "audio" | "subtitle"; questionIndex: number; lang?: string }) => {
      setUploadedMedia({ url: "", field: data.field, questionIndex: data.questionIndex, lang: data.lang })
      socket?.emit("manager:uploadMedia", { filename: data.filename, content: data.content })
    }

  const handleDownloadHistory = (runId: string) => {
    socket?.emit("manager:downloadHistory", { runId })
  }

  const handleCreateManager = (data: { username: string; password: string }) => {
    socket?.emit("manager:createManager", data)
  }

  const handleResetManagerPassword = (data: {
    managerId: string
    password: string
  }) => {
    socket?.emit("manager:resetManagerPassword", data)
  }

  const handleSetManagerDisabled = (data: {
    managerId: string
    disabled: boolean
  }) => {
    socket?.emit("manager:setManagerDisabled", data)
  }

    const handleDeleteManager = (managerId: string) => {
      socket?.emit("manager:deleteManager", { managerId })
    }

    const handleRenameManager = (data: { managerId: string; username: string }) => {
      socket?.emit("manager:renameManager", data)
    }

  const handleSaveOidcConfig = (config: OidcConfigInput) => {
    setOidcTestResult(null)
    socket?.emit("manager:updateOidcConfig", config)
  }

  const handleTestOidcConfig = (config: OidcConfigInput) => {
    if (!socket) {
      toast.error("Unable to test SSO settings while disconnected")

      return
    }

    setOidcTestResult(null)
    setIsTestingOidcConfig(true)
    socket.emit("manager:testOidcConfig", config)
  }

  const handleResumeOrTakeOver = () => {
    if (!activeGame) {
      return
    }

    if (activeGame.controlledByCurrentSession) {
      socket?.emit("manager:reconnect", { gameId: activeGame.gameId })
      return
    }

    socket?.emit("manager:takeOverGame", { gameId: activeGame.gameId })
  }

  const handleLogout = () => {
    persistManagerAuth(false)
    setIsAuth(false)
    setManager(null)
    setActiveTab("quizzes")
    setQuizzList([])
    setHistory([])
    setSettings({})
    setEditingQuizzId(null)
    setUploadedAudioUrl(null)
    setManagers([])
    setActiveGame(null)
    setOidcConfig(DEFAULT_OIDC_CONFIG)
    setOidcStatus(DEFAULT_OIDC_STATUS)
    setOidcTestResult(null)
    setIsTestingOidcConfig(false)
    setPendingOidcCompletion(false)
    reset()
    setQuestionStates(null)
    socket?.emit("manager:logout")
    navigate("/quizmaster")
  }

  useEffect(() => {
    fetch("/auth/oidc/status", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load SSO status")
        }

        return (await response.json()) as OidcStatus
      })
      .then((status) => {
        setOidcStatus(status)
      })
      .catch((error) => {
        console.error("Failed to load OIDC status", error)
      })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oidcResult = params.get("oidc")

    if (!oidcResult) {
      return
    }

    if (oidcResult === "error") {
      toast.error(params.get("message") ?? "SSO sign-in failed")
      navigate(location.pathname || "/quizmaster", { replace: true })

      return
    }

    if (oidcResult === "success") {
      setPendingOidcCompletion(true)
      navigate(location.pathname || "/quizmaster", { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!pendingOidcCompletion || !socket || !isConnected) {
      return
    }

    setPendingOidcCompletion(false)
    socket.emit("manager:completeOidcLogin")
  }, [isConnected, pendingOidcCompletion, socket])

  const handleStartSsoLogin = () => {
    if (!clientId) {
      toast.error("Unable to start SSO without a client session")

      return
    }

    const params = new URLSearchParams({
      clientId,
      returnTo: "/quizmaster",
    })

    window.location.assign(`/auth/oidc/login?${params.toString()}`)
  }

  const editingQuizz = quizzList.find((quizz) => quizz.id === editingQuizzId)

  let content = null

  if (requiresSetup === null) {
    content = (
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-6">
        <img src={logo} className="mb-10 h-16" alt="MindBuzz logo" />
        <div className="rounded-md bg-white px-6 py-4 text-sm text-Light-Slate shadow-sm">
          Loading manager panel...
        </div>
      </div>
    )
  } else if (!isAuth && requiresSetup) {
    content = (
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-6">
        <img src={logo} className="mb-10 h-16" alt="MindBuzz logo" />
        <InitialAdminSetup onSubmit={handleCreateInitialAdmin} />
      </div>
    )
  } else if (!isAuth) {
    content = (
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-6">
        <img src={logo} className="mb-10 h-16" alt="MindBuzz logo" />
        <ManagerPassword
          onSubmit={handleAuth}
          onSsoLogin={handleStartSsoLogin}
          showSsoButton={oidcStatus.enabled && oidcStatus.configured}
          isBusy={pendingOidcCompletion}
        />
      </div>
    )
  } else if (!hasAuthenticatedManager) {
    content = (
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-6">
        <img src={logo} className="mb-10 h-16" alt="MindBuzz logo" />
        <div className="rounded-md bg-white px-6 py-4 text-sm text-Light-Slate shadow-sm">
          Restoring manager session...
        </div>
      </div>
    )
  } else if (editingQuizz) {
    content = (
      <div className="relative z-10 flex min-h-dvh flex-col items-center px-4 py-6">
        <QuizzEditor
          quizz={editingQuizz}
          onBack={() => setEditingQuizzId(null)}
          onSave={handleUpdateQuizz}
            onUploadMedia={handleUploadMedia}
            uploadedMedia={uploadedMedia}
            mediaList={mediaList}
        />
      </div>
    )
  } else {
    const dashboardContent =
      activeTab === "history" ? (
        <HistoryPanel history={history} onDownload={handleDownloadHistory} />
      ) : activeTab === "settings" ? (
        <SettingsPanel
          settings={settings}
          uploadedAudioUrl={uploadedAudioUrl}
          onSave={handleSaveSettings}
          onUploadLocalAudio={handleUploadLocalAudio}
        />
      ) : activeTab === "managers" && manager?.role === "admin" ? (
        <ManagersPanel
          currentManagerId={manager.id}
          managers={managers}
          onCreate={handleCreateManager}
          onResetPassword={handleResetManagerPassword}
          onSetDisabled={handleSetManagerDisabled}
          onDelete={handleDeleteManager}
          onRenameManager={handleRenameManager}
        />
      ) : activeTab === "sso" && manager?.role === "admin" ? (
        <SsoSettingsPanel
          config={oidcConfig}
          onSave={handleSaveOidcConfig}
          onTest={handleTestOidcConfig}
          isTesting={isTestingOidcConfig}
          testResult={oidcTestResult}
        />
      ) : (
        <SelectQuizz
          quizzList={quizzList}
          onCreate={handleCreateQuizz}
          onDelete={handleDeleteQuizz}
          onEdit={handleEditQuizz}
          onSelect={handleCreate}
          onImport={handleImportQuizz}
          onExport={() => {}}
          onTogglePublic={handleTogglePublic}
          isAdmin={manager?.role === "admin"}
        />
      )

    content = (
      <div className="relative z-10 flex min-h-dvh flex-col items-center px-4 py-6">
        <div className="mb-4 flex w-full max-w-5xl flex-col gap-3">
          <div className="flex w-full items-center justify-between">
            <img src={logo} className="h-8" alt="logo" />
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-white">
                Signed in as {manager?.username}
              </p>
              <Button
                type="button"
                className="bg-white px-4 !text-black"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                className={clsx(
                  "px-4",
                  activeTab === tab.id
                    ? "bg-primary"
                    : "bg-white !text-black",
                )}
                onClick={() => handleSelectTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {activeGame && (
          <div className="mb-4 flex w-full max-w-5xl flex-col gap-3 rounded-md bg-white/95 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Active game</h2>
              <p className="text-sm text-gray-600">
                {activeGame.subject} | Invite code {activeGame.inviteCode} |{" "}
                {activeGame.started ? "In progress" : "Waiting for players"}
              </p>
            </div>

            <div className="flex gap-2">
  <Button className="px-4" onClick={handleResumeOrTakeOver} type="button">
    {activeGame.controlledByCurrentSession ? "Resume game" : "Take over game"}
  </Button>
  <Button
    className="px-4 bg-Dark-Active-Red"
    type="button"
    onClick={() => {
      if (window.confirm("Are you sure you want to stop the active game?")) {
        socket?.emit("manager:stopGame", { gameId: activeGame.gameId })
        setActiveGame(null)
      }
    }}
  >
    Stop game
  </Button>
</div>
          </div>
        )}

        {dashboardContent}
      </div>
    )
  }

  return (
    <section className="relative min-h-dvh">
      <div className="fixed top-0 left-0 h-full w-full">
        <img
          className="pointer-events-none h-full w-full object-cover"
          src={background}
          alt="background"
        />
      </div>

      {content}
    </section>
  )
}

export default ManagerAuthPage
