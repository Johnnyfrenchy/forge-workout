import { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react'
import { store } from '../storage/store'
import type { Session, Settings } from '../data/constants'

export interface AppContextValue {
  bootState: 'loading' | 'needsOnboarding' | 'ready'
  sessions: Session[]
  settings: Settings | null
  currentSession: Session | null
  tab: string
  setTab: (tab: string) => void
  completeOnboarding: (newSettings: Settings) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  startSession: (session: Session) => Promise<void>
  updateCurrentSession: (updater: Session | ((cs: Session) => Session)) => Promise<void>
  finishSession: (finalSession: Session) => Promise<void>
  discardCurrentSession: () => Promise<void>
  deleteSession: (id: string) => Promise<void>
  isFirebase: boolean
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useAppState() {
  const [bootState, setBootState] = useState<'loading' | 'needsOnboarding' | 'ready'>('loading')
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [tab, setTab] = useState('today')

  useEffect(() => {
    ;(async () => {
      await store.init()
      const data = await store.loadAll()
      setSessions(data.sessions || [])
      setCurrentSession(data.currentSession || null)
      if (!data.settings) {
        setBootState('needsOnboarding')
      } else {
        setSettings(data.settings)
        setBootState('ready')
      }
    })()
  }, [])

  const completeOnboarding = useCallback(async (newSettings: Settings) => {
    await store.saveSettings(newSettings)
    setSettings(newSettings)
    setBootState('ready')
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings!, ...patch }
    setSettings(next)
    await store.saveSettings(next)
  }, [settings])

  const startSession = useCallback(async (session: Session) => {
    setCurrentSession(session)
    await store.saveCurrentSession(session)
    setTab('active')
  }, [])

  const updateCurrentSession = useCallback(async (updater: Session | ((cs: Session) => Session)) => {
    const next = typeof updater === 'function' ? updater(currentSession!) : updater
    setCurrentSession(next)
    await store.saveCurrentSession(next)
  }, [currentSession])

  const finishSession = useCallback(async (finalSession: Session) => {
    const completed = { ...finalSession, completed: true, completedAt: new Date().toISOString() }
    await store.saveSession(completed)
    await store.saveCurrentSession(null)
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === completed.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = completed
        return copy
      }
      return [completed, ...prev]
    })
    setCurrentSession(null)
    setTab('today')
  }, [])

  const discardCurrentSession = useCallback(async () => {
    await store.saveCurrentSession(null)
    setCurrentSession(null)
    setTab('today')
  }, [])

  const deleteSession = useCallback(async (id: string) => {
    await store.deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  const value = useMemo<AppContextValue>(() => ({
    bootState, sessions, settings, currentSession, tab, setTab,
    completeOnboarding, updateSettings,
    startSession, updateCurrentSession, finishSession, discardCurrentSession,
    deleteSession,
    isFirebase: store.isFirebase(),
  }), [bootState, sessions, settings, currentSession, tab,
      completeOnboarding, updateSettings, startSession, updateCurrentSession,
      finishSession, discardCurrentSession, deleteSession])

  return value
}
