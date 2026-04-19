import { AppContext, useAppState } from './hooks/useApp'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { LoadingScreen } from './components/LoadingScreen'
import { Onboarding } from './screens/Onboarding'
import { TodayScreen } from './screens/TodayScreen'
import { ActiveSessionScreen } from './screens/ActiveSessionScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'

function AppRoot() {
  const state = useAppState()

  if (state.bootState === 'loading') return <LoadingScreen />
  if (state.bootState === 'needsOnboarding') {
    return (
      <AppContext.Provider value={state}>
        <Onboarding />
      </AppContext.Provider>
    )
  }

  return (
    <AppContext.Provider value={state}>
      <div className="min-h-screen bg-grid">
        <Header />
        <main className="relative z-10">
          {state.tab === 'today'    && <TodayScreen />}
          {state.tab === 'active'   && <ActiveSessionScreen />}
          {state.tab === 'history'  && <HistoryScreen />}
          {state.tab === 'stats'    && <StatsScreen />}
          {state.tab === 'settings' && <SettingsScreen />}
        </main>
        <BottomNav />
      </div>
    </AppContext.Provider>
  )
}

export default function App() {
  return <AppRoot />
}
