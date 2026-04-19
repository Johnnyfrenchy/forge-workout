export function MetaBlock({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="border-l-2 border-[var(--accent)] pl-3">
      <div className="font-mono text-[9px] text-[var(--ink-dim)] tracking-widest">{label}</div>
      <div className="font-display text-xl mt-0.5">
        {value}
        {unit && <span className="font-mono text-[10px] text-[var(--ink-dim)] ml-1">{unit}</span>}
      </div>
    </div>
  )
}
