import { Logo } from './Logo'
import { StatusBar } from './StatusBar'

export function Header() {
  return (
    <header
      className="border-b border-[var(--line-bright)] sticky top-0 z-20"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        background: 'var(--bg)',
        boxShadow: '0 2px 0 rgba(0,0,0,0.3), 0 8px 16px -8px rgba(0,0,0,0.8)',
      }}
    >
      <div className="max-w-screen-md mx-auto px-4 py-3 flex items-center justify-between">
        <Logo />
        <StatusBar />
      </div>
    </header>
  )
}
