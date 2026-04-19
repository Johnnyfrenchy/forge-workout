import { Logo } from './Logo'

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grid">
      <div className="anim-fade-up text-center">
        <Logo />
        <div className="mt-4 font-mono text-xs text-[var(--ink-dim)] tracking-widest">LOADING PROTOCOL...</div>
      </div>
    </div>
  )
}
