export function KpiCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="card p-3">
      <div className="font-mono text-[9px] text-[var(--ink-dim)] tracking-widest">{label}</div>
      <div className="font-display text-xl mt-1 leading-none">
        {value}
        {unit && <span className="font-mono text-[9px] text-[var(--ink-dim)] ml-1">{unit}</span>}
      </div>
    </div>
  )
}
