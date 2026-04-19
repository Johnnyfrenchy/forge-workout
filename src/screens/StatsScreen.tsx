import { useApp } from '../hooks/useApp'
import { computeFrequency } from '../algo/frequency'
import { groupFrequencyMap } from '../algo/sessionPicker'
import { groupSessionsByWeek, weekVolume } from '../algo/deload'
import { KpiCard } from '../components/KpiCard'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

export function StatsScreen() {
  const { sessions } = useApp()
  const completed = sessions.filter(s => s.completed)

  if (completed.length < 2) {
    return (
      <div className="p-6 text-center">
        <div className="font-display text-xl">Pas assez de données</div>
        <div className="font-mono text-xs text-[var(--ink-dim)] mt-2">Complète au moins 2 séances pour voir tes stats.</div>
      </div>
    )
  }

  const byWeek = groupSessionsByWeek(sessions)
  const weekEntries = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
  const weekData = weekEntries.slice(-12).map(([key, wSessions]) => ({
    key,
    volume: weekVolume(wSessions),
    sessions: wSessions.length,
  }))

  const freqData = weekData.map((w, i) => {
    const slice = weekData.slice(Math.max(0, i - 1), i + 1)
    const total = slice.reduce((a, b) => a + b.sessions, 0)
    return { key: w.key, freq: total / Math.max(1, slice.length) }
  })

  const groupFreq = groupFrequencyMap(sessions, 30)
  const groupData = Object.entries(groupFreq)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.slice(0, 4), value }))

  const tooltipStyle = { background: '#141414', border: '1px solid #3a3a3a', fontFamily: 'JetBrains Mono', fontSize: 11 }

  return (
    <div className="p-4 max-w-screen-md mx-auto pb-safe">
      <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-4">ANALYTICS</div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <KpiCard label="TOT SESS" value={completed.length} />
        <KpiCard label="VOL 7J" value={Math.round(weekData.slice(-1)[0]?.volume || 0)} unit="KG·R" />
        <KpiCard label="FREQ" value={computeFrequency(sessions, 14).toFixed(1)} unit="/WK" />
      </div>

      <div className="card p-4 mb-4">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">VOLUME / 12 WEEKS</div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={weekData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="key" tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} tickFormatter={v => v.split('-W')[1]} />
              <YAxis tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e8e8e8' }} />
              <Bar dataKey="volume" fill="#c6f042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">FREQUENCY TREND</div>
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer>
            <LineChart data={freqData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="key" tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} tickFormatter={v => v.split('-W')[1]} />
              <YAxis tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} width={30} domain={[0, 'dataMax + 1']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="stepAfter" dataKey="freq" stroke="#c6f042" strokeWidth={2} dot={{ fill: '#c6f042', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">GROUPS / LAST 30 DAYS</div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={groupData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2a2a" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8a8a8a', fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#c6f042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-2">RECENT DISTRIBUTION</div>
      <div className="flex gap-1 h-10 mb-8">
        {completed.slice(0, 30).reverse().map((s, i) => {
          const color = s.style === 'heavy' ? 'var(--accent)' : 'var(--info)'
          return (
            <div
              key={i}
              className="flex-1"
              style={{ background: color, opacity: 0.3 + Math.min(1, (s.plannedVolume || 10) / 30) * 0.7 }}
              title={s.type}
            />
          )
        })}
      </div>
    </div>
  )
}
