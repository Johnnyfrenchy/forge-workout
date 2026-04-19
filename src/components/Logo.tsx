export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${small ? 'w-6 h-6' : 'w-8 h-8'} bg-[var(--accent)]`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)' }}
        />
        <div className={`absolute inset-0 ${small ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center font-display text-black text-[10px]`}>F</div>
      </div>
      <div className={`font-display ${small ? 'text-lg' : 'text-xl'} tracking-tight`}>FORGE</div>
    </div>
  )
}
